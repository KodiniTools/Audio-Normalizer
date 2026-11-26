import { describe, expect, it } from 'vitest'
import { splitHeroTitle } from '../src/utils/heroTitle'

describe('splitHeroTitle', () => {
  it('trennt das erste Wort vom Rest', () => {
    expect(splitHeroTitle('Audio Normalizer')).toEqual({ first: 'Audio', rest: 'Normalizer' })
  })

  it('behält mehrere Restwörter zusammen', () => {
    expect(splitHeroTitle('  Audio  Lautstärke Tool ')).toEqual({
      first: 'Audio',
      rest: 'Lautstärke Tool',
    })
  })

  it('liefert bei einem Wort oder leerem Text einen leeren Rest', () => {
    expect(splitHeroTitle('Audio')).toEqual({ first: 'Audio', rest: '' })
    expect(splitHeroTitle('')).toEqual({ first: '', rest: '' })
  })
})
