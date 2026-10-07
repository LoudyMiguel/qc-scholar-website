import { createApp, createSSRApp } from 'vue'
import App from './App.vue'
import './assets/main.css'

// Production HTML is pre-rendered at build time (scripts/prerender.mjs), so
// hydrate that markup in place. The dev server serves an empty mount point.
const container = document.getElementById('app')
const app = container.firstElementChild ? createSSRApp(App) : createApp(App)
app.mount(container)
