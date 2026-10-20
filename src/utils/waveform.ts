// Shared by the DSP worker (processed takes) and the main thread (fallback).

// Waveform overview: the maximum absolute sample over all channels in each of
// `buckets` equal slices of the file. Small enough to keep per take and draw.
export const WAVEFORM_BUCKETS = 400

export const computeEnvelope = (
  channels: Float32Array[],
  buckets: number = WAVEFORM_BUCKETS,
): Float32Array => {
  const env = new Float32Array(buckets)
  const len = channels[0]?.length ?? 0
  if (len === 0) return env
  for (let b = 0; b < buckets; b++) {
    const from = Math.floor((b * len) / buckets)
    const to = Math.max(from + 1, Math.floor(((b + 1) * len) / buckets))
    let max = 0
    for (const ch of channels) {
      for (let i = from; i < to && i < len; i++) {
        const a = Math.abs(ch[i])
        if (a > max) max = a
      }
    }
    env[b] = max
  }
  return env
}
