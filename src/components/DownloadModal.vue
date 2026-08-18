<script setup>
import { Clock, Download, ExternalLink, Monitor, ShieldCheck, Smartphone, X } from '@lucide/vue'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { detectPlatform, releases, releasesById, siteConfig } from '../config/site'
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
  // Set when the visitor opened the dialog from a specific platform card. That
  // is an explicit choice and must win over user-agent detection — otherwise
  // tapping "Download for Windows" on a phone opens the dialog on Android.
  requestedPlatform: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close', 'download', 'notice'])

const modal = ref(null)
const downloading = ref(false)
const selectedId = ref(releases[0].id)
let previousFocus = null
let appRoot = null

const DOWNLOAD_CHECK_TIMEOUT_MS = 5000

const platformIcons = { android: Smartphone, windows: Monitor }

const installSteps = {
  android: [
    'Your browser asks once for permission to install apps — allow it.',
    'Open the downloaded APK and confirm the install.',
    'Want on-device compilers? Install Termux before you open the app.',
  ],
  windows: [
    'Unzip the folder anywhere, keeping all the files together.',
    'Run GenXYZ Lab.exe from inside that folder.',
    'Windows may warn about an unsigned build: More info → Run anyway.',
  ],
}

const activeRelease = computed(() => releasesById[selectedId.value] || releases[0])
const activeSteps = computed(() => installSteps[selectedId.value] || [])

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      // Re-resolve each time the dialog opens rather than once at module load:
      // a visitor can change to desktop mode, and this costs nothing.
      selectedId.value = releasesById[props.requestedPlatform]
        ? props.requestedPlatform
        : detectPlatform()
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

async function primaryDownloadIsAvailable(url) {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), DOWNLOAD_CHECK_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      cache: 'no-store',
      redirect: 'follow',
      signal: controller.signal,
    })
    return response.ok
  } catch (error) {
    console.warn('The primary download could not be reached.', error)
    return false
  } finally {
    window.clearTimeout(timeout)
  }
}

// Reserve the new tab during the trusted click. Waiting for the availability
// check before calling window.open() would cause popup blockers to reject it.
function reserveDownloadWindow() {
  const downloadWindow = window.open('', '_blank')
  if (!downloadWindow) return null

  downloadWindow.opener = null
  downloadWindow.document.title = 'Preparing downloadâ€¦'
  const message = downloadWindow.document.createElement('p')
  message.textContent = 'Checking the primary downloadâ€¦'
  message.style.cssText =
    'font: 16px/1.5 system-ui, sans-serif; color: #cbd5e1; background: #020617; margin: 0; min-height: 100vh; display: grid; place-items: center;'
  downloadWindow.document.body.style.margin = '0'
  downloadWindow.document.body.style.background = '#020617'
  downloadWindow.document.body.append(message)
  return downloadWindow
}

function navigateToDownload(url, downloadWindow) {
  if (downloadWindow && !downloadWindow.closed) {
    downloadWindow.location.replace(url)
    return
  }

  // A strict popup blocker may reject the reserved tab. Falling back in the
  // current tab still honours the visitor's click and starts the download.
  window.location.assign(url)
}

