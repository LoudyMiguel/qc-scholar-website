import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  createBugReport,
  createComment,
  ensureAnonymousUser,
  getCurrentUserId,
  isFirebaseConfigured,
  subscribeToCommentReactions,
  subscribeToComments,
  toggleCommentReaction,
} from '../services/firebase'

export function useCommunity() {
  const comments = ref([])
  const reactions = ref({})
  const currentUserId = ref(null)
  const loading = ref(isFirebaseConfigured)
  const error = ref('')
  const pendingReactions = ref(new Set())
  const unsubscribe = []
  const reactionUnsubscribers = new Map()

  const communityComments = computed(() =>
    comments.value.map((comment) => {
      const commentReactions = reactions.value[comment.id] || {}
      const reactionSummary = {}

      for (const type of ['upvote', 'like', 'heart']) {
        const voters = commentReactions[type] || {}
        reactionSummary[type] = {
          count: Object.keys(voters).length,
          active: Boolean(currentUserId.value && voters[currentUserId.value]),
        }
      }

      return { ...comment, reactions: reactionSummary }
    }),
  )

  onMounted(() => {
    if (!isFirebaseConfigured) {
      loading.value = false
      return
    }

    unsubscribe.push(
      subscribeToComments(
        (rows) => {
          comments.value = rows
          syncReactionListeners(rows)
          loading.value = false
        },
        handleRealtimeError,
      ),
    )

    ensureAnonymousUser()
      .then((user) => {
        currentUserId.value = user.uid
      })
      .catch(handleRealtimeError)
  })

  onBeforeUnmount(() => {
    unsubscribe.forEach((stop) => stop())
    reactionUnsubscribers.forEach((stop) => stop())
    reactionUnsubscribers.clear()
  })

  function syncReactionListeners(rows) {
    const visibleIds = new Set(rows.map((comment) => comment.id))

    reactionUnsubscribers.forEach((stop, commentId) => {
      if (visibleIds.has(commentId)) return
      stop()
      reactionUnsubscribers.delete(commentId)
      const next = { ...reactions.value }
      delete next[commentId]
      reactions.value = next
    })

    visibleIds.forEach((commentId) => {
      if (reactionUnsubscribers.has(commentId)) return
      const stop = subscribeToCommentReactions(
        commentId,
        (value) => {
          reactions.value = { ...reactions.value, [commentId]: value }
        },
        handleRealtimeError,
      )
      reactionUnsubscribers.set(commentId, stop)
    })
  }

  async function postComment(form) {
    error.value = ''
    return createComment(form)
  }

  async function reportBug(form) {
    error.value = ''
    return createBugReport(form)
  }

  async function react(commentId, type) {
    const key = `${commentId}:${type}`
    if (pendingReactions.value.has(key)) return

    pendingReactions.value = new Set(pendingReactions.value).add(key)
    error.value = ''
    try {
      await toggleCommentReaction(commentId, type)
      currentUserId.value = getCurrentUserId()
    } catch (reactionError) {
      error.value = friendlyError(reactionError)
      throw reactionError
    } finally {
      const next = new Set(pendingReactions.value)
      next.delete(key)
      pendingReactions.value = next
    }
  }

  function isReactionPending(commentId, type) {
    return pendingReactions.value.has(`${commentId}:${type}`)
  }

  function handleRealtimeError(firebaseError) {
    loading.value = false
    error.value = friendlyError(firebaseError)
  }

  return {
    comments: communityComments,
    loading,
    error,
    firebaseReady: isFirebaseConfigured,
    postComment,
    reportBug,
    react,
    isReactionPending,
  }
}

function friendlyError(error) {
  if (error?.code === 'auth/operation-not-allowed') {
    return 'Anonymous sign-in is not enabled for this Firebase project.'
  }
  if (error?.code === 'PERMISSION_DENIED') {
    return 'Firebase denied this action. Check the deployed database rules.'
  }
  return error?.message || 'The community service is temporarily unavailable.'
}
