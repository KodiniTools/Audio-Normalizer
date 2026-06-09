export interface Preset {
  id: string
  lufs: number
  truePeakDbtp: number
  color: string
}

export const PRESETS: Preset[] = [
  { id: 'spotify',   lufs: -14, truePeakDbtp: -1, color: '#1db954' },
  { id: 'youtube',   lufs: -14, truePeakDbtp: -1, color: '#ff0000' },
  { id: 'apple',     lufs: -16, truePeakDbtp: -1, color: '#fa243c' },
  { id: 'amazon',    lufs: -14, truePeakDbtp: -1, color: '#ff9900' },
  { id: 'tiktok',    lufs: -14, truePeakDbtp: -1, color: '#010101' },
  { id: 'podcast',   lufs: -16, truePeakDbtp: -1, color: '#9b59b6' },
  { id: 'audiobook', lufs: -19, truePeakDbtp: -3, color: '#e67e22' },
  { id: 'broadcast', lufs: -23, truePeakDbtp: -1, color: '#3498db' },
]
