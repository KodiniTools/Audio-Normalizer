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

const SITE_ORIGIN = 'https://kodinitools.com'
const BASE_PATH = '/audionormalisierer'

type Locale = 'de' | 'en'

interface RouteSeo {
  title: Record<Locale, string>
  description: Record<Locale, string>
  /** Absolute path on the site (already includes the deploy base). */
  canonicalPath: string
}

// Per-route, per-language metadata. Keyed by route name.
const ROUTE_SEO: Record<string, RouteSeo> = {
  landing: {
    title: {
      de: 'Audio Normalizer – Audio kostenlos normalisieren (EBU R128 / LUFS) im Browser',
      en: 'Audio Normalizer – Normalize Audio Free (EBU R128 / LUFS) in the Browser',
    },
    description: {
      de: 'Audiodateien kostenlos und ohne Upload direkt im Browser normalisieren – EBU R128, LUFS, RMS und Peak. Batch-Verarbeitung, Export als WAV, MP3 & WebM. 100 % lokal.',
      en: 'Normalize audio files for free, right in your browser, with no upload – EBU R128, LUFS, RMS and Peak. Batch processing, export to WAV, MP3 & WebM. 100 % local.',
    },
    canonicalPath: `${BASE_PATH}/`,
  },
  app: {
    title: {
      de: 'Audio normalisieren – Audio Normalizer App (EBU R128, RMS, Peak)',
      en: 'Normalize Audio – Audio Normalizer App (EBU R128, RMS, Peak)',
    },
    description: {
      de: 'Lade deine Audiodateien und normalisiere sie mit EBU R128, RMS oder Peak – inklusive Plattform-Presets, Rauschunterdrückung und Export als WAV, MP3 & WebM. Alles lokal im Browser.',
      en: 'Load your audio files and normalize them with EBU R128, RMS or Peak – including platform presets, noise reduction and export to WAV, MP3 & WebM. All local in your browser.',
    },
    canonicalPath: `${BASE_PATH}/app`,
  },
  guide: {
    title: {
      de: 'Anleitung – Audio Normalizer: EBU R128, LUFS, RMS & Peak erklärt',
      en: 'Guide – Audio Normalizer: EBU R128, LUFS, RMS & Peak Explained',
    },
    description: {
      de: 'Schritt-für-Schritt-Anleitung zur Audio-Normalisierung: RMS, Peak und EBU R128 (LUFS) verstehen, richtige Zielwerte für Streaming, Podcast & Broadcast wählen und Dateien exportieren.',
      en: 'Step-by-step guide to audio normalization: understand RMS, Peak and EBU R128 (LUFS), pick the right targets for streaming, podcast & broadcast, and export your files.',
    },
    canonicalPath: `${BASE_PATH}/anleitung`,
  },
}

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

const applySeo = (routeName: string, locale: Locale): void => {
  const seo = ROUTE_SEO[routeName] ?? ROUTE_SEO.landing
  const title = seo.title[locale]
  const description = seo.description[locale]
  const url = `${SITE_ORIGIN}${seo.canonicalPath}`

  document.title = title
  document.documentElement.setAttribute('lang', locale)

  setMeta('name', 'description', description)
  setCanonical(url)

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
