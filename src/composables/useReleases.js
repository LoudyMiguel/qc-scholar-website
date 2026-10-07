import { Monitor, Smartphone } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { detectPlatform, releases, siteConfig } from '../config/site'
import {
  prepareDownloadTracking,
  recordApproximateDownloadOrigin,
  recordDownloadClick,
} from '../services/firebase'

// Shared by the hero and the download cards, so the page makes one manifest
// request and both buttons reflect the same in-flight download.
const liveManifest = ref({})
const detected = ref('')
const downloadingId = ref('')
let started = false

const platformIcons = { android: Smartphone, android32: Smartphone, windows: Monitor }

// What each build actually does differently. Vague parity claims ("works
// everywhere!") are worse than useless here — the compiler story is genuinely
// different per platform and a visitor needs to know before downloading.
const highlights = {
  android: [
    'Guided courses, quizzes, and certificates offline',
    'Real compilers on-device through Termux',
    'Arduino, Flutter, and web project studios',
  ],
  android32: [
    'The same courses, quizzes, and certificates',
    'Built specifically for older 32-bit ARM phones',
    'Camera, AI, Arduino, and project tools retained',
  ],
  windows: [
    'The same courses, editor, and project tools',
    'Uses the compilers already on your PC',
    'Larger screen and full keyboard shortcuts',
  ],
}

const cards = computed(() =>
  releases.map((release) => ({
    ...release,
    version: liveManifest.value[release.id]?.version || siteConfig.version,
    size: liveManifest.value[release.id]?.size || release.size,
    icon: platformIcons[release.id],
    highlights: highlights[release.id] || [],
    isDetected: detected.value === release.id,
  })),
)

// The build to lead with, or null when the visitor's platform is unknown or
// its build is not published — callers then fall back to the full list.
const recommended = computed(
  () => cards.value.find((card) => card.isDetected && !card.isPlaceholder) || null,
)

function start() {
  if (started) return
  started = true
  detected.value = detectPlatform()

  fetch('/version.json', { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response.json()
    })
    .then((manifest) => {
      if (manifest && typeof manifest === 'object') liveManifest.value = manifest
    })
    .catch((error) => {
      console.warn('Live release metadata is unavailable; using the build fallback.', error)
    })

  prepareDownloadTracking().catch((error) => {
    console.warn('Download tracking could not be prepared.', error)
  })
}

async function startDownload(card) {
  if (downloadingId.value || !card || card.isPlaceholder) return
  downloadingId.value = card.id

  try {
    await Promise.race([
      Promise.allSettled([
        recordDownloadClick(card.id),
        recordApproximateDownloadOrigin(card.id),
      ]),
      new Promise((resolve) => window.setTimeout(resolve, 1800)),
    ])
  } catch (error) {
    console.warn('Download tracking was unavailable.', error)
  }

  window.location.assign(card.url)
  // A file download leaves this page open. Release the button so a visitor
  // whose download was cancelled or blocked can simply try again.
  window.setTimeout(() => {
    downloadingId.value = ''
  }, 4000)
}

export function useReleases() {
  onMounted(start)
  return { cards, recommended, detected, downloadingId, startDownload }
}
