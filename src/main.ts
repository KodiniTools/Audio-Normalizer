import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initSeo } from './composables/useSeo'
import { loadActiveLocale } from './composables/useI18n'
import './assets/styles.css'
import './assets/kodini-layout-stage1.css'

const app = createApp(App)
app.use(router)

// Pinia nutzt nur die App-Ansicht (/app). Erst beim Wechsel dorthin laden und installieren,
// damit Start-, Anleitungs- und Blogseite den Store-Code nicht mitladen müssen.
// Der Guard wartet, bis Pinia installiert ist, bevor AudioApp rendert.
let piniaInstalled: Promise<void> | null = null
router.beforeEach((to) => {
  if (to.name !== 'app') return
  piniaInstalled ??= import('pinia').then(
    ({ createPinia }) => {
      app.use(createPinia())
    },
    (err: unknown) => {
      piniaInstalled = null // beim nächsten Versuch erneut laden
      throw err
    },
  )
  return piniaInstalled
})

// Keep title / description / canonical / Open Graph in sync per route & language.
initSeo(router)

// Englisch liegt in einem eigenen Chunk – vor dem ersten Render laden, damit nichts flackert.
void loadActiveLocale().then(() => app.mount('#app'))