async function confirmDownload(event) {
  event.preventDefault()
  const release = activeRelease.value
  if (downloading.value || release.isPlaceholder) {
    return
  }
  downloading.value = true

  const downloadWindow = reserveDownloadWindow()
  let trackingError = null
  const trackingPromise = Promise.race([
    recordDownloadClick(release.id).then(() => true),
    // The download must never wait on analytics. If the counter is slow or
    // blocked, the file still starts on time.
    new Promise((resolve) => window.setTimeout(() => resolve(false), 1800)),
  ]).catch((error) => {
    trackingError = error
    return false
  })

  let tracked = false
  let usedMirror = false
  try {
    if (release.mirrorUrl) {
      const primaryAvailable = await primaryDownloadIsAvailable(release.url)
      usedMirror = !primaryAvailable
    }

    navigateToDownload(usedMirror ? release.mirrorUrl : release.url, downloadWindow)

    if (usedMirror) {
      emit(
        'notice',
        `R2 was unavailable, so the ${release.name} download opened from Google Drive instead.`,
      )
    }
  } catch (error) {
    console.error('The download could not be opened.', error)
    if (downloadWindow && !downloadWindow.closed) downloadWindow.close()
    emit(
      'notice',
      'The download could not be opened. Use the Google Drive mirror link and try again.',
    )
    downloading.value = false
    return
  }

  tracked = await trackingPromise
  if (trackingError) {
    console.warn('Download tracking was unavailable.', trackingError)
    if (!usedMirror) {
      emit(
        'notice',
        'Your download is continuing. The public counter could not be updated this time.',
      )
    }
  }
  downloading.value = false

  emit('download', {
    tracked,
    platform: release.id,
    source: usedMirror ? 'google-drive' : 'primary',
  })
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
          <div
            class="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-indigo-500/20 blur-[90px]"
            aria-hidden="true"
          />
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
            <p class="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-300">
              Get GenXYZ Lab
            </p>
            <h2
              id="download-modal-title"
              class="mt-3 font-display text-2xl font-semibold tracking-tight text-white sm:text-[1.75rem]"
            >
              Choose your platform.
            </h2>
            <p id="download-modal-description" class="mt-3 text-sm leading-7 text-slate-400">
              The same workspace on both. Android runs compilers through Termux;
              Windows uses the toolchains already installed on your PC.
            </p>

            <div
              class="mt-6 grid gap-2 sm:grid-cols-2"
              role="tablist"
              aria-label="Download platform"
            >
              <button
                v-for="release in releases"
                :key="release.id"
                type="button"
                role="tab"
                :aria-selected="selectedId === release.id"
                :class="[
                  'platform-tab',
                  { 'is-selected': selectedId === release.id },
                ]"
                @click="selectedId = release.id"
              >
                <span class="platform-tab-icon">
                  <component :is="platformIcons[release.id]" :size="19" aria-hidden="true" />
                </span>
                <span class="min-w-0 text-left">
                  <span class="block text-sm font-bold text-white">{{ release.name }}</span>
                  <span class="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.1em] text-slate-500">
                    <template v-if="release.isPlaceholder">Coming soon</template>
                    <template v-else>{{ release.fileKind }} · {{ release.size }}</template>
                  </span>
                </span>
              </button>
            </div>

            <div class="mt-4 rounded-2xl border border-indigo-400/15 bg-indigo-400/[0.06] p-4">
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                  <p class="text-sm font-bold text-white">
                    GenXYZ Lab {{ siteConfig.version }}
                  </p>
                  <p class="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-slate-500">
                    {{ activeRelease.requirement }}
                  </p>
                </div>
                <span
                  v-if="countReady"
                  class="shrink-0 rounded-full bg-slate-950/50 px-3 py-1.5 font-mono text-[10px] font-semibold text-slate-400"
                >
                  {{ downloadCount.toLocaleString() }} clicks
                </span>
              </div>
              <p class="mt-3 border-t border-indigo-300/10 pt-3 text-[11px] leading-5 text-indigo-100/70">
                {{ activeRelease.note }}
              </p>
            </div>

            <div v-if="activeRelease.isPlaceholder" class="mt-4 flex gap-2.5 rounded-xl border border-amber-300/15 bg-amber-300/[0.06] p-3.5">
              <Clock :size="16" class="mt-0.5 shrink-0 text-amber-300" aria-hidden="true" />
              <p class="text-[11px] leading-5 text-amber-100/75">
                The {{ activeRelease.name }} build is not published yet. Pick another
                platform, or check back shortly — nothing is downloaded from this
                button until the release is live.
              </p>
            </div>

            <ol v-else class="mt-4 space-y-2">
              <li
                v-for="(step, index) in activeSteps"
                :key="step"
                class="flex gap-3 text-[11px] leading-5 text-slate-400"
              >
                <span class="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-slate-800/80 font-mono text-[9px] font-bold text-slate-300">
                  {{ index + 1 }}
                </span>
                {{ step }}
              </li>
            </ol>

            <div
              v-if="!activeRelease.isPlaceholder && activeRelease.mirrorUrl"
              class="mt-4 rounded-xl border border-sky-300/15 bg-sky-300/[0.06] p-3.5"
            >
              <p class="text-[11px] leading-5 text-sky-100/75">
                R2 download did not start or returned an error?
                <a
                  :href="activeRelease.mirrorUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="ml-1 inline-flex items-center gap-1 font-bold text-sky-300 underline decoration-sky-300/40 underline-offset-4 transition hover:text-sky-200"
                >
                  Use the Google Drive mirror
                  <ExternalLink :size="12" aria-hidden="true" />
                </a>
              </p>
            </div>

            <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                class="button-secondary"
                :disabled="downloading"
                @click="$emit('close')"
              >
                Not now
              </button>
              <a
                v-if="!activeRelease.isPlaceholder"
                :href="activeRelease.url"
                target="_blank"
                rel="noopener noreferrer"
                class="button-primary"
                :aria-busy="downloading"
                @click="confirmDownload"
              >
                <span
                  v-if="downloading"
                  class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                  aria-hidden="true"
                />
                <Download v-else :size="18" aria-hidden="true" />
                {{ downloading ? 'Preparing…' : `Download ${activeRelease.fileKind}` }}
              </a>
              <button v-else type="button" class="button-primary" disabled>
                <Clock :size="18" aria-hidden="true" />
                Not available yet
              </button>
            </div>

            <p class="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] leading-5 text-slate-400">
              <ShieldCheck :size="12" aria-hidden="true" />
              Free. No account, no subscription, no telemetry in the app.
            </p>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.platform-tab {
  display: flex;
  min-height: 3.75rem;
  align-items: center;
  gap: 0.85rem;
  border: 1px solid rgb(51 65 85 / 0.8);
  border-radius: 0.9rem;
  background: rgb(2 6 23 / 0.45);
  padding: 0.75rem 1rem;
  transition:
    border-color 220ms ease,
    background-color 220ms ease,
    transform 220ms ease;
}

.platform-tab:hover {
  border-color: rgb(100 116 139 / 0.9);
  transform: translateY(-1px);
}

.platform-tab.is-selected {
  border-color: rgb(129 140 248 / 0.55);
  background: rgb(79 70 229 / 0.12);
  box-shadow: 0 0 0 1px rgb(129 140 248 / 0.18);
}

.platform-tab-icon {
  display: grid;
  height: 2.4rem;
  width: 2.4rem;
  flex-shrink: 0;
  place-items: center;
  border-radius: 0.7rem;
  background: rgb(15 23 42 / 0.9);
  color: rgb(148 163 184);
  transition: color 220ms ease, background-color 220ms ease;
}

.platform-tab.is-selected .platform-tab-icon {
  background: rgb(79 70 229 / 0.2);
  color: rgb(165 180 252);
}

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
