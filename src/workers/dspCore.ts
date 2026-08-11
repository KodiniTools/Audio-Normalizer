// ─────────────────────────────────────────────────────────────────────────────
// Pure typed-array DSP core — no Web Audio, no DOM. Safe to run inside a Worker.
//
// The Web Audio graphs used before (OfflineAudioContext + BiquadFilterNode +
// GainNode + WaveShaperNode + DynamicsCompressorNode) are reproduced here as
// plain math so the work can run off the main thread and in parallel.
//
// Biquad coefficients follow the exact Web Audio API formulas so the K-weighting
// used for loudness measurement matches the previous Web Audio results. For the
// high-pass the `Q` value is interpreted in dB, exactly as the Web Audio spec
// does:  Q_lin = 10^(Q/20),
//   alpha = (sin w0 / 2) · √((4 − √(16 − 16/Q_lin²)) / 2)
// Noise reduction is now spectral subtraction (STFT), further down in the file.
// ─────────────────────────────────────────────────────────────────────────────

import type { DspOp, DspParams } from '../types'

export interface DspOutput {
  peak: number
  rms: number
  lufs?: number
}

interface Biquad {
  b0: number
  b1: number
  b2: number
  a1: number
  a2: number
}

const normalize = (
  b0: number,
  b1: number,
  b2: number,
  a0: number,
  a1: number,
  a2: number,
): Biquad => ({ b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 })

// Web Audio alpha for lowpass/highpass (Q in dB).
const alphaLpHp = (sinw0: number, qDb: number): number => {
  const qLin = Math.pow(10, qDb / 20)
  return (sinw0 / 2) * Math.sqrt((4 - Math.sqrt(16 - 16 / (qLin * qLin))) / 2)
}

const makeHighpass = (f0: number, fs: number, qDb: number): Biquad => {
  const w0 = (2 * Math.PI * f0) / fs
  const cos = Math.cos(w0)
  const alpha = alphaLpHp(Math.sin(w0), qDb)
  return normalize((1 + cos) / 2, -(1 + cos), (1 + cos) / 2, 1 + alpha, -2 * cos, 1 - alpha)
}

// Web Audio high-shelf (shelf slope S = 1 → alpha = sin(w0)/√2).
const makeHighshelf = (f0: number, fs: number, gainDb: number): Biquad => {
  const A = Math.pow(10, gainDb / 40)
  const w0 = (2 * Math.PI * f0) / fs
  const cos = Math.cos(w0)
  const alpha = (Math.sin(w0) / 2) * Math.SQRT2
  const twoSqrtAAlpha = 2 * Math.sqrt(A) * alpha
  return normalize(
    A * (A + 1 + (A - 1) * cos + twoSqrtAAlpha),
    -2 * A * (A - 1 + (A + 1) * cos),
    A * (A + 1 + (A - 1) * cos - twoSqrtAAlpha),
    A + 1 - (A - 1) * cos + twoSqrtAAlpha,
    2 * (A - 1 - (A + 1) * cos),
    A + 1 - (A - 1) * cos - twoSqrtAAlpha,
  )
}

// Direct Form I biquad, applied in place.
const applyBiquad = (x: Float32Array, c: Biquad): void => {
  let x1 = 0
  let x2 = 0
  let y1 = 0
  let y2 = 0
  for (let n = 0; n < x.length; n++) {
    const xn = x[n]
    const yn = c.b0 * xn + c.b1 * x1 + c.b2 * x2 - c.a1 * y1 - c.a2 * y2
    x2 = x1
    x1 = xn
    y2 = y1
    y1 = yn
    x[n] = yn
  }
}

// ── Metering ─────────────────────────────────────────────────────────────────

export const calcPeak = (channels: Float32Array[]): number => {
  let peak = 0
  for (const ch of channels) {
    for (let i = 0; i < ch.length; i++) {
      const a = Math.abs(ch[i])
      if (a > peak) peak = a
    }
  }
  return peak
}

export const calcRMS = (channels: Float32Array[]): number => {
  let sum = 0
  let count = 0
  for (const ch of channels) {
    for (let i = 0; i < ch.length; i++) sum += ch[i] * ch[i]
    count += ch.length
  }
  return count === 0 ? 0 : Math.sqrt(sum / count)
}

