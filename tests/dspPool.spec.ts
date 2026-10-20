import { describe, it, expect, vi, afterEach } from 'vitest'
import type { DspRequest, DspResponse } from '../src/types'

// Fake module worker: answers each request asynchronously with peak = first
// sample, so results can be traced back to the job that produced them.
class FakeWorker extends EventTarget {
  postMessage(req: DspRequest): void {
    const delay = req.channels[0][1] ?? 0
    setTimeout(() => {
      const data: DspResponse = {
        jobId: req.jobId,
        ok: true,
        channels: req.channels,
        peak: req.channels[0][0],
        rms: 0,
      }
      this.dispatchEvent(new MessageEvent('message', { data }))
    }, delay)
  }
  terminate(): void {}
}

vi.stubGlobal('Worker', FakeWorker)
const { dspPool } = await import('../src/utils/dspPool')

const job = (value: number, delayMs: number) => ({
  op: 'meter' as const,
  channels: [new Float32Array([value, delayMs])],
  sampleRate: 48000,
  params: {},
})

afterEach(() => dspPool.terminate())

describe('dspPool', () => {
  it('liefert Ergebnisse in Job-Reihenfolge', async () => {
    const res = await dspPool.run([job(1, 20), job(2, 0), job(3, 5)])
    expect(res.map((r) => (r.ok ? r.peak : NaN))).toEqual([1, 2, 3])
  })

  it('vermischt keine Antworten bei gleichzeitigen run()-Aufrufen', async () => {
    const [a, b] = await Promise.all([dspPool.run([job(10, 15)]), dspPool.run([job(20, 0)])])
    expect(a[0].ok && a[0].peak).toBe(10)
    expect(b[0].ok && b[0].peak).toBe(20)
  })
})
