import { ref, computed, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import {
  generateId,
  calculateRMS,
  calculatePeak,
  dbToRms,
  isAudioFile,
  bufferToWave,
  CONSTANTS,
} from '../utils/audioUtils'
import { shareFiles } from '../utils/sharedFileRepository'
import { dspPool } from '../utils/dspPool'
import type { DspJobResult } from '../utils/dspPool'
import {
  DEFAULT_HISTORY_LIMITS,
  emptyHistory,
  pushHistory,
  undoHistory,
  redoHistory,
} from '../utils/history'
import type { HistoryState } from '../utils/history'
import { exportFile as doExportFile, exportAll as doExportAll } from '../composables/useAudioExport'
import { useI18n } from '../composables/useI18n'
import type {
  AudioFileData,
  BatchResult,
  StatusType,
  Toast,
  PlaybackMode,
  DspOp,
  DspParams,
  FileTake,
  HistoryEntry,
  HistoryLabel,
} from '../types'
import type { Preset } from '../data/presets'

export const useAudioStore = defineStore('audio', () => {
  const { t } = useI18n()

  // ── State ──────────────────────────────────────────────────────────────────
  const audioFiles = ref<AudioFileData[]>([])
  const globalRmsValue = ref(0.5)
  const globalDbValue = ref(-20)
  const downloadFormat = ref('wav')
  // Stack of subtle, auto-dismissing toast notifications. Every user-facing
  // action reports its outcome here via `setStatus`.
  const toasts = ref<Toast[]>([])
  const isProcessing = ref(false)
  const isLoading = ref(false)
  const loadingMessage = ref(t('dsp.processing'))
  // Overlay progress: 0–100 for a determinate bar, null for an indeterminate spinner.
  const loadingProgress = ref<number | null>(null)
  const r128Applied = ref(false)

  // ── Playlist / player-bar state ──────────────────────────────────────────────
  const currentTrackId = ref<string | null>(null)
  const playbackMode = ref<PlaybackMode>('original')

  // ── Derived selection / playlist getters ─────────────────────────────────────
  const selectedFiles = computed(() => audioFiles.value.filter((f) => f.selected))
  const processedFiles = computed(() => audioFiles.value.filter((f) => f.processed))
  const selectedCount = computed(() => selectedFiles.value.length)
  const processedCount = computed(() => processedFiles.value.length)
  const allSelected = computed(
    () => audioFiles.value.length > 0 && audioFiles.value.every((f) => f.selected),
  )
  const someSelected = computed(() => audioFiles.value.some((f) => f.selected))
  const currentTrack = computed(
    () => audioFiles.value.find((f) => f.id === currentTrackId.value) ?? null,
  )

  // ── Selection actions ─────────────────────────────────────────────────────────
  const toggleSelect = (id: string): void => {
    const file = audioFiles.value.find((f) => f.id === id)
    if (file) file.selected = !file.selected
  }

  const setAllSelected = (value: boolean): void => {
    audioFiles.value.forEach((f) => {
      f.selected = value
    })
  }

  const toggleSelectAll = (): void => setAllSelected(!allSelected.value)

  // ── Player-bar actions ────────────────────────────────────────────────────────
  const playTrack = (id: string): void => {
    const file = audioFiles.value.find((f) => f.id === id)
    if (!file) return
    currentTrackId.value = id
    // Fall back to the original take if the processed version doesn't exist yet.
    if (playbackMode.value === 'processed' && !file.processed) playbackMode.value = 'original'
  }

  const setPlaybackMode = (mode: PlaybackMode): void => {
    if (mode === 'processed' && !currentTrack.value?.processed) return
    playbackMode.value = mode
  }

  const playAdjacent = (direction: 1 | -1): void => {
    const list = audioFiles.value
    if (list.length === 0) return
    const idx = list.findIndex((f) => f.id === currentTrackId.value)
    let next = idx === -1 ? 0 : idx + direction
    if (next < 0) next = list.length - 1
    if (next >= list.length) next = 0
    playTrack(list[next].id)
  }

  const playNext = (): void => playAdjacent(1)
  const playPrev = (): void => playAdjacent(-1)

  // ── Undo / redo history ──────────────────────────────────────────────────────
  //
  // Every document-level action (edits, resets, adding/removing files) records
  // a `HistoryEntry`. Edits snapshot the affected files' "takes" before and
  // after; list changes retain the removed/added file objects so they can be
  // put back as-is. View state (selection, playback, slider values) is not
  // tracked. The stacks are immutable and kept in a shallowRef so the toolbar
  // reacts to pushes/undos without Vue deep-proxying every snapshot.
  const history = shallowRef<HistoryState<HistoryEntry>>(emptyHistory())
  let historySeq = 0

  const canUndo = computed(() => history.value.past.length > 0)
  const canRedo = computed(() => history.value.future.length > 0)
  const undoLabel = computed<HistoryLabel | null>(
    () => history.value.past[history.value.past.length - 1]?.label ?? null,
  )
  const redoLabel = computed<HistoryLabel | null>(
    () => history.value.future[history.value.future.length - 1]?.label ?? null,
  )
  /** Undoable entries, oldest first. */
  const historyPast = computed(() => history.value.past)
  /** Redoable entries, next redo first (i.e. in chronological order). */
  const historyFuture = computed(() => history.value.future.slice().reverse())

  const findFile = (id: string): AudioFileData | undefined =>
    audioFiles.value.find((f) => f.id === id)

  const takeOf = (file: AudioFileData): FileTake => ({
    processedBuffer: file.processedBuffer,
    peak: file.peak,
    rms: file.rms,
    lufs: file.lufs,
    targetRms: file.targetRms,
    processed: file.processed,
  })

  const takeEquals = (a: FileTake, b: FileTake): boolean =>
    a.processedBuffer === b.processedBuffer &&
    a.peak === b.peak &&
    a.rms === b.rms &&
    a.lufs === b.lufs &&
    a.targetRms === b.targetRms &&
    a.processed === b.processed

  // Put a snapshot back onto a file and rebuild its preview URL from the buffer.
  const restoreTake = (file: AudioFileData, take: FileTake): void => {
    file.processedBuffer = take.processedBuffer
    file.peak = take.peak
    file.rms = take.rms
    file.lufs = take.lufs
    file.targetRms = take.targetRms
    file.processed = take.processed
    if (file.processedBlobUrl) URL.revokeObjectURL(file.processedBlobUrl)
    file.processedBlobUrl = take.processed
      ? URL.createObjectURL(bufferToWave(take.processedBuffer, 0, take.processedBuffer.length))
      : null
  }

  // Bytes held only by the history: unique buffers referenced by the given
  // entries that are neither a live file's original nor its current take.
  const measureRetained = (entries: readonly HistoryEntry[]): number => {
    const live = new Set<AudioBuffer>()
    audioFiles.value.forEach((f) => {
      live.add(f.originalBuffer)
      live.add(f.processedBuffer)
    })
    const seen = new Set<AudioBuffer>()
    let bytes = 0
    const count = (buffer: AudioBuffer): void => {
      if (live.has(buffer) || seen.has(buffer)) return
      seen.add(buffer)
      bytes += buffer.length * buffer.numberOfChannels * Float32Array.BYTES_PER_ELEMENT
    }
    entries.forEach((entry) => {
      if (entry.kind === 'edit') {
        entry.changes.forEach((c) => {
          count(c.before.processedBuffer)
          count(c.after.processedBuffer)
        })
      } else {
        entry.files.forEach(({ file }) => {
          count(file.originalBuffer)
          count(file.processedBuffer)
        })
      }
    })
    return bytes
  }

  // Revoke the blob URLs of files that only the discarded entries still
  // referenced. A file that is live again, or still held by another entry
  // (e.g. its "add" and "remove" entries), keeps its URLs.
  const releaseEntries = (discarded: HistoryEntry[]): void => {
    if (discarded.length === 0) return
    const stillHeld = new Set<string>()
    audioFiles.value.forEach((f) => stillHeld.add(f.id))
    const remaining = [...history.value.past, ...history.value.future]
    remaining.forEach((entry) => {
      if (entry.kind !== 'edit') entry.files.forEach(({ file }) => stillHeld.add(file.id))
    })
    const released = new Set<string>()
    discarded.forEach((entry) => {
      if (entry.kind === 'edit') return
      entry.files.forEach(({ file }) => {
        if (stillHeld.has(file.id) || released.has(file.id)) return
        released.add(file.id)
        if (file.processedBlobUrl) URL.revokeObjectURL(file.processedBlobUrl)
        if (file.originalBlobUrl) URL.revokeObjectURL(file.originalBlobUrl)
      })
    })
  }

  // `Omit` would collapse the union, so distribute it over each entry kind.
  type HistoryEntryInput = HistoryEntry extends infer E
    ? E extends HistoryEntry
      ? Omit<E, 'id' | 'at'>
      : never
    : never

  const recordHistory = (entry: HistoryEntryInput): void => {
    const full: HistoryEntry = { ...entry, id: ++historySeq, at: Date.now() }
    const { state, discarded } = pushHistory(
      history.value,
      full,
      DEFAULT_HISTORY_LIMITS,
      measureRetained,
    )
    history.value = state
    releaseEntries(discarded)
  }

  // Record an edit only if something actually changed.
  const recordEdit = (
    label: HistoryLabel,
    changes: { id: string; before: FileTake; after: FileTake }[],
    r128Before: boolean,
  ): void => {
    const r128After = r128Applied.value
    if (changes.length === 0 && r128Before === r128After) return
    recordHistory({
      kind: 'edit',
      label,
      changes,
      r128: r128Before === r128After ? undefined : { before: r128Before, after: r128After },
    })
  }

  // After the playlist or a take changed under the player, keep the player-bar
  // state valid: no dangling current track, no "processed" mode without a take.
  const ensurePlaybackConsistency = (): void => {
    if (currentTrackId.value !== null && !findFile(currentTrackId.value)) {
      currentTrackId.value = null
      playbackMode.value = 'original'
    }
    if (playbackMode.value === 'processed' && !currentTrack.value?.processed) {
      playbackMode.value = 'original'
    }
  }

  const removeFilesById = (ids: Set<string>): void => {
    audioFiles.value = audioFiles.value.filter((f) => !ids.has(f.id))
  }

  const insertFiles = (files: { file: AudioFileData; index: number }[]): void => {
    const list = audioFiles.value.slice()
    // Ascending by index so earlier insertions don't shift later targets.
    files
      .slice()
      .sort((a, b) => a.index - b.index)
      .forEach(({ file, index }) => {
        if (list.some((f) => f.id === file.id)) return
        list.splice(Math.min(index, list.length), 0, file)
      })
    audioFiles.value = list
  }

  // Apply an entry in the given direction. 'undo' restores the "before" side,
  // 'redo' the "after" side.
  const applyEntry = (entry: HistoryEntry, direction: 'undo' | 'redo'): void => {
    const undoing = direction === 'undo'
    if (entry.kind === 'edit') {
      entry.changes.forEach((change) => {
        const file = findFile(change.id)
        if (file) restoreTake(file, undoing ? change.before : change.after)
      })
    } else {
      // 'add' undone or 'remove' redone takes files out; the opposite puts them back.
      const takeOut = entry.kind === 'add' ? undoing : !undoing
      if (takeOut) removeFilesById(new Set(entry.files.map(({ file }) => file.id)))
      else insertFiles(entry.files)
    }
    if (entry.r128) r128Applied.value = undoing ? entry.r128.before : entry.r128.after
    ensurePlaybackConsistency()
  }

  // Undo/redo are refused while an operation is running — a snapshot taken
  // mid-batch would otherwise race with the results being applied.
  const historyBusy = (): boolean => isProcessing.value || isLoading.value

  const undoStep = (): HistoryEntry | undefined => {
    const { state, entry } = undoHistory(history.value)
    if (!entry) return undefined
    history.value = state
    applyEntry(entry, 'undo')
    return entry
  }

  const redoStep = (): HistoryEntry | undefined => {
    const { state, entry } = redoHistory(history.value)
    if (!entry) return undefined
    history.value = state
    applyEntry(entry, 'redo')
    return entry
  }

  const undo = (): boolean => {
    if (historyBusy()) return false
    const entry = undoStep()
    if (!entry) return false
    setStatus(t('history.undone', { action: t(entry.label.key, entry.label.params) }), 'info')
    // Keep the IndexedDB hand-off in step with the restored takes (same as every edit).
    void autoShare()
    return true
  }

  const redo = (): boolean => {
    if (historyBusy()) return false
    const entry = redoStep()
    if (!entry) return false
    setStatus(t('history.redone', { action: t(entry.label.key, entry.label.params) }), 'info')
    void autoShare()
    return true
  }

  /**
   * Jump to the state right after the entry with the given id, or to the
   * initial state (before the oldest retained entry) when `id` is null.
   */
  const jumpToHistory = (id: number | null): boolean => {
    if (historyBusy()) return false
    const { past, future } = history.value
    let undoCount = 0
    let redoCount = 0
    if (id === null) {
      undoCount = past.length
    } else {
      const pastIdx = past.findIndex((e) => e.id === id)
      const futureIdx = future.findIndex((e) => e.id === id)
      if (pastIdx !== -1) undoCount = past.length - 1 - pastIdx
      else if (futureIdx !== -1) redoCount = future.length - futureIdx
      else return false
    }
    if (undoCount === 0 && redoCount === 0) return false
    let last: HistoryEntry | undefined
    for (let i = 0; i < undoCount; i++) last = undoStep()
    for (let i = 0; i < redoCount; i++) last = redoStep()
    if (undoCount > 0 && last) {
      setStatus(t('history.undone', { action: t(last.label.key, last.label.params) }), 'info')
    } else if (last) {
      setStatus(t('history.redone', { action: t(last.label.key, last.label.params) }), 'info')
    }
    void autoShare()
    return true
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  // All long-running processes report through the loading overlay. `setProgress`
  // shows the overlay with a determinate bar; each operation clears it via
  // `endLoading()` in its finally block so the bar never lingers.
  const setProgress = (label: string, value: number): void => {
    isLoading.value = true
    loadingMessage.value = label
    loadingProgress.value = value
  }

  const endLoading = (): void => {
    isLoading.value = false
    loadingProgress.value = null
  }

  // Newest toast id; incremented per push so every toast owns its own dismiss
  // timer (no shared slot, so a rapid second action can't clear the first early).
  let toastSeq = 0
  const MAX_TOASTS = 4

  const dismissToast = (id: number): void => {
    const index = toasts.value.findIndex((toast) => toast.id === id)
    if (index !== -1) toasts.value.splice(index, 1)
  }

  const setStatus = (message: string, type: StatusType = 'info'): void => {
    const id = ++toastSeq
    toasts.value.push({ id, type, message })
    // Cap the stack so a burst of actions never buries the screen.
    if (toasts.value.length > MAX_TOASTS) toasts.value.shift()
    const duration = type === 'error' ? 5000 : type === 'warning' ? 4000 : 3000
    setTimeout(() => dismissToast(id), duration)
  }

  // NOTE: Keep concurrency=1 for OfflineAudioContext — each context holds a full
  // PCM copy in RAM, so parallelism multiplies peak memory usage.
  const runBatch = async (
    items: AudioFileData[],
    label: string,
    fn: (item: AudioFileData, index: number) => Promise<void>,
    concurrency = 1,
  ): Promise<void> => {
    const total = items.length
    let done = 0
    let index = 0
    setProgress(label, 0)

    const lane = async () => {
      while (index < total) {
        const i = index++
        await fn(items[i], i)
        done++
        setProgress(label, (done / total) * 100)
      }
    }

    await Promise.all(Array.from({ length: Math.min(concurrency, total) }, lane))
  }

  // ── File Analysis ──────────────────────────────────────────────────────────

  const buildFileData = (buffer: AudioBuffer, name: string, originalRef: File): AudioFileData => ({
    id: generateId(),
    name,
    file: originalRef,
    originalBuffer: buffer,
    processedBuffer: buffer,
    peak: calculatePeak(buffer),
    rms: calculateRMS(buffer),
    originalPeak: calculatePeak(buffer),
    originalRms: calculateRMS(buffer),
    processedBlobUrl: null,
    originalBlobUrl: URL.createObjectURL(originalRef),
    duration: buffer.duration,
    // Newly added files start selected, so batch edits apply to them by default.
    selected: true,
    processed: false,
  })

  const decodeAudio = async (arrayBuffer: ArrayBuffer): Promise<AudioBuffer> => {
    const audioContext = new AudioContext()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    audioContext.close()
    return audioBuffer
  }

  const analyzeFile = async (file: File): Promise<AudioFileData> => {
    const buffer = await decodeAudio(await file.arrayBuffer())
    return buildFileData(buffer, file.name, file)
  }

  const analyzeBlob = async (blob: Blob, name: string): Promise<AudioFileData> => {
    const buffer = await decodeAudio(await blob.arrayBuffer())
    const fileRef = new File([blob], name, { type: blob.type })
    return buildFileData(buffer, name, fileRef)
  }

  // ── Auto-share: write processed buffers to IndexedDB after each operation ──

  const autoShare = async (): Promise<void> => {
    const toShare = audioFiles.value.filter((f) => f.processedBuffer)
    if (toShare.length === 0) return
    try {
      const blobs = toShare.map((f) => {
        const buf = f.processedBuffer!
        const blob = bufferToWave(buf, 0, buf.length)
        const baseName = f.name.replace(/\.[^/.]+$/, '')
        return { name: `${baseName}.wav`, blob }
      })
      await shareFiles(blobs, 'audionormalizer')
    } catch (e) {
      console.warn('[AudioNormalizer] autoShare failed:', e)
    }
  }

  // ── File Handling ──────────────────────────────────────────────────────────

  const handleFilesInput = async (files: File[]): Promise<void> => {
    isProcessing.value = true
    const audioOnly = files.filter((f) => {
      const ok = isAudioFile(f)
      if (!ok) setStatus(t('status.invalidFile', { name: f.name }), 'warning')
      return ok
    })

    if (audioOnly.length === 0) {
      setStatus(t('status.noValidFiles'), 'error')
      isProcessing.value = false
      return
    }

    let processed = 0
    let errors = 0
    const added: { file: AudioFileData; index: number }[] = []

    await runBatch(
      audioOnly as unknown as AudioFileData[],
      t('dsp.upload'),
      async (item) => {
        const file = item as unknown as File
        try {
          const data = await analyzeFile(file)
          added.push({ file: data, index: audioFiles.value.length })
          audioFiles.value.push(data)
          processed++
        } catch {
          setStatus(t('status.fileError', { name: (file as File).name }), 'error')
          errors++
        }
      },
      2,
    )

    isProcessing.value = false
    endLoading()
    if (added.length > 0) {
      recordHistory({
        kind: 'add',
        label: { key: 'history.addFiles', params: { count: added.length } },
        files: added,
      })
    }
    if (processed > 0) setStatus(t('status.uploaded', { count: processed }), 'success')
    else if (errors > 0) setStatus(t('status.noValidFiles'), 'error')
  }

  const handleSharedFiles = async (
    sharedRecords: { name: string; blob: Blob | ArrayBuffer; mimeType?: string }[],
  ): Promise<BatchResult> => {
    isProcessing.value = true
    let processed = 0
    let errors = 0
    const added: { file: AudioFileData; index: number }[] = []

    for (const record of sharedRecords) {
      try {
        const blob =
          record.blob instanceof Blob
            ? record.blob
            : new Blob([record.blob], { type: record.mimeType || 'audio/wav' })

        if (blob.size === 0) {
          console.warn(`[AudioNormalizer] Shared file "${record.name}" has empty blob, skipping`)
          errors++
          continue
        }

        const data = await analyzeBlob(blob, record.name)
        added.push({ file: data, index: audioFiles.value.length })
        audioFiles.value.push(data)
        processed++
      } catch (error) {
        console.error(`[AudioNormalizer] Failed to import shared file "${record.name}":`, error)
        errors++
      }
    }

    isProcessing.value = false
    if (added.length > 0) {
      recordHistory({
        kind: 'add',
        label: { key: 'history.importFiles', params: { count: added.length } },
        files: added,
      })
    }
    if (processed > 0) setStatus(t('status.imported', { count: processed }), 'success')
    return { processed, errors }
  }

  // ── Global Operations (DSP worker pool) ─────────────────────────────────────

  // Copy channel data so the source AudioBuffer isn't detached when the arrays
  // are transferred to a worker.
  const copyChannels = (buffer: AudioBuffer): Float32Array[] =>
    Array.from(
      { length: buffer.numberOfChannels },
      (_, c) => new Float32Array(buffer.getChannelData(c)),
    )

  // Rebuild an AudioBuffer from worker-returned channels and refresh the file's
  // meters and preview URL.
  const applyDspResult = (
    file: AudioFileData,
    channels: Float32Array[],
    peak: number,
    rms: number,
  ): void => {
    const sampleRate = file.originalBuffer.sampleRate
    const out = new AudioBuffer({
      length: channels[0].length,
      numberOfChannels: channels.length,
      sampleRate,
    })
    channels.forEach((ch, c) => out.copyToChannel(ch as Float32Array<ArrayBuffer>, c))
    file.processedBuffer = out
    file.peak = peak
    file.rms = rms
    file.processed = true
    if (file.processedBlobUrl) URL.revokeObjectURL(file.processedBlobUrl)
    file.processedBlobUrl = URL.createObjectURL(bufferToWave(out, 0, out.length))
  }

  // Dispatch a DSP op over the selected files in parallel across the worker pool.
  // `label` is both the overlay caption and the name of the resulting history entry.
  const runDspBatch = async (
    label: string,
    successMsg: string,
    op: DspOp,
    params: DspParams,
    { fromOriginal = false, markR128 = false }: { fromOriginal?: boolean; markR128?: boolean } = {},
  ): Promise<void> => {
    if (audioFiles.value.length === 0) return
    // Only the marked (selected) files in the interactive playlist are edited.
    const files = selectedFiles.value.slice()
    if (files.length === 0) {
      setStatus(t('status.selectAtLeastOne'), 'warning')
      return
    }
    isProcessing.value = true
    setProgress(label, 0)

    const jobs = files.map((file) => {
      const source = fromOriginal
        ? file.originalBuffer
        : (file.processedBuffer ?? file.originalBuffer)
      return { op, channels: copyChannels(source), sampleRate: source.sampleRate, params }
    })

    const results: DspJobResult[] = await dspPool.run(jobs, (done, total) =>
      setProgress(label, (done / total) * 100),
    )

    const changes: { id: string; before: FileTake; after: FileTake }[] = []
    results.forEach((res, i) => {
      const file = files[i]
      if (!res.ok) {
        if (res.error === 'silent') {
          setStatus(t('status.tooQuiet', { name: file.name }), 'warning')
        } else {
          console.error(`[${label}] ${file.name}:`, res.error)
        }
        return
      }
      const before = takeOf(file)
      applyDspResult(file, res.channels, res.peak, res.rms)
      changes.push({ id: file.id, before, after: takeOf(file) })
    })

    isProcessing.value = false
    endLoading()
    const r128Before = r128Applied.value
    if (markR128) r128Applied.value = true
    recordEdit(
      { key: 'history.batch', params: { action: label, count: changes.length } },
      changes,
      r128Before,
    )
    setStatus(successMsg, 'success')
    await autoShare()
  }

  const applyGlobalRms = (): Promise<void> =>
    runDspBatch(t('dsp.rmsScaling'), t('status.rmsDone'), 'rmsScale', {
      targetRms: globalRmsValue.value,
      targetDbtp: CONSTANTS.TRUE_PEAK_LIMIT_DBTP,
      maxRmsGain: 10,
    })

  const applyGlobalDb = (): Promise<void> =>
    runDspBatch(t('dsp.dbScaling'), t('status.dbDone'), 'rmsScale', {
      targetRms: dbToRms(globalDbValue.value),
      targetDbtp: CONSTANTS.TRUE_PEAK_LIMIT_DBTP,
      maxRmsGain: 10,
    })

  const applyEBUR128 = (): Promise<void> =>
    runDspBatch(
      t('dsp.ebu'),
      t('status.ebuDone'),
      'ebur128',
      {
        targetLufs: CONSTANTS.EBU_R128_TARGET_LUFS,
        targetDbtp: CONSTANTS.TRUE_PEAK_LIMIT_DBTP,
      },
      { fromOriginal: true, markR128: true },
    )

  const applyPreset = (preset: Preset): Promise<void> =>
    runDspBatch(
      t('history.preset', { preset: t(`presets.${preset.id}`) }),
      t('status.presetDone', {
        preset: preset.id,
        lufs: preset.lufs,
        dbtp: preset.truePeakDbtp,
      }),
      'ebur128',
      { targetLufs: preset.lufs, targetDbtp: preset.truePeakDbtp },
      { fromOriginal: true, markR128: true },
    )

  const applyNoiseReductionAll = (): Promise<void> =>
    runDspBatch(t('dsp.noise'), t('status.noiseDone'), 'noiseReduction', {
      nrOverSubtraction: CONSTANTS.NR_OVERSUBTRACTION,
      nrFloorGain: CONSTANTS.NR_FLOOR_GAIN,
      nrNoiseQuantile: CONSTANTS.NR_NOISE_QUANTILE,
    })

  const reduceClippingAll = (): Promise<void> =>
    runDspBatch(t('dsp.clipping'), t('status.clippingDone'), 'reduceClipping', {
      clipThreshold: CONSTANTS.CLIP_THRESHOLD,
    })

  const applyDynamicCompressionAll = (): Promise<void> =>
    runDspBatch(t('dsp.compression'), t('status.compressionDone'), 'dynamicCompression', {
      threshold: CONSTANTS.COMPRESSOR_THRESHOLD,
      knee: CONSTANTS.COMPRESSOR_KNEE,
      ratio: CONSTANTS.COMPRESSOR_RATIO,
      attack: CONSTANTS.COMPRESSOR_ATTACK,
      release: CONSTANTS.COMPRESSOR_RELEASE,
    })

  // Re-measure every loaded file (sample peak, RMS and integrated LUFS) on the
  // current take — the processed buffer if it exists, otherwise the original.
  // Read-only: the audio is not modified and files are not marked as processed.
  const analyzeAll = async (): Promise<void> => {
    const files = audioFiles.value.slice()
    if (files.length === 0) return
    isProcessing.value = true
    setProgress(t('dsp.analysis'), 0)

    const jobs = files.map((file) => {
      const source = file.processedBuffer ?? file.originalBuffer
      return {
        op: 'analyze' as DspOp,
        channels: copyChannels(source),
        sampleRate: source.sampleRate,
        params: {},
      }
    })

    const results: DspJobResult[] = await dspPool.run(jobs, (done, total) =>
      setProgress(t('dsp.analysis'), (done / total) * 100),
    )

    let analyzed = 0
    results.forEach((res, i) => {
      if (!res.ok) return
      const file = files[i]
      file.peak = res.peak
      file.rms = res.rms
      if (res.lufs !== undefined) file.lufs = res.lufs
      analyzed++
    })

    isProcessing.value = false
    endLoading()
    setStatus(t('status.analyzed', { count: analyzed }), 'success')
  }

  // ── Individual File Operations ─────────────────────────────────────────────

  const updateFile = async (updatedFile: AudioFileData): Promise<void> => {
    const file = audioFiles.value.find((f) => f.id === updatedFile.id)
    if (!file) return
    isLoading.value = true
    loadingMessage.value = t('dsp.editingFile', { name: updatedFile.name })
    const source = file.processedBuffer ?? file.originalBuffer
    const [res] = await dspPool.run([
      {
        op: 'rmsScale',
        channels: copyChannels(source),
        sampleRate: source.sampleRate,
        params: {
          targetRms: updatedFile.targetRms ?? globalRmsValue.value,
          targetDbtp: CONSTANTS.TRUE_PEAK_LIMIT_DBTP,
          maxRmsGain: 10,
        },
      },
    ])
    if (res.ok) {
      const before = takeOf(file)
      applyDspResult(file, res.channels, res.peak, res.rms)
      recordEdit(
        {
          key: 'history.editFile',
          params: {
            name: file.name,
            rms: Number(updatedFile.targetRms ?? globalRmsValue.value).toFixed(2),
          },
        },
        [{ id: file.id, before, after: takeOf(file) }],
        r128Applied.value,
      )
      setStatus(t('status.updated', { name: updatedFile.name }), 'success')
    } else if (res.error === 'silent') {
      setStatus(t('status.tooQuiet', { name: updatedFile.name }), 'warning')
    } else {
      setStatus(t('status.fileError', { name: updatedFile.name }), 'error')
    }
    endLoading()
  }

  // Revert a single file to its original, unprocessed state.
  const resetFile = (file: AudioFileData): void => {
    const target = audioFiles.value.find((f) => f.id === file.id)
    if (!target || !target.processed) return
    const before = takeOf(target)
    target.processedBuffer = target.originalBuffer
    target.peak = target.originalPeak
    target.rms = target.originalRms
    target.targetRms = undefined
    target.processed = false
    if (target.processedBlobUrl) {
      URL.revokeObjectURL(target.processedBlobUrl)
      target.processedBlobUrl = null
    }
    recordEdit(
      { key: 'history.resetFile', params: { name: target.name } },
      [{ id: target.id, before, after: takeOf(target) }],
      r128Applied.value,
    )
    // If this track is playing its processed take, fall back to the original.
    if (currentTrackId.value === target.id && playbackMode.value === 'processed') {
      playbackMode.value = 'original'
    }
    setStatus(t('status.fileReset', { name: target.name }), 'success')
  }

  // Removed files keep their blob URLs: the history retains the file object so
  // an undo can put it back untouched. URLs are revoked once the entry expires.
  const removeFile = (file: AudioFileData): void => {
    const index = audioFiles.value.findIndex((f) => f.id === file.id)
    if (index === -1) return
    const removed = audioFiles.value[index]
    audioFiles.value.splice(index, 1)
    if (currentTrackId.value === file.id) {
      currentTrackId.value = null
      playbackMode.value = 'original'
    }
    recordHistory({
      kind: 'remove',
      label: { key: 'history.removeFile', params: { name: removed.name } },
      files: [{ file: removed, index }],
    })
    setStatus(t('status.fileRemoved', { name: file.name }), 'info')
  }

  const deleteAll = (): void => {
    if (audioFiles.value.length === 0) return
    const removed = audioFiles.value.map((file, index) => ({ file, index }))
    const r128Before = r128Applied.value
    audioFiles.value = []
    r128Applied.value = false
    currentTrackId.value = null
    playbackMode.value = 'original'
    recordHistory({
      kind: 'remove',
      label: { key: 'history.deleteAll', params: { count: removed.length } },
      files: removed,
      r128: r128Before ? { before: true, after: false } : undefined,
    })
    setStatus(t('status.allDeleted'), 'info')
  }

  const resetAll = (): void => {
    const r128Before = r128Applied.value
    const changes: { id: string; before: FileTake; after: FileTake }[] = []
    audioFiles.value.forEach((file) => {
      const before = takeOf(file)
      file.processedBuffer = file.originalBuffer
      file.peak = file.originalPeak
      file.rms = file.originalRms
      file.targetRms = undefined
      file.processed = false
      if (file.processedBlobUrl) {
        URL.revokeObjectURL(file.processedBlobUrl)
        file.processedBlobUrl = null
      }
      const after = takeOf(file)
      if (!takeEquals(before, after)) changes.push({ id: file.id, before, after })
    })
    r128Applied.value = false
    // The processed take no longer exists — fall back to original playback.
    playbackMode.value = 'original'
    recordEdit({ key: 'history.resetAll', params: { count: changes.length } }, changes, r128Before)
    setStatus(t('status.allReset'), 'success')
  }

  // ── Export ─────────────────────────────────────────────────────────────────

  const exportFile = async (
    file: AudioFileData,
    format: string = downloadFormat.value,
  ): Promise<void> => {
    isLoading.value = true
    loadingProgress.value = null
    loadingMessage.value = t('dsp.exportingFile', { name: file.name })
    try {
      await doExportFile(
        file,
        format,
        (msg) => {
          loadingMessage.value = msg
        },
        setStatus,
        // Feed the MP3/WebM conversion percentage into the overlay's bar.
        (pct) => {
          loadingProgress.value = pct
        },
      )
    } finally {
      endLoading()
    }
  }

  const exportAll = async (): Promise<void> => {
    if (audioFiles.value.length === 0) return
    // Only edited (processed) files are included in the export.
    const files = processedFiles.value.slice()
    if (files.length === 0) {
      setStatus(t('status.noProcessedFiles'), 'warning')
      return
    }
    isLoading.value = true
    loadingMessage.value = t('dsp.zipCreating')
    try {
      await doExportAll(
        files,
        downloadFormat.value,
        setProgress,
        (msg) => {
          loadingMessage.value = msg
        },
        setStatus,
      )
    } finally {
      endLoading()
    }
  }

  return {
    audioFiles,
    globalRmsValue,
    globalDbValue,
    downloadFormat,
    toasts,
    dismissToast,
    isProcessing,
    isLoading,
    loadingMessage,
    loadingProgress,
    r128Applied,
    // Playlist / player-bar state
    currentTrackId,
    playbackMode,
    selectedFiles,
    processedFiles,
    selectedCount,
    processedCount,
    allSelected,
    someSelected,
    currentTrack,
    toggleSelect,
    setAllSelected,
    toggleSelectAll,
    playTrack,
    setPlaybackMode,
    playNext,
    playPrev,
    setProgress,
    setStatus,
    handleFilesInput,
    handleSharedFiles,
    applyGlobalRms,
    applyGlobalDb,
    applyEBUR128,
    applyPreset,
    analyzeAll,
    applyNoiseReductionAll,
    reduceClippingAll,
    applyDynamicCompressionAll,
    updateFile,
    resetFile,
    removeFile,
    exportFile,
    exportAll,
    deleteAll,
    resetAll,
    // Undo / redo history
    canUndo,
    canRedo,
    undoLabel,
    redoLabel,
    historyPast,
    historyFuture,
    undo,
    redo,
    jumpToHistory,
  }
})
