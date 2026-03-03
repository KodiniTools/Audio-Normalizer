import { ref } from 'vue'
import JSZip from 'jszip'
import { Muxer, ArrayBufferTarget } from 'webm-muxer'

// Constants
const CONSTANTS = {
  EBU_R128_TARGET_LUFS: -23,
  COMPRESSOR_THRESHOLD: -24,
  COMPRESSOR_KNEE: 30,
  COMPRESSOR_RATIO: 12,
  COMPRESSOR_ATTACK: 0.003,
  COMPRESSOR_RELEASE: 0.25,
  LOWPASS_FREQ: 8000,
  LOWPASS_Q: 1,
  MP3_KBPS: 320,
  WEBM_KBPS: 128,
}

// Fast WebM encoding using AudioEncoder (WebCodecs) + webm-muxer
const audioBufferToWebM = async (audioBuffer, onProgress = null) => {
  // Check if AudioEncoder is available (Chrome 94+, Edge)
  if (typeof AudioEncoder !== 'undefined') {
    return audioBufferToWebMFast(audioBuffer, onProgress)
  }
  // Fallback to MediaRecorder for unsupported browsers
  return audioBufferToWebMFallback(audioBuffer, onProgress)
}

// Fast path: AudioEncoder + webm-muxer (encodes at CPU speed, not real-time)
const audioBufferToWebMFast = async (audioBuffer, onProgress = null) => {
  const numberOfChannels = audioBuffer.numberOfChannels
  const sampleRate = audioBuffer.sampleRate
  const totalFrames = audioBuffer.length

  const target = new ArrayBufferTarget()
  const muxer = new Muxer({
    target,
    type: 'audio',
    audio: {
      codec: 'A_OPUS',
      numberOfChannels,
      sampleRate,
    }
  })

  // Collect encoded chunks
  const encoder = new AudioEncoder({
    output: (chunk, meta) => {
      muxer.addAudioChunk(chunk, meta)
    },
    error: (e) => {
      throw e
    }
  })

  encoder.configure({
    codec: 'opus',
    numberOfChannels,
    sampleRate,
    bitrate: CONSTANTS.WEBM_KBPS * 1000,
  })

  // Encode in chunks of 960 frames (20ms at 48kHz, Opus standard frame size)
  const chunkSize = 960 * Math.max(1, Math.round(sampleRate / 48000))
  let processedFrames = 0

  // Interleave channel data for AudioData
  for (let offset = 0; offset < totalFrames; offset += chunkSize) {
    const framesInChunk = Math.min(chunkSize, totalFrames - offset)

    // Create planar float32 data
    const planarData = new Float32Array(framesInChunk * numberOfChannels)
    for (let ch = 0; ch < numberOfChannels; ch++) {
      const channelData = audioBuffer.getChannelData(ch)
      planarData.set(
        channelData.subarray(offset, offset + framesInChunk),
        ch * framesInChunk
      )
    }

    const audioData = new AudioData({
      format: 'f32-planar',
      sampleRate,
      numberOfFrames: framesInChunk,
      numberOfChannels,
      timestamp: Math.round((offset / sampleRate) * 1_000_000), // microseconds
      data: planarData,
    })

    encoder.encode(audioData)
    audioData.close()

    processedFrames += framesInChunk
    if (onProgress) {
      onProgress(Math.min(Math.round((processedFrames / totalFrames) * 100), 99))
    }
  }

  await encoder.flush()
  encoder.close()
  muxer.finalize()

  if (onProgress) onProgress(100)
  return new Blob([target.buffer], { type: 'audio/webm' })
}

