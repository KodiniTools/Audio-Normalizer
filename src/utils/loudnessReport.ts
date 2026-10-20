import type { AudioFileData } from '../types'

/** One file's line in the loudness report. dB values are null when unmeasured or silent. */
export interface LoudnessReportRow {
  file: string
  durationSec: number
  integratedLufs: number | null
  truePeakDbtp: number | null
  loudnessRangeLu: number | null
  samplePeakDbfs: number | null
  rmsDbfs: number | null
  /** Peak-to-loudness ratio: true peak (dBTP) minus integrated loudness (LUFS). */
  plrLu: number | null
  processed: boolean
}

const round = (x: number, digits = 1): number => Number(x.toFixed(digits))

const toDb = (linear: number | undefined): number | null =>
  linear !== undefined && linear > 0 ? round(20 * Math.log10(linear)) : null

const orNull = (x: number | undefined): number | null =>
  x !== undefined && isFinite(x) ? round(x) : null

export const buildLoudnessReport = (files: readonly AudioFileData[]): LoudnessReportRow[] =>
  files.map((f) => {
    const truePeakDbtp = toDb(f.truePeak)
    const integratedLufs = orNull(f.lufs)
    return {
      file: f.name,
      durationSec: round(f.duration, 2),
      integratedLufs,
      truePeakDbtp,
      loudnessRangeLu: orNull(f.lra),
      samplePeakDbfs: toDb(f.peak),
      rmsDbfs: toDb(f.rms),
      plrLu:
        truePeakDbtp !== null && integratedLufs !== null
          ? round(truePeakDbtp - integratedLufs)
          : null,
      processed: f.processed,
    }
  })

const COLUMNS: (keyof LoudnessReportRow)[] = [
  'file',
  'durationSec',
  'integratedLufs',
  'truePeakDbtp',
  'loudnessRangeLu',
  'samplePeakDbfs',
  'rmsDbfs',
  'plrLu',
  'processed',
]

const csvCell = (value: LoudnessReportRow[keyof LoudnessReportRow]): string => {
  if (value === null) return ''
  const text = String(value)
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** RFC 4180 CSV with a header row; decimal point, comma separator. */
export const loudnessReportToCsv = (rows: readonly LoudnessReportRow[]): string =>
  [COLUMNS.join(','), ...rows.map((r) => COLUMNS.map((c) => csvCell(r[c])).join(','))].join(
    '\r\n',
  ) + '\r\n'

export const loudnessReportToJson = (rows: readonly LoudnessReportRow[]): string =>
  JSON.stringify({ generatedAt: new Date().toISOString(), files: rows }, null, 2) + '\n'
