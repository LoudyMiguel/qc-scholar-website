<script setup>
import {
  Bug,
  CircleAlert,
  CircleCheck,
  LoaderCircle,
  LockKeyhole,
  MessageCircle,
  MessagesSquare,
  Send,
  WifiOff,
} from '@lucide/vue'
import { nextTick, onMounted, reactive, ref } from 'vue'
import { siteConfig } from '../config/site'
import { useCommunity } from '../composables/useCommunity'
import CommentCard from './CommentCard.vue'

const {
  comments,
  loading,
  error,
  firebaseReady,
  postComment,
  reportBug,
  react,
  isReactionPending,
} = useCommunity()

const activeTab = ref('discussion')
const discussionTab = ref(null)
const bugTab = ref(null)
const submitting = ref(false)
const statusMessage = ref('')
const statusTone = ref('success')

const commentForm = reactive({
  authorName: '',
  body: '',
})

const bugForm = reactive({
  name: '',
  contact: '',
  category: 'Installation',
  description: '',
  device: '',
  appVersion: siteConfig.version,
})

onMounted(() => {
  try {
    const savedName = localStorage.getItem('genxyz-lab-display-name')
    if (savedName) {
      commentForm.authorName = savedName
      bugForm.name = savedName
    }
  } catch {
    // Storage can be unavailable in privacy modes; forms still work.
  }
})

async function submitComment() {
  if (!firebaseReady || submitting.value) return
  submitting.value = true
  statusMessage.value = ''

  try {
    await postComment(commentForm)
    rememberName(commentForm.authorName)
    bugForm.name = commentForm.authorName
    commentForm.body = ''
    showStatus('Your comment is live. Thank you for helping shape GenXYZ Lab.')
  } catch (submitError) {
    showStatus(submitError?.message || 'The comment could not be posted.', 'error')
  } finally {
    submitting.value = false
  }
}

async function submitBug() {
  if (!firebaseReady || submitting.value) return
  submitting.value = true
  statusMessage.value = ''

  try {
    await reportBug(bugForm)
    rememberName(bugForm.name)
    commentForm.authorName = bugForm.name
    bugForm.description = ''
    bugForm.device = ''
    bugForm.contact = ''
    showStatus('Bug report received and kept out of the public feed. Thank you for the useful detail.')
  } catch (submitError) {
    showStatus(submitError?.message || 'The bug report could not be sent.', 'error')
  } finally {
    submitting.value = false
  }
}

async function handleReaction(commentId, type) {
  try {
    await react(commentId, type)
  } catch {
    showStatus('That reaction could not be saved. Please try again.', 'error')
  }
}

function rememberName(name) {
  try {
    localStorage.setItem(
      'genxyz-lab-display-name',
      String(name || '').trim().slice(0, 40),
    )
  } catch {
    // Optional convenience only.
  }
}

function showStatus(message, tone = 'success') {
  statusMessage.value = message
  statusTone.value = tone
}

async function handleTabKeydown(event) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
  event.preventDefault()
  activeTab.value =
    event.key === 'ArrowLeft' || event.key === 'Home'
      ? 'discussion'
      : 'bug'
  statusMessage.value = ''
  await nextTick()
  ;(activeTab.value === 'discussion' ? discussionTab.value : bugTab.value)?.focus()
}
</script>