// Windowed RMS: loudest 50 % of 400 ms blocks (75 % overlap). Matches
// calculateWindowedRMS in audioUtils so RMS scaling aims at the same level.
const calcWindowedRMS = (channels: Float32Array[], fs: number): number => {
  const numChannels = channels.length
  const totalSamples = channels[0]?.length ?? 0
  const blockSize = Math.round(0.4 * fs)
  const hopSize = Math.round(0.1 * fs)

  const blockMs: number[] = []
  for (let start = 0; start + blockSize <= totalSamples; start += hopSize) {
    let sum = 0
    for (const ch of channels) {
      let chSum = 0
      for (let i = start; i < start + blockSize; i++) chSum += ch[i] * ch[i]
      sum += chSum / blockSize
    }
    blockMs.push(sum / numChannels)
  }

  if (blockMs.length === 0) return calcRMS(channels)

  blockMs.sort((a, b) => b - a)
  const keep = Math.max(1, Math.ceil(blockMs.length / 2))
  let meanMs = 0
  for (let i = 0; i < keep; i++) meanMs += blockMs[i]
  return Math.sqrt(meanMs / keep)
}

// ── ITU-R BS.1770-4 gated loudness (K-weighting via the biquads above) ───────

export const measureLoudnessR128 = (channels: Float32Array[], fs: number): number => {
  // Work on K-weighted copies so the source is untouched.
  const highshelf = makeHighshelf(1500, fs, 4)
  const highpass = makeHighpass(80, fs, Math.SQRT1_2)
  const filtered = channels.map((ch) => {
    const copy = new Float32Array(ch)
    applyBiquad(copy, highshelf)
    applyBiquad(copy, highpass)
    return copy
  })

  const totalSamples = filtered[0]?.length ?? 0
  const blockSize = Math.round(0.4 * fs)
  const hopSize = Math.round(0.1 * fs)

  const blockMs: number[] = []
  for (let start = 0; start + blockSize <= totalSamples; start += hopSize) {
    let sum = 0
    for (const ch of filtered) {
      let chSum = 0
      for (let i = start; i < start + blockSize; i++) chSum += ch[i] * ch[i]
      sum += chSum / blockSize
    }
    blockMs.push(sum)
  }

  if (blockMs.length === 0) return -70.0

  const absThreshold = Math.pow(10, (-70 + 0.691) / 10)
  const afterAbs = blockMs.filter((ms) => ms > absThreshold)
  if (afterAbs.length === 0) return -70.0

  const ungatedMs = afterAbs.reduce((a, b) => a + b, 0) / afterAbs.length
  const ungatedLufs = -0.691 + 10 * Math.log10(ungatedMs)

  const relThreshold = Math.pow(10, (ungatedLufs - 10 + 0.691) / 10)
  const afterRel = afterAbs.filter((ms) => ms > relThreshold)
  if (afterRel.length === 0) return -70.0

  const integratedMs = afterRel.reduce((a, b) => a + b, 0) / afterRel.length
  const lufs = -0.691 + 10 * Math.log10(integratedMs)
  return isFinite(lufs) ? lufs : -70.0
}

// ── True Peak via 4× polyphase FIR (replaces the 4× OfflineAudioContext render) ─
//
// A windowed-sinc prototype low-pass split into 4 polyphase branches reveals
// inter-sample peaks that appear between digital samples, at a fraction of the
// memory/CPU of rendering a quadruple-length buffer.

const TP_PHASES = 4
const TP_TAPS = 12
const tpPhase: Float32Array[] = (() => {
  const protoLen = TP_PHASES * TP_TAPS
  const proto = new Float32Array(protoLen)
  const center = (protoLen - 1) / 2
  for (let j = 0; j < protoLen; j++) {
    const m = j - center
    const x = (Math.PI * m) / TP_PHASES
    const sinc = m === 0 ? 1 : Math.sin(x) / x
    const win = 0.54 - 0.46 * Math.cos((2 * Math.PI * j) / (protoLen - 1)) // Hamming
    proto[j] = (sinc * win) / TP_PHASES
  }
  // Split into phases; normalise each phase to unity DC gain.
  const phases: Float32Array[] = []
  for (let p = 0; p < TP_PHASES; p++) {
    const taps = new Float32Array(TP_TAPS)
    let sum = 0
    for (let t = 0; t < TP_TAPS; t++) {
      taps[t] = proto[t * TP_PHASES + p]
      sum += taps[t]
    }
    if (sum !== 0) for (let t = 0; t < TP_TAPS; t++) taps[t] /= sum
    phases.push(taps)
  }
  return phases
})()

