import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

const { run } = vi.hoisted(() => ({ run: vi.fn() }))
vi.mock('../src/utils/dspPool', () => ({ dspPool: { run } }))
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
})