<template>
  <section id="community" class="section border-t border-line bg-subtle">
    <div class="site-container">
      <div class="mx-auto max-w-2xl text-center">
        <p class="eyebrow">Community</p>
        <h2 class="section-title mt-3">Help shape the next release</h2>
        <p class="section-lead mt-4">
          Share an idea, help another learner, or send a private bug report.
        </p>
      </div>

      <div class="mt-12 grid items-start gap-4 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div class="card overflow-hidden">
          <div class="grid grid-cols-2 gap-1 border-b border-line bg-subtle p-1.5" role="tablist" aria-label="Community contribution type">
            <button
              ref="discussionTab"
              id="discussion-tab"
              type="button"
              role="tab"
              :aria-selected="activeTab === 'discussion'"
              :tabindex="activeTab === 'discussion' ? 0 : -1"
              aria-controls="discussion-panel"
              class="tab"
              :class="{ 'is-active': activeTab === 'discussion' }"
              @click="activeTab = 'discussion'; statusMessage = ''"
              @keydown="handleTabKeydown"
            >
              <MessageCircle :size="16" aria-hidden="true" />
              Comment
            </button>
            <button
              ref="bugTab"
              id="bug-tab"
              type="button"
              role="tab"
              :aria-selected="activeTab === 'bug'"
              :tabindex="activeTab === 'bug' ? 0 : -1"
              aria-controls="bug-panel"
              class="tab"
              :class="{ 'is-active': activeTab === 'bug' }"
              @click="activeTab = 'bug'; statusMessage = ''"
              @keydown="handleTabKeydown"
            >
              <Bug :size="16" aria-hidden="true" />
              Report a bug
            </button>
          </div>

          <div v-if="!firebaseReady" class="mx-5 mt-5 flex gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4 sm:mx-6">
            <WifiOff :size="18" class="mt-0.5 shrink-0 text-warning-text" aria-hidden="true" />
            <div>
              <p class="text-sm font-semibold text-fg">Community preview mode</p>
              <p class="mt-1 text-sm text-fg-muted">Add the Firebase values from <code class="font-mono text-xs">.env.example</code> to enable live posts and reactions.</p>
            </div>
          </div>

          <form
            v-if="activeTab === 'discussion'"
            id="discussion-panel"
            role="tabpanel"
            aria-labelledby="discussion-tab"
            class="p-5 sm:p-6"
            @submit.prevent="submitComment"
          >
            <div>
              <label for="comment-name" class="field-label">Display name <span class="font-normal text-fg-subtle">(optional)</span></label>
              <input
                id="comment-name"
                v-model="commentForm.authorName"
                class="field-control"
                maxlength="40"
                autocomplete="nickname"
                placeholder="Anonymous builder"
                :disabled="!firebaseReady || submitting"
              />
            </div>
            <div class="mt-4">
              <div class="flex items-baseline justify-between">
                <label for="comment-body" class="field-label">Comment or idea</label>
                <span class="text-xs text-fg-subtle">{{ commentForm.body.length }}/500</span>
              </div>
              <textarea
                id="comment-body"
                v-model="commentForm.body"
                class="field-control min-h-32 resize-y"
                minlength="3"
                maxlength="500"
                required
                placeholder="What would make GenXYZ Lab more useful for you?"
                :disabled="!firebaseReady || submitting"
              />
            </div>
            <button type="submit" class="btn btn-primary mt-5 w-full" :disabled="!firebaseReady || submitting || commentForm.body.trim().length < 3">
              <LoaderCircle v-if="submitting" :size="17" class="animate-spin" aria-hidden="true" />
              <Send v-else :size="17" aria-hidden="true" />
              {{ submitting ? 'Publishing…' : 'Publish comment' }}
            </button>
            <p class="mt-3 text-center text-xs leading-relaxed text-fg-subtle">
              Your display name and comment are public. One comment every two minutes. Please do not share secrets or personal data.
            </p>
          </form>

          <form
            v-else
            id="bug-panel"
            role="tabpanel"
            aria-labelledby="bug-tab"
            class="p-5 sm:p-6"
            @submit.prevent="submitBug"
          >
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label for="bug-name" class="field-label">Your name <span class="font-normal text-fg-subtle">(optional)</span></label>
                <input id="bug-name" v-model="bugForm.name" class="field-control" maxlength="60" autocomplete="name" placeholder="Anonymous builder" :disabled="!firebaseReady || submitting" />
              </div>
              <div>
                <label for="bug-contact" class="field-label">Contact <span class="font-normal text-fg-subtle">(optional)</span></label>
                <input id="bug-contact" v-model="bugForm.contact" class="field-control" maxlength="160" autocomplete="email" placeholder="Email or handle" :disabled="!firebaseReady || submitting" />
              </div>
              <div>
                <label for="bug-category" class="field-label">Area</label>
                <select id="bug-category" v-model="bugForm.category" class="field-control" :disabled="!firebaseReady || submitting">
                  <option>Installation</option>
                  <option>Compiler / Termux</option>
                  <option>AI tools</option>
                  <option>Learning content</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label for="bug-device" class="field-label">Device <span class="font-normal text-fg-subtle">(optional)</span></label>
                <input id="bug-device" v-model="bugForm.device" class="field-control" maxlength="120" placeholder="e.g. Pixel 8, Windows 11" :disabled="!firebaseReady || submitting" />
              </div>
            </div>
            <div class="mt-4">
              <div class="flex items-baseline justify-between">
                <label for="bug-description" class="field-label">What happened?</label>
                <span class="text-xs text-fg-subtle">{{ bugForm.description.length }}/2000</span>
              </div>
              <textarea
                id="bug-description"
                v-model="bugForm.description"
                class="field-control min-h-36 resize-y"
                minlength="5"
                maxlength="2000"
                required
                placeholder="What did you expect, what happened instead, and which steps reproduce it?"
                :disabled="!firebaseReady || submitting"
              />
            </div>
            <button type="submit" class="btn btn-primary mt-5 w-full" :disabled="!firebaseReady || submitting || bugForm.description.trim().length < 5">
              <LoaderCircle v-if="submitting" :size="17" class="animate-spin" aria-hidden="true" />
              <Bug v-else :size="17" aria-hidden="true" />
              {{ submitting ? 'Sending report…' : 'Send bug report' }}
            </button>
            <p class="mt-3 flex flex-wrap items-center justify-center gap-x-1.5 text-center text-xs leading-relaxed text-fg-subtle">
              <LockKeyhole :size="12" aria-hidden="true" />
              Not shown publicly; readable only by you and site administrators.
              <a href="/privacy" class="text-link">Privacy details</a>
            </p>
          </form>

          <div
            v-if="statusMessage"
            class="mx-5 mb-5 flex gap-2.5 rounded-lg border p-3 text-sm sm:mx-6"
            :class="statusTone === 'success' ? 'border-success/30 bg-success/10 text-fg' : 'border-danger/30 bg-danger/10 text-fg'"
            role="status"
            aria-live="polite"
          >
            <CircleCheck v-if="statusTone === 'success'" :size="17" class="mt-0.5 shrink-0 text-success-text" aria-hidden="true" />
            <CircleAlert v-else :size="17" class="mt-0.5 shrink-0 text-danger-text" aria-hidden="true" />
            {{ statusMessage }}
          </div>
        </div>

        <div class="card p-5 sm:p-6">
          <div class="flex items-center justify-between gap-4 border-b border-line pb-4">
            <h3 class="text-lg font-semibold text-fg">Recent comments</h3>
            <span
              class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
              :class="firebaseReady ? 'bg-success/10 text-success-text' : 'bg-muted text-fg-subtle'"
            >
              <span class="h-1.5 w-1.5 rounded-full" :class="firebaseReady ? 'bg-success' : 'bg-fg-subtle'" aria-hidden="true" />
              {{ firebaseReady ? 'Live' : 'Preview' }}
            </span>
          </div>

          <div v-if="loading" class="grid min-h-64 place-items-center" aria-live="polite">
            <div class="text-center">
              <LoaderCircle :size="24" class="mx-auto animate-spin text-brand-text" aria-hidden="true" />
              <p class="mt-3 text-sm text-fg-subtle">Loading the conversation…</p>
            </div>
          </div>

          <div v-else-if="comments.length" class="comment-feed -mr-2 mt-4 space-y-3 pr-2 lg:max-h-[640px] lg:overflow-y-auto">
            <CommentCard
              v-for="comment in comments"
              :key="comment.id"
              :comment="comment"
              :pending="(type) => isReactionPending(comment.id, type)"
              @react="(type) => handleReaction(comment.id, type)"
            />
          </div>

          <div v-else class="mt-4 grid min-h-64 place-items-center rounded-lg border border-dashed border-line-strong p-8 text-center">
            <div>
              <span class="icon-tile mx-auto">
                <MessagesSquare :size="20" aria-hidden="true" />
              </span>
              <h4 class="mt-4 text-sm font-semibold text-fg">No comments yet</h4>
              <p class="mx-auto mt-1 max-w-xs text-sm text-fg-muted">
                {{ firebaseReady ? 'Be the first to share an idea or a setup tip.' : 'Connect Firebase to publish the first community comment.' }}
              </p>
            </div>
          </div>

          <p v-if="error" class="mt-4 text-sm text-danger-text" role="status" aria-live="polite">{{ error }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.tab {
  @apply inline-flex min-h-10 items-center justify-center gap-2 rounded-md text-sm font-medium text-fg-muted transition-colors duration-150 hover:text-fg;
}

.tab.is-active {
  @apply bg-surface text-fg shadow-card;
}

.comment-feed {
  scrollbar-width: thin;
}
</style>
