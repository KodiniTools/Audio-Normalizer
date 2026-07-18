import JSZip from 'jszip'
import { Muxer, ArrayBufferTarget } from 'webm-muxer'
import { CONSTANTS, bufferToWave, triggerDownload } from '../utils/audioUtils'
import type { AudioFileData, ExportResult, Mp3WorkerOutput, StatusType } from '../types'

type ProgressCallback = ((pct: number) => void) | null

const audioBufferToWebMFast = async (
  audioBuffer: AudioBuffer,
  onProgress: ProgressCallback = null,
): Promise<Blob> => {
  const { numberOfChannels, sampleRate, length: totalFrames } = audioBuffer

  const target = new ArrayBufferTarget()
  const muxer = new Muxer({
    target,
    type: 'webm',
    audio: { codec: 'A_OPUS', numberOfChannels, sampleRate },
  })

  const encoder = new AudioEncoder({
    output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
    error: (e) => {
      throw e
    },
  })
  encoder.configure({
    codec: 'opus',
    numberOfChannels,
    sampleRate,
    bitrate: CONSTANTS.WEBM_KBPS * 1000,
  })

  const chunkSize = 960 * Math.max(1, Math.round(sampleRate / 48000))
  let processedFrames = 0

  for (let offset = 0; offset < totalFrames; offset += chunkSize) {
    const framesInChunk = Math.min(chunkSize, totalFrames - offset)
    const planarData = new Float32Array(framesInChunk * numberOfChannels)
    for (let ch = 0; ch < numberOfChannels; ch++) {
      planarData.set(
        audioBuffer.getChannelData(ch).subarray(offset, offset + framesInChunk),
        ch * framesInChunk,
      )
    }

    const audioData = new AudioData({
      format: 'f32-planar',
      sampleRate,
      numberOfFrames: framesInChunk,
      numberOfChannels,
      timestamp: Math.round((offset / sampleRate) * 1_000_000),
      data: planarData,
    })
    encoder.encode(audioData)
    audioData.close()

    processedFrames += framesInChunk
    if (onProgress) onProgress(Math.min(Math.round((processedFrames / totalFrames) * 100), 99))
  }

  await encoder.flush()
  encoder.close()
  muxer.finalize()

  if (onProgress) onProgress(100)
  return new Blob([target.buffer], { type: 'audio/webm' })
}

