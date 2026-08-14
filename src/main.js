import { createApp } from 'vue'
import App from './App.vue'
import 'lenis/dist/lenis.css'
import './assets/main.css'

document.documentElement.classList.add('js-motion')

// Last-resort safety net. `js-motion` hides every reveal element until the
// motion layer shows it, so if the app never reaches that point — a module
// error, a blocked chunk, an unsupported browser — the page would render as
// nothing but a hero and a footer. Lifting the class after a few seconds means
// the worst case is a site without entrance animations rather than a site with
// no visible content. Normal startup clears it far sooner, in
// useScrollExperience, and this timeout then finds nothing to do.
window.setTimeout(() => {
  document.documentElement.classList.remove('js-motion')
}, 4000)

createApp(App).mount('#app')
