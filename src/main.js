import { createApp } from 'vue'
import App from './App.vue'
import 'lenis/dist/lenis.css'
import './assets/main.css'

document.documentElement.classList.add('js-motion')

createApp(App).mount('#app')
