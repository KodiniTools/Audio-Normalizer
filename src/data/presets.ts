export interface Preset {
  id: string
  lufs: number
  truePeakDbtp: number
}

export const PRESETS: Preset[] = [
  { id: 'spotify', lufs: -14, truePeakDbtp: -1 },
  { id: 'youtube', lufs: -14, truePeakDbtp: -1 },
  { id: 'apple', lufs: -16, truePeakDbtp: -1 },
  { id: 'amazon', lufs: -14, truePeakDbtp: -1 },
  { id: 'tiktok', lufs: -14, truePeakDbtp: -1 },
  { id: 'podcast', lufs: -16, truePeakDbtp: -1 },
  { id: 'audiobook', lufs: -19, truePeakDbtp: -3 },
  { id: 'broadcast', lufs: -23, truePeakDbtp: -1 },
]
