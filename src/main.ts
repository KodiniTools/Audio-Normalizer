import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { initSeo } from './composables/useSeo'
import './assets/styles.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)

// Keep title / description / canonical / Open Graph in sync per route & language.
initSeo(router)

app.mount('#app')
