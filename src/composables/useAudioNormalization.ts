import {
  CONSTANTS,
  calculateRMS,
  calculatePeak,
  bufferToWave,
} from '../utils/audioUtils'
import type { AudioFileData } from '../types'

type GraphBuilder = (ctx: OfflineAudioContext, source: AudioBufferSourceNode) => void

const applyOfflineEffect = (
  inputBuffer: AudioBuffer,
  buildGraph: GraphBuilder,
): Promise<AudioBuffer> => {
  const offlineCtx = new OfflineAudioContext(
    inputBuffer.numberOfChannels,
    inputBuffer.length,
    inputBuffer.sampleRate,
  )
  const source = offlineCtx.createBufferSource()
  source.buffer = inputBuffer
  buildGraph(offlineCtx, source)
  source.start()
  return offlineCtx.startRendering()
}

const updateFileData = (fileData: AudioFileData, renderedBuffer: AudioBuffer): void => {
  fileData.processedBuffer = renderedBuffer
  fileData.peak = calculatePeak(renderedBuffer)
  fileData.rms = calculateRMS(renderedBuffer)
  if (fileData.processedBlobUrl) URL.revokeObjectURL(fileData.processedBlobUrl)
  fileData.processedBlobUrl = URL.createObjectURL(
    bufferToWave(renderedBuffer, 0, renderedBuffer.length),
  )
}

// ITU-R BS.1770-4 K-weighting:
//   Stage 1: high-shelf pre-filter  (+4 dB @ 1.5 kHz)
//   Stage 2: 2nd-order Butterworth high-pass @ 80 Hz  (Q = 1/√2)
const applyKWeighting = (buffer: AudioBuffer): Promise<AudioBuffer> =>
  applyOfflineEffect(buffer, (ctx, source) => {
    const highshelf = ctx.createBiquadFilter()
    highshelf.type = 'highshelf'
    highshelf.frequency.value = 1500
    highshelf.gain.value = 4

    const highpass = ctx.createBiquadFilter()
    highpass.type = 'highpass'
    highpass.frequency.value = 80
    highpass.Q.value = Math.SQRT1_2

    source.connect(highshelf).connect(highpass).connect(ctx.destination)
  })

// True Peak via 4× oversampling (Web Audio sampleRate cap: 96 kHz).
// The resampler's anti-imaging filter reveals inter-sample peaks that lie
// between digital samples and would clip after D/A conversion.
const measureTruePeak = async (buffer: AudioBuffer): Promise<number> => {
  const targetRate = Math.min(buffer.sampleRate * 4, 96000)
  const scaledLength = Math.ceil(buffer.length * (targetRate / buffer.sampleRate))
  const offlineCtx = new OfflineAudioContext(buffer.numberOfChannels, scaledLength, targetRate)
  const source = offlineCtx.createBufferSource()
  source.buffer = buffer
  source.connect(offlineCtx.destination)
  source.start()
  const upsampled = await offlineCtx.startRendering()
  return calculatePeak(upsampled)
}

// Attenuate buffer so its True Peak does not exceed targetDbtp (−1 dBTP per EBU R128).
// Operates in-place on the Float32 channel data — no extra allocation needed.
const applyTruePeakLimit = async (
  buffer: AudioBuffer,
  targetDbtp = CONSTANTS.TRUE_PEAK_LIMIT_DBTP,
): Promise<void> => {
  const ceiling = Math.pow(10, targetDbtp / 20)
  const truePeak = await measureTruePeak(buffer)
  if (truePeak <= ceiling) return
  const gain = ceiling / truePeak
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const ch = buffer.getChannelData(c)
    for (let i = 0; i < ch.length; i++) ch[i] *= gain
  }
}

