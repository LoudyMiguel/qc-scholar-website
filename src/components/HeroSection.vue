<script setup>
import {
  ArrowRight,
  Braces,
  Download,
  Monitor,
  Smartphone,
  WifiOff,
} from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import LabScene from './LabScene.vue'
import { detectPlatform, releases, releasesById } from '../config/site'

defineEmits(['download'])

// Rendered on the server-less client only, so the first paint uses the neutral
// label and swaps once the platform is known. Guessing during setup would ship
// "Windows" to an Android visitor for one frame.
const platform = ref('')

onMounted(() => {
  platform.value = detectPlatform()
})

const primaryLabel = computed(() => {
  const release = releasesById[platform.value]
  return release ? `Download for ${release.shortName}` : 'Download GenXYZ Lab'
})

const availability = computed(() =>
  releases
    .filter((release) => !release.isPlaceholder)
    .map((release) => release.shortName),
)

const readout = [
  { key: 'Courses', value: '70 free' },
  { key: 'Tools', value: '7 built in' },
  { key: 'Network', value: 'optional' },
]
</script>

<template>
  <section
    id="top"
    class="hero-shell relative isolate overflow-hidden pb-24 pt-32 sm:pt-36 lg:pb-28 lg:pt-40"
  >
    <div class="hero-base-grid pointer-events-none absolute inset-0" aria-hidden="true" />
    <LabScene data-hero-scene />
    <div class="hero-glow pointer-events-none absolute inset-0" data-hero-glow aria-hidden="true" />
    <div class="hero-readability pointer-events-none absolute inset-0" aria-hidden="true" />
    <div class="hero-edge-fade pointer-events-none absolute inset-0" aria-hidden="true" />

    <div class="site-container relative z-10 flex min-h-[620px] items-center lg:min-h-[680px]">
      <div class="hero-copy w-full max-w-[700px]" data-hero-copy>
        <!-- Measurement rail. Instrument language rather than ornament: it marks
             the copy block's extent the way a technical drawing would. -->
        <div class="hero-rail" aria-hidden="true" data-hero-element>
          <span class="hero-rail-tick" />
          <span class="hero-rail-tick" />
          <span class="hero-rail-tick" />
        </div>

        <div class="eyebrow" data-hero-element>
          <span class="h-1.5 w-1.5 rounded-full bg-electric shadow-[0_0_13px_#22d3ee]" />
          The learning &amp; creation studio
        </div>

        <h1
          class="mt-7 max-w-[680px] font-display text-[2.65rem] font-semibold leading-[1.04] tracking-[-0.055em] text-white sm:text-6xl lg:text-[4.4rem]"
          data-hero-element
        >
          Turn curiosity into
          <span class="hero-gradient-text">working code.</span>
        </h1>

        <p
          class="mt-7 max-w-[560px] text-base leading-8 text-slate-300 sm:text-lg sm:leading-9"
          data-hero-element
        >
          70 free offline courses, 129 working templates, and a growing collection
          of open-source 2D and 3D games — on your Android phone or Windows PC.
        </p>

        <div class="mt-9 flex flex-col gap-3 sm:flex-row" data-hero-element>
          <button type="button" class="button-primary group sm:min-w-56" @click="$emit('download')">
            <Download :size="19" aria-hidden="true" />
            {{ primaryLabel }}
            <ArrowRight
              :size="17"
              class="transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </button>
          <a href="#setup" class="button-secondary sm:min-w-44"> See the setup </a>
        </div>

        <p
          v-if="availability.length"
          class="mt-4 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500"
          data-hero-element
        >
          Available for {{ availability.join(' · ') }} — free, no subscription
        </p>

        <ul
          class="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-xs font-semibold text-slate-400"
          aria-label="Product details"
          data-hero-element
        >
          <li class="inline-flex items-center gap-2">
            <Smartphone :size="15" class="text-emerald-400" aria-hidden="true" />
            Direct Android APK
          </li>
          <li class="inline-flex items-center gap-2">
            <Monitor :size="15" class="text-indigo-300" aria-hidden="true" />
            Windows desktop build
          </li>
          <li class="inline-flex items-center gap-2">
            <WifiOff :size="15" class="text-cyan-300" aria-hidden="true" />
            Offline-first
          </li>
        </ul>

        <!-- Instrument readout. Corner brackets instead of a rounded card keep
             the hero's technical register and stop it reading as one more
             glass panel. -->
        <div class="hero-readout mt-10 max-w-fit" data-hero-element>
          <span class="hero-readout-bracket hero-readout-bracket--tl" aria-hidden="true" />
          <span class="hero-readout-bracket hero-readout-bracket--br" aria-hidden="true" />
          <div class="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3.5">
            <span class="inline-flex items-center gap-2.5">
              <span class="relative flex h-2 w-2 shrink-0">
                <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                <span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span class="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-emerald-300">
                Environment ready
              </span>
            </span>
            <span
              v-for="item in readout"
              :key="item.key"
              class="hidden font-mono text-[10px] uppercase tracking-[0.13em] text-slate-500 sm:inline"
            >
              {{ item.key }}
              <b class="ml-1.5 font-semibold text-slate-300">{{ item.value }}</b>
            </span>
            <span class="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.13em] text-slate-500 sm:hidden">
              <Braces :size="12" class="text-cyan-300" aria-hidden="true" />
              70 courses · 129 templates
            </span>
          </div>
        </div>
      </div>
    </div>

    <div
      class="hero-scroll-cue pointer-events-none absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-3 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-slate-600 lg:flex"
      aria-hidden="true"
    >
      <span class="h-px w-12 bg-gradient-to-r from-transparent to-slate-700" />
      Scroll to trace the build
      <span class="h-px w-12 bg-gradient-to-l from-transparent to-slate-700" />
    </div>
  </section>
