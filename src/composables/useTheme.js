import { readonly, ref } from 'vue'

// Keep in sync with public/theme-init.js, which applies the theme before paint.
const STORAGE_KEY = 'genxyz-theme'
const THEME_COLORS = { light: '#ffffff', dark: '#090b13' }

// Module-level state: one theme for the whole page, shared by every caller.
const isDark = ref(
  typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark'),
)
let initialized = false

function readStoredTheme() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    return value === 'dark' || value === 'light' ? value : null
  } catch {
    return null
  }
}

function apply(dark) {
  isDark.value = dark
  const root = document.documentElement
  root.classList.toggle('dark', dark)
  root.classList.toggle('light', !dark)
  document
    .querySelectorAll('meta[name="theme-color"]')
    .forEach((meta) => meta.setAttribute('content', THEME_COLORS[dark ? 'dark' : 'light']))
}

function initialize() {
  if (initialized || typeof window === 'undefined') return
  initialized = true

  const media = window.matchMedia?.('(prefers-color-scheme: dark)')
  const stored = readStoredTheme()
  apply(stored ? stored === 'dark' : Boolean(media?.matches))

  // Follow the operating system until the visitor makes an explicit choice.
  media?.addEventListener?.('change', (event) => {
    if (!readStoredTheme()) apply(event.matches)
  })
}

export function useTheme() {
  initialize()

  function toggleTheme() {
    const next = !isDark.value
    apply(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light')
    } catch {
      // The choice still applies for this visit.
    }
  }

  return { isDark: readonly(isDark), toggleTheme }
}
