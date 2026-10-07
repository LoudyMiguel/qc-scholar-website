// Runs synchronously in <head>, before first paint, so the page never flashes
// the wrong theme. It is a separate file rather than an inline script because
// the Content-Security-Policy in `_headers` deliberately disallows inline JS.
// Keep the storage key in sync with src/composables/useTheme.js.
;(function () {
  var root = document.documentElement
  var stored = null
  try {
    stored = window.localStorage.getItem('genxyz-theme')
  } catch {
    // Storage can be blocked in privacy modes; fall back to the OS setting.
  }
  var dark =
    stored === 'dark' ||
    (stored !== 'light' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)
  root.classList.add(dark ? 'dark' : 'light')
})()
