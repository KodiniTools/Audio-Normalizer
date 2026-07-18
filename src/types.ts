export interface AudioFileData {
  id: string
  name: string
  file: File
  originalBuffer: AudioBuffer
  processedBuffer: AudioBuffer
  peak: number
  rms: number
  originalPeak: number
  originalRms: number
  processedBlobUrl: string | null
  originalBlobUrl: string
  targetRms?: number
  /** Duration in seconds (from the decoded buffer) — used for playlist display. */
  duration: number
  /** Whether the row is selected in the interactive playlist (edit target). */
  selected: boolean
  /** Whether any edit/normalisation has been applied — export considers only these. */
  processed: boolean
}

export type PlaybackMode = 'original' | 'processed'

export interface SharedFileRecord {
  id?: number
  name: string
  blob: Blob | ArrayBuffer
  mimeType?: string
  source?: string
  sharedAt?: number
}

export interface ExportResult {
  blob: Blob
  filename: string
}

export type StatusType = 'success' | 'error' | 'warning' | 'info'

export interface StatusBanner {
  type: StatusType
  message: string
}

export interface BatchResult {
  processed: number
  errors: number
}

export interface Mp3WorkerInput {
  baseUrl: string
  left: Float32Array
  right: Float32Array
  sampleRate: number
  kbps: number
  numChannels: number
}

export interface Mp3WorkerOutput {
  progress?: number
  result?: ArrayBuffer
  done?: boolean
}
