<script setup>
import { Check, Clock, Download, Monitor, Smartphone } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { detectPlatform, releases, siteConfig } from '../config/site'

defineEmits(['download'])

const detected = ref('')

onMounted(() => {
  detected.value = detectPlatform()
})

const platformIcons = { android: Smartphone, windows: Monitor }

// What each build actually does differently. Vague parity claims ("works
// everywhere!") are worse than useless here — the compiler story is genuinely
// different per platform and a visitor needs to know before downloading.
const highlights = {
  android: [
    'Guided courses, quizzes, and certificates offline',
    'Real compilers on-device through Termux',
    'Arduino, Flutter, and web project studios',
  ],
  windows: [
    'The same courses, editor, and project tools',
    'Uses the compilers already on your PC',
    'Larger screen, full keyboard shortcuts',
  ],
}

const cards = computed(() =>
  releases.map((release) => ({
    ...release,
    icon: platformIcons[release.id],
    highlights: highlights[release.id] || [],
    isDetected: detected.value === release.id,
  })),
)
</script>

<template>
  <section id="download" class="relative overflow-hidden py-24 sm:py-28">
    <div
      class="pointer-events-none absolute left-1/2 top-0 h-px w-[70%] -translate-x-1/2 bg-gradient-to-r from-transparent via-indigo-400/25 to-transparent"
      aria-hidden="true"
    />

    <div class="site-container relative">
      <div class="mx-auto max-w-3xl text-center" data-reveal>
        <span class="eyebrow">Get the app</span>
        <h2 class="section-heading mt-6">One workspace. Two platforms.</h2>
        <p class="section-copy mt-5">
          Free, with no account and no subscription. Pick the build that matches
          the device you learn on.
        </p>
      </div>

      <div class="mt-14 grid gap-4 lg:grid-cols-2">
        <article
          v-for="(card, index) in cards"
          :key="card.id"
          class="platform-card group"
          :class="{ 'is-detected': card.isDetected, 'is-pending': card.isPlaceholder }"
          data-reveal
          :style="{ '--reveal-delay': `${index * 90}ms` }"
        >
          <span class="card-bracket card-bracket--tl" aria-hidden="true" />
          <span class="card-bracket card-bracket--br" aria-hidden="true" />

          <div class="relative flex h-full flex-col p-6 sm:p-7">
            <div class="flex items-start justify-between gap-4">
              <span class="platform-glyph">
                <component :is="card.icon" :size="24" aria-hidden="true" />
              </span>

              <span
                v-if="card.isDetected && !card.isPlaceholder"
                class="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-emerald-300"
              >
                Your device
              </span>
              <span
                v-else-if="card.isPlaceholder"
                class="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1.5 font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-amber-200"
              >
                Coming soon
              </span>
            </div>

            <h3 class="mt-6 font-display text-2xl font-semibold tracking-tight text-white">
              {{ card.name }}
            </h3>
            <p class="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">
              {{ card.requirement }}
            </p>

            <ul class="mt-6 space-y-2.5">
              <li
                v-for="item in card.highlights"
                :key="item"
                class="flex items-start gap-2.5 text-sm leading-6 text-slate-400"
              >
                <span
                  class="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-indigo-400/12 text-indigo-300"
                >
                  <Check :size="11" :stroke-width="3" aria-hidden="true" />
                </span>
                {{ item }}
              </li>
            </ul>

            <div class="mt-auto pt-8">
              <div
                class="mb-4 flex items-center justify-between border-t border-slate-800/80 pt-4 font-mono text-[10px] uppercase tracking-[0.1em] text-slate-500"
              >
                <span>v{{ siteConfig.version }}</span>
                <span v-if="!card.isPlaceholder">{{ card.fileKind }} · {{ card.size }}</span>
                <span v-else>Not published</span>
              </div>

              <button
                v-if="!card.isPlaceholder"
                type="button"
                class="button-primary w-full"
                @click="$emit('download', card.id)"
              >
                <Download :size="18" aria-hidden="true" />
                Download for {{ card.shortName }}
              </button>
              <button v-else type="button" class="button-secondary w-full" disabled>
                <Clock :size="17" aria-hidden="true" />
                Not available yet
              </button>

              <p class="mt-3 text-center text-[11px] leading-5 text-slate-500">
                {{ card.note }}
              </p>
            </div>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.platform-card {
  position: relative;
  overflow: hidden;
  border: 1px solid rgb(148 163 184 / 0.13);
  background: linear-gradient(155deg, rgb(15 23 42 / 0.82), rgb(15 23 42 / 0.48));
  border-radius: 1.35rem;
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.05),
    0 28px 90px rgb(2 6 23 / 0.32);
  transition:
    border-color 420ms ease,
    transform 420ms cubic-bezier(0.16, 1, 0.3, 1);
}

.platform-card:hover {
  border-color: rgb(148 163 184 / 0.28);
  transform: translateY(-4px);
}

/* The detected platform gets a warmer edge and a soft interior glow, so the
   recommended choice is legible at a glance without hiding the other one. */
.platform-card.is-detected {
  border-color: rgb(129 140 248 / 0.34);
}

.platform-card.is-detected::before {
  position: absolute;
  top: -30%;
  right: -20%;
  width: 24rem;
  height: 24rem;
  border-radius: 50%;
  background: radial-gradient(circle, rgb(99 102 241 / 0.16), transparent 68%);
  content: '';
  pointer-events: none;
}

.platform-card.is-pending {
  opacity: 0.72;
}

.card-bracket {
  position: absolute;
  z-index: 1;
  width: 13px;
  height: 13px;
  border: 1px solid rgb(34 211 238 / 0.4);
  opacity: 0;
  transition: opacity 420ms ease;
}

.platform-card:hover .card-bracket,
.platform-card.is-detected .card-bracket {
  opacity: 1;
}

.card-bracket--tl {
  top: 10px;
  left: 10px;
  border-right: 0;
  border-bottom: 0;
}

.card-bracket--br {
  right: 10px;
  bottom: 10px;
  border-top: 0;
  border-left: 0;
}

.platform-glyph {
  display: grid;
  height: 3.25rem;
  width: 3.25rem;
  place-items: center;
  border: 1px solid rgb(255 255 255 / 0.07);
  border-radius: 1rem;
  background: rgb(2 6 23 / 0.55);
  color: rgb(165 180 252);
  transition: color 420ms ease, transform 420ms cubic-bezier(0.16, 1, 0.3, 1);
}

.platform-card:hover .platform-glyph {
  color: rgb(103 232 249);
  transform: translateY(-2px);
}

@media (prefers-reduced-motion: reduce) {
  .platform-card,
  .platform-glyph {
    transition: none;
  }

  .platform-card:hover {
    transform: none;
  }
}
</style>
