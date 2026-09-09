<script setup>
import {
  Bot,
  Boxes,
  CodeXml,
  Database,
  FolderOpen,
  WifiOff,
} from '@lucide/vue'

const features = [
  {
    title: 'Build and train real ML projects',
    body: 'Generate machine-learning starters, prepare image or tabular datasets, label object-detection data, and follow local training metrics.',
    icon: WifiOff,
    tone: 'cyan',
    size: 'large',
    layout: 'lg:col-span-4 lg:row-span-2',
    kicker: 'AI & ML Playground',
  },
  {
    title: 'Navigate larger code with clarity',
    body: 'Fold code regions, follow indentation guides, and work across project files in the enhanced editor.',
    icon: CodeXml,
    tone: 'indigo',
    size: 'medium',
    layout: 'lg:col-span-2',
    kicker: 'Enhanced code editor',
  },
  {
    title: 'Find every workspace faster',
    body: 'Search one Tools page for studios, solvers, APIs, databases, the terminal, compilers, and File Explorer.',
    icon: Boxes,
    tone: 'violet',
    size: 'medium',
    layout: 'lg:col-span-2',
    kicker: 'Tools & File Explorer',
  },
  {
    title: 'Explore 129 projects with less friction',
    body: 'Use the redesigned template gallery, richer project details, readiness signals, previews, and workspace placement.',
    icon: Database,
    tone: 'cyan',
    size: 'compact',
    layout: 'lg:col-span-2',
    kicker: 'Redesigned templates',
  },
  {
    title: 'Open ready-made AI and vision projects',
    body: 'Run supported models on photos or a live camera, then explore packaged vision, AR, and interactive ML projects.',
    icon: Bot,
    tone: 'indigo',
    size: 'compact',
    layout: 'lg:col-span-2',
    kicker: 'AI & Vision Projects',
  },
  {
    title: 'Understand every run',
    body: 'Use clearer inputs, output tables, diagrams, and step traces across the improved project and academic runners.',
    icon: FolderOpen,
    tone: 'amber',
    size: 'compact',
    layout: 'lg:col-span-2',
    kicker: 'Enhanced runner UX',
  },
]

const learningFlow = [
  { label: 'Learn', value: '70', detail: 'Offline courses' },
  { label: 'Create', value: '30+', detail: 'Tools & studios' },
  { label: 'Build', value: '129', detail: 'Working templates' },
]
</script>

<template>
  <section id="features" class="relative py-24 sm:py-28">
    <div class="site-container">
      <div class="mx-auto max-w-3xl text-center">
        <span class="eyebrow">One connected workspace</span>
        <h2 class="section-heading mt-6">From an idea to data, code, and a running project.</h2>
        <p class="section-copy mt-5">
          Version 3.0 brings AI and ML creation, stronger project tools, and a clearer path from source code to results.
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
