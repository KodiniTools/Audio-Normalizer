// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import de from '../src/locales/de.json'
import en from '../src/locales/en.json'

const placeholders = (text: string): string[] =>
  [...text.matchAll(/\{\s*(\w+)\s*\}/g)].map((m) => m[1]).sort()

describe('Übersetzungsdateien', () => {
  it('DE und EN haben dieselben Schlüssel', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(de).sort())
  })

  it('DE und EN nutzen je Schlüssel dieselben Platzhalter', () => {
    const deMessages: Record<string, string> = de
    const enMessages: Record<string, string> = en
    for (const key of Object.keys(deMessages)) {
      expect(placeholders(enMessages[key]), key).toEqual(placeholders(deMessages[key]))
    }
  })
})

describe('useI18n', () => {
  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
  })

  const load = async () => (await import('../src/composables/useI18n')).useI18n()

  it('startet auf Deutsch und ersetzt Platzhalter', async () => {
    const { t, locale } = await load()
    expect(locale.value).toBe('de')
    expect(t('status.reportExported', { count: 3 })).toBe(
      'Loudness-Report für 3 Datei(en) exportiert',
    )
    expect(t('gibt.es.nicht')).toBe('gibt.es.nicht')
  })

  it('lädt Englisch beim Umschalten nach und merkt sich die Sprache', async () => {
    const { t, locale, setLocale } = await load()
    await setLocale('en')
    expect(locale.value).toBe('en')
    expect(t('status.reportExported', { count: 2 })).toBe('Loudness report exported for 2 file(s)')
    expect(localStorage.getItem('locale')).toBe('en')
    expect(document.documentElement.getAttribute('lang')).toBe('en')
  })

  it('lädt eine gespeicherte englische Sprache vor dem ersten Render', async () => {
    localStorage.setItem('locale', 'en')
    const mod = await import('../src/composables/useI18n')
    await mod.loadActiveLocale()
    expect(mod.useI18n().t('nav-guide')).toBe('Guide')
  })

  it('bei schnellem Hin- und Herschalten gewinnt der letzte Wunsch', async () => {
    const { locale, setLocale } = await load()
    const toEn = setLocale('en')
    const toDe = setLocale('de')
    await Promise.all([toEn, toDe])
    expect(locale.value).toBe('de')
    expect(localStorage.getItem('locale')).toBe('de')
  })
})
