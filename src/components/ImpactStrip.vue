<script setup>
import { computed } from 'vue'
import { Award, Code2, Download, Layers3 } from '@lucide/vue'

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
  <section aria-label="QC Scholar at a glance" class="relative z-10 -mt-4 pb-24">
    <div class="site-container">
      <div class="glass-panel grid overflow-hidden rounded-2xl sm:grid-cols-2 lg:grid-cols-4" data-reveal>
        <div class="flex items-center gap-3.5 border-b border-slate-800/80 p-5 sm:border-r lg:border-b-0">
          <Code2 :size="21" class="text-indigo-300" aria-hidden="true" />
          <div>
            <p class="text-sm font-bold text-white">10 languages</p>
            <p class="mt-1 text-xs text-slate-500">Practical code workflows</p>
          </div>
        </div>
        <div class="flex items-center gap-3.5 border-b border-slate-800/80 p-5 lg:border-b-0 lg:border-r">
          <Layers3 :size="21" class="text-violet-300" aria-hidden="true" />
          <div>
            <p class="text-sm font-bold text-white">24 templates</p>
            <p class="mt-1 text-xs text-slate-500">Framework-ready starts</p>
          </div>
        </div>
        <div class="flex items-center gap-3.5 border-b border-slate-800/80 p-5 sm:border-b-0 sm:border-r">
          <Award :size="21" class="text-amber-300" aria-hidden="true" />
          <div>
            <p class="text-sm font-bold text-white">Proof of progress</p>
            <p class="mt-1 text-xs text-slate-500">Shareable certificates</p>
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
