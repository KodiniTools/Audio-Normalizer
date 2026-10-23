import { describe, it, expect } from 'vitest'
import { kWeightingFilters, measureLoudnessR128 } from '../src/workers/dspCore'

/** Stereo sine at `freq` Hz, 10 s, amplitude `amp`. */
const stereoSine = (freq: number, amp: number, fs: number): Float32Array[] => {
  const ch = new Float32Array(10 * fs)
  for (let i = 0; i < ch.length; i++) ch[i] = amp * Math.sin((2 * Math.PI * freq * i) / fs)
  return [ch, ch.slice()]
}

describe('K-Gewichtung (ITU-R BS.1770-4)', () => {
  it('trifft bei 48 kHz die Koeffizienten-Tabellen der Norm', () => {
    const { shelf, highpass } = kWeightingFilters(48000)
    expect(shelf.b0).toBeCloseTo(1.53512485958697, 9)
    expect(shelf.b1).toBeCloseTo(-2.69169618940638, 9)
    expect(shelf.b2).toBeCloseTo(1.19839281085285, 9)
    expect(shelf.a1).toBeCloseTo(-1.69065929318241, 9)
    expect(shelf.a2).toBeCloseTo(0.73248077421585, 9)
    expect([highpass.b0, highpass.b1, highpass.b2]).toEqual([1, -2, 1])
    expect(highpass.a1).toBeCloseTo(-1.99004745483398, 9)
    expect(highpass.a2).toBeCloseTo(0.99007225036621, 9)
  })

  // Referenzwerte: ffmpeg ebur128 für dieselben Signale (Sinus mit Spitzenwert 0,1763,
  // erzeugt mit `sine=f=…:sample_rate=48000,volume=6dB`).
  const amp = 0.1763
  it.each([
    [40, -21.3],
    [60, -18.7],
    [100, -16.9],
    [1000, -15.1],
    [5000, -11.8],
  ])('misst einen %i-Hz-Sinus wie ffmpeg (%f LUFS)', (freq, ref) => {
    expect(Math.abs(measureLoudnessR128(stereoSine(freq, amp, 48000), 48000) - ref)).toBeLessThan(
      0.1,
    )
  })

  it('liefert bei 44,1 kHz dieselben Werte wie bei 48 kHz', () => {
    for (const freq of [40, 1000, 8000]) {
      const at44 = measureLoudnessR128(stereoSine(freq, amp, 44100), 44100)
      const at48 = measureLoudnessR128(stereoSine(freq, amp, 48000), 48000)
      expect(Math.abs(at44 - at48)).toBeLessThan(0.05)
    }
  })
})