const audioBufferToWebMFallback = (
  audioBuffer: AudioBuffer,
  onProgress: ProgressCallback = null,
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      const audioContext = new AudioContext()
      audioContext.suspend()

      const dest = audioContext.createMediaStreamDestination()
      const source = audioContext.createBufferSource()
      source.buffer = audioBuffer
      source.connect(dest)

      let mimeType = 'audio/webm;codecs=opus'
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : 'audio/ogg;codecs=opus'
      }

      const mediaRecorder = new MediaRecorder(dest.stream, {
        mimeType,
        audioBitsPerSecond: CONSTANTS.WEBM_KBPS * 1000,
      })

      const chunks: Blob[] = []
      const duration = audioBuffer.duration * 1000
      const startTime = Date.now()

      let progressInterval: ReturnType<typeof setInterval> | null = null
      if (onProgress) {
        progressInterval = setInterval(() => {
          onProgress!(Math.min(Math.round(((Date.now() - startTime) / duration) * 100), 99))
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
        reject((e as Event & { error?: Error }).error || new Error('MediaRecorder error'))
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

const audioBufferToWebM = (
  audioBuffer: AudioBuffer,
  onProgress: ProgressCallback = null,
): Promise<Blob> => {
  if (typeof AudioEncoder !== 'undefined') return audioBufferToWebMFast(audioBuffer, onProgress)
  return audioBufferToWebMFallback(audioBuffer, onProgress)
}

const getFileBlob = async (
  file: AudioFileData,
  format: string,
  onProgress: ProgressCallback = null,
): Promise<ExportResult> => {
  const exportBuffer = file.processedBuffer || file.originalBuffer
  if (!exportBuffer) throw new Error('No audio data to export')

  const baseName = file.name.replace(/\.[^/.]+$/, '')

  if (format === 'mp3') {
    const left = exportBuffer.getChannelData(0)
    const right = exportBuffer.numberOfChannels > 1 ? exportBuffer.getChannelData(1) : left

    const mp3Blob = await new Promise<Blob>((resolve, reject) => {
      const worker = new Worker(new URL('../workers/mp3Worker.js', import.meta.url))
      worker.onmessage = (e: MessageEvent<Mp3WorkerOutput>) => {
        if (e.data.progress !== undefined && onProgress) onProgress(e.data.progress)
        if (e.data.done && e.data.result) {
          worker.terminate()
          resolve(new Blob([new Uint8Array(e.data.result)], { type: 'audio/mp3' }))
        }
      }
      worker.onerror = (err) => reject(err)
      const leftBuf = new Float32Array(left)
      const rightBuf = new Float32Array(right)
      worker.postMessage(
        {
          baseUrl: import.meta.env.BASE_URL,
          left: leftBuf,
          right: rightBuf,
          sampleRate: exportBuffer.sampleRate,
          kbps: CONSTANTS.MP3_KBPS,
          numChannels: exportBuffer.numberOfChannels,
        },
        [leftBuf.buffer, rightBuf.buffer],
      )
    })
    return { blob: mp3Blob, filename: `${baseName}.mp3` }
  }

  if (format === 'webm') {
    const webmBlob = await audioBufferToWebM(exportBuffer, onProgress)
    return { blob: webmBlob, filename: `${baseName}.webm` }
  }

  return { blob: bufferToWave(exportBuffer, 0, exportBuffer.length), filename: `${baseName}.wav` }
}

type SetStatus = (message: string, type?: StatusType) => void

export const exportFile = async (
  file: AudioFileData,
  format: string,
  setLoadingMessage: (msg: string) => void,
  setStatus: SetStatus,
  onProgress?: (pct: number) => void,
): Promise<void> => {
  try {
    const { blob, filename } = await getFileBlob(file, format, (pct) => {
      onProgress?.(pct)
      if (format === 'mp3') setLoadingMessage(`MP3-Konvertierung: ${pct}%`)
      else if (format === 'webm') setLoadingMessage(`WebM-Konvertierung: ${pct}%`)
    })
    triggerDownload(blob, filename)
    setStatus(`${file.name} heruntergeladen`, 'success')
  } catch (error) {
    console.error(`Error exporting ${file.name}:`, error)
    setStatus(`Fehler beim Exportieren von ${file.name}`, 'error')
  }
}

export const exportAll = async (
  audioFiles: AudioFileData[],
  format: string,
  setProgress: (label: string, value: number) => void,
  setLoadingMessage: (msg: string) => void,
  setStatus: SetStatus,
): Promise<void> => {
  const zip = new JSZip()
  const total = audioFiles.length

  setProgress('Export', 0)

  try {
    for (let i = 0; i < total; i++) {
      const file = audioFiles[i]
      setLoadingMessage(`Verarbeite ${file.name} (${i + 1}/${total})...`)

      const { blob, filename } = await getFileBlob(file, format, (pct) => {
        setProgress('Export', (i / total) * 100 + (pct / 100) * (100 / total))
        if (format === 'mp3') setLoadingMessage(`MP3-Konvertierung ${file.name}: ${pct}%`)
        else if (format === 'webm') setLoadingMessage(`WebM-Konvertierung ${file.name}: ${pct}%`)
      })

      zip.file(filename, blob)
      setProgress('Export', ((i + 1) / total) * 100)
    }

    setLoadingMessage('ZIP wird finalisiert...')
    const zipBlob = await zip.generateAsync(
      { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
      (meta) => {
        setProgress('ZIP', meta.percent)
        setLoadingMessage(`ZIP wird erstellt: ${Math.round(meta.percent)}%`)
      },
    )

    triggerDownload(zipBlob, `audio-normalized-${new Date().toISOString().slice(0, 10)}.zip`)
    setStatus(`${total} Datei(en) als ZIP heruntergeladen`, 'success')
  } catch (error) {
    console.error('Error creating ZIP:', error)
    setStatus('Fehler beim Erstellen der ZIP-Datei', 'error')
  }
}
