<script setup>
import { Download, X } from '@lucide/vue'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import CommunitySection from './components/CommunitySection.vue'
import DownloadGlobe from './components/DownloadGlobe.vue'
import DownloadModal from './components/DownloadModal.vue'
import FeatureBento from './components/FeatureBento.vue'
import HeroSection from './components/HeroSection.vue'
import CapabilitiesSection from './components/CapabilitiesSection.vue'
import ImpactStrip from './components/ImpactStrip.vue'
import PlatformDownloads from './components/PlatformDownloads.vue'
import ProductShowcase from './components/ProductShowcase.vue'
import SetupGuide from './components/SetupGuide.vue'
import SiteFooter from './components/SiteFooter.vue'
import SiteHeader from './components/SiteHeader.vue'
import { useScrollExperience } from './composables/useScrollExperience'
import {
  isFirebaseConfigured,
  subscribeToDownloadCount,
  subscribeToDownloadOrigins,
} from './services/firebase'

const downloadModalOpen = ref(false)
const requestedPlatform = ref('')
const downloadCount = ref(0)
const downloadOrigins = ref([])
const countReady = ref(false)
const notice = ref('')
const mobileDownloadVisible = ref(false)
const bottomContentInView = new Set()

let unsubscribeDownloadCount = () => {}
let unsubscribeDownloadOrigins = () => {}
let noticeTimer = 0
let bottomContentObserver = null

useScrollExperience()

onMounted(() => {
  if (isFirebaseConfigured) {
    unsubscribeDownloadCount = subscribeToDownloadCount(
      (count) => {
        downloadCount.value = count
        countReady.value = true
      },
      () => {
        countReady.value = false
      },
    )
    unsubscribeDownloadOrigins = subscribeToDownloadOrigins(
      (origins) => {
        downloadOrigins.value = origins
      },
      () => {
        downloadOrigins.value = []
      },
    )
  }

  updateMobileDownload()
  window.addEventListener('scroll', updateMobileDownload, { passive: true })

  bottomContentObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) bottomContentInView.add(entry.target)
      else bottomContentInView.delete(entry.target)
    })
    updateMobileDownload()
  })
  document
    .querySelectorAll('#community, footer')
    .forEach((element) => bottomContentObserver.observe(element))
})

onBeforeUnmount(() => {
  unsubscribeDownloadCount()
  unsubscribeDownloadOrigins()
  window.removeEventListener('scroll', updateMobileDownload)
  bottomContentObserver?.disconnect()
  window.clearTimeout(noticeTimer)
})

// A platform card passes its own id; the header, hero, and footer buttons pass
// nothing and let the dialog fall back to user-agent detection.
function openDownload(platformId = '') {
  requestedPlatform.value = typeof platformId === 'string' ? platformId : ''
  downloadModalOpen.value = true
}

function showNotice(message) {
  notice.value = message
  window.clearTimeout(noticeTimer)
  noticeTimer = window.setTimeout(() => {
    notice.value = ''
  }, 7000)
}

function updateMobileDownload() {
  mobileDownloadVisible.value =
    window.scrollY > 620 && bottomContentInView.size === 0
}
</script>

<template>
  <div class="min-h-screen overflow-x-clip bg-transparent">
    <a
      href="#main-content"
      class="fixed left-4 top-3 z-[140] -translate-y-20 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-xl transition focus:translate-y-0"
    >
      Skip to main content
    </a>
    <div class="noise-overlay" aria-hidden="true" />
    <div class="page-progress" aria-hidden="true" />
    <SiteHeader @download="openDownload" />

    <main id="main-content" tabindex="-1">
      <HeroSection @download="openDownload" />
      <ImpactStrip :download-count="downloadCount" :count-ready="countReady" />
      <ProductShowcase />
      <CapabilitiesSection />
      <FeatureBento />
      <PlatformDownloads @download="openDownload" />
      <DownloadGlobe
        :origins="downloadOrigins"
        :download-count="downloadCount"
        :count-ready="countReady"
      />
      <SetupGuide @download="openDownload" />
      <CommunitySection />
    </main>

    <SiteFooter @download="openDownload" />

    <Transition name="mobile-cta">
      <div
        v-if="mobileDownloadVisible && !downloadModalOpen"
        class="mobile-download-bar fixed inset-x-3 z-40 rounded-2xl border border-indigo-300/15 bg-slate-950/90 p-2 shadow-[0_18px_60px_rgba(2,6,23,.7)] backdrop-blur-xl sm:hidden"
      >
        <button type="button" class="button-primary w-full" @click="openDownload">
          <Download :size="17" aria-hidden="true" />
          Download GenXYZ Lab
        </button>
      </div>
    </Transition>

    <Transition name="toast">
      <div
        v-if="notice"
        class="fixed bottom-4 left-1/2 z-[120] flex w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 items-start gap-3 rounded-2xl border border-amber-300/20 bg-slate-900/95 p-4 text-xs leading-6 text-amber-100 shadow-2xl backdrop-blur-xl sm:bottom-7"
        role="status"
        aria-live="polite"
      >
        <span class="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-300" />
        <span class="flex-1">{{ notice }}</span>
        <button type="button" class="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-500 hover:text-white" aria-label="Dismiss notification" @click="notice = ''">
          <X :size="16" />
        </button>
      </div>
    </Transition>

    <DownloadModal
      :open="downloadModalOpen"
      :download-count="downloadCount"
      :count-ready="countReady"
      :requested-platform="requestedPlatform"
      @close="downloadModalOpen = false"
      @notice="showNotice"
    />
  </div>
</template>

<style scoped>
.mobile-cta-enter-active,
.mobile-cta-leave-active,
.toast-enter-active,
.toast-leave-active {
  transition: opacity 220ms ease, transform 280ms cubic-bezier(0.16, 1, 0.3, 1);
}

.mobile-cta-enter-from,
.mobile-cta-leave-to,
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 16px);
}

.mobile-cta-enter-from,
.mobile-cta-leave-to {
  transform: translateY(16px);
}

.mobile-download-bar {
  bottom: calc(0.75rem + env(safe-area-inset-bottom));
}
</style>
