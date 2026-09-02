<script setup>
import {
  Award,
  Bot,
  Boxes,
  CodeXml,
  Database,
  WifiOff,
} from '@lucide/vue'

const features = [
  {
    title: 'Learn without losing momentum',
    body: 'Move through 70 guided courses, checkpoints, quizzes, and downloadable material—even when your connection is unreliable.',
    icon: WifiOff,
    tone: 'cyan',
    size: 'large',
    layout: 'lg:col-span-4 lg:row-span-2',
    kicker: 'Offline-first learning',
  },
  {
    title: 'Practice real code',
    body: 'Write, run, diagnose, and refine code across ten language workflows from one focused workspace.',
    icon: CodeXml,
    tone: 'indigo',
    size: 'medium',
    layout: 'lg:col-span-2',
    kicker: 'Code Practice',
  },
  {
    title: 'Install with confidence',
    body: 'Compiler Manager turns toolchain setup into clear, visible steps with detection and repair guidance.',
    icon: Boxes,
    tone: 'violet',
    size: 'medium',
    layout: 'lg:col-span-2',
    kicker: 'Compiler Manager',
  },
  {
    title: 'Build beyond snippets',
    body: 'Start from 129 working templates, then use project files, live previews, APIs, and databases to make each build your own.',
    icon: Database,
    tone: 'cyan',
    size: 'compact',
    layout: 'lg:col-span-2',
    kicker: 'Project studio',
  },
  {
    title: 'Ask AI to unblock the work',
    body: 'Get help running projects, tracing bugs, explaining code, and preparing deployable output.',
    icon: Bot,
    tone: 'indigo',
    size: 'compact',
    layout: 'lg:col-span-2',
    kicker: 'AI assistance',
  },
  {
    title: 'Make progress visible',
    body: 'Turn completed learning paths into polished, shareable certificates.',
    icon: Award,
    tone: 'amber',
    size: 'compact',
    layout: 'lg:col-span-2',
    kicker: 'Certificates',
  },
]

const learningFlow = [
  { label: 'Learn', value: '70', detail: 'Offline courses' },
  { label: 'Practice', value: '10', detail: 'Language workflows' },
  { label: 'Build', value: '129', detail: 'Working templates' },
]
</script>

<template>
  <section id="features" class="relative py-24 sm:py-28">
    <div class="site-container">
      <div class="mx-auto max-w-3xl text-center">
        <span class="eyebrow">One connected workspace</span>
        <h2 class="section-heading mt-6">From first concept to a project you can run.</h2>
        <p class="section-copy mt-5">
          GenXYZ Lab closes the gap between learning a concept and doing something real with it.
        </p>
      </div>

      <div class="mt-14 grid gap-4 md:grid-cols-2 lg:auto-rows-[250px] lg:grid-flow-row-dense lg:grid-cols-6">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="min-h-64"
          :class="feature.layout"
        >
          <div class="h-full">
            <article class="feature-card glass-panel relative h-full overflow-hidden rounded-2xl p-6">
            <div
              class="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-70 blur-[75px]"
              :class="{
                'bg-cyan-500/20': feature.tone === 'cyan',
                'bg-indigo-500/25': feature.tone === 'indigo',
                'bg-violet-500/25': feature.tone === 'violet',
                'bg-amber-400/20': feature.tone === 'amber',
              }"
              aria-hidden="true"
            />

            <div class="relative flex h-full flex-col">
              <span
                class="grid h-12 w-12 place-items-center rounded-xl border border-white/[0.06] bg-slate-950/50"
                :class="{
                  'text-cyan-300': feature.tone === 'cyan',
                  'text-indigo-300': feature.tone === 'indigo',
                  'text-violet-300': feature.tone === 'violet',
                  'text-amber-300': feature.tone === 'amber',
                }"
              >
                <component :is="feature.icon" :size="22" aria-hidden="true" />
              </span>

              <div v-if="feature.size === 'large'" class="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <div v-for="stage in learningFlow" :key="stage.label" class="rounded-xl border border-white/[0.06] bg-slate-950/45 p-3.5">
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-[10px] font-bold uppercase tracking-[0.13em] text-slate-400">{{ stage.label }}</span>
                    <span class="font-mono text-base font-bold text-cyan-300">{{ stage.value }}</span>
                  </div>
                  <p class="mt-2 text-[11px] font-semibold text-slate-300">{{ stage.detail }}</p>
                </div>
              </div>

              <div class="mt-auto" :class="feature.size === 'large' ? 'pt-8' : 'pt-7'">
                <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{{ feature.kicker }}</p>
                <h3 class="mt-3 font-display text-xl font-semibold tracking-tight text-white">{{ feature.title }}</h3>
                <p class="mt-3 text-sm leading-7 text-slate-400">{{ feature.body }}</p>
              </div>
            </div>
            </article>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
