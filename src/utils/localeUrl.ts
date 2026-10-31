// Sprachfassungen als eigene URLs: Deutsch ohne Parameter, Englisch mit ?lang=en.
// hreflang und Canonical zeigen darauf; beim Start hat ?lang Vorrang.

export type Locale = 'de' | 'en'

export const isLocale = (value: string | null | undefined): value is Locale =>
  value === 'de' || value === 'en'

/** Startsprache: ?lang=de|en, dann gespeicherte Wahl, sonst Deutsch. */
export function resolveInitialLocale(search: string, stored: string | null): Locale {
  const fromUrl = new URLSearchParams(search).get('lang')
  if (isLocale(fromUrl)) return fromUrl
  return isLocale(stored) ? stored : 'de'
}

/** Absolute URL einer Seite in der gewünschten Sprache. */
export function localizedUrl(baseUrl: string, locale: Locale): string {
  return locale === 'en' ? `${baseUrl}?lang=en` : baseUrl
}

/** Canonical und hreflang-Ziele für eine Seite. */
export function localeUrls(baseUrl: string, locale: Locale) {
  return {
    canonical: localizedUrl(baseUrl, locale),
    alternates: [
      { hreflang: 'de', href: localizedUrl(baseUrl, 'de') },
      { hreflang: 'en', href: localizedUrl(baseUrl, 'en') },
      { hreflang: 'x-default', href: localizedUrl(baseUrl, 'de') },
    ],
  }
}
