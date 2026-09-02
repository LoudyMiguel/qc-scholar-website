<script setup>
import { Download } from '@lucide/vue'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import CommunitySection from './components/CommunitySection.vue'
import DownloadGlobe from './components/DownloadGlobe.vue'
import FeatureBento from './components/FeatureBento.vue'
import HeroSection from './components/HeroSection.vue'
import CapabilitiesSection from './components/CapabilitiesSection.vue'
import ImpactStrip from './components/ImpactStrip.vue'
import PlatformDownloads from './components/PlatformDownloads.vue'
import ProductShowcase from './components/ProductShowcase.vue'
import SetupGuide from './components/SetupGuide.vue'
import ScrollSpyNav from './components/ScrollSpyNav.vue'
import SiteFooter from './components/SiteFooter.vue'
import SiteHeader from './components/SiteHeader.vue'
import { useScrollExperience } from './composables/useScrollExperience'
import {
  isFirebaseConfigured,
  subscribeToDownloadCount,
  subscribeToDownloadOrigins,
} from './services/firebase'

const downloadCount = ref(0)
const downloadOrigins = ref([])
const countReady = ref(false)
const mobileDownloadVisible = ref(false)
const bottomContentInView = new Set()

let unsubscribeDownloadCount = () => {}
let unsubscribeDownloadOrigins = () => {}
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
    .querySelectorAll('#download, #community, footer')
    .forEach((element) => bottomContentObserver.observe(element))
})

onBeforeUnmount(() => {
  unsubscribeDownloadCount()
  unsubscribeDownloadOrigins()
  window.removeEventListener('scroll', updateMobileDownload)
  bottomContentObserver?.disconnect()
})

function openDownload() {
  // Reuse the real navigation anchor so Lenis and native browsers calculate
  // the same complete document distance. The platform cards handle the actual
  // tracked Drive navigation without opening a compositor-heavy modal.
  const downloadAnchor = document.querySelector('a[href="#download"]')
  if (downloadAnchor instanceof HTMLAnchorElement) {
    downloadAnchor.click()
    return
  }
  window.location.hash = 'download'
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
    <ScrollSpyNav />

    <main id="main-content" tabindex="-1">
      <HeroSection @download="openDownload" />
      <ImpactStrip :download-count="downloadCount" :count-ready="countReady" />
      <ProductShowcase />
      <CapabilitiesSection />
      <FeatureBento />
      <PlatformDownloads />
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
        v-if="mobileDownloadVisible"
        class="mobile-download-bar fixed inset-x-3 z-40 rounded-2xl border border-indigo-300/15 bg-slate-950/90 p-2 shadow-[0_18px_60px_rgba(2,6,23,.7)] backdrop-blur-xl sm:hidden"
      >
        <button type="button" class="button-primary w-full" @click="openDownload">
          <Download :size="17" aria-hidden="true" />
          Download GenXYZ Lab
        </button>
      </div>
    </Transition>

  </div>
</template>

<style scoped>
.mobile-cta-enter-active,
.mobile-cta-leave-active {
  transition: opacity 220ms ease, transform 280ms cubic-bezier(0.16, 1, 0.3, 1);
}

.mobile-cta-enter-from,
.mobile-cta-leave-to {
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
