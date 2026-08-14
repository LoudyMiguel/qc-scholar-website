<script setup>
import {
  Bug,
  CheckCircle2,
  LoaderCircle,
  LockKeyhole,
  MessageCircle,
  Send,
  Sparkles,
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
  <section id="community" class="relative overflow-hidden py-24 sm:py-28">
    <img
      src="/assets/community-constellation.webp"
      alt=""
      width="1600"
      height="686"
      loading="lazy"
      decoding="async"
      class="community-art pointer-events-none absolute left-1/2 top-8 h-[430px] w-[min(1400px,120vw)] max-w-none -translate-x-1/2 object-cover object-center opacity-30"
      aria-hidden="true"
    />
    <div class="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-slate-950/30 via-slate-950/65 to-slate-950" aria-hidden="true" />
    <div class="pointer-events-none absolute bottom-0 left-1/2 h-[30rem] w-[46rem] -translate-x-1/2 rounded-full bg-violet-600/10 blur-[130px]" aria-hidden="true" />

    <div class="site-container relative">
      <div class="mx-auto max-w-3xl text-center" data-reveal>
        <span class="eyebrow">Built in public</span>
        <h2 class="section-heading mt-6">Help make the next release better.</h2>
        <p class="section-copy mt-5">
          Share an idea, help another learner, or send a bug report that stays out of the public conversation.
        </p>
      </div>

      <div class="mt-14 grid items-start gap-5 lg:grid-cols-[.82fr_1.18fr]">
        <div class="glass-panel overflow-hidden rounded-3xl" data-reveal="left">
          <div class="grid grid-cols-2 border-b border-slate-800 p-2" role="tablist" aria-label="Community contribution type">
            <button
              ref="discussionTab"
              id="discussion-tab"
              type="button"
              role="tab"
              :aria-selected="activeTab === 'discussion'"
              :tabindex="activeTab === 'discussion' ? 0 : -1"
              aria-controls="discussion-panel"
              class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl text-xs font-bold transition"
              :class="activeTab === 'discussion' ? 'bg-indigo-400/10 text-indigo-200' : 'text-slate-500 hover:text-slate-300'"
              @click="activeTab = 'discussion'; statusMessage = ''"
              @keydown="handleTabKeydown"
            >
              <MessageCircle :size="16" aria-hidden="true" />
              Join discussion
            </button>
            <button
              ref="bugTab"
              id="bug-tab"
              type="button"
              role="tab"
              :aria-selected="activeTab === 'bug'"
              :tabindex="activeTab === 'bug' ? 0 : -1"
              aria-controls="bug-panel"
              class="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl text-xs font-bold transition"
              :class="activeTab === 'bug' ? 'bg-rose-400/10 text-rose-200' : 'text-slate-500 hover:text-slate-300'"
              @click="activeTab = 'bug'; statusMessage = ''"
              @keydown="handleTabKeydown"
            >
              <Bug :size="16" aria-hidden="true" />
              Report a bug
            </button>
          </div>

          <div v-if="!firebaseReady" class="m-5 flex gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/[0.06] p-4 text-amber-100/70">
            <WifiOff :size="19" class="mt-0.5 shrink-0 text-amber-300" aria-hidden="true" />
            <div>
              <p class="text-xs font-bold text-amber-100">Community preview mode</p>
              <p class="mt-1 text-[11px] leading-5">Add the Firebase values from <code>.env.example</code> to enable live posts and reactions.</p>
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
              <label for="comment-name" class="field-label">Display name <span class="normal-case tracking-normal text-slate-600">(optional)</span></label>
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
              <div class="flex items-end justify-between">
                <label for="comment-body" class="field-label">Comment or idea</label>
                <span class="mb-2 text-[11px] text-slate-400">{{ commentForm.body.length }}/1000</span>
              </div>
              <textarea
                id="comment-body"
                v-model="commentForm.body"
                class="field-control min-h-36 resize-y"
                minlength="3"
                maxlength="1000"
                required
                placeholder="What would make GenXYZ Lab more useful for you?"
                :disabled="!firebaseReady || submitting"
              />
            </div>
            <button type="submit" class="button-primary mt-5 w-full" :disabled="!firebaseReady || submitting || commentForm.body.trim().length < 3">
              <LoaderCircle v-if="submitting" :size="17" class="animate-spin" aria-hidden="true" />
              <Send v-else :size="17" aria-hidden="true" />
              {{ submitting ? 'Publishing…' : 'Publish comment' }}
            </button>
            <p class="mt-3 text-center text-[11px] leading-5 text-slate-400">
              Your display name and comment are public. Please do not share secrets or personal data.
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
                <label for="bug-name" class="field-label">Your name <span class="normal-case tracking-normal text-slate-600">(optional)</span></label>
                <input id="bug-name" v-model="bugForm.name" class="field-control" maxlength="60" autocomplete="name" placeholder="Anonymous builder" :disabled="!firebaseReady || submitting" />
              </div>
              <div>
                <label for="bug-contact" class="field-label">Contact <span class="normal-case tracking-normal text-slate-600">(optional)</span></label>
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
                <label for="bug-device" class="field-label">Device <span class="normal-case tracking-normal text-slate-600">(optional)</span></label>
                <input id="bug-device" v-model="bugForm.device" class="field-control" maxlength="120" placeholder="e.g. Pixel 8 (Android 15) or Windows 11" :disabled="!firebaseReady || submitting" />
              </div>
            </div>
            <div class="mt-4">
              <div class="flex items-end justify-between">
                <label for="bug-description" class="field-label">What happened?</label>
                <span class="mb-2 text-[11px] text-slate-400">{{ bugForm.description.length }}/2000</span>
              </div>
              <textarea
                id="bug-description"
                v-model="bugForm.description"
                class="field-control min-h-40 resize-y"
                minlength="5"
                maxlength="2000"
                required
                placeholder="What did you expect, what happened instead, and which steps reproduce it?"
                :disabled="!firebaseReady || submitting"
              />
            </div>
            <button type="submit" class="button-primary mt-5 w-full" :disabled="!firebaseReady || submitting || bugForm.description.trim().length < 5">
              <LoaderCircle v-if="submitting" :size="17" class="animate-spin" aria-hidden="true" />
              <Bug v-else :size="17" aria-hidden="true" />
              {{ submitting ? 'Sending report…' : 'Send bug report' }}
            </button>
            <p class="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] leading-5 text-slate-400">
              <LockKeyhole :size="12" aria-hidden="true" />
              Not shown publicly; readable by you and site administrators.
              <a href="/privacy.html" class="font-bold text-indigo-300 hover:text-indigo-200">Privacy details</a>
            </p>
          </form>

          <div v-if="statusMessage" class="mx-5 mb-5 flex gap-2 rounded-xl border p-3 text-[11px] leading-5" :class="statusTone === 'success' ? 'border-emerald-300/15 bg-emerald-300/[0.06] text-emerald-100/75' : 'border-rose-300/15 bg-rose-300/[0.06] text-rose-100/75'" role="status" aria-live="polite">
            <CheckCircle2 v-if="statusTone === 'success'" :size="16" class="mt-0.5 shrink-0 text-emerald-300" aria-hidden="true" />
            <Bug v-else :size="16" class="mt-0.5 shrink-0 text-rose-300" aria-hidden="true" />
            {{ statusMessage }}
          </div>
        </div>

        <div class="glass-panel rounded-3xl p-5 sm:p-6" data-reveal="right">
          <div class="flex items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Live community</p>
              <h3 class="mt-2 font-display text-xl font-semibold text-white">Ideas from fellow builders</h3>
            </div>
            <span class="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.12em]" :class="firebaseReady ? 'border-emerald-400/15 bg-emerald-400/[0.06] text-emerald-300' : 'border-slate-700 bg-slate-900 text-slate-500'">
              <span class="h-1.5 w-1.5 rounded-full" :class="firebaseReady ? 'bg-emerald-400' : 'bg-slate-600'" />
              {{ firebaseReady ? 'Realtime' : 'Preview' }}
            </span>
          </div>

          <div v-if="loading" class="grid min-h-72 place-items-center" aria-live="polite">
            <div class="text-center">
              <LoaderCircle :size="25" class="mx-auto animate-spin text-indigo-300" aria-hidden="true" />
              <p class="mt-3 text-xs text-slate-500">Loading the conversation…</p>
            </div>
          </div>

          <div v-else-if="comments.length" class="mt-5 space-y-3 pr-1 lg:max-h-[670px] lg:overflow-y-auto">
            <CommentCard
              v-for="comment in comments"
              :key="comment.id"
              :comment="comment"
              :pending="(type) => isReactionPending(comment.id, type)"
              @react="(type) => handleReaction(comment.id, type)"
            />
          </div>

          <div v-else class="grid min-h-72 place-items-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/30 p-8 text-center">
            <div>
              <span class="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-indigo-400/10 text-indigo-300">
                <Sparkles :size="21" aria-hidden="true" />
              </span>
              <h4 class="mt-4 text-sm font-bold text-slate-200">The conversation starts here.</h4>
              <p class="mt-2 max-w-xs text-xs leading-6 text-slate-500">
                {{ firebaseReady ? 'Share the first thoughtful idea or setup tip.' : 'Connect Firebase to publish the first community comment.' }}
              </p>
            </div>
          </div>

          <p v-if="error" class="mt-4 text-[11px] leading-5 text-rose-300" role="status" aria-live="polite">{{ error }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.community-art {
  filter: saturate(1.12) contrast(1.04);
  mask-image: linear-gradient(to bottom, black 0%, black 64%, transparent 100%);
  animation: constellation-drift 14s ease-in-out infinite alternate;
}

@keyframes constellation-drift {
  from {
    transform: translateX(-50%) scale(1.01);
  }
  to {
    transform: translateX(-50%) scale(1.055);
  }
}
</style>
