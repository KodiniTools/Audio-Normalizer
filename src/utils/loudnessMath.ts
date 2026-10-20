// BS.1770 gating math shared by the DSP worker and the album mode in the store.
// Works on block powers (mean square, summed over channels, K-weighted), so it is
// independent of sample rate and channel count.

export const powerToLufs = (ms: number): number => -0.691 + 10 * Math.log10(ms)
export const lufsToPower = (lufs: number): number => Math.pow(10, (lufs + 0.691) / 10)
export const meanOf = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length

/** Silence / no measurable blocks. */
export const LUFS_FLOOR = -70.0

/**
 * Integrated loudness of 400 ms block powers: absolute gate −70 LUFS, relative
 * gate −10 LU. Blocks of several tracks pooled together give the album loudness.
 */
export const gatedLoudness = (blockMs: number[]): number => {
  if (blockMs.length === 0) return LUFS_FLOOR

  const afterAbs = blockMs.filter((ms) => ms > lufsToPower(-70))
  if (afterAbs.length === 0) return LUFS_FLOOR

  const ungatedLufs = powerToLufs(meanOf(afterAbs))
  const afterRel = afterAbs.filter((ms) => ms > lufsToPower(ungatedLufs - 10))
  if (afterRel.length === 0) return LUFS_FLOOR

  const lufs = powerToLufs(meanOf(afterRel))
  return isFinite(lufs) ? lufs : LUFS_FLOOR
}

export interface AlbumTrack {
  /** 400 ms block powers of the track (see gatedLoudness). */
  blocks: number[]
  /** True peak of the track, linear. */
  truePeak: number
}

export interface AlbumGain {
  /** Album loudness before the gain, LUFS. */
  lufs: number
  /** Linear gain applied to every track. */
  gain: number
}

/**
 * One gain for all tracks: brings the pooled album loudness to `targetLufs`,
 * lowered if needed so the loudest true peak stays at or below `targetDbtp`.
 * Returns null when the album is silent.
 */
export const albumGain = (
  tracks: AlbumTrack[],
  targetLufs: number,
  targetDbtp: number,
): AlbumGain | null => {
  const lufs = gatedLoudness(tracks.flatMap((tr) => tr.blocks))
  if (lufs <= LUFS_FLOOR) return null
  let gain = Math.pow(10, (targetLufs - lufs) / 20)
  const maxTp = Math.max(0, ...tracks.map((tr) => tr.truePeak))
  const ceiling = Math.pow(10, targetDbtp / 20)
  if (maxTp * gain > ceiling) gain = ceiling / maxTp
  return { lufs, gain }
}
