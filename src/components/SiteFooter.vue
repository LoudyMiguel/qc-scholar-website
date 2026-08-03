<script setup>
import { ExternalLink, GitFork, Heart } from '@lucide/vue'
import BrandLogo from './BrandLogo.vue'
import { siteConfig } from '../config/site'

defineEmits(['download'])

const year = new Date().getFullYear()
</script>

<template>
  <footer class="border-t border-white/[0.06] bg-slate-950/60 pb-28 pt-12 sm:pb-12">
    <div class="site-container">
      <div class="grid gap-10 border-b border-slate-800/80 pb-10 md:grid-cols-[1.3fr_.7fr_.7fr]">
        <div>
          <BrandLogo />
          <p class="mt-5 max-w-md text-sm leading-7 text-slate-500">
            Guided learning, on-device coding, developer tools, and proof of progress in one Android workspace.
          </p>
          <p class="mt-4 inline-flex items-center gap-2 text-[11px] font-semibold text-slate-600">
            Built independently with
            <Heart :size="13" class="text-rose-400" fill="currentColor" aria-label="care" />
            and learner feedback.
          </p>
        </div>

        <nav aria-label="Product links">
          <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">Explore</p>
          <div class="mt-4 flex flex-col items-start gap-1">
            <a href="#features" class="inline-flex min-h-10 items-center text-xs font-semibold text-slate-400 transition hover:text-white">Features</a>
            <a href="#setup" class="inline-flex min-h-10 items-center text-xs font-semibold text-slate-400 transition hover:text-white">Android setup</a>
            <a href="#community" class="inline-flex min-h-10 items-center text-xs font-semibold text-slate-400 transition hover:text-white">Community</a>
            <a href="/privacy.html" class="inline-flex min-h-10 items-center text-xs font-semibold text-slate-400 transition hover:text-white">Privacy</a>
            <button type="button" class="inline-flex min-h-10 items-center text-xs font-semibold text-indigo-300 transition hover:text-indigo-200" @click="$emit('download')">Download APK</button>
          </div>
        </nav>

        <nav aria-label="Verified resources">
          <p class="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">Verified resources</p>
          <div class="mt-4 flex flex-col items-start gap-1">
            <a :href="siteConfig.termuxUrl" target="_blank" rel="noopener noreferrer" class="inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-slate-400 transition hover:text-white">
              Termux on F-Droid
              <span class="sr-only"> (opens in a new tab)</span>
              <ExternalLink :size="12" />
            </a>
            <a :href="siteConfig.termuxDocsUrl" target="_blank" rel="noopener noreferrer" class="inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-slate-400 transition hover:text-white">
              Installation notes
              <span class="sr-only"> (opens in a new tab)</span>
              <GitFork :size="12" />
            </a>
          </div>
        </nav>
      </div>

      <div class="flex flex-col gap-3 pt-6 text-[10px] leading-5 text-slate-600 sm:flex-row sm:items-center sm:justify-between">
        <p>© {{ year }} QC Scholar. All rights reserved.</p>
        <p class="max-w-xl sm:text-right">
          Termux is a separate open-source project. QC Scholar is not affiliated with or endorsed by the Termux maintainers or F-Droid.
        </p>
      </div>
    </div>
  </footer>
</template>
