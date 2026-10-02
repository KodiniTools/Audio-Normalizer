import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// The DSP pool normally spawns module workers; replace it with a synchronous
// fake that halves every sample so "processed" buffers are distinguishable.
vi.mock('../src/utils/dspPool', () => ({
  dspPool: {
    run: vi.fn(
      async (
        jobs: { channels: Float32Array[] }[],
        onProgress?: (done: number, total: number) => void,
      ) => {
        onProgress?.(jobs.length, jobs.length)
        return jobs.map((job) => ({
          ok: true as const,
          channels: job.channels.map((ch) => ch.map((x) => x * 0.5)),
          peak: 0.125,
          rms: 0.125,
        }))
      },
    ),
  },
}))
vi.mock('../src/utils/sharedFileRepository', () => ({
  shareFiles: vi.fn(async () => undefined),
}))
vi.mock('../src/composables/useAudioExport', () => ({
  exportFile: vi.fn(async () => undefined),
  exportAll: vi.fn(async () => undefined),
}))

import { useAudioStore } from '../src/stores/audioStore'

type Store = ReturnType<typeof useAudioStore>

const makeFile = (name: string, bytes = 64): File =>
  new File([new Uint8Array(bytes)], name, { type: 'audio/wav' })

const load = async (store: Store, ...names: string[]): Promise<void> => {
  await store.handleFilesInput(names.map((n) => makeFile(n)))
}

const names = (store: Store): string[] => store.audioFiles.map((f) => f.name)
const revokeMock = URL.revokeObjectURL as unknown as ReturnType<typeof vi.fn>