// Fallback: MediaRecorder (real-time, slower)
const audioBufferToWebMFallback = async (audioBuffer, onProgress = null) => {
  return new Promise((resolve, reject) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      audioContext.suspend()

      const dest = audioContext.createMediaStreamDestination()
      const source = audioContext.createBufferSource()
      source.buffer = audioBuffer
      source.connect(dest)

      let mimeType = 'audio/webm;codecs=opus'
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm'
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/ogg;codecs=opus'
        }
      }

      const mediaRecorder = new MediaRecorder(dest.stream, {
        mimeType,
        audioBitsPerSecond: CONSTANTS.WEBM_KBPS * 1000
      })

      const chunks = []
      const duration = audioBuffer.duration * 1000
      const startTime = Date.now()

      let progressInterval = null
      if (onProgress) {
        progressInterval = setInterval(() => {
          const elapsed = Date.now() - startTime
          onProgress(Math.min(Math.round((elapsed / duration) * 100), 99))
        }, 100)
      }

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      mediaRecorder.onstop = () => {
        if (progressInterval) clearInterval(progressInterval)
        if (onProgress) onProgress(100)
        audioContext.close()
        resolve(new Blob(chunks, { type: mimeType }))
      }

      mediaRecorder.onerror = (e) => {
        if (progressInterval) clearInterval(progressInterval)
        audioContext.close()
        reject(e.error || new Error('MediaRecorder error'))
      }

      audioContext.resume().then(() => {
        mediaRecorder.start()
        source.start(0)
      })

      source.onended = () => {
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') mediaRecorder.stop()
        }, 100)
      }
    } catch (error) {
      reject(error)
    }
  })
}

// MP3 Worker: created inline using new Worker(new URL(...)) so Vite emits a separate file (CSP-safe)

