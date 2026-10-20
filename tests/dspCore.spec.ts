import { describe, it, expect } from 'vitest'
import type { DspOp } from '../src/types'
import {
  runOp,
  calcPeak,
  calcRMS,
  measureLoudnessR128,
  measureTruePeak,
} from '../src/workers/dspCore'

const FS = 48000

const dbToAmp = (db: number): number => Math.pow(10, db / 20)
const ampToDb = (amp: number): number => 20 * Math.log10(amp)

/** Sine at `freq` Hz, `seconds` long, amplitude `amp`, start phase `phase` (rad). */
const sine = (seconds: number, amp: number, freq = 1000, phase = 0): Float32Array => {
  const out = new Float32Array(Math.round(seconds * FS))
  for (let i = 0; i < out.length; i++)
    out[i] = amp * Math.sin((2 * Math.PI * freq * i) / FS + phase)
  return out
}

/** Deterministic white noise in [-amp, amp] (LCG, so runs are reproducible). */
const noise = (seconds: number, amp: number, seed = 1): Float32Array => {
  const out = new Float32Array(Math.round(seconds * FS))
  let s = seed
  for (let i = 0; i < out.length; i++) {
    s = (s * 1664525 + 1013904223) >>> 0
    out[i] = amp * ((s / 2 ** 32) * 2 - 1)
  }
  return out
}

const stereo = (ch: Float32Array): Float32Array[] => [ch, ch.slice()]
const rmsOf = (ch: Float32Array, from = 0, to = ch.length): number =>
  calcRMS([ch.subarray(from, to)])

describe('Messfunktionen', () => {
  it('calcPeak und calcRMS über mehrere Kanäle, leere Kanäle ergeben 0', () => {
    expect(calcPeak([Float32Array.of(0.1, -0.7), Float32Array.of(0.5)])).toBeCloseTo(0.7, 6)
    expect(calcRMS([Float32Array.of(1, -1), Float32Array.of(0, 0)])).toBeCloseTo(Math.SQRT1_2, 6)
    expect(calcPeak([new Float32Array(0)])).toBe(0)
    expect(calcRMS([new Float32Array(0)])).toBe(0)
  })

  it('True Peak findet Spitzen zwischen den Samples (fs/4, 45° Phase)', () => {
    // Samples liegen bei ±0.707·A, die echte Spitze liegt genau zwischen zwei Samples.
    const ch = sine(1, 0.5, FS / 4, Math.PI / 4)
    expect(ampToDb(calcPeak([ch]))).toBeCloseTo(ampToDb(0.5) - 3.01, 1)
    expect(Math.abs(ampToDb(measureTruePeak([ch])) - ampToDb(0.5))).toBeLessThan(0.3)
  })

  it('True Peak ist nie kleiner als der Sample-Peak', () => {
    const ch = noise(1, 0.8, 7)
    expect(measureTruePeak([ch])).toBeGreaterThanOrEqual(calcPeak([ch]))
  })
})

describe("dspCore 'ebur128'", () => {
  it('normalisiert auf die Ziel-Lautheit und hält das True-Peak-Limit ein', () => {
    const channels = stereo(sine(10, dbToAmp(-30)))
    const out = runOp('ebur128', channels, FS, { targetLufs: -16, targetDbtp: -1 })
    expect(measureLoudnessR128(channels, FS)).toBeCloseTo(-16, 1)
    expect(ampToDb(measureTruePeak(channels))).toBeLessThanOrEqual(-1 + 1e-3)
    expect(out.peak).toBeCloseTo(calcPeak(channels), 6)
  })

  it('senkt bei zu hohem Ziel die Pegel, bis True Peak auf der Grenze liegt', () => {
    // Sinus: LUFS ≈ Spitzenpegel, ein Ziel von +2 LUFS würde über −1 dBTP gehen.
    const channels = stereo(sine(10, dbToAmp(-20)))
    runOp('ebur128', channels, FS, { targetLufs: 2, targetDbtp: -1 })
    expect(ampToDb(measureTruePeak(channels))).toBeCloseTo(-1, 2)
    expect(measureLoudnessR128(channels, FS)).toBeCloseTo(-1, 0)
  })
})

