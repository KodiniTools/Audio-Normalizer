import { ref } from 'vue'
import JSZip from 'jszip'

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

// Helper function to convert AudioBuffer to WebM using MediaRecorder
const audioBufferToWebM = async (audioBuffer, onProgress = null) => {
  return new Promise((resolve, reject) => {
    try {
      // Create an audio context (not connected to speakers)
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()

      // Suspend the context to prevent any audio output
      audioContext.suspend()

      // Create a MediaStreamDestination
      const dest = audioContext.createMediaStreamDestination()

      // Create a buffer source and connect ONLY to the MediaStreamDestination
      const source = audioContext.createBufferSource()
      source.buffer = audioBuffer
      source.connect(dest)
      // DO NOT connect to audioContext.destination - this prevents playback

      // Determine supported MIME type
      let mimeType = 'audio/webm;codecs=opus'
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm'
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/ogg;codecs=opus'
        }
      }

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(dest.stream, {
        mimeType: mimeType,
        audioBitsPerSecond: CONSTANTS.WEBM_KBPS * 1000
      })

      const chunks = []
      const duration = audioBuffer.duration * 1000 // in ms
      const startTime = Date.now()

      // Progress tracking
      let progressInterval = null
      if (onProgress) {
        progressInterval = setInterval(() => {
          const elapsed = Date.now() - startTime
          const progress = Math.min(Math.round((elapsed / duration) * 100), 99)
          onProgress(progress)
        }, 100)
      }

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        if (progressInterval) clearInterval(progressInterval)
        if (onProgress) onProgress(100)
        audioContext.close()
        const blob = new Blob(chunks, { type: mimeType })
        resolve(blob)
      }

      mediaRecorder.onerror = (e) => {
        if (progressInterval) clearInterval(progressInterval)
        audioContext.close()
        reject(e.error || new Error('MediaRecorder error'))
      }

      // Resume context and start recording
      audioContext.resume().then(() => {
        mediaRecorder.start()
        source.start(0)
      })

      // Stop when playback ends
      source.onended = () => {
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop()
          }
        }, 100) // Small delay to ensure all data is captured
      }
    } catch (error) {
      reject(error)
    }
  })
}

// MP3 Worker (singleton)
let mp3Worker = null
const createMP3Worker = () => {
  const mp3WorkerCode = `
    importScripts("https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.0/lame.min.js");

    function convertFloat32ToInt16(buffer) {
      const l = buffer.length;
      const buf = new Int16Array(l);
      for (let i = 0; i < l; i++) {
        let s = Math.max(-1, Math.min(1, buffer[i]));
        buf[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      return buf;
    }

    self.onmessage = function(e) {
      const { left, right, sampleRate, kbps, numChannels } = e.data;
      const mp3encoder = new lamejs.Mp3Encoder(numChannels, sampleRate, kbps);
      const blockSize = 1152;
      let mp3Data = [];
      let totalSamples = left.length;
      
      for (let i = 0; i < totalSamples; i += blockSize) {
        const leftChunk = left.subarray(i, i + blockSize);
        const rightChunk = numChannels > 1 ? right.subarray(i, i + blockSize) : leftChunk;
        const leftInt16 = convertFloat32ToInt16(leftChunk);
        const rightInt16 = convertFloat32ToInt16(rightChunk);
        const mp3buf = mp3encoder.encodeBuffer(leftInt16, rightInt16);
        if (mp3buf.length > 0) {
          mp3Data.push(new Int8Array(mp3buf));
        }
        let progress = Math.min(Math.round((i + blockSize) / totalSamples * 100), 100);
        self.postMessage({ progress });
      }
      
      const mp3buf = mp3encoder.flush();
      if (mp3buf.length > 0) {
        mp3Data.push(new Int8Array(mp3buf));
      }
      
      let totalLength = mp3Data.reduce((sum, arr) => sum + arr.length, 0);
      let result = new Uint8Array(totalLength);
      let offset = 0;
      for (let arr of mp3Data) {
        result.set(arr, offset);
        offset += arr.length;
      }
      self.postMessage({ result: result.buffer, done: true }, [result.buffer]);
    };
  `
  const blob = new Blob([mp3WorkerCode], { type: "application/javascript" })
  return URL.createObjectURL(blob)
}

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

      if (!mp3Worker) {
        mp3Worker = createMP3Worker()
      }

      const mp3Blob = await new Promise((resolve, reject) => {
        const worker = new Worker(mp3Worker)
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
