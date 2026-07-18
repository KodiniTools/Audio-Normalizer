import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import {
  generateId,
  calculateRMS,
  calculatePeak,
  dbToRms,
  isAudioFile,
  bufferToWave,
} from '../utils/audioUtils'
import { shareFiles } from '../utils/sharedFileRepository'
import {
  scaleAudioBuffer,
  normalizeToLoudnessR128,
  applyNoiseReduction,
  reduceClipping,
  applyDynamicCompression,
} from '../composables/useAudioNormalization'
import { exportFile as doExportFile, exportAll as doExportAll } from '../composables/useAudioExport'
import type { AudioFileData, BatchResult, StatusType, PlaybackMode } from '../types'
import type { Preset } from '../data/presets'

export const useAudioStore = defineStore('audio', () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const audioFiles = ref<AudioFileData[]>([])
  const globalRmsValue = ref(0.5)
  const globalDbValue = ref(-20)
  const downloadFormat = ref('wav')
  const showProgress = ref(false)
  const progress = ref(0)
  const progressLabel = ref('')
  const statusMessage = ref('')
  const statusType = ref<StatusType>('info')
  const isProcessing = ref(false)
  const isLoading = ref(false)
  const loadingMessage = ref('Verarbeite...')
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

  const setProgress = (label: string, value: number): void => {
    showProgress.value = true
    progressLabel.value = label
    progress.value = value
    if (value >= 100)
      setTimeout(() => {
        showProgress.value = false
      }, 500)
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

  // ── Global Operations ──────────────────────────────────────────────────────

  const runGlobalOp = async (
    label: string,
    successMsg: string,
    fn: (file: AudioFileData) => Promise<void>,
  ): Promise<void> => {
    if (audioFiles.value.length === 0) return
    // Only the marked (selected) files in the interactive playlist are edited.
    const files = selectedFiles.value.slice()
    if (files.length === 0) {
      setStatus('Bitte markieren Sie mindestens eine Datei in der Playliste', 'warning')
      return
    }
    isProcessing.value = true
    await runBatch(files, label, async (file) => {
      try {
        await fn(file)
        file.processed = true
      } catch (e) {
        if (e instanceof Error && e.message === 'silent') {
          setStatus(`${file.name}: Datei ist zu leise zum Skalieren`, 'warning')
        } else {
          console.error(`[${label}] ${file.name}:`, e)
        }
      }
    })
    isProcessing.value = false
    setStatus(successMsg, 'success')
  }

  const applyGlobalRms = async (): Promise<void> => {
    await runGlobalOp('RMS Skalierung', 'RMS Skalierung abgeschlossen', (f) =>
      scaleAudioBuffer(f, globalRmsValue.value),
    )
    await autoShare()
  }

  const applyGlobalDb = async (): Promise<void> => {
    await runGlobalOp('dB Skalierung', 'dB Skalierung abgeschlossen', (f) =>
      scaleAudioBuffer(f, dbToRms(globalDbValue.value)),
    )
    await autoShare()
  }

  const applyEBUR128 = async (): Promise<void> => {
    await runGlobalOp('EBU R128', 'EBU R128 Normalisierung abgeschlossen', normalizeToLoudnessR128)
    r128Applied.value = true
    await autoShare()
  }

  const applyPreset = async (preset: Preset): Promise<void> => {
    if (audioFiles.value.length === 0) return
    const files = selectedFiles.value.slice()
    if (files.length === 0) {
      setStatus('Bitte markieren Sie mindestens eine Datei in der Playliste', 'warning')
      return
    }
    isProcessing.value = true
    await runBatch(files, preset.id, async (file) => {
      try {
        await normalizeToLoudnessR128(file, preset.lufs, preset.truePeakDbtp)
        file.processed = true
      } catch (e) {
        console.error(`[Preset ${preset.id}] ${file.name}:`, e)
      }
    })
    isProcessing.value = false
    r128Applied.value = true
    setStatus(
      `Preset „${preset.id}“ angewendet (${preset.lufs} LUFS, ${preset.truePeakDbtp} dBTP)`,
      'success',
    )
    await autoShare()
  }

  const applyNoiseReductionAll = async (): Promise<void> => {
    await runGlobalOp(
      'Rauschunterdrückung',
      'Rauschunterdrückung abgeschlossen',
      applyNoiseReduction,
    )
    await autoShare()
  }

  const reduceClippingAll = async (): Promise<void> => {
    await runGlobalOp('Clipping Reduktion', 'Clipping Reduktion abgeschlossen', reduceClipping)
    await autoShare()
  }

  const applyDynamicCompressionAll = async (): Promise<void> => {
    await runGlobalOp(
      'Dynamikkompression',
      'Dynamikkompression abgeschlossen',
      applyDynamicCompression,
    )
    await autoShare()
  }

  const analyzeAll = (): void => setStatus('Alle Dateien bereits analysiert', 'info')

  // ── Individual File Operations ─────────────────────────────────────────────

  const updateFile = async (updatedFile: AudioFileData): Promise<void> => {
    const index = audioFiles.value.findIndex((f) => f.id === updatedFile.id)
    if (index === -1) return
    isLoading.value = true
    try {
      await scaleAudioBuffer(audioFiles.value[index], updatedFile.targetRms ?? globalRmsValue.value)
      audioFiles.value[index].processed = true
      setStatus(`${updatedFile.name} aktualisiert`, 'success')
    } catch (e) {
      if (e instanceof Error && e.message === 'silent') {
        setStatus(`${updatedFile.name}: Datei ist zu leise zum Skalieren`, 'warning')
      } else {
        setStatus(`Fehler bei ${updatedFile.name}`, 'error')
      }
    }
    isLoading.value = false
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
    loadingMessage.value = `Exportiere ${file.name}...`
    try {
      await doExportFile(
        file,
        downloadFormat.value,
        (msg) => {
          loadingMessage.value = msg
        },
        setStatus,
      )
    } finally {
      isLoading.value = false
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
      isLoading.value = false
    }
  }

  return {
    audioFiles,
    globalRmsValue,
    globalDbValue,
    downloadFormat,
    showProgress,
    progress,
    progressLabel,
    statusMessage,
    statusType,
    isProcessing,
    isLoading,
    loadingMessage,
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
