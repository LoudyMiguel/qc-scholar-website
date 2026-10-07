<script setup>
import { Download, Menu, X } from '@lucide/vue'
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useActiveSection } from '../composables/useActiveSection'
import BrandLogo from './BrandLogo.vue'
import ThemeToggle from './ThemeToggle.vue'

const menuOpen = ref(false)
const menuButton = ref(null)

const links = [
  { label: 'Features', href: '#features', sections: ['features', 'workflow'] },
  { label: 'Download', href: '#download', sections: ['download', 'download-map'] },
  { label: 'Setup', href: '#setup', sections: ['setup'] },
  { label: 'Community', href: '#community', sections: ['community'] },
  { label: 'Docs', href: '/docs/', sections: [] },
]

const activeSection = useActiveSection(links.flatMap((link) => link.sections))

function isActive(link) {
  return link.sections.includes(activeSection.value)
}

function closeMenu() {
  menuOpen.value = false
}

watch(menuOpen, (isOpen) => {
  if (isOpen) document.addEventListener('keydown', handleMenuKeydown)
  else document.removeEventListener('keydown', handleMenuKeydown)
})

onBeforeUnmount(() => document.removeEventListener('keydown', handleMenuKeydown))

async function handleMenuKeydown(event) {
  if (event.key !== 'Escape') return
  menuOpen.value = false
  await nextTick()
  menuButton.value?.focus()
}
</script>

<template>
  <header class="sticky top-0 z-50 border-b border-line bg-canvas">
    <div class="site-container flex h-16 items-center justify-between gap-4">
      <BrandLogo />

      <nav class="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
        <a
          v-for="link in links"
          :key="link.href"
          :href="link.href"
          class="rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150"
          :class="isActive(link) ? 'bg-muted text-fg' : 'text-fg-muted hover:text-fg'"
          :aria-current="isActive(link) ? 'location' : undefined"
        >
          {{ link.label }}
        </a>
      </nav>

      <div class="flex items-center gap-1.5">
        <ThemeToggle />
        <a
          href="#download"
          class="btn btn-primary h-10 min-h-0 w-10 whitespace-nowrap px-0 sm:w-auto sm:px-4"
          aria-label="Download GenXYZ Lab"
        >
          <Download :size="17" aria-hidden="true" />
          <span class="hidden sm:inline">Download</span>
        </a>
        <button
          ref="menuButton"
          type="button"
          class="icon-button lg:hidden"
          :aria-expanded="menuOpen"
          aria-controls="mobile-navigation"
          :aria-label="menuOpen ? 'Close navigation' : 'Open navigation'"
          @click="menuOpen = !menuOpen"
        >
          <X v-if="menuOpen" :size="20" aria-hidden="true" />
          <Menu v-else :size="20" aria-hidden="true" />
        </button>
      </div>
    </div>

    <nav
      v-if="menuOpen"
      id="mobile-navigation"
      class="border-t border-line bg-canvas lg:hidden"
      aria-label="Mobile navigation"
    >
      <div class="site-container py-2">
        <a
          v-for="link in links"
          :key="link.href"
          :href="link.href"
          class="flex min-h-12 items-center border-b border-line text-base font-medium text-fg last:border-b-0"
          @click="closeMenu"
        >
          {{ link.label }}
        </a>
      </div>
    </nav>
  </header>
</template>
