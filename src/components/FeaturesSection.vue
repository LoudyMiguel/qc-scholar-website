<script setup>
import {
  Award,
  Boxes,
  BrainCircuit,
  CodeXml,
  Gamepad2,
  GraduationCap,
  LayoutTemplate,
  Sparkles,
  Wrench,
} from '@lucide/vue'

// Each card names concrete examples rather than stopping at a count, so every
// claim can be checked against the app and the documentation.
const features = [
  {
    icon: GraduationCap,
    title: '70 offline courses',
    body: 'Guided lessons, checkpoints, and quizzes that keep working without a connection. Finish a course and earn a certificate.',
  },
  {
    icon: CodeXml,
    title: 'Code in 10 languages',
    body: 'Python, Java, JavaScript, TypeScript, C, C++, Dart, Rust, Go, and Kotlin, with code folding, indentation guides, and a run console.',
  },
  {
    icon: LayoutTemplate,
    title: '129 working templates',
    body: 'Start from complete, ready-to-run projects with previews, readiness checks, and a clear overview of every file.',
  },
  {
    icon: BrainCircuit,
    title: 'AI and machine learning',
    body: 'Generate ML starter projects, label images and tabular data in Dataset Studio, and follow local training in Training Studio.',
  },
  {
    icon: Wrench,
    title: '30+ tools and studios',
    body: 'API Tester, SQL and NoSQL labs, File Explorer, a terminal, Compiler Manager, and 13 offline academic solvers.',
  },
  {
    icon: Boxes,
    title: '20+ frameworks',
    body: 'Flutter, Arduino, Web Dev, and Notebook studios, plus starters for React, Vue, Django, FastAPI, Spring Boot, and more.',
  },
  {
    icon: Gamepad2,
    title: '30+ open-source games',
    body: 'Playable source to take apart — from classic arcade games to 3D projects like Subway Dash, billiards, and bowling.',
  },
  {
    icon: Sparkles,
    title: 'Project-aware AI assistant',
    body: 'Ask questions, explain code, and diagnose problems with an assistant that reads your project. Bring the provider you prefer.',
  },
  {
    icon: Award,
    title: 'Progress you can prove',
    body: 'Quizzes, certificates with QR verification, daily activity, and portable backups of everything you create.',
  },
]
</script>

<template>
  <section id="features" class="section">
    <div class="site-container">
      <div class="mx-auto max-w-2xl text-center">
        <p class="eyebrow">Features</p>
        <h2 class="section-title mt-3">Everything you need to learn, practice, and build</h2>
        <p class="section-lead mt-4">
          One app takes you from your first lesson to a running project — on your phone or your PC.
        </p>
      </div>

      <ul class="mt-12 grid gap-4 sm:mt-16 sm:grid-cols-2 lg:grid-cols-3">
        <li
          v-for="feature in features"
          :key="feature.title"
          class="card flex gap-4 p-5 transition-colors duration-150 hover:border-line-strong sm:block sm:p-6"
        >
          <span class="icon-tile">
            <component :is="feature.icon" :size="20" aria-hidden="true" />
          </span>
          <div class="min-w-0">
            <h3 class="text-base font-semibold text-fg sm:mt-5">{{ feature.title }}</h3>
            <p class="mt-1.5 text-sm leading-relaxed text-fg-muted sm:mt-2">{{ feature.body }}</p>
          </div>
        </li>
      </ul>

      <p class="mt-8 text-center text-sm text-fg-subtle">
        Everything above is included — no paid tier and nothing to unlock.
      </p>
    </div>
  </section>
</template>
