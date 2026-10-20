import { describe, it, expect } from 'vitest'
import {
  buildLoudnessReport,
  loudnessReportToCsv,
  loudnessReportToJson,
} from '../src/utils/loudnessReport'
import type { AudioFileData } from '../src/types'

const file = (over: Partial<AudioFileData>): AudioFileData =>
  ({
    name: 'a.wav',
    duration: 12.3456,
    peak: 0.5,
    rms: 0.1,
    processed: false,
    ...over,
  }) as AudioFileData

describe('Loudness-Report', () => {
  it('rechnet in dB um und bildet die PLR aus True Peak und LUFS', () => {
    const [row] = buildLoudnessReport([
      file({ lufs: -14.04, truePeak: Math.pow(10, -1 / 20), lra: 6.26, processed: true }),
    ])
    expect(row).toEqual({
      file: 'a.wav',
      durationSec: 12.35,
      integratedLufs: -14,
      truePeakDbtp: -1,
      loudnessRangeLu: 6.3,
      samplePeakDbfs: -6,
      rmsDbfs: -20,
      plrLu: 13,
      processed: true,
    })
  })

  it('lässt Felder ohne Messung leer statt 0 oder -Infinity', () => {
    const [row] = buildLoudnessReport([file({ peak: 0, rms: 0 })])
    expect(row.integratedLufs).toBeNull()
    expect(row.plrLu).toBeNull()
    expect(row.samplePeakDbfs).toBeNull()
  })

  it('schreibt CSV nach RFC 4180 (Kopfzeile, Quoting, leere Zellen)', () => {
    const csv = loudnessReportToCsv(buildLoudnessReport([file({ name: 'Mix, "final".wav' })]))
    const [header, line] = csv.split('\r\n')
    expect(header).toBe(
      'file,durationSec,integratedLufs,truePeakDbtp,loudnessRangeLu,samplePeakDbfs,rmsDbfs,plrLu,processed',
    )
    expect(line).toBe('"Mix, ""final"".wav",12.35,,,,-6,-20,,false')
  })

  it('schreibt JSON mit Zeitstempel und allen Zeilen', () => {
    const json = JSON.parse(loudnessReportToJson(buildLoudnessReport([file({}), file({})])))
    expect(json.files).toHaveLength(2)
    expect(typeof json.generatedAt).toBe('string')
  })
})
