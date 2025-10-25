import { ref } from 'vue'

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

  const setStatus = (message) => {
    statusMessage.value = message
    setTimeout(() => {
      statusMessage.value = ''
    }, 3000)
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
    setProgress('Upload', 0)
    const total = files.length
    let processed = 0
    
    for (const file of files) {
      if (!file.type.startsWith('audio/')) {
        setStatus(`${file.name} ist keine gültige Audiodatei`)
        continue
      }
      
      try {
        const fileData = await analyzeFile(file)
        audioFiles.value.push(fileData)
        processed++
        setProgress('Upload', (processed / total) * 100)
      } catch (error) {
        setStatus(`Fehler bei ${file.name}`)
      }
    }
    
    setStatus(`${processed} Datei(en) erfolgreich hochgeladen`)
  }

  // Global Operations - ORIGINAL LOGIC
  const applyGlobalRms = async () => {
    if (audioFiles.value.length === 0) return
    
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
    
    setStatus('RMS Skalierung abgeschlossen')
  }

  const applyGlobalDb = async () => {
    if (audioFiles.value.length === 0) return
    
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
    
    setStatus('dB Skalierung abgeschlossen')
  }

  const applyEBUR128 = async () => {
    if (audioFiles.value.length === 0) return
    
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
    
    setStatus('EBU R128 Normalisierung abgeschlossen')
  }

  const analyzeAll = async () => {
    setStatus('Alle Dateien bereits analysiert')
  }

  const applyNoiseReductionAll = async () => {
    if (audioFiles.value.length === 0) return
    
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
    
    setStatus('Rauschunterdrückung abgeschlossen')
  }

  const reduceClippingAll = async () => {
    if (audioFiles.value.length === 0) return
    
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
    
    setStatus('Clipping Reduktion abgeschlossen')
  }

  const applyDynamicCompressionAll = async () => {
    if (audioFiles.value.length === 0) return
    
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
    
    setStatus('Dynamikkompression abgeschlossen')
  }

  const updateFile = async (updatedFile) => {
    const index = audioFiles.value.findIndex(f => f.id === updatedFile.id)
    if (index === -1) return
    
    isLoading.value = true
    try {
      await scaleAudioBuffer(audioFiles.value[index], updatedFile.targetRms)
      setStatus(`${updatedFile.name} aktualisiert`)
    } catch (error) {
      setStatus(`Fehler bei ${updatedFile.name}`)
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
    setStatus(`${file.name} entfernt`)
  }

  const exportFile = async (file) => {
    try {
      const exportBuffer = file.processedBuffer || file.originalBuffer
      if (!exportBuffer) throw new Error("No audio data to export")
      
      const baseName = "processed_" + file.name.replace(/\.[^/.]+$/, "")
      
      if (downloadFormat.value === 'mp3') {
        isLoading.value = true
        loadingMessage.value = `MP3-Konvertierung (${file.name})...`
        
        const left = exportBuffer.getChannelData(0)
        const right = (exportBuffer.numberOfChannels > 1) ? 
          exportBuffer.getChannelData(1) : left
        
        if (!mp3Worker) {
          mp3Worker = createMP3Worker()
        }
        
        await new Promise((resolve, reject) => {
          const worker = new Worker(mp3Worker)
          worker.onmessage = e => {
            if (e.data.progress !== undefined) {
              loadingMessage.value = `MP3-Konvertierung: ${e.data.progress}%`
            }
            if (e.data.done) {
              const mp3Blob = new Blob([new Uint8Array(e.data.result)], {
                type: 'audio/mp3'
              })
              triggerDownload(mp3Blob, `${baseName}.mp3`)
              worker.terminate()
              resolve()
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
        
        isLoading.value = false
      } else {
        const wavBlob = bufferToWave(exportBuffer, 0, exportBuffer.length)
        triggerDownload(wavBlob, `${baseName}.wav`)
      }
      
      setStatus(`${file.name} heruntergeladen`)
    } catch (error) {
      console.error(`Error exporting ${file.name}:`, error)
      setStatus(`Fehler beim Exportieren von ${file.name}`)
      isLoading.value = false
    }
  }

  const exportAll = async () => {
    if (audioFiles.value.length === 0) return
    
    setProgress('Export', 0)
    const total = audioFiles.value.length
    
    for (let i = 0; i < total; i++) {
      await exportFile(audioFiles.value[i])
      setProgress('Export', ((i + 1) / total) * 100)
    }
    
    setStatus('Alle Dateien heruntergeladen')
  }

  const deleteAll = () => {
    audioFiles.value.forEach(file => {
      if (file.processedBlobUrl) URL.revokeObjectURL(file.processedBlobUrl)
      if (file.originalBlobUrl) URL.revokeObjectURL(file.originalBlobUrl)
    })
    audioFiles.value = []
    setStatus('Alle Dateien gelöscht')
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
    setStatus('Alle Änderungen zurückgesetzt')
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
