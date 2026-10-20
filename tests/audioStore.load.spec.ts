import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const { run, download } = vi.hoisted(() => ({ run: vi.fn(), download: vi.fn() }))
vi.mock('../src/utils/dspPool', () => ({ dspPool: { run } }))
vi.mock('../src/utils/audioUtils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../src/utils/audioUtils')>()),
  triggerDownload: download,
}))
vi.mock('../src/utils/sharedFileRepository', () => ({ shareFiles: vi.fn(async () => undefined) }))

import { useAudioStore } from '../src/stores/audioStore'

const wav = (name: string): File => new File([new Uint8Array(64)], name, { type: 'audio/wav' })

describe('audioStore: Pegel beim Laden', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    run.mockReset()
  })

  it("misst Peak/RMS im Worker ('meter') und übernimmt sie als Originalwerte", async () => {
    run.mockResolvedValue([{ ok: true, channels: [], peak: 0.9, rms: 0.3 }])
    const store = useAudioStore()
    await store.handleFilesInput([wav('a.wav')])
    expect(run.mock.calls[0][0][0].op).toBe('meter')
    const [file] = store.audioFiles
    expect([file.peak, file.rms, file.originalPeak, file.originalRms]).toEqual([0.9, 0.3, 0.9, 0.3])
  })

  it('fällt auf den Main-Thread zurück, wenn der Worker scheitert', async () => {
    run.mockRejectedValue(new Error('no worker'))
    const store = useAudioStore()
    await store.handleFilesInput([wav('a.wav')])
    // FakeAudioContext decodiert zu konstant 0.25
    const [file] = store.audioFiles
    expect(file.peak).toBeCloseTo(0.25, 6)
    expect(file.rms).toBeCloseTo(0.25, 6)
  })

  it('übernimmt die Wellenform aus dem Worker und berechnet sie sonst selbst', async () => {
    const env = new Float32Array([0.1, 0.2])
    run.mockResolvedValueOnce([{ ok: true, channels: [], peak: 0.9, rms: 0.3, envelope: env }])
    const store = useAudioStore()
    await store.handleFilesInput([wav('a.wav')])
    expect(store.audioFiles[0].waveform).toBe(env)

    run.mockRejectedValueOnce(new Error('no worker'))
    await store.handleFilesInput([wav('b.wav')])
    expect(store.audioFiles[1].waveform).toHaveLength(400)
    expect(store.audioFiles[1].waveform[0]).toBeCloseTo(0.25, 6)
  })
})

describe('audioStore: Loudness nach Bearbeitung und Undo', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    run.mockReset()
    download.mockReset()
    // Every op echoes its channels at half level; 'analyze' adds loudness values.
    run.mockImplementation(async (jobs: { op: string; channels: Float32Array[] }[]) =>
      jobs.map((job) => ({
        ok: true,
        channels: job.channels.map((ch) => ch.map((x) => x * 0.5)),
        peak: 0.125,
        rms: 0.125,
        ...(job.op === 'analyze' ? { lufs: -14, truePeak: 0.9, lra: 5 } : {}),
      })),
    )
  })

  it('verwirft veraltete Loudness-Werte nach einer Bearbeitung, Undo stellt sie wieder her', async () => {
    const store = useAudioStore()
    await store.handleFilesInput([wav('a.wav')])
    await store.analyzeAll()
    const file = store.audioFiles[0]
    expect([file.lufs, file.truePeak, file.lra]).toEqual([-14, 0.9, 5])

    await store.applyGlobalRms()
    expect([file.lufs, file.truePeak, file.lra]).toEqual([undefined, undefined, undefined])
    expect(file.processedWaveform).toHaveLength(400)

    store.undo()
    expect([file.lufs, file.truePeak, file.lra]).toEqual([-14, 0.9, 5])
    expect(file.processedWaveform).toBeUndefined()
  })

  it('analysiert vor dem Report-Export fehlende Dateien und lädt CSV herunter', async () => {
    const store = useAudioStore()
    await store.handleFilesInput([wav('a.wav')])
    await store.exportLoudnessReport('csv')
    expect(run.mock.calls.some((c) => c[0][0].op === 'analyze')).toBe(true)
    expect(download).toHaveBeenCalledTimes(1)
    const [blob, name] = download.mock.calls[0] as [Blob, string]
    expect(await blob.text()).toContain('a.wav,')
    expect(name).toMatch(/^loudness-report-\d{4}-\d{2}-\d{2}\.csv$/)
  })
})
