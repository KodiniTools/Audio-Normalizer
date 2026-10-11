import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { LANDING_IMAGE_LOCALES, landingImageSrc } from '../src/utils/landingImage'

describe('landingImageSrc', () => {
  it('liefert das Bild passend zur UI-Sprache', () => {
    expect(landingImageSrc('de', '/audionormalisierer/')).toBe(
      '/audionormalisierer/normalizer-landingpage-de.webp',
    )
    expect(landingImageSrc('en', '/audionormalisierer/')).toBe(
      '/audionormalisierer/normalizer-landingpage-en.webp',
    )
  })

  it('fällt bei unbekannter Sprache auf Deutsch zurück', () => {
    expect(landingImageSrc('fr', '/')).toBe('/normalizer-landingpage-de.webp')
    expect(landingImageSrc('', '/')).toBe('/normalizer-landingpage-de.webp')
  })

  it('ergänzt einen fehlenden Slash an der Basis-URL', () => {
    expect(landingImageSrc('en', '/base')).toBe('/base/normalizer-landingpage-en.webp')
  })

  it('jede unterstützte Sprache hat eine Bilddatei in public/', () => {
    for (const lang of LANDING_IMAGE_LOCALES) {
      const file = join(__dirname, '..', 'public', `normalizer-landingpage-${lang}.webp`)
      expect(existsSync(file)).toBe(true)
    }
  })
})