describe("dspCore 'rmsScale'", () => {
  it('skaliert auf den Ziel-RMS', () => {
    const channels = stereo(sine(5, 0.1))
    const out = runOp('rmsScale', channels, FS, { targetRms: 0.2, targetDbtp: -1 })
    expect(out.rms).toBeCloseTo(0.2, 3)
  })

  it('begrenzt die Verstärkung auf maxRmsGain', () => {
    const channels = stereo(sine(5, 0.001))
    runOp('rmsScale', channels, FS, { targetRms: 0.5, maxRmsGain: 10 })
    expect(calcPeak(channels)).toBeCloseTo(0.01, 4)
  })

  it('wirft bei Stille statt durch 0 zu teilen', () => {
    expect(() => runOp('rmsScale', stereo(new Float32Array(FS)), FS, {})).toThrow('silent')
  })
})

describe("dspCore 'reduceClipping'", () => {
  it('lässt Signale unter der Schwelle bitgenau unverändert', () => {
    const ch = sine(1, 0.85)
    const before = ch.slice()
    runOp('reduceClipping', [ch], FS, { clipThreshold: 0.9 })
    expect(ch).toEqual(before)
  })

  it('rundet Spitzen über der Schwelle ab, Vorzeichen und Reihenfolge bleiben', () => {
    const ch = Float32Array.of(0.95, -1, 1.5, -3, 0.5)
    runOp('reduceClipping', [ch], FS, { clipThreshold: 0.9 })
    expect(ch[4]).toBe(0.5)
    for (const x of ch) expect(Math.abs(x)).toBeLessThanOrEqual(1)
    expect(ch[0]).toBeGreaterThan(0.9)
    expect(ch[1]).toBeLessThan(-0.9)
    expect(Math.abs(ch[3])).toBeGreaterThan(Math.abs(ch[2]))
    expect(Math.abs(ch[2])).toBeGreaterThan(Math.abs(ch[1]))
  })
})

describe("dspCore 'dynamicCompression'", () => {
  it('lässt leise Signale unter dem Knie unverändert', () => {
    const ch = sine(1, dbToAmp(-45))
    const before = ch.slice()
    runOp('dynamicCompression', [ch], FS, {})
    expect(ch).toEqual(before)
  })

  it('reduziert laute Signale im eingeschwungenen Zustand um (L − T)·(1 − 1/R)', () => {
    // 0 dBFS, Threshold −24 dB, Ratio 12 → 22 dB Reduktion
    const ch = sine(2, 1)
    runOp('dynamicCompression', [ch], FS, { threshold: -24, ratio: 12, knee: 30 })
    const tailPeak = calcPeak([ch.subarray(FS)])
    expect(ampToDb(tailPeak)).toBeGreaterThan(-24)
    expect(ampToDb(tailPeak)).toBeLessThan(-20)
  })
})

describe("dspCore 'noiseReduction'", () => {
  it('dämpft Rauschen deutlich und erhält den Nutzton', () => {
    // 2 s nur Rauschen, dann 2 s Ton mit demselben Rauschen
    const bg = noise(4, 0.02, 3)
    const tone = sine(2, 0.5)
    const ch = bg.slice()
    for (let i = 0; i < tone.length; i++) ch[2 * FS + i] += tone[i]
    const noiseBefore = rmsOf(ch, FS / 2, (3 * FS) / 2)
    const toneBefore = rmsOf(ch, (5 * FS) / 2, (7 * FS) / 2)

    runOp('noiseReduction', [ch], FS, {})

    const noiseAfter = rmsOf(ch, FS / 2, (3 * FS) / 2)
    const toneAfter = rmsOf(ch, (5 * FS) / 2, (7 * FS) / 2)
    expect(ampToDb(noiseAfter / noiseBefore)).toBeLessThan(-10)
    expect(Math.abs(ampToDb(toneAfter / toneBefore))).toBeLessThan(1)
  })
})

describe('runOp', () => {
  it('meldet unbekannte Operationen', () => {
    expect(() => runOp('gibtsNicht' as DspOp, [new Float32Array(4)], FS, {})).toThrow(
      'Unknown DSP op',
    )
  })
})