export const measureTruePeak = (channels: Float32Array[]): number => {
  let peak = 0
  for (const ch of channels) {
    const len = ch.length
    for (let i = 0; i < len; i++) {
      const s = Math.abs(ch[i])
      if (s > peak) peak = s // guarantees we never under-report the sample peak
      for (let p = 1; p < TP_PHASES; p++) {
        const taps = tpPhase[p]
        let acc = 0
        for (let t = 0; t < TP_TAPS; t++) {
          const idx = i - t
          if (idx < 0) break
          acc += taps[t] * ch[idx]
        }
        const a = Math.abs(acc)
        if (a > peak) peak = a
      }
    }
  }
  return peak
}

// ── Gain / limiting ──────────────────────────────────────────────────────────

const applyGain = (channels: Float32Array[], gain: number): void => {
  if (gain === 1) return
  for (const ch of channels) for (let i = 0; i < ch.length; i++) ch[i] *= gain
}

const limitTruePeak = (channels: Float32Array[], targetDbtp: number): void => {
  const ceiling = Math.pow(10, targetDbtp / 20)
  const tp = measureTruePeak(channels)
  if (tp <= ceiling) return
  applyGain(channels, ceiling / tp)
}

const finalize = (channels: Float32Array[]): DspOutput => ({
  peak: calcPeak(channels),
  rms: calcRMS(channels),
})

// ── Operations ───────────────────────────────────────────────────────────────

const rmsScale = (channels: Float32Array[], fs: number, params: DspParams): DspOutput => {
  const currentRms = calcWindowedRMS(channels, fs)
  if (currentRms < 1e-6) throw new Error('silent')
  const rawGain = (params.targetRms ?? 0.5) / currentRms
  const gain = Math.min(rawGain, params.maxRmsGain ?? 10)
  applyGain(channels, gain)
  limitTruePeak(channels, params.targetDbtp ?? -1)
  return finalize(channels)
}

const ebur128 = (channels: Float32Array[], fs: number, params: DspParams): DspOutput => {
  const currentLufs = measureLoudnessR128(channels, fs)
  const gain = Math.pow(10, ((params.targetLufs ?? -23) - currentLufs) / 20)
  applyGain(channels, gain)
  limitTruePeak(channels, params.targetDbtp ?? -1)
  return finalize(channels)
}

// ── FFT (radix-2, in-place) for the spectral noise reducer ───────────────────

interface Fft {
  forward(re: Float64Array, im: Float64Array): void
  inverse(re: Float64Array, im: Float64Array): void
}

const makeFft = (n: number): Fft => {
  const levels = Math.log2(n)
  const rev = new Uint32Array(n)
  for (let i = 0; i < n; i++) {
    let x = i
    let r = 0
    for (let j = 0; j < levels; j++) {
      r = (r << 1) | (x & 1)
      x >>= 1
    }
    rev[i] = r
  }
  const cosT = new Float64Array(n / 2)
  const sinT = new Float64Array(n / 2)
  for (let i = 0; i < n / 2; i++) {
    const a = (2 * Math.PI * i) / n
    cosT[i] = Math.cos(a)
    sinT[i] = Math.sin(a)
  }
  const transform = (re: Float64Array, im: Float64Array, inverse: boolean): void => {
    for (let i = 0; i < n; i++) {
      const j = rev[i]
      if (j > i) {
        let t = re[i]
        re[i] = re[j]
        re[j] = t
        t = im[i]
        im[i] = im[j]
        im[j] = t
      }
    }
    for (let size = 2; size <= n; size <<= 1) {
      const half = size >> 1
      const step = n / size
      for (let i = 0; i < n; i += size) {
        for (let j = i, k = 0; j < i + half; j++, k += step) {
          const wr = cosT[k]
          const wi = inverse ? sinT[k] : -sinT[k]
          const tr = re[j + half] * wr - im[j + half] * wi
          const ti = re[j + half] * wi + im[j + half] * wr
          re[j + half] = re[j] - tr
          im[j + half] = im[j] - ti
          re[j] += tr
          im[j] += ti
        }
      }
    }
    if (inverse) {
      for (let i = 0; i < n; i++) {
        re[i] /= n
        im[i] /= n
      }
    }
  }
  return {
    forward: (re, im) => transform(re, im, false),
    inverse: (re, im) => transform(re, im, true),
  }
}

