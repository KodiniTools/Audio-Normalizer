// ─────────────────────────────────────────────────────────────────────────────
// DSP worker pool.
//
// Spreads per-file DSP jobs across a pool of module workers so processing runs
// off the main thread (no UI freeze) and in parallel (roughly Nx faster on N
// cores for a batch). Channel buffers are moved to/from workers via Transferable
// ArrayBuffers (zero-copy). Pool size is capped so N large PCM copies don't blow
// up peak memory.
// ─────────────────────────────────────────────────────────────────────────────
import type { DspRequest, DspResponse } from '../types'

export interface DspJob {
  op: DspRequest['op']
  channels: Float32Array[]
  sampleRate: number
  params: DspRequest['params']
}

export type DspJobResult =
  | { ok: true; channels: Float32Array[]; peak: number; rms: number }
  | { ok: false; error: string }

const POOL_SIZE = Math.max(1, Math.min(navigator.hardwareConcurrency || 2, 4))

class DspPool {
  private workers: Worker[] = []

  private ensureWorkers(count: number): void {
    while (this.workers.length < count) {
      this.workers.push(
        new Worker(new URL('../workers/dspWorker.ts', import.meta.url), { type: 'module' }),
      )
    }
  }

  /**
   * Runs all jobs across the pool and resolves with results in the same order.
   * `onProgress(done, total)` fires after each completed job.
   */
  run(jobs: DspJob[], onProgress?: (done: number, total: number) => void): Promise<DspJobResult[]> {
    return new Promise((resolve) => {
      const total = jobs.length
      if (total === 0) {
        resolve([])
        return
      }

      const laneCount = Math.min(POOL_SIZE, total)
      this.ensureWorkers(laneCount)

      const results: DspJobResult[] = new Array(total)
      let nextIndex = 0
      let done = 0

      const dispatch = (worker: Worker): void => {
        if (nextIndex >= total) return
        const jobId = nextIndex++
        const job = jobs[jobId]

        const handleMessage = (e: MessageEvent<DspResponse>): void => {
          if (e.data.jobId !== jobId) return
          worker.removeEventListener('message', handleMessage)
          worker.removeEventListener('error', handleError)
          results[jobId] = e.data.ok
            ? { ok: true, channels: e.data.channels, peak: e.data.peak, rms: e.data.rms }
            : { ok: false, error: e.data.error }
          done++
          onProgress?.(done, total)
          if (done === total) resolve(results)
          else dispatch(worker)
        }

        const handleError = (err: ErrorEvent): void => {
          worker.removeEventListener('message', handleMessage)
          worker.removeEventListener('error', handleError)
          results[jobId] = { ok: false, error: err.message || 'worker error' }
          done++
          onProgress?.(done, total)
          if (done === total) resolve(results)
          else dispatch(worker)
        }

        worker.addEventListener('message', handleMessage)
        worker.addEventListener('error', handleError)

        const request: DspRequest = {
          jobId,
          op: job.op,
          channels: job.channels,
          sampleRate: job.sampleRate,
          params: job.params,
        }
        worker.postMessage(
          request,
          job.channels.map((c) => c.buffer),
        )
      }

      for (let i = 0; i < laneCount; i++) dispatch(this.workers[i])
    })
  }

  terminate(): void {
    this.workers.forEach((w) => w.terminate())
    this.workers = []
  }
}

export const dspPool = new DspPool()
export const DSP_POOL_SIZE = POOL_SIZE