export function useAudioProcessor() {
  const audioFiles = ref([])
  const globalRmsValue = ref(0.5)
  const globalDbValue = ref(-20)
  const downloadFormat = ref('wav')
  const showProgress = ref(false)
  const progress = ref(0)
  const progressLabel = ref('')
  const isLoading = ref(false)
  const loadingMessage = ref('Verarbeite...')
  const statusMessage = ref('')
  const statusType = ref('info') // 'success', 'error', 'warning', 'info'
  const isProcessing = ref(false)

  // Helper Functions
  const generateId = () => '_' + Math.random().toString(36).substr(2, 9)

  const calculateRMS = (buffer) => {
    let rmsSum = 0
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel)
      for (let i = 0; i < channelData.length; i++) {
        rmsSum += channelData[i] * channelData[i]
      }
    }
    return Math.sqrt(rmsSum / (buffer.length * buffer.numberOfChannels))
  }

  const calculatePeak = (buffer) => {
    let peak = 0
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel)
      for (let i = 0; i < channelData.length; i++) {
        peak = Math.max(peak, Math.abs(channelData[i]))
      }
    }
    return peak
  }

  const dbToRms = (db) => Math.pow(10, db / 20)

  const normalizePeak = (buffer) => {
    const maxPeak = 1.0
    const currentPeak = calculatePeak(buffer)
    if (currentPeak > maxPeak) {
      const scaleFactor = maxPeak / currentPeak
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const channelData = buffer.getChannelData(channel)
        for (let i = 0; i < channelData.length; i++) {
          channelData[i] *= scaleFactor
        }
      }
    }
    return buffer
  }

  const bufferToWave = (abuffer, offset, len) => {
    const numOfChan = abuffer.numberOfChannels
    const length = len * numOfChan * 2 + 44
    const buffer = new ArrayBuffer(length)
    const view = new DataView(buffer)
    const sampleRate = abuffer.sampleRate
    
    const writeString = (view, offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }
    
    writeString(view, 0, "RIFF")
    view.setUint32(4, 36 + len * numOfChan * 2, true)
    writeString(view, 8, "WAVE")
    writeString(view, 12, "fmt ")
    view.setUint32(16, 16, true)
    view.setUint16(20, 1, true)
    view.setUint16(22, numOfChan, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * numOfChan * 2, true)
    view.setUint16(32, numOfChan * 2, true)
    view.setUint16(34, 16, true)
    writeString(view, 36, "data")
    view.setUint32(40, len * numOfChan * 2, true)
    
    let pos = 44
    for (let i = 0; i < len; i++) {
      for (let channel = 0; channel < numOfChan; channel++) {
        let sample = abuffer.getChannelData(channel)[offset + i]
        sample = Math.max(-1, Math.min(1, sample))
        sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF
        view.setInt16(pos, sample, true)
        pos += 2
      }
    }
    return new Blob([buffer], { type: "audio/wav" })
  }

  const triggerDownload = (blob, filename) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.style.display = "none"
    a.download = filename
    a.href = url
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const setProgress = (label, value) => {
    showProgress.value = true
    progressLabel.value = label
    progress.value = value
    if (value >= 100) {
      setTimeout(() => {
        showProgress.value = false
      }, 500)
    }
  }

  const setStatus = (message, type = 'info') => {
    statusMessage.value = message
    statusType.value = type
    // Longer duration for errors, shorter for success
    const duration = type === 'error' ? 5000 : type === 'warning' ? 4000 : 3000
    setTimeout(() => {
      statusMessage.value = ''
    }, duration)
  }

  // Audio Processing Functions
  const measureLoudnessR128 = async (buffer) => {
    const offlineCtx = new OfflineAudioContext(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    )
    const source = offlineCtx.createBufferSource()
    source.buffer = buffer
    
    const highpass = offlineCtx.createBiquadFilter()
    highpass.type = 'highpass'
    highpass.frequency.value = 38
    highpass.Q.value = 0.5
    
    const highshelf = offlineCtx.createBiquadFilter()
    highshelf.type = 'highshelf'
    highshelf.frequency.value = 1500
    highshelf.gain.value = 4
    
    source.connect(highpass).connect(highshelf).connect(offlineCtx.destination)
    source.start()
    
    const filtered = await offlineCtx.startRendering()
    const integratedRms = calculateRMS(filtered)
    const lufs = 20 * Math.log10(integratedRms) + 16.8
    return isFinite(lufs) ? lufs : -70.0
  }

  const scaleAudioBuffer = async (fileData, targetRms) => {
    const originalBuffer = fileData.originalBuffer
    if (!originalBuffer) throw new Error("Original buffer not found")
    
    const currentRms = calculateRMS(originalBuffer)
    const gain = targetRms / (currentRms || 1)
    
    const offlineContext = new OfflineAudioContext(
      originalBuffer.numberOfChannels,
      originalBuffer.length,
      originalBuffer.sampleRate
    )
    const source = offlineContext.createBufferSource()
    source.buffer = originalBuffer
    
    const gainNode = offlineContext.createGain()
    gainNode.gain.value = gain
    
    source.connect(gainNode).connect(offlineContext.destination)
    source.start()
    
    const renderedBuffer = await offlineContext.startRendering()
    normalizePeak(renderedBuffer)
    
    fileData.processedBuffer = renderedBuffer
    fileData.peak = calculatePeak(renderedBuffer)
    fileData.rms = calculateRMS(renderedBuffer)
    
    if (fileData.processedBlobUrl) {
      URL.revokeObjectURL(fileData.processedBlobUrl)
    }
    
    const wavBlob = bufferToWave(renderedBuffer, 0, renderedBuffer.length)
    fileData.processedBlobUrl = URL.createObjectURL(wavBlob)
  }

  const normalizeToLoudnessR128 = async (fileData, targetLufs) => {
    const originalBuffer = fileData.originalBuffer
    if (!originalBuffer) throw new Error("Original buffer not found")
    
    const currentLufs = await measureLoudnessR128(originalBuffer)
    const gainValue = Math.pow(10, (targetLufs - currentLufs) / 20)
    
    const offlineContext = new OfflineAudioContext(
      originalBuffer.numberOfChannels,
      originalBuffer.length,
      originalBuffer.sampleRate
    )
    const source = offlineContext.createBufferSource()
    source.buffer = originalBuffer
    
    const gainNode = offlineContext.createGain()
    gainNode.gain.value = gainValue
    
    source.connect(gainNode).connect(offlineContext.destination)
    source.start()
    
    const renderedBuffer = await offlineContext.startRendering()
    normalizePeak(renderedBuffer)
    
    fileData.processedBuffer = renderedBuffer
    fileData.peak = calculatePeak(renderedBuffer)
    fileData.rms = calculateRMS(renderedBuffer)
    
    if (fileData.processedBlobUrl) {
      URL.revokeObjectURL(fileData.processedBlobUrl)
    }
    
    const wavBlob = bufferToWave(renderedBuffer, 0, renderedBuffer.length)
    fileData.processedBlobUrl = URL.createObjectURL(wavBlob)
  }

  const applyNoiseReduction = async (fileData) => {
    const originalBuffer = fileData.processedBuffer || fileData.originalBuffer
    const offlineContext = new OfflineAudioContext(
      originalBuffer.numberOfChannels,
      originalBuffer.length,
      originalBuffer.sampleRate
    )
    const source = offlineContext.createBufferSource()
    source.buffer = originalBuffer
    
    const lowpass = offlineContext.createBiquadFilter()
    lowpass.type = "lowpass"
    lowpass.frequency.value = CONSTANTS.LOWPASS_FREQ
    lowpass.Q.value = CONSTANTS.LOWPASS_Q
    
    source.connect(lowpass).connect(offlineContext.destination)
    source.start()
    
    const renderedBuffer = await offlineContext.startRendering()
    fileData.processedBuffer = renderedBuffer
    fileData.peak = calculatePeak(renderedBuffer)
    fileData.rms = calculateRMS(renderedBuffer)
    
    if (fileData.processedBlobUrl) {
      URL.revokeObjectURL(fileData.processedBlobUrl)
    }
    
    const wavBlob = bufferToWave(renderedBuffer, 0, renderedBuffer.length)
    fileData.processedBlobUrl = URL.createObjectURL(wavBlob)
  }

  const reduceClipping = async (fileData) => {
    const buffer = fileData.processedBuffer || fileData.originalBuffer
    const offlineContext = new OfflineAudioContext(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    )
    const source = offlineContext.createBufferSource()
    source.buffer = buffer
    
    const waveshaper = offlineContext.createWaveShaper()
    const curve = new Float32Array(256)
    for (let i = 0; i < 256; i++) {
      const x = (i - 128) / 128
      curve[i] = Math.tanh(x * 2)
    }
    waveshaper.curve = curve
    
    source.connect(waveshaper).connect(offlineContext.destination)
    source.start()
    
    const renderedBuffer = await offlineContext.startRendering()
    fileData.processedBuffer = renderedBuffer
    fileData.peak = calculatePeak(renderedBuffer)
    fileData.rms = calculateRMS(renderedBuffer)
    
    if (fileData.processedBlobUrl) {
      URL.revokeObjectURL(fileData.processedBlobUrl)
    }
    
    const wavBlob = bufferToWave(renderedBuffer, 0, renderedBuffer.length)
    fileData.processedBlobUrl = URL.createObjectURL(wavBlob)
  }

  const applyDynamicCompression = async (fileData) => {
    const originalBuffer = fileData.processedBuffer || fileData.originalBuffer
    const offlineContext = new OfflineAudioContext(
      originalBuffer.numberOfChannels,
      originalBuffer.length,
      originalBuffer.sampleRate
    )
    const source = offlineContext.createBufferSource()
    source.buffer = originalBuffer
    
    const compressor = offlineContext.createDynamicsCompressor()
    compressor.threshold.value = CONSTANTS.COMPRESSOR_THRESHOLD
    compressor.knee.value = CONSTANTS.COMPRESSOR_KNEE
    compressor.ratio.value = CONSTANTS.COMPRESSOR_RATIO
    compressor.attack.value = CONSTANTS.COMPRESSOR_ATTACK
    compressor.release.value = CONSTANTS.COMPRESSOR_RELEASE
    
    source.connect(compressor).connect(offlineContext.destination)
    source.start()
    
    const renderedBuffer = await offlineContext.startRendering()
    fileData.processedBuffer = renderedBuffer
    fileData.peak = calculatePeak(renderedBuffer)
    fileData.rms = calculateRMS(renderedBuffer)
    
    if (fileData.processedBlobUrl) {
      URL.revokeObjectURL(fileData.processedBlobUrl)
    }
    
    const wavBlob = bufferToWave(renderedBuffer, 0, renderedBuffer.length)
    fileData.processedBlobUrl = URL.createObjectURL(wavBlob)
  }

  // Analyze a Blob (used for shared files from IndexedDB where we have a Blob, not a File)
  const analyzeBlob = async (blob, name) => {
    try {
      const arrayBuffer = await blob.arrayBuffer()
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      audioContext.close()

      return {
        id: generateId(),
        name: name,
        file: new File([blob], name, { type: blob.type }),
        originalBuffer: audioBuffer,
        processedBuffer: audioBuffer,
        peak: calculatePeak(audioBuffer),
        rms: calculateRMS(audioBuffer),
        originalPeak: calculatePeak(audioBuffer),
        originalRms: calculateRMS(audioBuffer),
        processedBlobUrl: null,
        originalBlobUrl: URL.createObjectURL(blob)
      }
    } catch (error) {
      console.error(`Error analyzing shared file ${name}:`, error)
      throw error
    }
  }

  // File Handling - ORIGINAL LOGIC
  const analyzeFile = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)
      audioContext.close() // Sofort schließen
      
      return {
        id: generateId(),
        name: file.name,
        file: file,
        originalBuffer: audioBuffer,
        processedBuffer: audioBuffer,
        peak: calculatePeak(audioBuffer),
        rms: calculateRMS(audioBuffer),
        originalPeak: calculatePeak(audioBuffer),
        originalRms: calculateRMS(audioBuffer),
        processedBlobUrl: null,
        originalBlobUrl: URL.createObjectURL(file)
      }
    } catch (error) {
      console.error(`Error analyzing ${file.name}:`, error)
      throw error
    }
  }

  const handleFilesInput = async (files) => {
    isProcessing.value = true
    setProgress('Upload', 0)
    const total = files.length
    let processed = 0
    let errors = 0

    for (const file of files) {
      if (!file.type.startsWith('audio/')) {
        setStatus(`${file.name} ist keine gültige Audiodatei`, 'warning')
        errors++
        continue
      }

      try {
        const fileData = await analyzeFile(file)
        audioFiles.value.push(fileData)
        processed++
        setProgress('Upload', (processed / total) * 100)
      } catch (error) {
        setStatus(`Fehler bei ${file.name}`, 'error')
        errors++
      }
    }

    isProcessing.value = false
    if (processed > 0) {
      setStatus(`${processed} Datei(en) erfolgreich hochgeladen`, 'success')
    } else if (errors > 0) {
      setStatus('Keine gültigen Audio-Dateien gefunden', 'error')
    }
  }

  /**
   * Import shared files from IndexedDB (sent by Audio Konverter).
   * @param {{ name: string, blob: Blob, mimeType: string }[]} sharedRecords
   */
  const handleSharedFiles = async (sharedRecords) => {
    isProcessing.value = true
    setProgress('Import', 0)
    const total = sharedRecords.length
    let processed = 0
    let errors = 0

    for (const record of sharedRecords) {
      try {
        const blob = record.blob instanceof Blob
          ? record.blob
          : new Blob([record.blob], { type: record.mimeType || 'audio/wav' })

        if (blob.size === 0) {
          console.warn(`[AudioNormalizer] Shared file "${record.name}" has empty blob, skipping`)
          errors++
          continue
        }

        const fileData = await analyzeBlob(blob, record.name)
        audioFiles.value.push(fileData)
        processed++
        setProgress('Import', (processed / total) * 100)
      } catch (error) {
        console.error(`[AudioNormalizer] Failed to import shared file "${record.name}":`, error)
        errors++
      }
    }

    isProcessing.value = false
    if (processed > 0) {
      setStatus(`${processed} Datei(en) importiert`, 'success')
    }
    return { processed, errors }
  }

  // Global Operations - ORIGINAL LOGIC
  const applyGlobalRms = async () => {
    if (audioFiles.value.length === 0) return

    isProcessing.value = true
    setProgress('RMS Skalierung', 0)
    const total = audioFiles.value.length

    for (let i = 0; i < total; i++) {
      try {
        await scaleAudioBuffer(audioFiles.value[i], globalRmsValue.value)
      } catch (error) {
        console.error(`Error scaling ${audioFiles.value[i].name}:`, error)
      }
      setProgress('RMS Skalierung', ((i + 1) / total) * 100)
    }

    isProcessing.value = false
    setStatus('RMS Skalierung abgeschlossen', 'success')
  }

  const applyGlobalDb = async () => {
    if (audioFiles.value.length === 0) return

    isProcessing.value = true
    const targetRms = dbToRms(globalDbValue.value)
    setProgress('dB Skalierung', 0)
    const total = audioFiles.value.length

    for (let i = 0; i < total; i++) {
      try {
        await scaleAudioBuffer(audioFiles.value[i], targetRms)
      } catch (error) {
        console.error(`Error scaling ${audioFiles.value[i].name}:`, error)
      }
      setProgress('dB Skalierung', ((i + 1) / total) * 100)
    }

    isProcessing.value = false
    setStatus('dB Skalierung abgeschlossen', 'success')
  }

  const applyEBUR128 = async () => {
    if (audioFiles.value.length === 0) return

    isProcessing.value = true
    setProgress('EBU R128', 0)
    const total = audioFiles.value.length

    for (let i = 0; i < total; i++) {
      try {
        await normalizeToLoudnessR128(
          audioFiles.value[i],
          CONSTANTS.EBU_R128_TARGET_LUFS
        )
      } catch (error) {
        console.error(`Error normalizing ${audioFiles.value[i].name}:`, error)
      }
      setProgress('EBU R128', ((i + 1) / total) * 100)
    }

    isProcessing.value = false
    setStatus('EBU R128 Normalisierung abgeschlossen', 'success')
  }

  const analyzeAll = async () => {
    setStatus('Alle Dateien bereits analysiert', 'info')
  }

  const applyNoiseReductionAll = async () => {
    if (audioFiles.value.length === 0) return

    isProcessing.value = true
    setProgress('Rauschunterdrückung', 0)
    const total = audioFiles.value.length

    for (let i = 0; i < total; i++) {
      try {
        await applyNoiseReduction(audioFiles.value[i])
      } catch (error) {
        console.error(`Error reducing noise ${audioFiles.value[i].name}:`, error)
      }
      setProgress('Rauschunterdrückung', ((i + 1) / total) * 100)
    }

    isProcessing.value = false
    setStatus('Rauschunterdrückung abgeschlossen', 'success')
  }

  const reduceClippingAll = async () => {
    if (audioFiles.value.length === 0) return

    isProcessing.value = true
    setProgress('Clipping Reduktion', 0)
    const total = audioFiles.value.length

    for (let i = 0; i < total; i++) {
      try {
        await reduceClipping(audioFiles.value[i])
      } catch (error) {
        console.error(`Error reducing clipping ${audioFiles.value[i].name}:`, error)
      }
      setProgress('Clipping Reduktion', ((i + 1) / total) * 100)
    }

    isProcessing.value = false
    setStatus('Clipping Reduktion abgeschlossen', 'success')
  }

  const applyDynamicCompressionAll = async () => {
    if (audioFiles.value.length === 0) return

    isProcessing.value = true
    setProgress('Dynamikkompression', 0)
    const total = audioFiles.value.length

    for (let i = 0; i < total; i++) {
      try {
        await applyDynamicCompression(audioFiles.value[i])
      } catch (error) {
        console.error(`Error compressing ${audioFiles.value[i].name}:`, error)
      }
      setProgress('Dynamikkompression', ((i + 1) / total) * 100)
    }

    isProcessing.value = false
    setStatus('Dynamikkompression abgeschlossen', 'success')
  }

  const updateFile = async (updatedFile) => {
    const index = audioFiles.value.findIndex(f => f.id === updatedFile.id)
    if (index === -1) return

    isLoading.value = true
    try {
      await scaleAudioBuffer(audioFiles.value[index], updatedFile.targetRms)
      setStatus(`${updatedFile.name} aktualisiert`, 'success')
    } catch (error) {
      setStatus(`Fehler bei ${updatedFile.name}`, 'error')
    }
    isLoading.value = false
  }

  const removeFile = (file) => {
    const index = audioFiles.value.findIndex(f => f.id === file.id)
    if (index === -1) return

    if (file.processedBlobUrl) {
      URL.revokeObjectURL(file.processedBlobUrl)
    }
    if (file.originalBlobUrl) {
      URL.revokeObjectURL(file.originalBlobUrl)
    }

    audioFiles.value.splice(index, 1)
    setStatus(`${file.name} entfernt`, 'info')
  }

  // Helper function to get file blob for export (without downloading)
  const getFileBlob = async (file, onProgress = null) => {
    const exportBuffer = file.processedBuffer || file.originalBuffer
    if (!exportBuffer) throw new Error("No audio data to export")

    const baseName = "processed_" + file.name.replace(/\.[^/.]+$/, "")

    if (downloadFormat.value === 'mp3') {
      const left = exportBuffer.getChannelData(0)
      const right = (exportBuffer.numberOfChannels > 1) ?
        exportBuffer.getChannelData(1) : left

      const mp3Blob = await new Promise((resolve, reject) => {
        const worker = new Worker(new URL('../workers/mp3Worker.js', import.meta.url), { type: 'module' })
        worker.onmessage = e => {
          if (e.data.progress !== undefined && onProgress) {
            onProgress(e.data.progress)
          }
          if (e.data.done) {
            const blob = new Blob([new Uint8Array(e.data.result)], {
              type: 'audio/mp3'
            })
            worker.terminate()
            resolve(blob)
          }
        }
        worker.onerror = err => reject(err)
        worker.postMessage({
          left: new Float32Array(left),
          right: new Float32Array(right),
          sampleRate: exportBuffer.sampleRate,
          kbps: CONSTANTS.MP3_KBPS,
          numChannels: exportBuffer.numberOfChannels
        })
      })

      return { blob: mp3Blob, filename: `${baseName}.mp3` }
    } else if (downloadFormat.value === 'webm') {
      const webmBlob = await audioBufferToWebM(exportBuffer, onProgress)
      return { blob: webmBlob, filename: `${baseName}.webm` }
    } else {
      const wavBlob = bufferToWave(exportBuffer, 0, exportBuffer.length)
      return { blob: wavBlob, filename: `${baseName}.wav` }
    }
  }

  const exportFile = async (file) => {
    try {
      isLoading.value = true
      const format = downloadFormat.value.toUpperCase()
      loadingMessage.value = `Exportiere ${file.name}...`

      const { blob, filename } = await getFileBlob(file, (progress) => {
        if (downloadFormat.value === 'mp3') {
          loadingMessage.value = `MP3-Konvertierung: ${progress}%`
        } else if (downloadFormat.value === 'webm') {
          loadingMessage.value = `WebM-Konvertierung: ${progress}%`
        }
      })

      triggerDownload(blob, filename)
      isLoading.value = false
      setStatus(`${file.name} heruntergeladen`, 'success')
    } catch (error) {
      console.error(`Error exporting ${file.name}:`, error)
      setStatus(`Fehler beim Exportieren von ${file.name}`, 'error')
      isLoading.value = false
    }
  }

  const exportAll = async () => {
    if (audioFiles.value.length === 0) return

    isProcessing.value = true
    isLoading.value = true
    loadingMessage.value = 'ZIP wird erstellt...'
    setProgress('Export', 0)

    const zip = new JSZip()
    const total = audioFiles.value.length
    const format = downloadFormat.value

    try {
      for (let i = 0; i < total; i++) {
        const file = audioFiles.value[i]
        loadingMessage.value = `Verarbeite ${file.name} (${i + 1}/${total})...`

        const { blob, filename } = await getFileBlob(file, (encodeProgress) => {
          const baseProgress = (i / total) * 100
          const fileProgress = (encodeProgress / 100) * (100 / total)
          setProgress('Export', baseProgress + fileProgress)
          if (format === 'mp3') {
            loadingMessage.value = `MP3-Konvertierung ${file.name}: ${encodeProgress}%`
          } else if (format === 'webm') {
            loadingMessage.value = `WebM-Konvertierung ${file.name}: ${encodeProgress}%`
          }
        })

        zip.file(filename, blob)
        setProgress('Export', ((i + 1) / total) * 100)
      }

      loadingMessage.value = 'ZIP wird finalisiert...'
      const zipBlob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      }, (metadata) => {
        loadingMessage.value = `ZIP wird erstellt: ${Math.round(metadata.percent)}%`
      })

      const timestamp = new Date().toISOString().slice(0, 10)
      triggerDownload(zipBlob, `audio-normalized-${timestamp}.zip`)

      isLoading.value = false
      isProcessing.value = false
      setStatus(`${total} Datei(en) als ZIP heruntergeladen`, 'success')
    } catch (error) {
      console.error('Error creating ZIP:', error)
      setStatus('Fehler beim Erstellen der ZIP-Datei', 'error')
      isLoading.value = false
      isProcessing.value = false
    }
  }

  const deleteAll = () => {
    audioFiles.value.forEach(file => {
      if (file.processedBlobUrl) URL.revokeObjectURL(file.processedBlobUrl)
      if (file.originalBlobUrl) URL.revokeObjectURL(file.originalBlobUrl)
    })
    audioFiles.value = []
    setStatus('Alle Dateien gelöscht', 'info')
  }

  const resetAll = () => {
    audioFiles.value.forEach(file => {
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
    resetAll
  }
}
