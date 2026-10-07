import { createApp, createSSRApp } from 'vue'
import DocsApp from './DocsApp.vue'
import './assets/main.css'

// Hydrate the build-time markup; see src/main.js.
const container = document.getElementById('app')
const app = container.firstElementChild ? createSSRApp(DocsApp) : createApp(DocsApp)
app.mount(container)
