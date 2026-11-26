import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  LANDING_IMAGE_HEIGHT,
  LANDING_IMAGE_LOCALES,
  LANDING_IMAGE_WIDTH,
  landingImageSrc,
} from '../src/utils/landingImage'

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

  it('Bilddateien haben die im Code hinterlegten Maße', () => {
    for (const lang of LANDING_IMAGE_LOCALES) {
      const file = join(__dirname, '..', 'public', `normalizer-landingpage-${lang}.webp`)
      expect(webpSize(readFileSync(file))).toEqual({
        width: LANDING_IMAGE_WIDTH,
        height: LANDING_IMAGE_HEIGHT,
      })
    }
  })
})

/** Liest Breite und Höhe aus einem WebP-Header (VP8, VP8L oder VP8X). */
function webpSize(buf: Buffer): { width: number; height: number } {
  const chunk = buf.toString('ascii', 12, 16)
  if (chunk === 'VP8 ') {
    return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff }
  }
  if (chunk === 'VP8L') {
    const bits = buf.readUInt32LE(21)
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 }
  }
  if (chunk === 'VP8X') {
    return { width: buf.readUIntLE(24, 3) + 1, height: buf.readUIntLE(27, 3) + 1 }
  }
  throw new Error(`Unbekanntes WebP-Format: ${chunk}`)
}