const hannWindow = (n: number): Float64Array => {
  const w = new Float64Array(n)
  for (let i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1))
  return w
}

// Spectral-subtraction noise reduction — a genuine broadband denoiser that
// replaces the old fixed low-pass. The noise magnitude spectrum is estimated
// from the quietest frames of the file (assumed to be noise-only pauses), then
// subtracted from every frame in the STFT domain with an over-subtraction
// factor and a spectral floor. A per-frame gain mask, smoothed across frequency
// to suppress "musical noise", is reconstructed via weighted overlap-add, so a
// clean signal is returned essentially unchanged while stationary broadband
// noise is attenuated.
const NR_FFT_SIZE = 2048

const noiseReduction = (channels: Float32Array[], params: DspParams): DspOutput => {
  const N = NR_FFT_SIZE
  const H = N >> 2 // 75 % overlap
  const half = N >> 1
  const alpha = params.nrOverSubtraction ?? 2.0
  const floorGain = params.nrFloorGain ?? 0.1
  const quantile = params.nrNoiseQuantile ?? 0.2
  const smoothR = 2
  const eps = 1e-10

  const fft = makeFft(N)
  const win = hannWindow(N)
  const re = new Float64Array(N)
  const im = new Float64Array(N)
  const noiseProf = new Float64Array(half + 1)
  const gain = new Float64Array(half + 1)
  const gainS = new Float64Array(half + 1)

  const loadFrame = (ch: Float32Array, p: number, len: number): void => {
    for (let nn = 0; nn < N; nn++) {
      const idx = p + nn
      re[nn] = idx < len ? ch[idx] * win[nn] : 0
      im[nn] = 0
    }
  }

  for (const ch of channels) {
    const len = ch.length
    if (len < N) continue // too short to analyse — leave untouched

    const positions: number[] = []
    for (let p = 0; p < len; p += H) positions.push(p)
    const M = positions.length

    // Pass 0: windowed frame energy (time domain, no FFT) → noise-frame gate.
    const energies = new Float64Array(M)
    for (let m = 0; m < M; m++) {
      const p = positions[m]
      let e = 0
      for (let nn = 0; nn < N; nn++) {
        const idx = p + nn
        const s = idx < len ? ch[idx] * win[nn] : 0
        e += s * s
      }
      energies[m] = e
    }
    const energyThresh =
      Float64Array.from(energies).sort()[Math.min(M - 1, Math.floor(quantile * M))]

    // Pass 1: average magnitude spectrum over the quiet frames = noise profile.
    noiseProf.fill(0)
    let noiseCount = 0
    for (let m = 0; m < M; m++) {
      if (energies[m] > energyThresh) continue
      loadFrame(ch, positions[m], len)
      fft.forward(re, im)
      for (let k = 0; k <= half; k++) noiseProf[k] += Math.hypot(re[k], im[k])
      noiseCount++
    }
    if (noiseCount === 0) continue
    for (let k = 0; k <= half; k++) noiseProf[k] /= noiseCount

    // Pass 2: subtract noise per bin, reconstruct via weighted overlap-add.
    const out = new Float32Array(len)
    const norm = new Float32Array(len)
    for (let m = 0; m < M; m++) {
      const p = positions[m]
      loadFrame(ch, p, len)
      fft.forward(re, im)
      for (let k = 0; k <= half; k++) {
        const mag = Math.hypot(re[k], im[k])
        gain[k] = Math.max(floorGain, 1 - (alpha * noiseProf[k]) / (mag + eps))
      }
      // Smooth the gain across frequency to suppress musical noise.
      for (let k = 0; k <= half; k++) {
        let s = 0
        let c = 0
        for (let d = -smoothR; d <= smoothR; d++) {
          const kk = k + d
          if (kk >= 0 && kk <= half) {
            s += gain[kk]
            c++
          }
        }
        gainS[k] = s / c
      }
      for (let k = 0; k <= half; k++) {
        re[k] *= gainS[k]
        im[k] *= gainS[k]
      }
      for (let k = 1; k < half; k++) {
        const kk = N - k
        re[kk] *= gainS[k]
        im[kk] *= gainS[k]
      }
      fft.inverse(re, im)
      for (let nn = 0; nn < N; nn++) {
        const idx = p + nn
        if (idx >= len) break
        out[idx] += re[nn] * win[nn]
        norm[idx] += win[nn] * win[nn]
      }
    }
    for (let i = 0; i < len; i++) {
      if (norm[i] > 1e-6) ch[i] = out[i] / norm[i]
    }
  }
  return finalize(channels)
}

