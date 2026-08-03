<script setup>
import {
  ArrowRight,
  Braces,
  Download,
  ShieldCheck,
  WifiOff,
} from '@lucide/vue'
import TerminalGrid from './TerminalGrid.vue'

defineEmits(['download'])
</script>

<template>
  <section id="top" class="hero-shell relative isolate min-h-[880px] overflow-hidden pb-24 pt-32 sm:min-h-[850px] sm:pt-36 lg:min-h-[900px] lg:pt-40">
    <div class="hero-base-grid pointer-events-none absolute inset-0" aria-hidden="true" />
    <TerminalGrid />
    <div class="hero-terminal-glow pointer-events-none absolute inset-0" data-hero-glow aria-hidden="true" />
    <div class="hero-readability pointer-events-none absolute inset-0" aria-hidden="true" />
    <div class="hero-edge-fade pointer-events-none absolute inset-0" aria-hidden="true" />

    <div class="site-container relative z-10 flex min-h-[690px] items-center sm:min-h-[650px] lg:min-h-[690px]">
      <div class="hero-copy w-full max-w-[700px]" data-hero-copy>
        <div class="eyebrow" data-hero-element>
          <span class="h-1.5 w-1.5 rounded-full bg-electric shadow-[0_0_13px_#22d3ee]" />
          The Android learning &amp; creation studio
        </div>

        <h1
          class="mt-7 max-w-[680px] font-display text-[2.65rem] font-semibold leading-[1.04] tracking-[-0.055em] text-white sm:text-6xl lg:text-[4.5rem]"
          data-hero-element
        >
          Turn curiosity into
          <span class="bg-gradient-to-r from-indigo-300 via-violet-300 to-cyan-300 bg-clip-text text-transparent">
            working code.
          </span>
        </h1>

        <p class="mt-7 max-w-[590px] text-base leading-8 text-slate-300 sm:text-lg sm:leading-9" data-hero-element>
          Learn through guided courses, practice with real toolchains, build complete projects, and get help when you are stuck—all from your Android device.
        </p>

        <div class="mt-8 flex flex-col gap-3 sm:flex-row" data-hero-element>
          <button type="button" class="button-primary group sm:min-w-52" @click="$emit('download')">
            <Download :size="19" aria-hidden="true" />
            Download QC Scholar
            <ArrowRight
              :size="17"
              class="transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </button>
          <a href="#setup" class="button-secondary sm:min-w-48">
            See the 4-step setup
          </a>
        </div>

        <ul
          class="mt-7 flex flex-wrap gap-x-5 gap-y-3 text-xs font-semibold text-slate-400"
          aria-label="Product details"
          data-hero-element
        >
          <li class="inline-flex items-center gap-2">
            <ShieldCheck :size="15" class="text-emerald-400" aria-hidden="true" />
            Direct Android APK
          </li>
          <li class="inline-flex items-center gap-2">
            <WifiOff :size="15" class="text-indigo-300" aria-hidden="true" />
            Offline-first learning
          </li>
          <li class="inline-flex items-center gap-2">
            <Braces :size="15" class="text-cyan-300" aria-hidden="true" />
            On-device toolchains
          </li>
        </ul>

        <div class="mt-9 inline-flex max-w-full items-center gap-3 rounded-xl border border-cyan-300/10 bg-slate-950/72 px-3.5 py-2.5 shadow-[0_18px_50px_rgba(2,6,23,.35)] backdrop-blur-md" data-hero-element>
          <span class="relative flex h-2.5 w-2.5 shrink-0">
            <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
            <span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
          <span class="truncate font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Compiler Manager · local environment ready
          </span>
        </div>
      </div>
    </div>

    <div class="hero-scroll-cue pointer-events-none absolute bottom-9 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-3 text-[9px] font-bold uppercase tracking-[0.22em] text-slate-600 lg:flex" aria-hidden="true">
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
    linear-gradient(rgba(100, 116, 139, 0.055) 1px, transparent 1px),
    linear-gradient(90deg, rgba(100, 116, 139, 0.055) 1px, transparent 1px);
  background-position: center top;
  background-size: 62px 62px;
  opacity: 0.72;
}

.hero-terminal-glow {
  background:
    radial-gradient(circle at 79% 31%, rgba(34, 211, 238, 0.13), transparent 27rem),
    radial-gradient(circle at 68% 68%, rgba(124, 58, 237, 0.12), transparent 30rem);
  opacity: 0.9;
  will-change: opacity, transform;
}

.hero-readability {
  z-index: 2;
  background: linear-gradient(
    90deg,
    #020617 0%,
    rgba(2, 6, 23, 0.985) 24%,
    rgba(2, 6, 23, 0.93) 41%,
    rgba(2, 6, 23, 0.58) 59%,
    rgba(2, 6, 23, 0.14) 78%,
    rgba(2, 6, 23, 0.03) 100%
  );
}

.hero-edge-fade {
  z-index: 3;
  background:
    linear-gradient(to bottom, #020617 0%, transparent 13%, transparent 79%, #020617 100%),
    radial-gradient(ellipse at center, transparent 48%, rgba(2, 6, 23, 0.58) 100%);
}

.hero-copy {
  text-shadow: 0 2px 32px rgba(2, 6, 23, 0.76);
  will-change: transform, opacity;
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
      rgba(2, 6, 23, 0.985) 38%,
      rgba(2, 6, 23, 0.78) 68%,
      rgba(2, 6, 23, 0.3) 100%
    );
  }
}

@media (max-width: 639px) {
  .hero-readability {
    background: linear-gradient(
      to bottom,
      #020617 0%,
      rgba(2, 6, 23, 0.98) 50%,
      rgba(2, 6, 23, 0.72) 68%,
      rgba(2, 6, 23, 0.3) 86%,
      #020617 100%
    );
  }

  .hero-edge-fade {
    background: linear-gradient(to bottom, #020617 0%, transparent 12%, transparent 88%, #020617 100%);
  }

  .hero-base-grid {
    background-size: 48px 48px;
    opacity: 0.54;
  }
}

</style>
