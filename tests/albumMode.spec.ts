import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { runOp, measureLoudnessR128, measureTruePeak, calcPeak } from '../src/workers/dspCore'
import { albumGain, gatedLoudness } from '../src/utils/loudnessMath'
import type { DspOp, DspParams } from '../src/types'

// The pool runs the real DSP core in-process, so the store test covers both steps.
const { run } = vi.hoisted(() => ({ run: vi.fn() }))
vi.mock('../src/utils/dspPool', () => ({ dspPool: { run } }))
vi.mock('../src/utils/sharedFileRepository', () => ({ shareFiles: vi.fn(async () => undefined) }))

import { useAudioStore } from '../src/stores/audioStore'
import { PRESETS } from '../src/data/presets'

const FS = 48000
const dbToAmp = (db: number): number => Math.pow(10, db / 20)
const ampToDb = (amp: number): number => 20 * Math.log10(amp)

const sine = (seconds: number, amp: number, fs = FS): Float32Array => {
  const out = new Float32Array(Math.round(seconds * fs))
  for (let i = 0; i < out.length; i++) out[i] = amp * Math.sin((2 * Math.PI * 1000 * i) / fs)
  return out
}

const measure = (ch: Float32Array[]) => {
  const res = runOp('albumMeasure', ch, FS, {})
  return { blocks: res.blocks ?? [], truePeak: res.truePeak ?? 0 }
}

describe('Album-Gain (loudnessMath)', () => {
  it('gatedLoudness über die Blöcke eines Titels entspricht dessen LUFS', () => {
    const ch = [sine(5, dbToAmp(-23)), sine(5, dbToAmp(-23))]
    expect(gatedLoudness(measure(ch).blocks)).toBeCloseTo(measureLoudnessR128(ch, FS), 6)
  })

  it("'albumMeasure' verändert die Daten nicht", () => {
    const ch = [sine(1, 0.3)]
    const before = ch[0].slice()
    runOp('albumMeasure', ch, FS, {})
    expect(ch[0]).toEqual(before)
  })

  it('bringt das Album auf das Ziel, der Abstand der Titel bleibt', () => {
    const loud = [sine(10, dbToAmp(-20)), sine(10, dbToAmp(-20))]
    const quiet = [sine(10, dbToAmp(-30)), sine(10, dbToAmp(-30))]
    const album = albumGain([measure(loud), measure(quiet)], -16, -1)
    expect(album).not.toBeNull()
    for (const ch of [loud, quiet]) runOp('gain', ch, FS, { gain: album!.gain })

    const tracks = [measure(loud), measure(quiet)]
    expect(gatedLoudness(tracks.flatMap((tr) => tr.blocks))).toBeCloseTo(-16, 1)
    expect(measureLoudnessR128(loud, FS) - measureLoudnessR128(quiet, FS)).toBeCloseTo(10, 2)
  })

  it('senkt den gemeinsamen Gain, wenn der lauteste True Peak die Grenze überschreiten würde', () => {
    const loud = [sine(10, dbToAmp(-6))]
    const quiet = [sine(10, dbToAmp(-30))]
    const album = albumGain([measure(loud), measure(quiet)], -3, -1)!
    expect(ampToDb(measureTruePeak(loud) * album.gain)).toBeCloseTo(-1, 3)
  })

  it('gibt bei Stille null zurück', () => {
    expect(albumGain([measure([new Float32Array(FS)])], -14, -1)).toBeNull()
  })
})

describe('audioStore: Album-Modus', () => {
  const STORE_FS = 8000
  // FakeAudioContext liefert 1 Kanal mit 8 kHz, Länge = Bytes / 4.
  const wav = (name: string, seconds: number): File =>
    new File([new Uint8Array(seconds * STORE_FS * 4)], name, { type: 'audio/wav' })

  beforeEach(() => {
    setActivePinia(createPinia())
    run.mockReset()
    run.mockImplementation(
      async (
        jobs: { op: DspOp; channels: Float32Array[]; sampleRate: number; params: DspParams }[],
      ) =>
        jobs.map((job) => {
          try {
            return {
              ok: true,
              channels: job.channels,
              ...runOp(job.op, job.channels, job.sampleRate, job.params),
            }
          } catch (err) {
            return { ok: false, error: (err as Error).message }
          }
        }),
    )
  })

  const loadTwo = async () => {
    const store = useAudioStore()
    await store.handleFilesInput([wav('laut.wav', 5), wav('leise.wav', 5)])
    store.audioFiles[0].originalBuffer.getChannelData(0).set(sine(5, 0.2, STORE_FS))
    store.audioFiles[1].originalBuffer.getChannelData(0).set(sine(5, 0.02, STORE_FS))
    run.mockClear()
    return store
  }

  const peaks = (store: ReturnType<typeof useAudioStore>): number[] =>
    store.audioFiles.map((f) => calcPeak([f.processedBuffer!.getChannelData(0)]))

  it('wendet einen gemeinsamen Gain an, das Verhältnis der Titel bleibt', async () => {
    const store = await loadTwo()
    store.albumMode = true
    await store.applyPreset(PRESETS[0])

    expect(run.mock.calls.map((c) => c[0][0].op)).toEqual(['albumMeasure', 'gain'])
    const [gainA, gainB] = run.mock.calls[1][0].map((job: { params: DspParams }) => job.params.gain)
    expect(gainA).toBe(gainB)
    const [a, b] = peaks(store)
    expect(a / b).toBeCloseTo(10, 3)
    expect(store.r128Applied).toBe(true)
    expect(store.historyPast).toHaveLength(2)

    // Ein Undo nimmt den ganzen Album-Schritt zurück.
    store.undo()
    expect(store.audioFiles.every((f) => !f.processed)).toBe(true)
  })

  it('ohne Album-Modus wird jeder Titel einzeln normalisiert', async () => {
    const store = await loadTwo()
    await store.applyPreset(PRESETS[0])
    expect(run.mock.calls.map((c) => c[0][0].op)).toEqual(['ebur128'])
    const [a, b] = peaks(store)
    expect(a / b).toBeCloseTo(1, 2)
  })

  it('meldet stille Titel und ändert nichts', async () => {
    const store = useAudioStore()
    await store.handleFilesInput([wav('still.wav', 1)])
    store.audioFiles[0].originalBuffer.getChannelData(0).fill(0)
    store.albumMode = true
    await store.applyEBUR128()
    expect(store.audioFiles[0].processed).toBe(false)
    expect(store.toasts.at(-1)?.message).toBe(
      'Die markierten Titel sind zu leise für den Album-Modus',
    )
    expect(store.isProcessing).toBe(false)
  })
})
