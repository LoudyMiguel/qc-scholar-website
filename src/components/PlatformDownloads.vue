<script setup>
import { Check, Clock, Download, ExternalLink, LoaderCircle } from '@lucide/vue'
import { computed } from 'vue'
import { siteConfig } from '../config/site'
import { useReleases } from '../composables/useReleases'

const props = defineProps({
  downloadCount: {
    type: Number,
    default: 0,
  },
  countReady: {
    type: Boolean,
    default: false,
  },
})

const { cards, recommended, downloadingId, startDownload } = useReleases()

const formattedDownloadCount = computed(() => props.downloadCount.toLocaleString())
</script>

<template>
  <section id="download" class="section">
    <div class="site-container">
      <div class="mx-auto max-w-2xl text-center">
        <p class="eyebrow">Download</p>
        <h2 class="section-title mt-3">Get GenXYZ Lab for your device</h2>
        <p class="section-lead mt-4">
          Free, with no account and no subscription. Pick the build for the device you learn on.
        </p>
        <p v-if="countReady" class="badge mt-6" aria-live="polite">
          <span class="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
          <span>
            <strong class="font-semibold text-fg">{{ formattedDownloadCount }}</strong>
            download{{ downloadCount === 1 ? '' : 's' }} started
          </span>
        </p>
      </div>

      <div
        class="mx-auto mt-12 grid max-w-4xl gap-4"
        :class="cards.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'"
      >
        <article
          v-for="card in cards"
          :key="card.id"
          class="card flex min-w-0 flex-col p-5 sm:p-8"
          :class="{
            'border-brand ring-1 ring-brand': card.isDetected && !card.isPlaceholder,
            'opacity-75': card.isPlaceholder,
          }"
        >
          <div class="flex items-start justify-between gap-4">
            <span class="icon-tile h-12 w-12">
              <component :is="card.icon" :size="24" aria-hidden="true" />
            </span>
            <span
              v-if="card.isDetected && !card.isPlaceholder"
              class="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand-text"
            >
              Your device
            </span>
            <span
              v-else-if="card.isPlaceholder"
              class="rounded-full bg-warning/15 px-2.5 py-1 text-xs font-semibold text-warning-text"
            >
              Coming soon
            </span>
          </div>

          <h3 class="mt-5 text-xl font-semibold text-fg">{{ card.name }}</h3>
          <p class="mt-1 text-sm text-fg-muted">{{ card.requirement }}</p>

          <ul class="mt-6 space-y-3">
            <li
              v-for="item in card.highlights"
              :key="item"
              class="flex items-start gap-3 text-sm text-fg-muted"
            >
              <Check :size="17" class="mt-0.5 shrink-0 text-success-text" aria-hidden="true" />
              {{ item }}
            </li>
          </ul>

          <div class="mt-auto pt-8">
            <dl class="mb-4 flex items-center justify-between border-t border-line pt-4 text-sm text-fg-subtle">
              <div>
                <dt class="sr-only">Version</dt>
                <dd>v{{ card.version }}</dd>
              </div>
              <div>
                <dt class="sr-only">File</dt>
                <dd>{{ card.isPlaceholder ? 'Not published yet' : `${card.fileKind} · ${card.size}` }}</dd>
              </div>
            </dl>

            <a
              v-if="!card.isPlaceholder"
              :href="card.url"
              class="btn w-full sm:btn-lg"
              :class="card.isDetected || !recommended ? 'btn-primary' : 'btn-secondary'"
              :aria-busy="downloadingId === card.id"
              @click.prevent="startDownload(card)"
            >
              <LoaderCircle v-if="downloadingId === card.id" :size="18" class="animate-spin" aria-hidden="true" />
              <Download v-else :size="18" aria-hidden="true" />
              {{ downloadingId === card.id ? 'Starting download…' : `Download for ${card.shortName}` }}
            </a>
            <button v-else type="button" class="btn btn-secondary w-full sm:btn-lg" disabled>
              <Clock :size="18" aria-hidden="true" />
              Not available yet
            </button>

            <p class="mt-3 text-center text-xs text-fg-subtle">{{ card.note }}</p>
          </div>
        </article>
      </div>

      <p class="mt-8 text-center text-sm text-fg-muted">
        Prefer to verify first?
        <a :href="siteConfig.releasesUrl" target="_blank" rel="noopener noreferrer" class="text-link inline-flex items-center gap-1">
          See every release and its SHA-256 checksums
          <ExternalLink :size="13" aria-hidden="true" />
          <span class="sr-only">(opens in a new tab)</span>
        </a>
      </p>
    </div>
  </section>
</template>
