<script setup>
import {
  ArrowUpRight,
  BatteryCharging,
  BookOpenCheck,
  Download,
  ExternalLink,
  Play,
  Terminal,
} from '@lucide/vue'
import { siteConfig } from '../config/site'

defineEmits(['download'])

const steps = [
  {
    number: '01',
    title: 'Install official Termux',
    body: 'Get the current Termux APK from its verified F-Droid package page. Do not use the obsolete Play Store build.',
    icon: Download,
    link: siteConfig.termuxUrl,
    linkLabel: 'Open verified source',
  },
  {
    number: '02',
    title: 'Open Termux once',
    body: 'Launch Termux and let its initial environment finish preparing before you return to QC Scholar.',
    icon: Terminal,
  },
  {
    number: '03',
    title: 'Open Compiler Manager',
    body: 'In QC Scholar, go to Code Practice → Compilers → Compiler Manager.',
    icon: Play,
  },
  {
    number: '04',
    title: 'Follow the guided setup',
    body: 'Choose your language or framework, then follow its explicit installation, permission, and detection guide.',
    icon: BookOpenCheck,
  },
]
</script>

<template>
  <section id="setup" class="relative overflow-hidden py-24 sm:py-28">
    <div class="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-indigo-400/20 to-transparent" aria-hidden="true" />
    <div class="site-container relative">
      <div class="mx-auto max-w-3xl text-center" data-reveal>
        <span class="eyebrow">Android onboarding</span>
        <h2 class="section-heading mt-6">Real compilers, without the guesswork.</h2>
        <p class="section-copy mt-5">
          Four deliberate steps connect QC Scholar to the local toolchains running through Termux.
        </p>
      </div>

      <div class="relative mt-14">
        <div class="pointer-events-none absolute left-[12.5%] right-[12.5%] top-8 hidden h-px bg-gradient-to-r from-indigo-400/20 via-cyan-300/50 to-violet-400/20 lg:block" aria-hidden="true" />
        <ol class="grid gap-4 lg:grid-cols-4">
          <li
            v-for="(step, index) in steps"
            :key="step.number"
            data-scroll-depth="5"
          >
            <div class="h-full" data-reveal :style="{ '--reveal-delay': `${index * 80}ms` }">
              <article class="glass-panel group relative h-full rounded-2xl p-5 sm:p-6">
              <div class="relative z-10 flex items-center justify-between">
                <span class="grid h-12 w-12 place-items-center rounded-xl border border-indigo-400/20 bg-indigo-400/10 text-indigo-200 shadow-[0_0_25px_rgba(99,102,241,.12)]">
                  <component :is="step.icon" :size="21" aria-hidden="true" />
                </span>
                <span class="font-display text-2xl font-semibold text-slate-800">{{ step.number }}</span>
              </div>
              <h3 class="mt-7 font-display text-lg font-semibold tracking-tight text-white">{{ step.title }}</h3>
              <p class="mt-3 text-sm leading-7 text-slate-400">{{ step.body }}</p>
              <a
                v-if="step.link"
                :href="step.link"
                target="_blank"
                rel="noopener noreferrer"
                class="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg text-xs font-bold text-cyan-300 transition hover:text-cyan-200"
              >
                {{ step.linkLabel }}
                <span class="sr-only"> (opens in a new tab)</span>
                <ExternalLink :size="14" aria-hidden="true" />
              </a>
              </article>
            </div>
          </li>
        </ol>
      </div>

      <div class="mt-6 grid gap-4 lg:grid-cols-2" data-reveal>
        <div class="rounded-2xl border border-amber-300/15 bg-amber-300/[0.06] p-5 sm:flex sm:items-start sm:gap-4">
          <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-300/10 text-amber-300">
            <Download :size="20" aria-hidden="true" />
          </span>
          <div class="mt-3 sm:mt-0">
            <h3 class="text-sm font-bold text-amber-100">Install order matters</h3>
            <p class="mt-2 text-xs leading-6 text-amber-100/65">
              Planning to compile offline? Install Termux before QC Scholar so Android can expose the command permission that connects the two apps.
            </p>
          </div>
        </div>
        <div class="rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.05] p-5 sm:flex sm:items-start sm:gap-4">
          <span class="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan-300/10 text-cyan-300">
            <BatteryCharging :size="20" aria-hidden="true" />
          </span>
          <div class="mt-3 sm:mt-0">
            <h3 class="text-sm font-bold text-cyan-100">Keep long-running tools alive</h3>
            <p class="mt-2 text-xs leading-6 text-cyan-100/65">
              If Android stops a local server or tunnel, set Termux battery usage to <strong class="text-cyan-100">Unrestricted</strong> in Android settings.
            </p>
          </div>
        </div>
      </div>

      <div class="mt-8 flex flex-col items-center justify-between gap-5 rounded-3xl border border-indigo-400/15 bg-gradient-to-r from-indigo-500/10 via-slate-900/70 to-violet-500/10 p-7 sm:flex-row sm:p-9" data-reveal>
        <div>
          <p class="font-display text-xl font-semibold text-white">Ready to build on Android?</p>
          <p class="mt-2 text-sm text-slate-400">Get the latest release, then let Compiler Manager guide the setup.</p>
        </div>
        <div class="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
          <button type="button" class="button-primary w-full sm:w-auto" @click="$emit('download')">
            Download QC Scholar
            <ArrowUpRight :size="17" aria-hidden="true" />
          </button>
          <a
            :href="siteConfig.termuxDocsUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex min-h-9 items-center justify-center gap-1.5 text-[10px] font-semibold text-slate-500 hover:text-slate-300"
          >
            Read the official Termux installation notes
            <span class="sr-only"> (opens in a new tab)</span>
            <ExternalLink :size="11" />
          </a>
        </div>
      </div>
    </div>
  </section>
</template>
