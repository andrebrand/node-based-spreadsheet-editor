import { createApp } from 'vue'
import './assets/main.css'
import App from './App.vue'
import { nodes, edges, rawData } from './composables/usePipeline'

if (typeof window !== 'undefined') {
  ;(window as any).__PIPELINE__ = { nodes, edges, rawData }
}

createApp(App).mount('#app')
