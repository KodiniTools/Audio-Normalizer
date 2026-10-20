import { Mp3Encoder } from '@breezystack/lamejs'
import type { Mp3WorkerInput, Mp3WorkerOutput } from '../types'

const BLOCK_SIZE = 1152

const toInt16 = (buffer: Float32Array): Int16Array => {
  const out = new Int16Array(buffer.length)
  for (let i = 0; i < buffer.length; i++) {
    const s = Math.max(-1, Math.min(1, buffer[i]))
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  return out
}

const post = (msg: Mp3WorkerOutput, transfer: ArrayBuffer[] = []): void => {
  ;(self as unknown as Worker).postMessage(msg, transfer)
}

self.onmessage = (e: MessageEvent<Mp3WorkerInput>) => {
  const { left, right, sampleRate, kbps, numChannels } = e.data
  const encoder = new Mp3Encoder(numChannels, sampleRate, kbps)
  const chunks: Uint8Array[] = []
  const total = left.length

  for (let i = 0; i < total; i += BLOCK_SIZE) {
    const leftChunk = left.subarray(i, i + BLOCK_SIZE)
    const rightChunk = numChannels > 1 ? right.subarray(i, i + BLOCK_SIZE) : leftChunk
    const buf = encoder.encodeBuffer(toInt16(leftChunk), toInt16(rightChunk))
    if (buf.length > 0) chunks.push(new Uint8Array(buf))
    post({ progress: Math.min(Math.round(((i + BLOCK_SIZE) / total) * 100), 100) })
  }

  const tail = encoder.flush()
  if (tail.length > 0) chunks.push(new Uint8Array(tail))

  const result = new Uint8Array(chunks.reduce((sum, c) => sum + c.length, 0))
  let offset = 0
  for (const c of chunks) {
    result.set(c, offset)
    offset += c.length
  }
  post({ result: result.buffer, done: true }, [result.buffer])
}
