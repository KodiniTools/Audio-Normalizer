export const CONSTANTS = {
  EBU_R128_TARGET_LUFS: -23,
  TRUE_PEAK_LIMIT_DBTP: -1,
  COMPRESSOR_THRESHOLD: -24,
  COMPRESSOR_KNEE: 30,
  COMPRESSOR_RATIO: 12,
  COMPRESSOR_ATTACK: 0.003,
  COMPRESSOR_RELEASE: 0.25,
  LOWPASS_FREQ: 8000,
  LOWPASS_Q: 1,
  MP3_KBPS: 320,
  WEBM_KBPS: 128,
} as const

export const generateId = (): string => '_' + Math.random().toString(36).substr(2, 9)

export const calculateRMS = (buffer: AudioBuffer): number => {
  let rmsSum = 0
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const channelData = buffer.getChannelData(channel)
    for (let i = 0; i < channelData.length; i++) {
      rmsSum += channelData[i] * channelData[i]
    }
  }
  return Math.sqrt(rmsSum / (buffer.length * buffer.numberOfChannels))
}

// Windowed RMS: splits the buffer into 400 ms blocks (75 % overlap), sorts them
// by loudness, and averages the loudest 50 %. This makes the measurement resistant
// to fade-ins, fade-outs, and silent gaps — the same problem that gating solves for
// EBU R128 — so RMS scaling aims at the musically active level, not the whole file.
export const calculateWindowedRMS = (buffer: AudioBuffer): number => {
  const { sampleRate, numberOfChannels, length: totalSamples } = buffer
  const blockSize = Math.round(0.4 * sampleRate)
  const hopSize = Math.round(0.1 * sampleRate)

  const channels: Float32Array[] = Array.from({ length: numberOfChannels }, (_, c) =>
    buffer.getChannelData(c),
  )

  const blockMs: number[] = []
  for (let start = 0; start + blockSize <= totalSamples; start += hopSize) {
    let sum = 0
    for (const ch of channels) {
      let chSum = 0
      for (let i = start; i < start + blockSize; i++) chSum += ch[i] * ch[i]
      sum += chSum / blockSize
    }
    blockMs.push(sum / numberOfChannels)
  }

  if (blockMs.length === 0) return calculateRMS(buffer)

  // Sort descending, keep loudest 50 % of blocks
  blockMs.sort((a, b) => b - a)
  const keep = Math.max(1, Math.ceil(blockMs.length / 2))
  const meanMs = blockMs.slice(0, keep).reduce((a, b) => a + b, 0) / keep
  return Math.sqrt(meanMs)
}

export const calculatePeak = (buffer: AudioBuffer): number => {
  let peak = 0
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const channelData = buffer.getChannelData(channel)
    for (let i = 0; i < channelData.length; i++) {
      peak = Math.max(peak, Math.abs(channelData[i]))
    }
  }
  return peak
}

export const dbToRms = (db: number): number => Math.pow(10, db / 20)

export const normalizePeak = (buffer: AudioBuffer): AudioBuffer => {
  const currentPeak = calculatePeak(buffer)
  if (currentPeak > 1.0) {
    const scaleFactor = 1.0 / currentPeak
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel)
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] *= scaleFactor
      }
    }
  }
  return buffer
}

export const bufferToWave = (abuffer: AudioBuffer, offset: number, len: number): Blob => {
  const numOfChan = abuffer.numberOfChannels
  const length = len * numOfChan * 2 + 44
  const buffer = new ArrayBuffer(length)
  const view = new DataView(buffer)
  const sampleRate = abuffer.sampleRate

  const writeString = (v: DataView, off: number, string: string) => {
    for (let i = 0; i < string.length; i++) v.setUint8(off + i, string.charCodeAt(i))
  }

  writeString(view, 0, 'RIFF')
  view.setUint32(4, 36 + len * numOfChan * 2, true)
  writeString(view, 8, 'WAVE')
  writeString(view, 12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numOfChan, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * numOfChan * 2, true)
  view.setUint16(32, numOfChan * 2, true)
  view.setUint16(34, 16, true)
  writeString(view, 36, 'data')
  view.setUint32(40, len * numOfChan * 2, true)

  let pos = 44
  for (let i = 0; i < len; i++) {
    for (let channel = 0; channel < numOfChan; channel++) {
      let sample = abuffer.getChannelData(channel)[offset + i]
      sample = Math.max(-1, Math.min(1, sample))
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7fff
      view.setInt16(pos, sample, true)
      pos += 2
    }
  }
  return new Blob([buffer], { type: 'audio/wav' })
}

export const triggerDownload = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.style.display = 'none'
  a.download = filename
  a.href = url
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

export const isAudioFile = (file: File): boolean =>
  file.type.startsWith('audio/') || /\.(mp3|wav|flac|ogg|m4a|aac|opus|wma)$/i.test(file.name)
