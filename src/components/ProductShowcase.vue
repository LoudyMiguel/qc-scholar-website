<script setup>
import {
  Check,
  ChevronRight,
  CirclePlay,
  Code2,
  Sparkles,
  SquareTerminal,
  Workflow,
} from '@lucide/vue'
</script>

<template>
  <section id="experience" class="relative py-20 sm:py-28">
    <div
      class="pointer-events-none absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/10 blur-[130px]"
      aria-hidden="true"
    />

    <div class="site-container relative grid items-center gap-12 lg:grid-cols-[.72fr_1.28fr] lg:gap-16">
      <div data-reveal="left">
        <span class="eyebrow">Built for momentum</span>
        <h2 class="section-heading mt-6">Learning and building finally share the same space.</h2>
        <p class="section-copy mt-5">
          Move from a guided explanation into hands-on code without changing devices or rebuilding your setup every time.
        </p>

        <div class="mt-8 space-y-3">
          <div
            v-for="item in [
              'Courses, quizzes, and project practice stay connected',
              'Compiler guidance is visible before anything runs',
              'AI assistance works inside the project context',
            ]"
            :key="item"
            class="flex items-start gap-3 text-sm leading-6 text-slate-300"
          >
            <span class="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-400/10 text-emerald-300">
              <Check :size="13" :stroke-width="2.5" aria-hidden="true" />
            </span>
            {{ item }}
          </div>
        </div>

        <a href="#features" class="mt-8 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-bold text-indigo-300 transition hover:text-indigo-200">
          Explore every capability
          <ChevronRight :size="16" aria-hidden="true" />
        </a>
      </div>

      <div data-scroll-depth="14">
        <figure
          class="showcase-shell glass-panel group relative min-h-[470px] overflow-hidden rounded-[1.7rem] p-2 shadow-cyan sm:min-h-[560px] sm:p-3"
          data-reveal="right"
        >
        <div class="relative h-full min-h-[454px] overflow-hidden rounded-[1.25rem] border border-slate-700/70 bg-[#070d1a] sm:min-h-[536px]">
          <img
            src="/assets/feature-lab.webp"
            alt=""
            width="1200"
            height="900"
            loading="lazy"
            decoding="async"
            class="product-art absolute inset-0 h-full w-full object-cover object-center"
          />
          <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-slate-950/25" aria-hidden="true" />
          <div class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,transparent_20%,rgba(2,6,23,.38)_88%)]" aria-hidden="true" />

          <div class="absolute inset-x-0 top-0 z-10 flex h-12 items-center border-b border-white/10 bg-slate-950/55 px-4 backdrop-blur-md">
            <div class="flex gap-1.5" aria-hidden="true">
              <span class="h-2.5 w-2.5 rounded-full bg-rose-400/80" />
              <span class="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
              <span class="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
            </div>
            <div class="mx-auto flex items-center gap-2 rounded-md border border-white/[0.06] bg-slate-950/60 px-4 py-1.5 text-[10px] font-semibold text-slate-400">
              <span class="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_9px_#34d399]" />
              GenXYZ Lab · Project Studio
            </div>
          </div>

          <div class="float-card absolute left-4 top-20 z-10 rounded-2xl border border-cyan-300/15 bg-slate-950/68 p-3.5 shadow-xl backdrop-blur-xl sm:left-6 sm:top-24 sm:p-4">
            <div class="flex items-center gap-3">
              <span class="grid h-10 w-10 place-items-center rounded-xl bg-cyan-300/10 text-cyan-300">
                <Workflow :size="19" aria-hidden="true" />
              </span>
              <div>
                <p class="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-500">Connected workflow</p>
                <p class="mt-1 text-xs font-bold text-white">Learn → Code → Build</p>
              </div>
            </div>
          </div>

          <div class="float-card-delayed absolute right-4 top-[38%] z-10 hidden rounded-2xl border border-indigo-300/15 bg-slate-950/65 p-3.5 shadow-xl backdrop-blur-xl sm:block">
            <div class="flex items-center gap-2 text-[10px] font-bold text-indigo-200">
              <Sparkles :size="15" class="text-violet-300" aria-hidden="true" />
              Project-aware AI
            </div>
            <div class="mt-3 flex gap-1.5" aria-hidden="true">
              <span class="h-1.5 w-10 rounded-full bg-indigo-300/50" />
              <span class="h-1.5 w-6 rounded-full bg-cyan-300/40" />
              <span class="h-1.5 w-3 rounded-full bg-violet-300/40" />
            </div>
          </div>

          <div class="absolute inset-x-4 bottom-4 z-10 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/78 shadow-2xl backdrop-blur-xl sm:inset-x-6 sm:bottom-6">
            <div class="flex h-10 items-center justify-between border-b border-white/[0.07] px-4">
              <div class="flex items-center gap-2 text-[10px] font-semibold text-slate-400">
                <Code2 :size="13" class="text-cyan-300" aria-hidden="true" />
                main.dart
              </div>
              <span class="inline-flex min-h-7 items-center gap-1.5 rounded-lg bg-emerald-400/10 px-2.5 text-[9px] font-bold text-emerald-300">
                <CirclePlay :size="12" fill="currentColor" aria-hidden="true" />
                Run
              </span>
            </div>
            <div class="grid grid-cols-[1fr_auto] items-end gap-4 p-4">
              <pre class="overflow-hidden font-mono text-[9px] leading-5 text-slate-400 sm:text-[10px]"><code><span class="text-violet-300">final</span> project = LabProject(
  idea: <span class="text-amber-200">'build anywhere'</span>,
);
project.<span class="text-cyan-300">run</span>();</code></pre>
              <span class="hidden items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1.5 text-[9px] font-bold text-emerald-300 sm:inline-flex">
                <SquareTerminal :size="12" aria-hidden="true" />
                Termux · ready
              </span>
            </div>
          </div>
        </div>
        </figure>
      </div>
    </div>
  </section>
</template>

<style scoped>
.showcase-shell {
  transform-style: preserve-3d;
}

.product-art {
  transform: scale(1.035);
  transition: filter 600ms ease, transform 900ms cubic-bezier(0.16, 1, 0.3, 1);
}

.showcase-shell:hover .product-art {
  filter: saturate(1.12) brightness(1.06);
  transform: scale(1.075);
}

.float-card {
  animation: card-float 5.5s ease-in-out infinite;
}

.float-card-delayed {
  animation: card-float 6.5s 1.1s ease-in-out infinite;
}

@keyframes card-float {
  0%,
  100% {
    transform: translateY(0) rotate(-0.5deg);
  }
  50% {
    transform: translateY(-8px) rotate(0.6deg);
  }
}
</style>