const reduceClipping = (channels: Float32Array[], params: DspParams): DspOutput => {
  // Soft-knee peak taming. Samples below the threshold pass through UNCHANGED;
  // only samples above it are smoothly rounded toward a 1.0 ceiling. Unlike a
  // full-range waveshaper this never boosts the level and never touches the body
  // of the signal — it just softens the hard edges that clipping produces. When
  // nothing exceeds the threshold the audio is returned bit-for-bit unchanged.
  const threshold = params.clipThreshold ?? 0.9
  const range = 1 - threshold
  for (const ch of channels) {
    for (let i = 0; i < ch.length; i++) {
      const x = ch[i]
      const a = Math.abs(x)
      if (a <= threshold) continue
      const over = (a - threshold) / range
      ch[i] = Math.sign(x) * (threshold + range * Math.tanh(over))
    }
  }
  return finalize(channels)
}

// Feed-forward, stereo-linked soft-knee compressor (independent implementation
// of the previous DynamicsCompressorNode; no automatic make-up gain, matching
// the Web Audio node's behaviour of only attenuating above the threshold).
const dynamicCompression = (channels: Float32Array[], fs: number, params: DspParams): DspOutput => {
  const threshold = params.threshold ?? -24
  const knee = params.knee ?? 30
  const ratio = params.ratio ?? 12
  const attack = params.attack ?? 0.003
  const release = params.release ?? 0.25
  const slope = 1 - 1 / ratio

  const attackCoef = Math.exp(-1 / (attack * fs))
  const releaseCoef = Math.exp(-1 / (release * fs))
  const halfKnee = knee / 2

  const len = channels[0]?.length ?? 0
  let envReductionDb = 0

  for (let n = 0; n < len; n++) {
    let detect = 0
    for (const ch of channels) {
      const a = Math.abs(ch[n])
      if (a > detect) detect = a
    }
    const levelDb = 20 * Math.log10(detect + 1e-12)
    const over = levelDb - threshold

    let targetReduction: number
    if (over <= -halfKnee) {
      targetReduction = 0
    } else if (over >= halfKnee) {
      targetReduction = over * slope
    } else {
      const x = over + halfKnee
      targetReduction = (slope * (x * x)) / (2 * knee)
    }

    // Envelope follower on the gain reduction (attack when increasing).
    if (targetReduction > envReductionDb) {
      envReductionDb = attackCoef * envReductionDb + (1 - attackCoef) * targetReduction
    } else {
      envReductionDb = releaseCoef * envReductionDb + (1 - releaseCoef) * targetReduction
    }

    const gain = Math.pow(10, -envReductionDb / 20)
    for (const ch of channels) ch[n] *= gain
  }
  return finalize(channels)
}

// Read-only measurement: sample peak, RMS and integrated loudness (LUFS).
// Leaves the channel data untouched — used by the "Analyze" action.
const analyze = (channels: Float32Array[], fs: number): DspOutput => ({
  peak: calcPeak(channels),
  rms: calcRMS(channels),
  lufs: measureLoudnessR128(channels, fs),
})

export const runOp = (
  op: DspOp,
  channels: Float32Array[],
  fs: number,
  params: DspParams,
): DspOutput => {
  switch (op) {
    case 'rmsScale':
      return rmsScale(channels, fs, params)
    case 'ebur128':
      return ebur128(channels, fs, params)
    case 'noiseReduction':
      return noiseReduction(channels, params)
    case 'reduceClipping':
      return reduceClipping(channels, params)
    case 'dynamicCompression':
      return dynamicCompression(channels, fs, params)
    case 'analyze':
      return analyze(channels, fs)
    default:
      throw new Error(`Unknown DSP op: ${op}`)
  }
}
