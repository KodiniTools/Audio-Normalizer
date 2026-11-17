// ─────────────────────────────────────────────────────────────────────────────
// SPA SEO: keep <title>, meta description, canonical and Open Graph / Twitter
// tags in sync with the active route AND the active language.
//
// This app has no SSR, so without this every route would share the static tags
// from index.html. Googlebot renders JS and picks up these updates; social
// scrapers that don't run JS still get solid defaults from index.html.
// ─────────────────────────────────────────────────────────────────────────────
import { watch } from 'vue'
import type { Router } from 'vue-router'
import { useI18n } from './useI18n'
import { localeUrls, type Locale } from '../utils/localeUrl'
import { ROUTE_SEO, SITE_ORIGIN } from '../config/routeSeo'

const ensureTag = (selector: string, create: () => HTMLElement): HTMLElement => {
  let el = document.head.querySelector<HTMLElement>(selector)
  if (!el) {
    el = create()
    document.head.appendChild(el)
  }
  return el
}

const setMeta = (attr: 'name' | 'property', key: string, content: string): void => {
  const el = ensureTag(`meta[${attr}="${key}"]`, () => {
    const m = document.createElement('meta')
    m.setAttribute(attr, key)
    return m
  })
  el.setAttribute('content', content)
}

const setCanonical = (href: string): void => {
  const el = ensureTag('link[rel="canonical"]', () => {
    const l = document.createElement('link')
    l.setAttribute('rel', 'canonical')
    return l
  }) as HTMLLinkElement
  el.setAttribute('href', href)
}

const setAlternate = (hreflang: string, href: string): void => {
  const el = ensureTag(`link[rel="alternate"][hreflang="${hreflang}"]`, () => {
    const l = document.createElement('link')
    l.setAttribute('rel', 'alternate')
    l.setAttribute('hreflang', hreflang)
    return l
  })
  el.setAttribute('href', href)
}

const applySeo = (routeName: string, locale: Locale): void => {
  const seo = ROUTE_SEO[routeName] ?? ROUTE_SEO.landing
  const title = seo.title[locale]
  const description = seo.description[locale]
  const { canonical: url, alternates } = localeUrls(`${SITE_ORIGIN}${seo.canonicalPath}`, locale)

  document.title = title
  document.documentElement.setAttribute('lang', locale)

  setMeta('name', 'description', description)
  setCanonical(url)
  for (const { hreflang, href } of alternates) setAlternate(hreflang, href)

  setMeta('property', 'og:title', title)
  setMeta('property', 'og:description', description)
  setMeta('property', 'og:url', url)
  setMeta('property', 'og:locale', locale === 'de' ? 'de_DE' : 'en_US')
  setMeta('property', 'og:locale:alternate', locale === 'de' ? 'en_US' : 'de_DE')

  setMeta('name', 'twitter:title', title)
  setMeta('name', 'twitter:description', description)
}

/**
 * Wire up route- and language-driven SEO. Call once with the app router.
 */
export const initSeo = (router: Router): void => {
  const { locale } = useI18n()

  const currentRouteName = (): string =>
    (router.currentRoute.value.name as string | undefined) ?? 'landing'

  router.afterEach((to) => {
    applySeo((to.name as string | undefined) ?? 'landing', locale.value as Locale)
  })

  // Re-apply when the user switches language on the same route.
  watch(locale, (loc) => applySeo(currentRouteName(), loc as Locale))

  // Initial application (router.isReady resolves the first route).
  router.isReady().then(() => applySeo(currentRouteName(), locale.value as Locale))
}
