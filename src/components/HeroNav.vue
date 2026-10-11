<template>
  <!--
    Lokale Navigation (Muster: Equalizer 19, HeroNav.vue).
    Die globale Kodinitools-Navigation (SSI nav.html) ist `position: sticky`,
    daher klebt diese Leiste direkt darunter statt sie zu überlagern.
  -->
  <div class="hero-nav">
    <div class="hero-nav-inner">
      <router-link to="/" class="hero-nav-brand" @click="onHomeClick">
        <AudioWaveform :size="18" class="hero-nav-brand-icon" aria-hidden="true" />
        <span class="hero-nav-brand-text">Audio Normalizer</span>
      </router-link>

      <nav class="hero-nav-links" :aria-label="t('nav-label')">
        <router-link
          v-for="tab in TABS"
          :key="tab.id"
          :to="tab.to"
          class="hero-nav-link"
          :class="{ active: activeTab === tab.id }"
          :aria-current="activeTab === tab.id ? 'page' : undefined"
          @click="tab.id === 'home' && onHomeClick()"
        >
          {{ t(tab.labelKey) }}
        </router-link>
        <router-link to="/app" class="hero-nav-cta">
          {{ t('hero-cta') }} <span aria-hidden="true">→</span>
        </router-link>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import type { RouteLocationRaw } from 'vue-router'
  import { AudioWaveform } from 'lucide-vue-next'
  import { useI18n } from '../composables/useI18n'

  type TabId = 'home' | 'features' | 'guide' | 'blog' | 'faq'

  interface Tab {
    id: TabId
    labelKey: string
    to: RouteLocationRaw
  }

  const { t } = useI18n()
  const route = useRoute()

  /** Reihenfolge = Navigation. Anker-Tabs zeigen auf Abschnitte der Startseite. */
  const TABS: Tab[] = [
    { id: 'home', labelKey: 'nav-home', to: '/' },
    { id: 'features', labelKey: 'nav-features', to: { path: '/', hash: '#features' } },
    { id: 'guide', labelKey: 'nav-guide', to: '/anleitung' },
    { id: 'blog', labelKey: 'nav-blog', to: '/blog' },
    { id: 'faq', labelKey: 'nav-faq', to: { path: '/', hash: '#faq' } },
  ]

  /** Abschnitte der Startseite mit Scroll-Spy (Reihenfolge = Seite). */
  const LANDING_SECTIONS = ['features', 'faq'] as const

  // Unterhalb dieser Linie (px vom oberen Viewport-Rand) gilt ein Abschnitt als
  // erreicht: globale Navigation (70 px) + diese Leiste (56 px) + etwas Luft.
  const ACTIVE_LINE_PX = 160

  const landingSection = ref<TabId>('home')

  const activeTab = computed<TabId>(() => {
    switch (route.name) {
      case 'guide':
        return 'guide'
      case 'blog':
        return 'blog'
      default:
        return landingSection.value
    }
  })

  function handleScroll() {
    if (route.name !== 'landing') return
    // Aktiv ist der letzte Abschnitt, dessen Oberkante die Linie passiert hat
    let current: TabId = 'home'
    for (const id of LANDING_SECTIONS) {
      const el = document.getElementById(id)
      if (el && el.getBoundingClientRect().top <= ACTIVE_LINE_PX) current = id
    }
    // Am Seitenende ist der letzte Abschnitt aktiv, auch wenn er zu kurz ist,
    // um die Linie zu erreichen (FAQ mit geschlossenen Einträgen).
    const atBottom =
      window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
    const last = LANDING_SECTIONS[LANDING_SECTIONS.length - 1]
    if (atBottom && current !== 'home' && last) current = last
    landingSection.value = current
  }

  // „Start“/Logo auf der Startseite selbst: der Router hat nichts zu tun,
  // also nur nach oben scrollen.
  function onHomeClick() {
    if (route.name !== 'landing' || route.hash) return
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
  }

  onMounted(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
  })
</script>

<style scoped>
  .hero-nav {
    position: sticky;
    top: 70px; /* Höhe der globalen Navigation (nav.html, Desktop) */
    z-index: var(--ds-z-topbar);
    background: var(--ds-surface-1);
    border-bottom: var(--ds-border-width) solid var(--ds-border);
  }

  .hero-nav-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ds-space-4);
    height: var(--ds-topbar-height);
    max-width: var(--ds-container);
    margin: 0 auto;
    padding: 0 var(--ds-gutter);
  }

  .hero-nav-brand {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-space-2);
    flex-shrink: 0;
    font-size: var(--ds-text-lg);
    font-weight: var(--ds-weight-bold);
    letter-spacing: var(--ds-tracking-tight);
    color: var(--ds-text);
    text-decoration: none;
  }

  .hero-nav-brand:hover {
    color: var(--ds-text);
  }

  .hero-nav-brand-icon {
    color: var(--ds-accent);
  }

  .hero-nav-links {
    display: flex;
    align-items: center;
    gap: var(--ds-space-1);
    min-width: 0;
  }

  .hero-nav-link {
    padding: var(--ds-space-2) var(--ds-space-3);
    border-radius: var(--ds-radius-sm);
    font-size: var(--ds-text-md);
    font-weight: var(--ds-weight-semibold);
    white-space: nowrap;
    color: var(--ds-text-2);
    text-decoration: none;
    transition:
      color var(--ds-duration) var(--ds-ease),
      background-color var(--ds-duration) var(--ds-ease);
  }

  .hero-nav-link:hover {
    color: var(--ds-text);
    background: var(--ds-surface-2);
  }

  .hero-nav-link.active {
    color: var(--ds-accent);
  }

  /* Kompakte Variante des Hero-Buttons der Startseite */
  .hero-nav-cta {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-space-1);
    height: var(--ds-control-md);
    margin-left: var(--ds-space-2);
    padding: 0 var(--ds-space-4);
    border-radius: var(--ds-radius-md);
    background: var(--ds-accent);
    color: var(--ds-on-accent);
    font-size: var(--ds-text-md);
    font-weight: var(--ds-weight-semibold);
    white-space: nowrap;
    text-decoration: none;
    transition: background-color var(--ds-duration) var(--ds-ease);
  }

  .hero-nav-cta:hover {
    background: var(--ds-accent-hover);
    color: var(--ds-on-accent);
  }

  .hero-nav-brand:focus-visible,
  .hero-nav-link:focus-visible,
  .hero-nav-cta:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }

  @media (max-width: 768px) {
    .hero-nav {
      top: 60px; /* globale Navigation ist auf kleinen Bildschirmen 60 px hoch */
    }

    .hero-nav-inner {
      gap: var(--ds-space-3);
      padding: 0 var(--ds-space-4);
    }

    /* Tabs bleiben erreichbar: bei Platzmangel seitlich scrollbar (nur die Leiste,
       nie die Seite) */
    .hero-nav-links {
      overflow-x: auto;
      scrollbar-width: none;
    }

    .hero-nav-links::-webkit-scrollbar {
      display: none;
    }

    .hero-nav-link {
      padding: var(--ds-space-2);
      font-size: var(--ds-text-sm);
    }
  }

  @media (max-width: 600px) {
    .hero-nav-brand-text,
    .hero-nav-cta {
      display: none; /* Platz für die Tabs; die Hero-CTA folgt direkt darunter */
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .hero-nav-link,
    .hero-nav-cta {
      transition: none;
    }
  }
</style>
