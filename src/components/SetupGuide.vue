<script setup>
import {
  ArrowRight,
  BatteryCharging,
  ExternalLink,
  Info,
  Monitor,
  Smartphone,
} from '@lucide/vue'
import { siteConfig } from '../config/site'

const platforms = [
  {
    name: 'Windows',
    icon: Monitor,
    summary: 'Uses the compilers already installed on your PC — there is nothing extra to set up.',
    steps: [
      { title: 'Extract the ZIP', body: 'Unzip the whole download into a normal folder. Do not run the app from inside the archive.' },
      { title: 'Launch GenXYZ Lab', body: 'Open the extracted folder and start the GenXYZ Lab executable. Keep the other files beside it.' },
      { title: 'Check your toolchains', body: 'Compiler Manager detects Python, Node.js, JDK, GCC, Go, Rust, and Dart on your PATH and links to official installers for anything missing.' },
    ],
  },
  {
    name: 'Android',
    icon: Smartphone,
    summary: 'Courses work right away. To run code on your phone, connect local compilers through Termux.',
    steps: [
      { title: 'Install Termux from F-Droid', body: 'Use the current verified F-Droid build. The old Play Store version is obsolete.', link: siteConfig.termuxUrl, linkLabel: 'Open Termux on F-Droid' },
      { title: 'Open Termux once', body: 'Let it finish preparing its environment, then return to GenXYZ Lab.' },
      { title: 'Open Compiler Manager', body: 'In GenXYZ Lab, go to Code Practice → Compilers → Compiler Manager.' },
      { title: 'Follow the guided setup', body: 'Pick a language or framework and follow its install, permission, and detection steps.' },
    ],
  },
]
</script>

<template>
  <section id="setup" class="section">
    <div class="site-container">
      <div class="mx-auto max-w-2xl text-center">
        <p class="eyebrow">Setup</p>
        <h2 class="section-title mt-3">Up and running in a few minutes</h2>
        <p class="section-lead mt-4">
          Real compilers, without the guesswork. Here is everything each platform needs.
        </p>
      </div>

      <div class="mt-12 grid gap-4 lg:grid-cols-2">
        <article v-for="platform in platforms" :key="platform.name" class="card p-6 sm:p-8">
          <div class="flex items-center gap-3">
            <span class="icon-tile">
              <component :is="platform.icon" :size="20" aria-hidden="true" />
            </span>
            <h3 class="text-xl font-semibold text-fg">{{ platform.name }}</h3>
          </div>
          <p class="mt-4 text-sm leading-relaxed text-fg-muted">{{ platform.summary }}</p>

          <ol class="mt-6 space-y-5">
            <li v-for="(step, index) in platform.steps" :key="step.title" class="flex gap-4">
              <span class="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-line-strong text-xs font-semibold text-fg">
                {{ index + 1 }}
              </span>
              <div class="min-w-0 pt-0.5">
                <h4 class="text-sm font-semibold text-fg">{{ step.title }}</h4>
                <p class="mt-1 text-sm leading-relaxed text-fg-muted">{{ step.body }}</p>
                <a
                  v-if="step.link"
                  :href="step.link"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-link mt-1.5 inline-flex min-h-9 items-center gap-1.5 text-sm"
                >
                  {{ step.linkLabel }}
                  <ExternalLink :size="14" aria-hidden="true" />
                  <span class="sr-only">(opens in a new tab)</span>
                </a>
              </div>
            </li>
          </ol>
        </article>
      </div>

      <div class="mt-4 grid gap-4 md:grid-cols-2">
        <div class="flex gap-3 rounded-xl border border-warning/30 bg-warning/10 p-5">
          <Info :size="20" class="mt-0.5 shrink-0 text-warning-text" aria-hidden="true" />
          <div>
            <h3 class="text-sm font-semibold text-fg">Android: install order matters</h3>
            <p class="mt-1 text-sm leading-relaxed text-fg-muted">
              Planning to compile offline? Install Termux before GenXYZ Lab so Android can grant the permission that connects the two apps.
            </p>
          </div>
        </div>
        <div class="flex gap-3 rounded-xl border border-brand/25 bg-brand/5 p-5">
          <BatteryCharging :size="20" class="mt-0.5 shrink-0 text-brand-text" aria-hidden="true" />
          <div>
            <h3 class="text-sm font-semibold text-fg">Keep long-running tools alive</h3>
            <p class="mt-1 text-sm leading-relaxed text-fg-muted">
              If Android stops a local server or tunnel, set Termux battery usage to <strong class="font-semibold text-fg">Unrestricted</strong> in Android settings.
            </p>
          </div>
        </div>
      </div>

      <div class="card mt-12 flex flex-col items-start gap-6 p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 class="text-xl font-semibold text-fg">Ready to start building?</h3>
          <p class="mt-1 text-sm text-fg-muted">
            Download the app, then follow the full guide for tips, workflows, and troubleshooting.
          </p>
        </div>
        <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <a href="#download" class="btn btn-primary">Download GenXYZ Lab</a>
          <a href="/docs/#setup" class="btn btn-secondary">
            Full setup guide
            <ArrowRight :size="16" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  </section>
</template>
