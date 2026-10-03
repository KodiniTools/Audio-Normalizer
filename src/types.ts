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
  /** Integrated loudness (LUFS, ITU-R BS.1770) from the last "Analyze" run. */
  lufs?: number
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

export interface Toast {
  id: number
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
  | 'analyze'

export interface DspParams {
  targetRms?: number
  targetLufs?: number
  targetDbtp?: number
  maxRmsGain?: number
  nrOverSubtraction?: number
  nrFloorGain?: number
  nrNoiseQuantile?: number
  threshold?: number
  knee?: number
  ratio?: number
  attack?: number
  release?: number
  clipThreshold?: number
}

export interface DspRequest {
  jobId: number
  op: DspOp
  channels: Float32Array[]
  sampleRate: number
  params: DspParams
}

export type DspResponse =
  | { jobId: number; ok: true; channels: Float32Array[]; peak: number; rms: number; lufs?: number }
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

// ── Undo / redo history ──────────────────────────────────────────────────────

/** Translatable label of a history entry; resolved via `t(key, params)` on display. */
export interface HistoryLabel {
  key: string
  params?: Record<string, string | number>
}

/**
 * Snapshot of a file's editable "take" — every field an edit operation may
 * change. The blob preview URL is deliberately not part of the snapshot: it is
 * regenerated from `processedBuffer` on restore so stale blobs don't pile up.
 */
export interface FileTake {
  processedBuffer: AudioBuffer
  peak: number
  rms: number
  lufs: number | undefined
  targetRms: number | undefined
  processed: boolean
}

export interface HistoryEntryBase {
  /** Monotonic id, unique within the session. */
  id: number
  label: HistoryLabel
  /** `Date.now()` when the action was recorded. */
  at: number
  /** `r128Applied` flag before/after the action (only when the action changed it). */
  r128?: { before: boolean; after: boolean }
}

/** An audio edit (normalisation, effect, per-file apply, reset) on one or more files. */
export interface HistoryEditEntry extends HistoryEntryBase {
  kind: 'edit'
  changes: { id: string; before: FileTake; after: FileTake }[]
}

/** Files added to (kind 'add') or removed from (kind 'remove') the playlist. */
export interface HistoryListEntry extends HistoryEntryBase {
  kind: 'add' | 'remove'
  /** The file objects plus their playlist index at the time of the action. */
  files: { file: AudioFileData; index: number }[]
}

export type HistoryEntry = HistoryEditEntry | HistoryListEntry
