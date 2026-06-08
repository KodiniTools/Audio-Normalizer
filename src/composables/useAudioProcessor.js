import { ref } from 'vue'
import {
  generateId,
  calculateRMS,
  calculatePeak,
  dbToRms,
  isAudioFile,
} from '../utils/audioUtils.js'
import {
  scaleAudioBuffer,
  normalizeToLoudnessR128,
  applyNoiseReduction,
  reduceClipping,
  applyDynamicCompression,
} from './useAudioNormalization.js'
import { useAudioExport } from './useAudioExport.js'

export function useAudioProcessor() {
  const audioFiles = ref([])
  const globalRmsValue = ref(0.5)
  const globalDbValue = ref(-20)
  const downloadFormat = ref('wav')
  const showProgress = ref(false)
  const progress = ref(0)
  const progressLabel = ref('')
  const statusMessage = ref('')
  const statusType = ref('info')
  const isProcessing = ref(false)

  // ── Helpers ──────────────────────────────────────────────────────────────

  const setProgress = (label, value) => {
    showProgress.value = true
    progressLabel.value = label
    progress.value = value
    if (value >= 100)
      setTimeout(() => {
        showProgress.value = false
      }, 500)
  }

  const setStatus = (message, type = 'info') => {
    statusMessage.value = message
    statusType.value = type
    const duration = type === 'error' ? 5000 : type === 'warning' ? 4000 : 3000
    setTimeout(() => {
      statusMessage.value = ''
    }, duration)
  }

  // NOTE: Keep concurrency=1 for OfflineAudioContext operations — each context
  // holds a full PCM copy of the file in RAM, so parallelism multiplies peak usage.
  const runBatch = async (items, label, fn, concurrency = 1) => {
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

  // ── Export (delegated) ───────────────────────────────────────────────────

  const {
    isLoading,
    loadingMessage,
    exportFile,
    exportAll: _exportAll,
  } = useAudioExport(downloadFormat, setProgress, setStatus)

  const exportAll = () => _exportAll(audioFiles.value.slice())

  // ── File Analysis ────────────────────────────────────────────────────────

  const buildFileData = async (buffer, name, originalRef) => ({
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

  const analyzeFile = async (file) => {
    const arrayBuffer = await file.arrayBuffer()
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    audioContext.close()
    return buildFileData(audioBuffer, file.name, file)
  }

  const analyzeBlob = async (blob, name) => {
    const arrayBuffer = await blob.arrayBuffer()
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
    audioContext.close()
    const fileRef = new File([blob], name, { type: blob.type })
    return buildFileData(audioBuffer, name, fileRef)
  }

  // ── File Handling ────────────────────────────────────────────────────────

  const handleFilesInput = async (files) => {
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
      audioOnly,
      'Upload',
      async (file) => {
        try {
          audioFiles.value.push(await analyzeFile(file))
          processed++
        } catch {
          setStatus(`Fehler bei ${file.name}`, 'error')
          errors++
        }
      },
      2,
    )

    isProcessing.value = false
    if (processed > 0) setStatus(`${processed} Datei(en) erfolgreich hochgeladen`, 'success')
    else if (errors > 0) setStatus('Keine gültigen Audio-Dateien gefunden', 'error')
  }

  const handleSharedFiles = async (sharedRecords) => {
    isProcessing.value = true
    let processed = 0
    let errors = 0

    await runBatch(
      sharedRecords,
      'Import',
      async (record) => {
        try {
          const blob =
            record.blob instanceof Blob
              ? record.blob
              : new Blob([record.blob], { type: record.mimeType || 'audio/wav' })

          if (blob.size === 0) {
            console.warn(`[AudioNormalizer] Shared file "${record.name}" has empty blob, skipping`)
            errors++
            return
          }

          audioFiles.value.push(await analyzeBlob(blob, record.name))
          processed++
        } catch (error) {
          console.error(`[AudioNormalizer] Failed to import shared file "${record.name}":`, error)
          errors++
        }
      },
      2,
    )

    isProcessing.value = false
    if (processed > 0) setStatus(`${processed} Datei(en) importiert`, 'success')
    return { processed, errors }
  }

  // ── Global Normalization Operations ──────────────────────────────────────

  const runGlobalOp = async (label, successMsg, fn) => {
    if (audioFiles.value.length === 0) return
    isProcessing.value = true
    const files = audioFiles.value.slice()
    await runBatch(files, label, async (file) => {
      try {
        await fn(file)
      } catch (e) {
        console.error(`[${label}] ${file.name}:`, e)
      }
    })
    isProcessing.value = false
    setStatus(successMsg, 'success')
  }

  const applyGlobalRms = () =>
    runGlobalOp('RMS Skalierung', 'RMS Skalierung abgeschlossen', (f) =>
      scaleAudioBuffer(f, globalRmsValue.value),
    )

  const applyGlobalDb = () =>
    runGlobalOp('dB Skalierung', 'dB Skalierung abgeschlossen', (f) =>
      scaleAudioBuffer(f, dbToRms(globalDbValue.value)),
    )

  const applyEBUR128 = () =>
    runGlobalOp('EBU R128', 'EBU R128 Normalisierung abgeschlossen', normalizeToLoudnessR128)

  const applyNoiseReductionAll = () =>
    runGlobalOp('Rauschunterdrückung', 'Rauschunterdrückung abgeschlossen', applyNoiseReduction)

  const reduceClippingAll = () =>
    runGlobalOp('Clipping Reduktion', 'Clipping Reduktion abgeschlossen', reduceClipping)

  const applyDynamicCompressionAll = () =>
    runGlobalOp('Dynamikkompression', 'Dynamikkompression abgeschlossen', applyDynamicCompression)

  const analyzeAll = () => setStatus('Alle Dateien bereits analysiert', 'info')

  // ── Individual File Operations ───────────────────────────────────────────

  const updateFile = async (updatedFile) => {
    const index = audioFiles.value.findIndex((f) => f.id === updatedFile.id)
    if (index === -1) return
    isLoading.value = true
    try {
      await scaleAudioBuffer(audioFiles.value[index], updatedFile.targetRms)
      setStatus(`${updatedFile.name} aktualisiert`, 'success')
    } catch {
      setStatus(`Fehler bei ${updatedFile.name}`, 'error')
    }
    isLoading.value = false
  }

  const removeFile = (file) => {
    const index = audioFiles.value.findIndex((f) => f.id === file.id)
    if (index === -1) return
    if (file.processedBlobUrl) URL.revokeObjectURL(file.processedBlobUrl)
    if (file.originalBlobUrl) URL.revokeObjectURL(file.originalBlobUrl)
    audioFiles.value.splice(index, 1)
    setStatus(`${file.name} entfernt`, 'info')
  }

  const deleteAll = () => {
    audioFiles.value.forEach((file) => {
      if (file.processedBlobUrl) URL.revokeObjectURL(file.processedBlobUrl)
      if (file.originalBlobUrl) URL.revokeObjectURL(file.originalBlobUrl)
    })
    audioFiles.value = []
    setStatus('Alle Dateien gelöscht', 'info')
  }

  const resetAll = () => {
    audioFiles.value.forEach((file) => {
      file.processedBuffer = file.originalBuffer
      file.peak = file.originalPeak
      file.rms = file.originalRms
      if (file.processedBlobUrl) {
        URL.revokeObjectURL(file.processedBlobUrl)
        file.processedBlobUrl = null
      }
    })
    setStatus('Alle Änderungen zurückgesetzt', 'success')
  }

  return {
    audioFiles,
    globalRmsValue,
    globalDbValue,
    downloadFormat,
    showProgress,
    progress,
    progressLabel,
    isLoading,
    loadingMessage,
    statusMessage,
    statusType,
    isProcessing,
    handleFilesInput,
    handleSharedFiles,
    applyGlobalRms,
    applyGlobalDb,
    applyEBUR128,
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
}
