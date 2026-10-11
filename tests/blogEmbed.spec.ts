import { describe, expect, it } from 'vitest'
import { BLOG_POST_URL, measureFrameHeight } from '../src/utils/blogEmbed'

type FrameLike = Parameters<typeof measureFrameHeight>[0]

const frameWith = (doc: unknown): FrameLike => ({ contentDocument: doc as Document | null })

describe('blogEmbed', () => {
  it('bettet den Beitrag „Audio normalisieren“ ein', () => {
    expect(BLOG_POST_URL).toBe('https://kodinitools.com/blog/audio-normalisieren/')
  })

  it('liefert die größere Inhaltshöhe von html und body', () => {
    const doc = { documentElement: { scrollHeight: 2400 }, body: { scrollHeight: 2350 } }
    expect(measureFrameHeight(frameWith(doc))).toBe(2400)
  })

  it('liefert null ohne lesbares Dokument (fremder Ursprung)', () => {
    expect(measureFrameHeight(frameWith(null))).toBeNull()
  })

  it('liefert null, wenn der Zugriff wirft (SecurityError)', () => {
    const frame = {
      get contentDocument(): Document | null {
        throw new Error('SecurityError')
      },
    }
    expect(measureFrameHeight(frame)).toBeNull()
  })

  it('liefert null bei Höhe 0 (Dokument noch leer)', () => {
    const doc = { documentElement: { scrollHeight: 0 }, body: null }
    expect(measureFrameHeight(frameWith(doc))).toBeNull()
  })
})
