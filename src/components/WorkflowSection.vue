<script setup>
import { recommendedWorkflow } from '../docs-content'
</script>

<template>
  <section id="workflow" class="section border-y border-line bg-subtle">
    <div class="site-container">
      <div class="max-w-2xl">
        <p class="eyebrow">How it works</p>
        <h2 class="section-title mt-3">From first lesson to finished project</h2>
        <p class="section-lead mt-4">
          Courses, practice, and projects live in the same app, so what you learn becomes code you can run and keep.
        </p>
      </div>

      <ol class="mt-12 grid gap-4 lg:grid-cols-3">
        <li v-for="(step, index) in recommendedWorkflow" :key="step.label" class="card p-6">
          <div class="flex items-center gap-3">
            <span class="grid h-8 w-8 place-items-center rounded-full bg-brand text-sm font-semibold text-white">
              {{ index + 1 }}
            </span>
            <span class="text-sm font-semibold text-brand-text">{{ step.label }}</span>
          </div>
          <h3 class="mt-5 text-lg font-semibold text-fg">{{ step.title }}</h3>
          <p class="mt-2 text-sm leading-relaxed text-fg-muted">{{ step.detail }}</p>
        </li>
      </ol>
    </div>
  </section>
</template>
