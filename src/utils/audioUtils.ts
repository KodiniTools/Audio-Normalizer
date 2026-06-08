export const CONSTANTS = {
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
