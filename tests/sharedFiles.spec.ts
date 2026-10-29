import { describe, expect, it, vi, beforeEach } from 'vitest'
import { reactive, nextTick } from 'vue'
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'

vi.mock('../src/utils/sharedFileRepository', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/utils/sharedFileRepository')>()
  return {
    ...actual,
    getSharedFiles: vi.fn(async () => [{ name: 'clip.wav', blob: new Blob(['x']), source: 'audio-cutter' }]),
    clearSharedFiles: vi.fn(async () => {}),
  }
})

import { useSharedFiles } from '../src/composables/useSharedFiles'
import { clearSharedFiles, isReceivableSource } from '../src/utils/sharedFileRepository'

const t = (key: string, values: Record<string, unknown> = {}) => `${key}|${JSON.stringify(values)}`

function setup(source: string | undefined) {
  const route = reactive({ query: source ? { source } : {} }) as unknown as RouteLocationNormalizedLoaded
  const router = { isReady: () => Promise.resolve() } as unknown as Router
  const handle = vi.fn(async (records: unknown[]) => ({ processed: records.length, errors: 0 }))
  const { sharedBanner } = useSharedFiles(handle as never, t, route, router)
  return { handle, sharedBanner }
}

const flush = async () => {
  for (let i = 0; i < 5; i++) await nextTick()
}

describe('isReceivableSource', () => {
  it('accepts converter, cutter and playlist converter, rejects others', () => {
    expect(isReceivableSource('audiokonverter')).toBe(true)
    expect(isReceivableSource('audio-cutter')).toBe(true)
    expect(isReceivableSource('playlistkonverter')).toBe(true)
    expect(isReceivableSource('audionormalizer')).toBe(false)
    expect(isReceivableSource(undefined)).toBe(false)
  })
})

describe('useSharedFiles', () => {
  beforeEach(() => vi.clearAllMocks())

  it('imports files handed over by the audio cutter and names the tool', async () => {
    const { handle, sharedBanner } = setup('audio-cutter')
    await flush()
    expect(handle).toHaveBeenCalledTimes(1)
    expect(clearSharedFiles).toHaveBeenCalledTimes(1)
    expect(sharedBanner.value?.type).toBe('success')
    expect(sharedBanner.value?.message).toContain('app.sharedSource.audio-cutter')
  })

  it('keeps importing from the audio converter', async () => {
    const { handle } = setup('audiokonverter')
    await flush()
    expect(handle).toHaveBeenCalledTimes(1)
  })

  it('imports the playlist handed over by the playlist converter', async () => {
    const { handle, sharedBanner } = setup('playlistkonverter')
    await flush()
    expect(handle).toHaveBeenCalledTimes(1)
    expect(sharedBanner.value?.message).toContain('app.sharedSource.playlistkonverter')
  })

  it('ignores unknown or missing sources', async () => {
    const a = setup('somethingelse')
    const b = setup(undefined)
    await flush()
    expect(a.handle).not.toHaveBeenCalled()
    expect(b.handle).not.toHaveBeenCalled()
  })
})
