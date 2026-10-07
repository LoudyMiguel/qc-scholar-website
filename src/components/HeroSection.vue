<script setup>
import { ArrowRight, BookOpen, Check, Download, LoaderCircle } from '@lucide/vue'
import { useReleases } from '../composables/useReleases'
import AppPreview from './AppPreview.vue'

const { recommended, downloadingId, startDownload } = useReleases()

const assurances = ['Free, no subscription', 'No account required', 'Works offline']
</script>

<template>
  <section id="top" class="hero relative overflow-hidden border-b border-line">
    <div class="site-container grid items-center gap-12 py-14 sm:py-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] lg:gap-16 lg:py-24">
      <div class="min-w-0">
        <a href="#features" class="badge transition-colors duration-150 hover:border-line-strong hover:text-fg">
          <span class="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
          New in 3.0: AI &amp; machine-learning studios
          <ArrowRight :size="13" aria-hidden="true" />
        </a>

        <h1 class="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-fg sm:text-5xl lg:text-[3.5rem]">
          Learn to code.
          <span class="block text-brand-text">Build real projects.</span>
        </h1>

        <p class="section-lead mt-6 max-w-xl">
          GenXYZ Lab is a free learning and coding studio for Android and Windows —
          70 offline courses, 129 working templates, and AI tools in one app.
        </p>

        <div class="mt-8 flex flex-col gap-3 sm:flex-row">
          <button
            v-if="recommended"
            type="button"
            class="btn btn-primary btn-lg"
            :aria-busy="downloadingId === recommended.id"
            :disabled="downloadingId === recommended.id"
            @click="startDownload(recommended)"
          >
            <LoaderCircle v-if="downloadingId === recommended.id" :size="18" class="animate-spin" aria-hidden="true" />
            <Download v-else :size="18" aria-hidden="true" />
            {{ downloadingId === recommended.id ? 'Starting download…' : `Download for ${recommended.shortName}` }}
          </button>
          <a v-else href="#download" class="btn btn-primary btn-lg">
            <Download :size="18" aria-hidden="true" />
            Download free
          </a>
          <a href="/docs/" class="btn btn-secondary btn-lg">
            <BookOpen :size="18" aria-hidden="true" />
            Read the docs
          </a>
        </div>

        <!-- Always rendered so the detected build's details, which appear only
             after hydration, fill this line instead of pushing content down. -->
        <p class="mt-3 text-sm text-fg-subtle">
          <template v-if="recommended">
            v{{ recommended.version }} · {{ recommended.fileKind }} · {{ recommended.size }} ·
            <a href="#download" class="text-link font-medium">Other platforms</a>
          </template>
          <template v-else>Available for Android and Windows</template>
        </p>

        <ul class="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-fg-muted" aria-label="Highlights">
          <li v-for="item in assurances" :key="item" class="inline-flex items-center gap-2">
            <Check :size="16" class="text-success-text" aria-hidden="true" />
            {{ item }}
          </li>
        </ul>
      </div>

      <AppPreview />
    </div>
  </section>
</template>

<style scoped>
/* A single static gradient: painted once, never animated or blurred. */
.hero {
  background-image: radial-gradient(
    60rem 32rem at 85% -10%,
    rgb(var(--brand) / 0.09),
    transparent 70%
  );
}
</style>
