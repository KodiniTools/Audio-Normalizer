import { describe, expect, it } from 'vitest'
import { localeUrls, localizedUrl, resolveInitialLocale } from '../src/utils/localeUrl'

const BASE = 'https://kodinitools.com/audionormalisierer/'

describe('resolveInitialLocale', () => {
  it('?lang hat Vorrang vor der gespeicherten Sprache', () => {
    expect(resolveInitialLocale('?lang=en', 'de')).toBe('en')
    expect(resolveInitialLocale('?source=audio-cutter&lang=de', 'en')).toBe('de')
  })

  it('ohne Speicher (Googlebot) gilt ?lang=en', () => {
    expect(resolveInitialLocale('?lang=en', null)).toBe('en')
  })

  it('ungültige oder fehlende Werte fallen auf Speicher bzw. Deutsch zurück', () => {
    expect(resolveInitialLocale('?lang=fr', 'en')).toBe('en')
    expect(resolveInitialLocale('', null)).toBe('de')
    expect(resolveInitialLocale('', 'xx')).toBe('de')
  })
})

describe('localeUrls', () => {
  it('Canonical folgt der Sprache', () => {
    expect(localizedUrl(BASE, 'de')).toBe(BASE)
    expect(localeUrls(BASE, 'en').canonical).toBe(`${BASE}?lang=en`)
    expect(localeUrls(`${BASE}app`, 'de').canonical).toBe(`${BASE}app`)
  })

  it('hreflang nennt beide Sprachen und Deutsch als x-default, unabhängig von der Sprache', () => {
    for (const locale of ['de', 'en'] as const) {
      expect(localeUrls(BASE, locale).alternates).toEqual([
        { hreflang: 'de', href: BASE },
        { hreflang: 'en', href: `${BASE}?lang=en` },
        { hreflang: 'x-default', href: BASE },
      ])
    }
  })
})
