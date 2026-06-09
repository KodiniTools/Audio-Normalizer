import { ref } from 'vue'
import { defineStore } from 'pinia'
import { generateId, calculateRMS, calculatePeak, dbToRms, isAudioFile } from '../utils/audioUtils'
import {
  scaleAudioBuffer,
  normalizeToLoudnessR128,
  applyNoiseReduction,
  reduceClipping,
  applyDynamicCompression,
} from '../composables/useAudioNormalization'
import {
  exportFile as doExportFile,
  exportAll as doExportAll,
} from '../composables/useAudioExport'
import type { AudioFileData, BatchResult, StatusType } from '../types'
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
    isProcessing.value = true
    const files = audioFiles.value.slice()
    await runBatch(files, label, async (file) => {
      try {
        await fn(file)
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

  const applyGlobalRms = (): Promise<void> =>
    runGlobalOp('RMS Skalierung', 'RMS Skalierung abgeschlossen', (f) =>
      scaleAudioBuffer(f, globalRmsValue.value),
    )

  const applyGlobalDb = (): Promise<void> =>
    runGlobalOp('dB Skalierung', 'dB Skalierung abgeschlossen', (f) =>
      scaleAudioBuffer(f, dbToRms(globalDbValue.value)),
    )

  const applyEBUR128 = async (): Promise<void> => {
    await runGlobalOp('EBU R128', 'EBU R128 Normalisierung abgeschlossen', normalizeToLoudnessR128)
    r128Applied.value = true
  }

  const applyPreset = async (preset: Preset): Promise<void> => {
    if (audioFiles.value.length === 0) return
    isProcessing.value = true
    const files = audioFiles.value.slice()
    await runBatch(files, preset.id, async (file) => {
      try {
        await normalizeToLoudnessR128(file, preset.lufs, preset.truePeakDbtp)
      } catch (e) {
        console.error(`[Preset ${preset.id}] ${file.name}:`, e)
      }
    })
    isProcessing.value = false
    r128Applied.value = true
    setStatus(`Preset „${preset.id}" angewendet (${preset.lufs} LUFS, ${preset.truePeakDbtp} dBTP)`, 'success')
  }

  const applyNoiseReductionAll = (): Promise<void> =>
    runGlobalOp('Rauschunterdrückung', 'Rauschunterdrückung abgeschlossen', applyNoiseReduction)

  const reduceClippingAll = (): Promise<void> =>
    runGlobalOp('Clipping Reduktion', 'Clipping Reduktion abgeschlossen', reduceClipping)

  const applyDynamicCompressionAll = (): Promise<void> =>
    runGlobalOp(
      'Dynamikkompression',
      'Dynamikkompression abgeschlossen',
      applyDynamicCompression,
    )

  const analyzeAll = (): void => setStatus('Alle Dateien bereits analysiert', 'info')

  // ── Individual File Operations ─────────────────────────────────────────────

  const updateFile = async (updatedFile: AudioFileData): Promise<void> => {
    const index = audioFiles.value.findIndex((f) => f.id === updatedFile.id)
    if (index === -1) return
    isLoading.value = true
    try {
      await scaleAudioBuffer(audioFiles.value[index], updatedFile.targetRms ?? globalRmsValue.value)
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
    setStatus(`${file.name} entfernt`, 'info')
  }

  const deleteAll = (): void => {
    audioFiles.value.forEach((file) => {
      if (file.processedBlobUrl) URL.revokeObjectURL(file.processedBlobUrl)
      if (file.originalBlobUrl) URL.revokeObjectURL(file.originalBlobUrl)
    })
    audioFiles.value = []
    r128Applied.value = false
    setStatus('Alle Dateien gelöscht', 'info')
  }

  const resetAll = (): void => {
    audioFiles.value.forEach((file) => {
      file.processedBuffer = file.originalBuffer
      file.peak = file.originalPeak
      file.rms = file.originalRms
      if (file.processedBlobUrl) {
        URL.revokeObjectURL(file.processedBlobUrl)
        file.processedBlobUrl = null
      }
    })
    r128Applied.value = false
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
    isLoading.value = true
    loadingMessage.value = 'ZIP wird erstellt...'
    try {
      await doExportAll(
        audioFiles.value.slice(),
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