describe('audioStore undo/redo', () => {
  let store: Store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAudioStore()
    revokeMock.mockClear()
  })

  it('starts with an empty history', () => {
    expect(store.canUndo).toBe(false)
    expect(store.canRedo).toBe(false)
    expect(store.undo()).toBe(false)
    expect(store.redo()).toBe(false)
  })

  it('records adding files; undo removes them, redo restores them in order', async () => {
    await load(store, 'a.wav', 'b.wav')
    expect(names(store)).toEqual(['a.wav', 'b.wav'])
    expect(store.canUndo).toBe(true)
    expect(store.undoLabel).toEqual({ key: 'history.addFiles', params: { count: 2 } })

    expect(store.undo()).toBe(true)
    expect(store.audioFiles).toHaveLength(0)
    expect(store.canRedo).toBe(true)

    expect(store.redo()).toBe(true)
    expect(names(store)).toEqual(['a.wav', 'b.wav'])
    expect(store.canRedo).toBe(false)
  })

  it('snapshots a DSP batch so undo restores takes, meters and the R128 flag', async () => {
    await load(store, 'a.wav', 'b.wav')
    const [a, b] = store.audioFiles
    const originalA = a.originalBuffer

    await store.applyEBUR128()
    expect(a.processed).toBe(true)
    expect(b.processed).toBe(true)
    expect(a.processedBuffer).not.toBe(originalA)
    expect(store.r128Applied).toBe(true)
    const processedA = a.processedBuffer
    const processedUrlA = a.processedBlobUrl
    expect(processedUrlA).not.toBeNull()

    expect(store.undo()).toBe(true)
    expect(a.processed).toBe(false)
    expect(a.processedBuffer).toBe(originalA)
    expect(a.peak).toBe(a.originalPeak)
    expect(a.rms).toBe(a.originalRms)
    expect(a.processedBlobUrl).toBeNull()
    expect(b.processed).toBe(false)
    expect(store.r128Applied).toBe(false)
    // The stale preview blob of the undone take is released.
    expect(revokeMock).toHaveBeenCalledWith(processedUrlA)

    expect(store.redo()).toBe(true)
    expect(a.processed).toBe(true)
    expect(a.processedBuffer).toBe(processedA)
    expect(a.peak).toBe(0.125)
    expect(a.processedBlobUrl).not.toBeNull()
    expect(a.processedBlobUrl).not.toBe(processedUrlA)
    expect(store.r128Applied).toBe(true)
  })

  it('only touches selected files and records the count', async () => {
    await load(store, 'a.wav', 'b.wav')
    const [a, b] = store.audioFiles
    store.toggleSelect(b.id)

    await store.applyNoiseReductionAll()
    expect(a.processed).toBe(true)
    expect(b.processed).toBe(false)
    expect(store.undoLabel?.params).toMatchObject({ count: 1 })

    store.undo()
    expect(a.processed).toBe(false)
    expect(b.processed).toBe(false)
  })

  it('makes per-file apply and reset undoable', async () => {
    await load(store, 'a.wav')
    const [a] = store.audioFiles

    await store.updateFile({ ...a, targetRms: 0.3 })
    expect(a.processed).toBe(true)
    expect(store.undoLabel?.key).toBe('history.editFile')

    store.resetFile(a)
    expect(a.processed).toBe(false)
    expect(store.undoLabel?.key).toBe('history.resetFile')

    store.undo() // undo reset
    expect(a.processed).toBe(true)
    store.undo() // undo apply
    expect(a.processed).toBe(false)
    store.redo()
    expect(a.processed).toBe(true)
  })

  it('resetAll records only files that actually changed', async () => {
    await load(store, 'a.wav', 'b.wav')
    const [a, b] = store.audioFiles
    store.toggleSelect(b.id)
    await store.applyDynamicCompressionAll()

    store.resetAll()
    expect(store.undoLabel).toEqual({ key: 'history.resetAll', params: { count: 1 } })
    expect(a.processed).toBe(false)

    store.undo()
    expect(a.processed).toBe(true)
    expect(b.processed).toBe(false)
  })

  it('restores a removed file at its previous position without revoking its URLs', async () => {
    await load(store, 'a.wav', 'b.wav', 'c.wav')
    const b = store.audioFiles[1]
    const originalUrl = b.originalBlobUrl

    store.removeFile(b)
    expect(names(store)).toEqual(['a.wav', 'c.wav'])
    expect(revokeMock).not.toHaveBeenCalledWith(originalUrl)

    store.undo()
    expect(names(store)).toEqual(['a.wav', 'b.wav', 'c.wav'])
    expect(store.audioFiles[1]).toBe(b)
    expect(store.audioFiles[1].originalBlobUrl).toBe(originalUrl)

    store.redo()
    expect(names(store)).toEqual(['a.wav', 'c.wav'])
  })

  it('revokes blob URLs only once no history entry holds the file any more', async () => {
    await load(store, 'a.wav')
    const a = store.audioFiles[0]
    const urlA = a.originalBlobUrl

    store.removeFile(a) // past: [add a, remove a]
    store.undo() // a is live again; future: [remove a]
    store.undo() // a gone; future: [remove a, add a]
    expect(store.audioFiles).toHaveLength(0)
    expect(revokeMock).not.toHaveBeenCalledWith(urlA)

    // A new action invalidates the redo stack → nothing references `a` any more.
    await load(store, 'b.wav')
    expect(revokeMock).toHaveBeenCalledWith(urlA)
    expect(store.canRedo).toBe(false)
  })

  it('keeps URLs of a file that is live again when its redo entry is discarded', async () => {
    await load(store, 'a.wav', 'b.wav')
    const [a, b] = store.audioFiles
    store.removeFile(a)
    store.undo() // a live, future: [remove a]
    store.removeFile(b) // discards the redo entry for a
    expect(revokeMock).not.toHaveBeenCalledWith(a.originalBlobUrl)
    expect(names(store)).toEqual(['a.wav'])
  })

  it('deleteAll is undoable and restores the R128 flag', async () => {
    await load(store, 'a.wav', 'b.wav')
    await store.applyEBUR128()
    store.playTrack(store.audioFiles[0].id)
    store.setPlaybackMode('processed')

    store.deleteAll()
    expect(store.audioFiles).toHaveLength(0)
    expect(store.r128Applied).toBe(false)
    expect(store.currentTrackId).toBeNull()
    expect(store.playbackMode).toBe('original')

    store.undo()
    expect(names(store)).toEqual(['a.wav', 'b.wav'])
    expect(store.audioFiles.every((f) => f.processed)).toBe(true)
    expect(store.r128Applied).toBe(true)

    store.redo()
    expect(store.audioFiles).toHaveLength(0)
    expect(store.r128Applied).toBe(false)
  })

  it('falls back to original playback when the current take is undone', async () => {
    await load(store, 'a.wav')
    const a = store.audioFiles[0]
    await store.applyEBUR128()
    store.playTrack(a.id)
    store.setPlaybackMode('processed')
    expect(store.playbackMode).toBe('processed')

    store.undo()
    expect(store.playbackMode).toBe('original')
    expect(store.currentTrackId).toBe(a.id)
  })

  it('clears the current track when an undo removes it', async () => {
    await load(store, 'a.wav')
    store.playTrack(store.audioFiles[0].id)
    store.undo()
    expect(store.currentTrackId).toBeNull()
  })

  it('discards the redo stack when a new action is recorded', async () => {
    await load(store, 'a.wav')
    await store.applyEBUR128()
    store.undo()
    expect(store.canRedo).toBe(true)

    await store.reduceClippingAll()
    expect(store.canRedo).toBe(false)
    expect(store.historyPast.map((e) => e.label.key)).toEqual(['history.addFiles', 'history.batch'])
  })

  it('refuses undo/redo while an operation is running', async () => {
    await load(store, 'a.wav')
    store.isProcessing = true
    expect(store.undo()).toBe(false)
    expect(store.audioFiles).toHaveLength(1)
    store.isProcessing = false
    store.isLoading = true
    expect(store.undo()).toBe(false)
    store.isLoading = false
    expect(store.undo()).toBe(true)
  })

  it('does not record view-state changes such as selection or playback', async () => {
    await load(store, 'a.wav')
    const before = store.historyPast.length
    store.toggleSelect(store.audioFiles[0].id)
    store.toggleSelectAll()
    store.playTrack(store.audioFiles[0].id)
    expect(store.historyPast.length).toBe(before)
  })

  it('jumpToHistory moves across several steps in either direction', async () => {
    await load(store, 'a.wav')
    await store.applyEBUR128()
    store.resetAll()
    const [addEntry, editEntry, resetEntry] = store.historyPast
    const a = store.audioFiles[0]
    expect(a.processed).toBe(false)

    expect(store.jumpToHistory(addEntry.id)).toBe(true)
    expect(store.audioFiles).toHaveLength(1)
    expect(a.processed).toBe(false)
    expect(store.historyFuture.map((e) => e.id)).toEqual([editEntry.id, resetEntry.id])

    expect(store.jumpToHistory(editEntry.id)).toBe(true)
    expect(a.processed).toBe(true)

    expect(store.jumpToHistory(null)).toBe(true)
    expect(store.audioFiles).toHaveLength(0)

    expect(store.jumpToHistory(resetEntry.id)).toBe(true)
    expect(store.audioFiles[0].processed).toBe(false)
    expect(store.canRedo).toBe(false)

    // Already there / unknown id → no-op.
    expect(store.jumpToHistory(resetEntry.id)).toBe(false)
    expect(store.jumpToHistory(999)).toBe(false)
  })
})
