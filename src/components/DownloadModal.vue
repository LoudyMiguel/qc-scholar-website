<script setup>
import {
  CheckCircle2,
  Download,
  HeartHandshake,
  Info,
  RefreshCw,
  ShieldCheck,
  X,
} from '@lucide/vue'
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { isPlaceholderDownload, siteConfig } from '../config/site'
import { recordDownloadClick } from '../services/firebase'

const props = defineProps({
  open: {
    type: Boolean,
    required: true,
  },
  downloadCount: {
    type: Number,
    default: 0,
  },
  countReady: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'download', 'notice'])
const modal = ref(null)
const downloading = ref(false)
let previousFocus = null
let appRoot = null

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      previousFocus = document.activeElement
      appRoot = document.getElementById('app')
      if (appRoot) appRoot.inert = true
      document.body.classList.add('modal-open')
      document.addEventListener('keydown', handleKeydown)
      await nextTick()
      modal.value?.focus()
    } else {
      restorePage()
    }
  },
)

onBeforeUnmount(restorePage)

function restorePage() {
  document.body.classList.remove('modal-open')
  document.removeEventListener('keydown', handleKeydown)
  if (appRoot) {
    appRoot.inert = false
    appRoot = null
  }
  if (props.open === false && previousFocus instanceof HTMLElement) {
    previousFocus.focus()
    previousFocus = null
  }
}

function handleKeydown(event) {
  if (event.key === 'Escape' && !downloading.value) {
    emit('close')
    return
  }

  if (event.key !== 'Tab' || !modal.value) return
  const focusable = Array.from(
    modal.value.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  )
  if (!focusable.length) return

  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  const focusOutsideDialog = !modal.value.contains(document.activeElement)
  if (
    event.shiftKey &&
    (document.activeElement === first ||
      document.activeElement === modal.value ||
      focusOutsideDialog)
  ) {
    event.preventDefault()
    last.focus()
  } else if (
    !event.shiftKey &&
    (document.activeElement === last ||
      document.activeElement === modal.value ||
      focusOutsideDialog)
  ) {
    event.preventDefault()
    first.focus()
  }
}