</template>

<style scoped>
.hero-shell {
  background: #020617;
}

.hero-base-grid {
  background-image:
    linear-gradient(rgba(100, 116, 139, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(100, 116, 139, 0.05) 1px, transparent 1px);
  background-position: center top;
  background-size: 62px 62px;
  opacity: 0.7;
}

.hero-glow {
  background:
    radial-gradient(circle at 74% 40%, rgba(99, 102, 241, 0.16), transparent 30rem),
    radial-gradient(circle at 62% 72%, rgba(124, 58, 237, 0.11), transparent 28rem);
  will-change: opacity, transform;
}

/* The scene lives behind the copy, so the left third is darkened hard and the
   right is left almost clear. A uniform scrim would either wash out the 3D or
   leave the headline unreadable. */
.hero-readability {
  z-index: 2;
  background: linear-gradient(
    90deg,
    #020617 0%,
    rgba(2, 6, 23, 0.98) 26%,
    rgba(2, 6, 23, 0.88) 42%,
    rgba(2, 6, 23, 0.46) 62%,
    rgba(2, 6, 23, 0.08) 82%,
    transparent 100%
  );
}

.hero-edge-fade {
  z-index: 3;
  background: linear-gradient(
    to bottom,
    #020617 0%,
    transparent 14%,
    transparent 80%,
    #020617 100%
  );
}

.hero-copy {
  position: relative;
  text-shadow: 0 2px 32px rgba(2, 6, 23, 0.76);
  will-change: transform, opacity;
}

.hero-gradient-text {
  background: linear-gradient(100deg, #a5b4fc 0%, #c4b5fd 42%, #67e8f9 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero-rail {
  position: absolute;
  top: 0.35rem;
  left: -1.65rem;
  display: none;
  width: 1px;
  height: 8.5rem;
  background: linear-gradient(to bottom, rgba(99, 102, 241, 0.5), transparent);
}

.hero-rail-tick {
  position: absolute;
  left: 0;
  width: 7px;
  height: 1px;
  background: rgba(99, 102, 241, 0.55);
}

.hero-rail-tick:nth-child(1) {
  top: 0;
}
.hero-rail-tick:nth-child(2) {
  top: 3.25rem;
  width: 4px;
  opacity: 0.6;
}
.hero-rail-tick:nth-child(3) {
  top: 6.5rem;
  width: 4px;
  opacity: 0.35;
}

@media (min-width: 1280px) {
  .hero-rail {
    display: block;
  }
}

.hero-readout {
  position: relative;
  border: 1px solid rgba(148, 163, 184, 0.1);
  background: rgba(2, 6, 23, 0.66);
  backdrop-filter: blur(10px);
}

.hero-readout-bracket {
  position: absolute;
  width: 10px;
  height: 10px;
  border: 1px solid rgba(34, 211, 238, 0.55);
}

.hero-readout-bracket--tl {
  top: -1px;
  left: -1px;
  border-right: 0;
  border-bottom: 0;
}

.hero-readout-bracket--br {
  right: -1px;
  bottom: -1px;
  border-top: 0;
  border-left: 0;
}

.hero-scroll-cue {
  animation: cue-breathe 2.4s ease-in-out infinite;
}

@keyframes cue-breathe {
  50% {
    opacity: 0.45;
    transform: translate(-50%, 5px);
  }
}

@media (max-width: 1023px) {
  .hero-readability {
    background: linear-gradient(
      90deg,
      #020617 0%,
      rgba(2, 6, 23, 0.97) 40%,
      rgba(2, 6, 23, 0.74) 70%,
      rgba(2, 6, 23, 0.3) 100%
    );
  }
}

@media (max-width: 639px) {
  .hero-readability {
    background: linear-gradient(
      to bottom,
      #020617 0%,
      rgba(2, 6, 23, 0.97) 46%,
      rgba(2, 6, 23, 0.74) 66%,
      rgba(2, 6, 23, 0.36) 84%,
      #020617 100%
    );
  }

  .hero-base-grid {
    background-size: 48px 48px;
    opacity: 0.5;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-scroll-cue {
    animation: none;
  }
}
</style>
