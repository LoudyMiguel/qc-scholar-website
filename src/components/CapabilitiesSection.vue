<script setup>
import {
  Boxes,
  Gamepad2,
  GraduationCap,
  LayoutTemplate,
  Wrench,
} from '@lucide/vue'
import TerminalGrid from './TerminalGrid.vue'

// The headline numbers. Each one names concrete examples rather than stopping
// at a count — concrete examples make the release claims verifiable.
const capabilities = [
  {
    value: '70',
    unit: 'courses',
    title: 'Free offline courses',
    detail:
      'Guided lessons, quizzes, and checkpoints that keep working with no connection.',
    icon: GraduationCap,
    tone: 'cyan',
    span: 'lg:col-span-2',
  },
  {
    value: '7',
    unit: 'tools',
    title: 'Built-in developer tools',
    detail:
      'Including an API Tester, an Arduino uploader, and a Web App Builder that turns a website into a mobile app.',
    icon: Wrench,
    tone: 'indigo',
    span: 'lg:col-span-2',
  },
  {
    value: '20+',
    unit: 'frameworks',
    title: 'App development frameworks',
    detail: 'Scaffold, run, and preview real projects on device.',
    icon: Boxes,
    tone: 'violet',
    span: '',
  },
  {
    value: '30+',
    unit: 'games',
    title: 'Open-source games',
    detail:
      'Playable source including 3D Subway Dash, billiards, bowling, and an interactive periodic table.',
    icon: Gamepad2,
    tone: 'amber',
    span: '',
  },
  {
    value: '129',
    unit: 'templates',
    title: 'Open-source system templates',
    detail:
      'Tested, ready-to-run projects across business, productivity, education, and developer workflows.',
    icon: LayoutTemplate,
    tone: 'cyan',
    span: 'lg:col-span-2',
  },
]

const toneText = {
  cyan: 'text-cyan-300',
  indigo: 'text-indigo-300',
  violet: 'text-violet-300',
  amber: 'text-amber-300',
}
</script>

<template>
  <section id="inside" class="relative overflow-hidden py-24 sm:py-28">
    <!-- Decorative backdrop. Real content always sits above it. -->
    <TerminalGrid />
    <div
      class="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/55 to-slate-950"
      aria-hidden="true"
    />
    <div
      class="pointer-events-none absolute left-1/2 top-1/3 h-[28rem] w-[48rem] -translate-x-1/2 rounded-full bg-indigo-600/[0.09] blur-[140px]"
      aria-hidden="true"
    />

    <div class="site-container relative">
      <div class="mx-auto max-w-3xl text-center" data-reveal>
        <span class="eyebrow">What is inside</span>
        <h2 class="section-heading mt-6">More than a course app.</h2>
        <p class="section-copy mt-5">
          A full workbench: courses to learn from, tools to build with, and
          open-source projects to take apart.
        </p>
      </div>

      <dl class="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="(item, index) in capabilities"
          :key="item.title"
          :class="item.span"
          data-reveal
          :style="{ '--reveal-delay': `${index * 70}ms` }"
        >
          <div class="capability-card group h-full">
            <span class="capability-bracket capability-bracket--tl" aria-hidden="true" />
            <span class="capability-bracket capability-bracket--br" aria-hidden="true" />

            <div class="relative flex h-full flex-col p-6">
              <component
                :is="item.icon"
                :size="21"
                :class="toneText[item.tone]"
                aria-hidden="true"
              />

              <dd class="mt-6 flex items-baseline gap-2">
                <span
                  class="font-display text-4xl font-semibold tracking-[-0.05em] text-white sm:text-[2.75rem]"
                >
                  {{ item.value }}
                </span>
                <span
                  class="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500"
                >
                  {{ item.unit }}
                </span>
              </dd>

              <dt class="mt-3 font-display text-base font-semibold tracking-tight text-white">
                {{ item.title }}
              </dt>
              <p class="mt-2 text-sm leading-6 text-slate-400">{{ item.detail }}</p>
            </div>
          </div>
        </div>
      </dl>

      <p
        class="mt-8 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-slate-600"
        data-reveal
      >
        Everything above is included — no paid tier, no unlock
      </p>
    </div>
  </section>
</template>

<style scoped>
.capability-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgb(148 163 184 / 0.13);
  border-radius: 1.25rem;
  background: linear-gradient(155deg, rgb(15 23 42 / 0.86), rgb(15 23 42 / 0.6));
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.05),
    0 24px 70px rgb(2 6 23 / 0.34);
  backdrop-filter: blur(14px);
  transition:
    border-color 420ms ease,
    transform 420ms cubic-bezier(0.16, 1, 0.3, 1);
}

.capability-card:hover {
  border-color: rgb(148 163 184 / 0.3);
  transform: translateY(-3px);
}

.capability-bracket {
  position: absolute;
  z-index: 1;
  width: 11px;
  height: 11px;
  border: 1px solid rgb(34 211 238 / 0.45);
  opacity: 0;
  transition: opacity 420ms ease;
}

.capability-card:hover .capability-bracket {
  opacity: 1;
}

.capability-bracket--tl {
  top: 9px;
  left: 9px;
  border-right: 0;
  border-bottom: 0;
}

.capability-bracket--br {
  right: 9px;
  bottom: 9px;
  border-top: 0;
  border-left: 0;
}

@media (prefers-reduced-motion: reduce) {
  .capability-card {
    transition: none;
  }

  .capability-card:hover {
    transform: none;
  }
}
</style>
