import { ref, computed } from 'vue'
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
import { exportFile as doExportFile, exportAll as doExportAll } from '../composables/useAudioExport'
import type {
  AudioFileData,
  BatchResult,
  StatusType,
  PlaybackMode,
  DspOp,
  DspParams,
} from '../types'
import type { Preset } from '../data/presets'

export const useAudioStore = defineStore('audio', () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const audioFiles = ref<AudioFileData[]>([])
  const globalRmsValue = ref(0.5)
  const globalDbValue = ref(-20)
  const downloadFormat = ref('wav')
  const statusMessage = ref('')
  const statusType = ref<StatusType>('info')
  const isProcessing = ref(false)
  const isLoading = ref(false)
  const loadingMessage = ref('Verarbeite...')
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

  const setStatus = (message: string, type: StatusType = 'info'): void => {
    statusMessage.value = message
    statusType.value = type
    const duration = type === 'error' ? 5000 : type === 'warning' ? 4000 : 3000
    setTimeout(() => {
      statusMessage.value = ''
    }, duration)
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
      if (!ok) setStatus(`${f.name} ist keine gültige Audiodatei`, 'warning')
      return ok
    })

    if (audioOnly.length === 0) {
      setStatus('Keine gültigen Audio-Dateien gefunden', 'error')
      isProcessing.value = false
      return
    }

    let processed = 0
    let errors = 0

    await runBatch(
      audioOnly as unknown as AudioFileData[],
      'Upload',
      async (item) => {
        const file = item as unknown as File
        try {
          audioFiles.value.push(await analyzeFile(file))
          processed++
        } catch {
          setStatus(`Fehler bei ${(file as File).name}`, 'error')
          errors++
        }
      },
      2,
    )

    isProcessing.value = false
    endLoading()
    if (processed > 0) setStatus(`${processed} Datei(en) erfolgreich hochgeladen`, 'success')
    else if (errors > 0) setStatus('Keine gültigen Audio-Dateien gefunden', 'error')
  }

  const handleSharedFiles = async (
    sharedRecords: { name: string; blob: Blob | ArrayBuffer; mimeType?: string }[],
  ): Promise<BatchResult> => {
    isProcessing.value = true
    let processed = 0
    let errors = 0

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

        audioFiles.value.push(await analyzeBlob(blob, record.name))
        processed++
      } catch (error) {
        console.error(`[AudioNormalizer] Failed to import shared file "${record.name}":`, error)
        errors++
      }
    }

    isProcessing.value = false
    if (processed > 0) setStatus(`${processed} Datei(en) importiert`, 'success')
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
      setStatus('Bitte markieren Sie mindestens eine Datei in der Playliste', 'warning')
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

    results.forEach((res, i) => {
      const file = files[i]
      if (!res.ok) {
        if (res.error === 'silent') {
          setStatus(`${file.name}: Datei ist zu leise zum Skalieren`, 'warning')
        } else {
          console.error(`[${label}] ${file.name}:`, res.error)
        }
        return
      }
      applyDspResult(file, res.channels, res.peak, res.rms)
    })

    isProcessing.value = false
    endLoading()
    if (markR128) r128Applied.value = true
    setStatus(successMsg, 'success')
    await autoShare()
  }

  const applyGlobalRms = (): Promise<void> =>
    runDspBatch('RMS Skalierung', 'RMS Skalierung abgeschlossen', 'rmsScale', {
      targetRms: globalRmsValue.value,
      targetDbtp: CONSTANTS.TRUE_PEAK_LIMIT_DBTP,
      maxRmsGain: 10,
    })

  const applyGlobalDb = (): Promise<void> =>
    runDspBatch('dB Skalierung', 'dB Skalierung abgeschlossen', 'rmsScale', {
      targetRms: dbToRms(globalDbValue.value),
      targetDbtp: CONSTANTS.TRUE_PEAK_LIMIT_DBTP,
      maxRmsGain: 10,
    })

  const applyEBUR128 = (): Promise<void> =>
    runDspBatch(
      'EBU R128',
      'EBU R128 Normalisierung abgeschlossen',
      'ebur128',
      {
        targetLufs: CONSTANTS.EBU_R128_TARGET_LUFS,
        targetDbtp: CONSTANTS.TRUE_PEAK_LIMIT_DBTP,
      },
      { fromOriginal: true, markR128: true },
    )

  const applyPreset = (preset: Preset): Promise<void> =>
    runDspBatch(
      preset.id,
      `Preset „${preset.id}“ angewendet (${preset.lufs} LUFS, ${preset.truePeakDbtp} dBTP)`,
      'ebur128',
      { targetLufs: preset.lufs, targetDbtp: preset.truePeakDbtp },
      { fromOriginal: true, markR128: true },
    )

  const applyNoiseReductionAll = (): Promise<void> =>
    runDspBatch('Rauschunterdrückung', 'Rauschunterdrückung abgeschlossen', 'noiseReduction', {
      lowpassFreq: CONSTANTS.LOWPASS_FREQ,
      lowpassQ: CONSTANTS.LOWPASS_Q,
    })

  const reduceClippingAll = (): Promise<void> =>
    runDspBatch('Clipping Reduktion', 'Clipping Reduktion abgeschlossen', 'reduceClipping', {})

  const applyDynamicCompressionAll = (): Promise<void> =>
    runDspBatch('Dynamikkompression', 'Dynamikkompression abgeschlossen', 'dynamicCompression', {
      threshold: CONSTANTS.COMPRESSOR_THRESHOLD,
      knee: CONSTANTS.COMPRESSOR_KNEE,
      ratio: CONSTANTS.COMPRESSOR_RATIO,
      attack: CONSTANTS.COMPRESSOR_ATTACK,
      release: CONSTANTS.COMPRESSOR_RELEASE,
    })

  const analyzeAll = (): void => setStatus('Alle Dateien bereits analysiert', 'info')

  // ── Individual File Operations ─────────────────────────────────────────────

  const updateFile = async (updatedFile: AudioFileData): Promise<void> => {
    const file = audioFiles.value.find((f) => f.id === updatedFile.id)
    if (!file) return
    isLoading.value = true
    loadingMessage.value = `${updatedFile.name} wird bearbeitet...`
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
      applyDspResult(file, res.channels, res.peak, res.rms)
      setStatus(`${updatedFile.name} aktualisiert`, 'success')
    } else if (res.error === 'silent') {
      setStatus(`${updatedFile.name}: Datei ist zu leise zum Skalieren`, 'warning')
    } else {
      setStatus(`Fehler bei ${updatedFile.name}`, 'error')
    }
    endLoading()
  }

  const removeFile = (file: AudioFileData): void => {
    const index = audioFiles.value.findIndex((f) => f.id === file.id)
    if (index === -1) return
    if (file.processedBlobUrl) URL.revokeObjectURL(file.processedBlobUrl)
    if (file.originalBlobUrl) URL.revokeObjectURL(file.originalBlobUrl)
    audioFiles.value.splice(index, 1)
    if (currentTrackId.value === file.id) {
      currentTrackId.value = null
      playbackMode.value = 'original'
    }
    setStatus(`${file.name} entfernt`, 'info')
  }

  const deleteAll = (): void => {
    audioFiles.value.forEach((file) => {
      if (file.processedBlobUrl) URL.revokeObjectURL(file.processedBlobUrl)
      if (file.originalBlobUrl) URL.revokeObjectURL(file.originalBlobUrl)
    })
    audioFiles.value = []
    r128Applied.value = false
    currentTrackId.value = null
    playbackMode.value = 'original'
    setStatus('Alle Dateien gelöscht', 'info')
  }

  const resetAll = (): void => {
    audioFiles.value.forEach((file) => {
      file.processedBuffer = file.originalBuffer
      file.peak = file.originalPeak
      file.rms = file.originalRms
      file.processed = false
      if (file.processedBlobUrl) {
        URL.revokeObjectURL(file.processedBlobUrl)
        file.processedBlobUrl = null
      }
    })
    r128Applied.value = false
    // The processed take no longer exists — fall back to original playback.
    playbackMode.value = 'original'
    setStatus('Alle Änderungen zurückgesetzt', 'success')
  }

  // ── Export ─────────────────────────────────────────────────────────────────

  const exportFile = async (file: AudioFileData): Promise<void> => {
    isLoading.value = true
    loadingProgress.value = null
    loadingMessage.value = `Exportiere ${file.name}...`
    try {
      await doExportFile(
        file,
        downloadFormat.value,
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
      setStatus('Keine bearbeiteten Dateien zum Exportieren', 'warning')
      return
    }
    isLoading.value = true
    loadingMessage.value = 'ZIP wird erstellt...'
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
    statusMessage,
    statusType,
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
    removeFile,
    exportFile,
    exportAll,
    deleteAll,
    resetAll,
  }
})
