// Minimal browser-API stubs so the Pinia store can be exercised in plain Node.
import { vi } from 'vitest'

/** In-memory AudioBuffer with the subset of the Web Audio API the app uses. */
class FakeAudioBuffer {
  readonly length: number
  readonly numberOfChannels: number
  readonly sampleRate: number
  private readonly channels: Float32Array[]

  constructor(opts: { length: number; numberOfChannels: number; sampleRate: number }) {
    this.length = opts.length
    this.numberOfChannels = opts.numberOfChannels
    this.sampleRate = opts.sampleRate
    this.channels = Array.from(
      { length: opts.numberOfChannels },
      () => new Float32Array(opts.length),
    )
  }

  get duration(): number {
    return this.length / this.sampleRate
  }

  getChannelData(channel: number): Float32Array {
    return this.channels[channel]
  }

  copyToChannel(source: Float32Array, channel: number): void {
    this.channels[channel].set(source.subarray(0, this.length))
  }
}

/** `decodeAudioData` turns the file's bytes into a constant-amplitude mono buffer. */
class FakeAudioContext {
  async decodeAudioData(data: ArrayBuffer): Promise<FakeAudioBuffer> {
    const length = Math.max(4, Math.floor(data.byteLength / 4))
    const buffer = new FakeAudioBuffer({ length, numberOfChannels: 1, sampleRate: 8000 })
    buffer.getChannelData(0).fill(0.25)
    return buffer
  }
  close(): void {}
}

class MemoryStorage {
  private store = new Map<string, string>()
  getItem(key: string): string | null {
    return this.store.get(key) ?? null
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value))
  }
  removeItem(key: string): void {
    this.store.delete(key)
  }
  clear(): void {
    this.store.clear()
  }
}

let urlSeq = 0
const g = globalThis as unknown as Record<string, unknown>
g.AudioBuffer = FakeAudioBuffer
g.AudioContext = FakeAudioContext
g.localStorage = new MemoryStorage()
g.window = globalThis

// Deterministic blob URLs and a spy-able revoke so tests can assert cleanup.
URL.createObjectURL = vi.fn(() => `blob:test/${++urlSeq}`)
URL.revokeObjectURL = vi.fn()
