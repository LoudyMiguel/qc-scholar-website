<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import CommunitySection from './components/CommunitySection.vue'
import DownloadMap from './components/DownloadMap.vue'
import FeaturesSection from './components/FeaturesSection.vue'
import HeroSection from './components/HeroSection.vue'
import PlatformDownloads from './components/PlatformDownloads.vue'
import SetupGuide from './components/SetupGuide.vue'
import SiteFooter from './components/SiteFooter.vue'
import SiteHeader from './components/SiteHeader.vue'
import StatsStrip from './components/StatsStrip.vue'
import WorkflowSection from './components/WorkflowSection.vue'
import {
  isFirebaseConfigured,
  subscribeToDownloadCount,
  subscribeToDownloadMap,
} from './services/firebase'

const downloadCount = ref(0)
const downloadMap = ref({ locations: [], regions: [] })
const countReady = ref(false)

let unsubscribeDownloadCount = () => {}
let unsubscribeDownloadMap = () => {}

onMounted(() => {
  if (!isFirebaseConfigured) return

  unsubscribeDownloadCount = subscribeToDownloadCount(
    (count) => {
      downloadCount.value = count
      countReady.value = true
    },
    () => {
      countReady.value = false
    },
  )
  unsubscribeDownloadMap = subscribeToDownloadMap(
    (map) => {
      downloadMap.value = map
    },
    () => {
      downloadMap.value = { locations: [], regions: [] }
    },
  )
})

onBeforeUnmount(() => {
  unsubscribeDownloadCount()
  unsubscribeDownloadMap()
})
</script>

<template>
  <a
    href="#main-content"
    class="btn btn-primary fixed left-4 top-3 z-[100] -translate-y-20 focus:translate-y-0"
  >
    Skip to main content
  </a>

  <SiteHeader />

  <main id="main-content" tabindex="-1" class="focus:outline-none">
    <HeroSection />
    <StatsStrip :download-count="downloadCount" :count-ready="countReady" />
    <FeaturesSection />
    <WorkflowSection />
    <PlatformDownloads :download-count="downloadCount" :count-ready="countReady" />
    <DownloadMap
      :locations="downloadMap.locations"
      :regions="downloadMap.regions"
      :download-count="downloadCount"
      :count-ready="countReady"
    />
    <SetupGuide />
    <CommunitySection />
  </main>

  <SiteFooter />
</template>
