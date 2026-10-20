import { describe, it, expect } from 'vitest'
import { runOp } from '../src/workers/dspCore'

describe("dspCore 'meter'", () => {
  it('misst Sample-Peak und RMS über alle Kanäle, ohne die Daten zu ändern', () => {
    const left = new Float32Array([0.5, -0.5, 0.5, -0.5])
    const right = new Float32Array([0, 0, 0, -0.8])
    const before = [Array.from(left), Array.from(right)]
    const out = runOp('meter', [left, right], 48000, {})
    expect(out.peak).toBeCloseTo(0.8, 6)
    expect(out.rms).toBeCloseTo(Math.sqrt((4 * 0.25 + 0.64) / 8), 6)
    expect(out.lufs).toBeUndefined()
    expect([Array.from(left), Array.from(right)]).toEqual(before)
  })
})
