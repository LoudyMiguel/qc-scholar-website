<script setup>
import { Download, Menu, X } from '@lucide/vue'
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import BrandLogo from './BrandLogo.vue'

const emit = defineEmits(['download'])
const menuOpen = ref(false)
const menuButton = ref(null)

const links = [
  { label: 'Experience', href: '#experience' },
  { label: 'Features', href: '#features' },
  { label: 'Download', href: '#download' },
  { label: 'Setup', href: '#setup' },
  { label: 'Community', href: '#community' },
]

function requestDownload() {
  menuOpen.value = false
  emit('download')
}

watch(menuOpen, (isOpen) => {
  if (isOpen) document.addEventListener('keydown', handleMenuKeydown)
  else document.removeEventListener('keydown', handleMenuKeydown)
})

onBeforeUnmount(() =>
  document.removeEventListener('keydown', handleMenuKeydown),
)

async function handleMenuKeydown(event) {
  if (event.key !== 'Escape') return
  menuOpen.value = false
  await nextTick()
  menuButton.value?.focus()
}
</script>

<template>
  <header
    class="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-slate-950/75 backdrop-blur-xl"
  >
    <div class="site-container flex h-[76px] items-center justify-between">
      <BrandLogo />

      <nav class="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
        <a
          v-for="link in links"
          :key="link.href"
          :href="link.href"
          class="inline-flex min-h-11 items-center rounded-lg px-3.5 text-sm font-semibold text-slate-400 transition hover:bg-white/[0.04] hover:text-white"
        >
          {{ link.label }}
        </a>
      </nav>

      <div class="flex items-center gap-2.5">
        <span
          class="hidden items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.13em] text-emerald-300 sm:inline-flex"
        >
          <span class="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_#34d399]" />
          Offline-first
        </span>
        <button type="button" class="button-primary hidden md:inline-flex" @click="requestDownload">
          <Download :size="17" aria-hidden="true" />
          Download
        </button>
        <button
          ref="menuButton"
          type="button"
          class="grid h-11 w-11 place-items-center rounded-xl border border-slate-800 bg-slate-900 text-slate-200 lg:hidden"
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

    <Transition name="menu">
      <nav
        v-if="menuOpen"
        id="mobile-navigation"
        class="border-t border-white/[0.06] bg-slate-950/95 px-5 pb-5 pt-3 backdrop-blur-xl lg:hidden"
        aria-label="Mobile navigation"
      >
        <a
          v-for="link in links"
          :key="link.href"
          :href="link.href"
          class="flex min-h-12 items-center border-b border-slate-800/70 text-sm font-semibold text-slate-300"
          @click="menuOpen = false"
        >
          {{ link.label }}
        </a>
        <button type="button" class="button-primary mt-4 w-full" @click="requestDownload">
          <Download :size="17" aria-hidden="true" />
          Download GenXYZ Lab
        </button>
      </nav>
    </Transition>
  </header>
</template>

<style scoped>
.menu-enter-active,
.menu-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}

.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
