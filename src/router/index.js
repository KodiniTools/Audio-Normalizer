import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'landing',
    component: () => import('../views/LandingPage.vue'),
  },
  {
    path: '/app',
    name: 'app',
    component: () => import('../views/AudioApp.vue'),
  },
  {
    path: '/anleitung',
    name: 'guide',
    component: () => import('../views/GuidePage.vue'),
    meta: {
      title: 'Anleitung - Audio Normalisierung Pro',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
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
