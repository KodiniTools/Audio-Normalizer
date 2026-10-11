import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
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
    path: '/blog',
    name: 'blog',
    component: () => import('../views/BlogPage.vue'),
    meta: {
      title: 'Blog - Audio Normalisierung Pro',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

// Abstand für Anker: jede Seite setzt `scroll-margin-top` auf ihren Zielen
// (globale Navigation + HeroNav), CSS bleibt damit die einzige Quelle.
// Fallback: Höhe beider Leisten (70 px + 56 px) plus Luft.
const DEFAULT_HASH_OFFSET = 140
function hashScrollOffset(hash: string): number {
  const el = document.getElementById(hash.slice(1))
  if (!el) return DEFAULT_HASH_OFFSET
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop)
  return Number.isFinite(margin) && margin > 0 ? margin : DEFAULT_HASH_OFFSET
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, top: hashScrollOffset(to.hash), behavior: 'smooth' }
    return { top: 0 }
  },
})

// Redirect to /app when arriving with ?source=audiokonverter on the landing page
router.beforeEach((to, _from, next) => {
  if (to.name === 'landing' && to.query.source === 'audiokonverter') {
    next({ name: 'app', query: { source: 'audiokonverter' } })
  } else {
    next()
  }
})

export default router
