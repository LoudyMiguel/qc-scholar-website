<script setup>
import { Moon, Sun } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { useTheme } from '../composables/useTheme'

const { isDark, toggleTheme } = useTheme()

// The page is pre-rendered without knowing the visitor's theme, so the label
// stays neutral until hydration finishes and only then names the action.
// The icon needs no such wait: CSS picks it from the class theme-init.js put
// on <html> before first paint.
const mounted = ref(false)
onMounted(() => {
  mounted.value = true
})

const label = computed(() => {
  if (!mounted.value) return 'Toggle dark theme'
  return isDark.value ? 'Switch to light theme' : 'Switch to dark theme'
})
</script>

<template>
  <button
    type="button"
    class="icon-button"
    :aria-label="label"
    :title="label"
    @click="toggleTheme"
  >
    <Sun :size="18" class="theme-icon-sun" aria-hidden="true" />
    <Moon :size="18" class="theme-icon-moon" aria-hidden="true" />
  </button>
</template>

<style>
.theme-icon-sun,
:root.dark .theme-icon-moon {
  display: none;
}

:root.dark .theme-icon-sun {
  display: block;
}
</style>