async function confirmDownload() {
  if (downloading.value) return
  downloading.value = true

  let tracked = false
  try {
    tracked = await Promise.race([
      recordDownloadClick().then(() => true),
      new Promise((resolve) => window.setTimeout(() => resolve(false), 1800)),
    ])
  } catch (error) {
    console.warn('Download tracking was unavailable.', error)
    emit(
      'notice',
      'Your download is continuing. The public counter could not be updated this time.',
    )
  } finally {
    downloading.value = false
  }

  emit('download', { tracked })
  window.location.assign(siteConfig.apkDownloadUrl)
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-md sm:p-6"
        @mousedown.self="!downloading && $emit('close')"
      >
        <section
          ref="modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="download-modal-title"
          aria-describedby="download-modal-description"
          tabindex="-1"
          class="glass-panel relative my-auto w-full max-w-xl overflow-hidden rounded-3xl border-indigo-400/20 bg-slate-900 shadow-[0_30px_120px_rgba(2,6,23,.7)] focus:outline-none"
        >
          <div class="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-[90px]" aria-hidden="true" />
          <button
            type="button"
            class="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-xl border border-slate-700/80 bg-slate-950/50 text-slate-400 transition hover:text-white"
            aria-label="Close download dialog"
            :disabled="downloading"
            @click="$emit('close')"
          >
            <X :size="19" aria-hidden="true" />
          </button>

          <div class="relative p-6 sm:p-8">
            <span class="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-glow">
              <RefreshCw :size="25" aria-hidden="true" />
            </span>
            <p class="mt-6 text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-300">Before you install</p>
            <h2 id="download-modal-title" class="mt-2 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Keep QC Scholar working at its best.
            </h2>
            <p id="download-modal-description" class="mt-4 text-sm leading-7 text-slate-400">
              Each release improves Android compatibility, compiler setup, and reliability. Staying current helps you avoid outdated setup steps and gives you the most dependable learning workspace.
            </p>

            <div class="mt-5 grid gap-2.5 sm:grid-cols-2">
              <div class="flex gap-3 rounded-xl border border-slate-700/70 bg-slate-950/45 p-3.5">
                <ShieldCheck :size="19" class="mt-0.5 shrink-0 text-emerald-300" aria-hidden="true" />
                <div>
                  <p class="text-xs font-bold text-slate-100">Latest compatibility fixes</p>
                  <p class="mt-1 text-[11px] leading-5 text-slate-500">The supported setup guides match this build.</p>
                </div>
              </div>
              <div class="flex gap-3 rounded-xl border border-slate-700/70 bg-slate-950/45 p-3.5">
                <HeartHandshake :size="19" class="mt-0.5 shrink-0 text-violet-300" aria-hidden="true" />
                <div>
                  <p class="text-xs font-bold text-slate-100">Support independent work</p>
                  <p class="mt-1 text-[11px] leading-5 text-slate-500">Downloads and useful feedback guide continued development.</p>
                </div>
              </div>
            </div>

            <div class="mt-5 rounded-2xl border border-indigo-400/15 bg-indigo-400/[0.06] p-4">
              <div class="flex items-center justify-between gap-4">
                <div>
                  <p class="text-sm font-bold text-white">QC Scholar {{ siteConfig.version }}</p>
                  <p class="mt-1 text-[11px] text-slate-500">
                    Android APK · {{ siteConfig.apkSize }}
                    <template v-if="siteConfig.releaseDate"> · {{ siteConfig.releaseDate }}</template>
                  </p>
                </div>
                <span v-if="countReady" class="rounded-full bg-slate-950/50 px-3 py-1.5 text-[10px] font-semibold text-slate-400">
                  {{ downloadCount.toLocaleString() }} recorded clicks
                </span>
              </div>
              <div class="mt-3 flex gap-2 border-t border-indigo-300/10 pt-3 text-[11px] leading-5 text-indigo-100/70">
                <Info :size="15" class="mt-0.5 shrink-0 text-indigo-300" aria-hidden="true" />
                <p>
                  For offline compilers, install Termux <strong class="text-indigo-100">before</strong> QC Scholar so Android can connect their permissions correctly.
                </p>
              </div>
            </div>

            <div v-if="isPlaceholderDownload" class="mt-4 flex gap-2 rounded-xl border border-amber-300/15 bg-amber-300/[0.06] p-3 text-[11px] leading-5 text-amber-100/70">
              <Info :size="15" class="mt-0.5 shrink-0 text-amber-300" aria-hidden="true" />
              <p>Developer preview: replace <code>VITE_APK_DOWNLOAD_URL</code> with the Cloudflare R2 object URL before launch.</p>
            </div>

            <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" class="button-secondary" :disabled="downloading" @click="$emit('close')">
                Not now
              </button>
              <a
                :href="siteConfig.apkDownloadUrl"
                class="button-primary"
                :aria-busy="downloading"
                @click.prevent="confirmDownload"
              >
                <span v-if="downloading" class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
                <Download v-else :size="18" aria-hidden="true" />
                {{ downloading ? 'Preparing download…' : 'Download latest APK' }}
              </a>
            </div>

            <p class="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] leading-5 text-slate-400">
              <CheckCircle2 :size="12" aria-hidden="true" />
              No subscription. The counter records best-effort link clicks, not installations.
            </p>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 220ms ease;
}

.modal-enter-active section,
.modal-leave-active section {
  transition: opacity 220ms ease, transform 280ms cubic-bezier(0.16, 1, 0.3, 1);
}

.modal-enter-from,
.modal-leave-to,
.modal-enter-from section,
.modal-leave-to section {
  opacity: 0;
}

.modal-enter-from section,
.modal-leave-to section {
  transform: translateY(16px) scale(0.98);
}
</style>
