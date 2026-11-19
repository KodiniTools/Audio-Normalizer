/**
 * Regressionsschutz für die Ladeperformance von index.html (PageSpeed Mobile):
 * keine render-blockierenden Fremd-Stylesheets, Schrift- und LCP-Bild-Preloads
 * zeigen auf vorhandene Dateien.
 */
import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { landingImageSrc } from '../src/utils/landingImage'

const ROOT = join(__dirname, '..')
const html = readFileSync(join(ROOT, 'index.html'), 'utf8')
const head = html.slice(0, html.indexOf('</head>')).replace(/<noscript>[\s\S]*?<\/noscript>/g, '')

describe('index.html', () => {
  it('lädt Font Awesome nicht render-blockierend', () => {
    const links = [...head.matchAll(/<link[^>]*fontawesome[^>]*>/g)].map((m) => m[0])
    expect(links.length).toBeGreaterThan(0)
    for (const link of links) {
      expect(link).toMatch(/media="print"/)
      expect(link).toMatch(/onload="this\.media ?= ?'all'"/)
    }
  })

  it('lädt vorab nur vorhandene Supreme-Schriften (mit crossorigin)', () => {
    const fonts = [...head.matchAll(/<link[^>]*as="font"[^>]*>/g)].map((m) => m[0])
    expect(fonts.length).toBeGreaterThan(0)
    for (const link of fonts) {
      const href = link.match(/href="([^"]+)"/)?.[1] ?? ''
      expect(existsSync(join(ROOT, href))).toBe(true)
      expect(link).toMatch(/\bcrossorigin\b/)
    }
  })

  it('lädt das Hero-Bild mit demselben Dateinamen vor, den die Startseite nutzt', () => {
    expect(head).toContain("'normalizer-landingpage-' + lang + '.webp'")
    for (const lang of ['de', 'en']) {
      const file = landingImageSrc(lang, '/').slice(1)
      expect(file).toBe(`normalizer-landingpage-${lang}.webp`)
      expect(existsSync(join(ROOT, 'public', file))).toBe(true)
    }
  })

  it('lädt keinen Google Tag Manager und kein Tracking (nur Search Console)', () => {
    expect(html).not.toMatch(/googletagmanager|GTM-|gtag\(|dataLayer|google-analytics/)
  })
})
