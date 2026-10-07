<script setup>
import { ExternalLink } from '@lucide/vue'
import BrandLogo from './BrandLogo.vue'
import { siteConfig } from '../config/site'

const year = new Date().getFullYear()

const columns = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Download', href: '#download' },
      { label: 'Setup guide', href: '#setup' },
      { label: 'Documentation', href: '/docs/' },
    ],
  },
  {
    title: 'Community',
    links: [
      { label: 'Discussion', href: '#community' },
      { label: 'Report a bug', href: '#community' },
      { label: 'Privacy', href: '/privacy' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Release files', href: siteConfig.releasesUrl, external: true },
      { label: 'Termux on F-Droid', href: siteConfig.termuxUrl, external: true },
      { label: 'Termux install notes', href: siteConfig.termuxDocsUrl, external: true },
    ],
  },
]
</script>

<template>
  <footer class="border-t border-line bg-canvas">
    <div class="site-container py-12 sm:py-16">
      <div class="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <BrandLogo />
          <p class="mt-4 max-w-xs text-sm leading-relaxed text-fg-muted">
            A free, offline-first learning and coding studio for Android and Windows.
          </p>
        </div>

        <nav
          v-for="column in columns"
          :key="column.title"
          :aria-label="column.title"
        >
          <h2 class="text-sm font-semibold text-fg">{{ column.title }}</h2>
          <ul class="mt-3 space-y-1">
            <li v-for="link in column.links" :key="link.label">
              <a
                :href="link.href"
                class="inline-flex min-h-9 items-center gap-1.5 text-sm text-fg-muted transition-colors duration-150 hover:text-fg"
                v-bind="link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {}"
              >
                {{ link.label }}
                <template v-if="link.external">
                  <ExternalLink :size="13" aria-hidden="true" />
                  <span class="sr-only">(opens in a new tab)</span>
                </template>
              </a>
            </li>
          </ul>
        </nav>
      </div>

      <div class="mt-10 flex flex-col gap-3 border-t border-line pt-6 text-xs leading-relaxed text-fg-subtle sm:flex-row sm:justify-between">
        <p>© {{ year }} GenXYZ Lab. All rights reserved.</p>
        <p class="max-w-xl sm:text-right">
          Termux is a separate open-source project. GenXYZ Lab is not affiliated with or endorsed by the Termux maintainers or F-Droid.
        </p>
      </div>
    </div>
  </footer>
</template>
