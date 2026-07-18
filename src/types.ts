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

// ── DSP worker pool messages ────────────────────────────────────────────────
export type DspOp =
  | 'rmsScale'
  | 'ebur128'
  | 'noiseReduction'
  | 'reduceClipping'
  | 'dynamicCompression'

export interface DspParams {
  targetRms?: number
  targetLufs?: number
  targetDbtp?: number
  maxRmsGain?: number
  lowpassFreq?: number
  lowpassQ?: number
  threshold?: number
  knee?: number
  ratio?: number
  attack?: number
  release?: number
}

export interface DspRequest {
  jobId: number
  op: DspOp
  channels: Float32Array[]
  sampleRate: number
  params: DspParams
}

export type DspResponse =
  | { jobId: number; ok: true; channels: Float32Array[]; peak: number; rms: number }
  | { jobId: number; ok: false; error: string }

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
