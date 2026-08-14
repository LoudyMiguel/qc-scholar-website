<script setup>
import { computed } from 'vue'
import { Download, GraduationCap, Layers3, Wrench } from '@lucide/vue'

const props = defineProps({
  downloadCount: {
    type: Number,
    default: 0,
  },
  countReady: {
    type: Boolean,
    default: false,
  },
})

const downloads = computed(() =>
  props.downloadCount.toLocaleString(undefined, { maximumFractionDigits: 0 }),
)
</script>

<template>
  <section aria-label="GenXYZ Lab at a glance" class="relative z-10 -mt-4 pb-24">
    <div class="site-container">
      <div class="glass-panel grid overflow-hidden rounded-2xl sm:grid-cols-2 lg:grid-cols-4" data-reveal>
        <div class="flex items-center gap-3.5 border-b border-slate-800/80 p-5 sm:border-r lg:border-b-0">
          <GraduationCap :size="21" class="text-cyan-300" aria-hidden="true" />
          <div>
            <p class="text-sm font-bold text-white">50+ free courses</p>
            <p class="mt-1 text-xs text-slate-500">Work offline, start to finish</p>
          </div>
        </div>
        <div class="flex items-center gap-3.5 border-b border-slate-800/80 p-5 lg:border-b-0 lg:border-r">
          <Wrench :size="21" class="text-indigo-300" aria-hidden="true" />
          <div>
            <p class="text-sm font-bold text-white">7 developer tools</p>
            <p class="mt-1 text-xs text-slate-500">API tester, Arduino, app builder</p>
          </div>
        </div>
        <div class="flex items-center gap-3.5 border-b border-slate-800/80 p-5 sm:border-b-0 sm:border-r">
          <Layers3 :size="21" class="text-violet-300" aria-hidden="true" />
          <div>
            <p class="text-sm font-bold text-white">20+ frameworks</p>
            <p class="mt-1 text-xs text-slate-500">Plus 30+ open-source games</p>
          </div>
        </div>
        <div class="flex items-center gap-3.5 p-5" aria-live="polite">
          <Download :size="21" class="text-cyan-300" aria-hidden="true" />
          <div>
            <p class="text-sm font-bold text-white">
              {{ countReady ? `${downloads} download${downloadCount === 1 ? '' : 's'}` : 'Independent release' }}
            </p>
            <p class="mt-1 text-xs text-slate-500">
              {{ countReady ? 'Recorded confirmation clicks' : 'Built with learner feedback' }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
