// Build-time only (see scripts/prerender.mjs). Renders each page to HTML so
// the first paint is the real page instead of a plain fallback that flashes
// until the app loads, and so crawlers and link previews read the full
// content. The browser then hydrates this markup instead of re-creating it.
import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import App from './App.vue'
import DocsApp from './DocsApp.vue'

export const pages = {
  'index.html': () => renderToString(createSSRApp(App)),
  'docs/index.html': () => renderToString(createSSRApp(DocsApp)),
}
