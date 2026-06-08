import {
  CONSTANTS,
  calculateRMS,
  calculatePeak,
  normalizePeak,
  bufferToWave,
} from '../utils/audioUtils.js'

const applyOfflineEffect = async (inputBuffer, buildGraph) => {
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

const updateFileData = (fileData, renderedBuffer) => {
  fileData.processedBuffer = renderedBuffer
  fileData.peak = calculatePeak(renderedBuffer)
  fileData.rms = calculateRMS(renderedBuffer)
  if (fileData.processedBlobUrl) URL.revokeObjectURL(fileData.processedBlobUrl)
  fileData.processedBlobUrl = URL.createObjectURL(
    bufferToWave(renderedBuffer, 0, renderedBuffer.length),
  )
}

export const measureLoudnessR128 = async (buffer) => {
  const renderedBuffer = await applyOfflineEffect(buffer, (ctx, source) => {
    const highpass = ctx.createBiquadFilter()
    highpass.type = 'highpass'
    highpass.frequency.value = 38
    highpass.Q.value = 0.5

    const highshelf = ctx.createBiquadFilter()
    highshelf.type = 'highshelf'
    highshelf.frequency.value = 1500
    highshelf.gain.value = 4

    source.connect(highpass).connect(highshelf).connect(ctx.destination)
  })
  const integratedRms = calculateRMS(renderedBuffer)
  const lufs = 20 * Math.log10(integratedRms) + 16.8
  return isFinite(lufs) ? lufs : -70.0
}

export const scaleAudioBuffer = async (fileData, targetRms) => {
  const originalBuffer = fileData.originalBuffer
  if (!originalBuffer) throw new Error('Original buffer not found')

  const currentRms = calculateRMS(originalBuffer)
  const gain = targetRms / (currentRms || 1)

  const renderedBuffer = await applyOfflineEffect(originalBuffer, (ctx, source) => {
    const gainNode = ctx.createGain()
    gainNode.gain.value = gain
    source.connect(gainNode).connect(ctx.destination)
  })

  normalizePeak(renderedBuffer)
  updateFileData(fileData, renderedBuffer)
}

export const normalizeToLoudnessR128 = async (
  fileData,
  targetLufs = CONSTANTS.EBU_R128_TARGET_LUFS,
) => {
  const originalBuffer = fileData.originalBuffer
  if (!originalBuffer) throw new Error('Original buffer not found')

  const currentLufs = await measureLoudnessR128(originalBuffer)
  const gainValue = Math.pow(10, (targetLufs - currentLufs) / 20)

  const renderedBuffer = await applyOfflineEffect(originalBuffer, (ctx, source) => {
    const gainNode = ctx.createGain()
    gainNode.gain.value = gainValue
    source.connect(gainNode).connect(ctx.destination)
  })

  normalizePeak(renderedBuffer)
  updateFileData(fileData, renderedBuffer)
}

export const applyNoiseReduction = async (fileData) => {
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

export const reduceClipping = async (fileData) => {
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

export const applyDynamicCompression = async (fileData) => {
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
