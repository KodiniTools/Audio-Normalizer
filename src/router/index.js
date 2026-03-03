// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '../views/LandingPage.vue'
import AudioApp from '../views/AudioApp.vue'
import GuidePage from '../views/GuidePage.vue'

const routes = [
  {
    path: '/',
    name: 'landing',
    component: LandingPage
  },
  {
    path: '/app',
    name: 'app',
    component: AudioApp
  },
  {
    path: '/anleitung',
    name: 'guide',
    component: GuidePage,
    meta: {
      title: 'Anleitung - Audio Normalisierung Pro'
    }
  }
]

const router = createRouter({
  // WICHTIG: base-Pfad muss mit vite.config.js übereinstimmen!
  history: createWebHistory('/audionormalisierer/'),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Redirect to /app when arriving with ?source=audiokonverter on the landing page
router.beforeEach((to, from, next) => {
  if (to.name === 'landing' && to.query.source === 'audiokonverter') {
    next({ name: 'app', query: { source: 'audiokonverter' } })
  } else {
    next()
  }
})

export default router