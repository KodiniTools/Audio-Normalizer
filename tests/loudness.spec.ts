import { describe, it, expect } from 'vitest'
import { runOp, measureLoudnessR128, measureLoudnessRange } from '../src/workers/dspCore'
import { computeEnvelope } from '../src/utils/waveform'

const FS = 48000

/** 1 kHz sine, stereo, `seconds` long, at `amp` (linear). */
const sine = (seconds: number, amp: number): Float32Array => {
  const out = new Float32Array(Math.round(seconds * FS))
  for (let i = 0; i < out.length; i++) out[i] = amp * Math.sin((2 * Math.PI * 1000 * i) / FS)
  return out
}

const concat = (...parts: Float32Array[]): Float32Array => {
  const out = new Float32Array(parts.reduce((n, p) => n + p.length, 0))
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out
}

const dbToAmp = (db: number): number => Math.pow(10, db / 20)

describe('Loudness-Messung', () => {
  it('misst einen 1-kHz-Sinus bei -20 dBFS (Stereo) als ca. -20 LUFS (BS.1770 Referenz)', () => {
    const ch = sine(10, dbToAmp(-20))
    const lufs = measureLoudnessR128([ch, new Float32Array(ch)], FS)
    expect(lufs).toBeGreaterThan(-20.5)
    expect(lufs).toBeLessThan(-19.5)
  })

  it('gibt für einen gleichmäßigen Ton eine LRA nahe 0 LU', () => {
    const ch = sine(20, dbToAmp(-20))
    expect(measureLoudnessRange([ch, new Float32Array(ch)], FS)).toBeLessThan(0.5)
  })

  it('misst bei abwechselnd -20/-30 dBFS eine LRA von ca. 10 LU (EBU Tech 3342)', () => {
    const ch = concat(sine(20, dbToAmp(-20)), sine(20, dbToAmp(-30)))
    const lra = measureLoudnessRange([ch, new Float32Array(ch)], FS)
    expect(lra).toBeGreaterThan(9)
    expect(lra).toBeLessThan(11)
  })

  it("liefert in 'analyze' True Peak ≥ Sample-Peak und LRA, ohne die Daten zu ändern", () => {
    const ch = sine(5, 0.5)
    const copy = new Float32Array(ch)
    const out = runOp('analyze', [ch], FS, {})
    expect(out.truePeak).toBeGreaterThanOrEqual(out.peak)
    expect(out.truePeak).toBeLessThan(0.52)
    expect(out.lra).toBeDefined()
    expect(out.envelope).toBeUndefined()
    expect(ch).toEqual(copy)
  })

  it('liefert bei bearbeitenden Operationen eine Wellenform des Ergebnisses', () => {
    const out = runOp('rmsScale', [sine(2, 0.1)], FS, { targetRms: 0.2, targetDbtp: -1 })
    expect(out.envelope?.length).toBe(400)
    expect(Math.max(...out.envelope!)).toBeCloseTo(out.peak, 5)
  })
})

describe('computeEnvelope', () => {
  it('nimmt pro Abschnitt das Betragsmaximum über alle Kanäle', () => {
    const l = new Float32Array([0.1, -0.5, 0.2, 0.0])
    const r = new Float32Array([0.0, 0.1, -0.9, 0.3])
    expect(Array.from(computeEnvelope([l, r], 2))).toEqual([
      expect.closeTo(0.5, 6),
      expect.closeTo(0.9, 6),
    ])
  })

  it('kommt mit mehr Abschnitten als Samples und leeren Kanälen zurecht', () => {
    expect(computeEnvelope([new Float32Array([0.5, -0.25])], 4)).toHaveLength(4)
    expect(Array.from(computeEnvelope([], 3))).toEqual([0, 0, 0])
  })
})
