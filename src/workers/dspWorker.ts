// Module worker: runs one DSP job on a set of channel buffers and transfers the
// processed buffers back (zero-copy). One worker per pool lane.
import { runOp } from './dspCore'
import type { DspRequest, DspResponse } from '../types'

self.onmessage = (e: MessageEvent<DspRequest>) => {
  const { jobId, op, channels, sampleRate, params } = e.data
  try {
    const { peak, rms } = runOp(op, channels, sampleRate, params)
    const transfer = channels.map((c) => c.buffer)
    const message: DspResponse = { jobId, ok: true, channels, peak, rms }
    ;(self as unknown as Worker).postMessage(message, transfer)
  } catch (err) {
    const message: DspResponse = {
      jobId,
      ok: false,
      error: err instanceof Error ? err.message : 'error',
    }
    ;(self as unknown as Worker).postMessage(message)
  }
}