// ITU-R BS.1770-4 §2.2 gated loudness measurement.
//
// Algorithm:
//   1. K-weight the signal (two biquad filters above).
//   2. Partition into 400 ms blocks, 75 % overlap (100 ms hop).
//   3. Compute mean square per block, summed across channels
//      (equal weights G=1 for L/R per BS.1770 Table 1).
//   4. Absolute gate: discard blocks below −70 LUFS.
//   5. Ungated loudness from passing blocks.
//   6. Relative gate: discard blocks below (ungated − 10 LU).
//   7. Integrated loudness = −0.691 + 10·log₁₀(mean of gated block MSs).
export const measureLoudnessR128 = async (buffer: AudioBuffer): Promise<number> => {
  const filtered = await applyKWeighting(buffer)

  const { sampleRate, numberOfChannels, length: totalSamples } = filtered
  const blockSize = Math.round(0.4 * sampleRate)
  const hopSize = Math.round(0.1 * sampleRate)

  const channels: Float32Array[] = Array.from({ length: numberOfChannels }, (_, c) =>
    filtered.getChannelData(c),
  )

  // Mean square per block summed across channels (BS.1770 equal-weight stereo/mono)
  const blockMs: number[] = []
  for (let start = 0; start + blockSize <= totalSamples; start += hopSize) {
    let sum = 0
    for (const ch of channels) {
      let chSum = 0
      for (let i = start; i < start + blockSize; i++) chSum += ch[i] * ch[i]
      sum += chSum / blockSize
    }
    blockMs.push(sum)
  }

  if (blockMs.length === 0) return -70.0

  // Absolute gate threshold: −70 LUFS → ms = 10^((−70 + 0.691) / 10)
  const absThreshold = Math.pow(10, (-70 + 0.691) / 10)
  const afterAbs = blockMs.filter((ms) => ms > absThreshold)
  if (afterAbs.length === 0) return -70.0

  // Ungated loudness from absolute-gated blocks
  const ungatedMs = afterAbs.reduce((a, b) => a + b, 0) / afterAbs.length
  const ungatedLufs = -0.691 + 10 * Math.log10(ungatedMs)

  // Relative gate threshold: (ungated − 10 LU) → ms
  const relThreshold = Math.pow(10, (ungatedLufs - 10 + 0.691) / 10)
  const afterRel = afterAbs.filter((ms) => ms > relThreshold)
  if (afterRel.length === 0) return -70.0

  const integratedMs = afterRel.reduce((a, b) => a + b, 0) / afterRel.length
  const lufs = -0.691 + 10 * Math.log10(integratedMs)
  return isFinite(lufs) ? lufs : -70.0
}

export const scaleAudioBuffer = async (
  fileData: AudioFileData,
  targetRms: number,
): Promise<void> => {
  const originalBuffer = fileData.originalBuffer
  if (!originalBuffer) throw new Error('Original buffer not found')

  const currentRms = calculateRMS(originalBuffer)
  const gain = targetRms / (currentRms || 1)

  const renderedBuffer = await applyOfflineEffect(originalBuffer, (ctx, source) => {
    const gainNode = ctx.createGain()
    gainNode.gain.value = gain
    source.connect(gainNode).connect(ctx.destination)
  })

  await applyTruePeakLimit(renderedBuffer)
  updateFileData(fileData, renderedBuffer)
}

export const normalizeToLoudnessR128 = async (
  fileData: AudioFileData,
  targetLufs = CONSTANTS.EBU_R128_TARGET_LUFS,
): Promise<void> => {
  const originalBuffer = fileData.originalBuffer
  if (!originalBuffer) throw new Error('Original buffer not found')

  const currentLufs = await measureLoudnessR128(originalBuffer)
  const gainValue = Math.pow(10, (targetLufs - currentLufs) / 20)

  const renderedBuffer = await applyOfflineEffect(originalBuffer, (ctx, source) => {
    const gainNode = ctx.createGain()
    gainNode.gain.value = gainValue
    source.connect(gainNode).connect(ctx.destination)
  })

  await applyTruePeakLimit(renderedBuffer)
  updateFileData(fileData, renderedBuffer)
}

export const applyNoiseReduction = async (fileData: AudioFileData): Promise<void> => {
  const inputBuffer = fileData.processedBuffer || fileData.originalBuffer

  const renderedBuffer = await applyOfflineEffect(inputBuffer, (ctx, source) => {
    const lowpass = ctx.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.value = CONSTANTS.LOWPASS_FREQ
    lowpass.Q.value = CONSTANTS.LOWPASS_Q
    source.connect(lowpass).connect(ctx.destination)
  })

  updateFileData(fileData, renderedBuffer)
}

export const reduceClipping = async (fileData: AudioFileData): Promise<void> => {
  const inputBuffer = fileData.processedBuffer || fileData.originalBuffer

  const renderedBuffer = await applyOfflineEffect(inputBuffer, (ctx, source) => {
    const waveshaper = ctx.createWaveShaper()
    const curve = new Float32Array(256)
    for (let i = 0; i < 256; i++) {
      const x = (i - 128) / 128
      curve[i] = Math.tanh(x * 2)
    }
    waveshaper.curve = curve
    source.connect(waveshaper).connect(ctx.destination)
  })

  updateFileData(fileData, renderedBuffer)
}

export const applyDynamicCompression = async (fileData: AudioFileData): Promise<void> => {
  const inputBuffer = fileData.processedBuffer || fileData.originalBuffer

  const renderedBuffer = await applyOfflineEffect(inputBuffer, (ctx, source) => {
    const compressor = ctx.createDynamicsCompressor()
    compressor.threshold.value = CONSTANTS.COMPRESSOR_THRESHOLD
    compressor.knee.value = CONSTANTS.COMPRESSOR_KNEE
    compressor.ratio.value = CONSTANTS.COMPRESSOR_RATIO
    compressor.attack.value = CONSTANTS.COMPRESSOR_ATTACK
    compressor.release.value = CONSTANTS.COMPRESSOR_RELEASE
    source.connect(compressor).connect(ctx.destination)
  })

  updateFileData(fileData, renderedBuffer)
}
