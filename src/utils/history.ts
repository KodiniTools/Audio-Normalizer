// ─────────────────────────────────────────────────────────────────────────────
// Generic, framework-free undo/redo stack.
//
// The history is modelled as two immutable stacks:
//   past   — entries that can be undone (newest last)
//   future — entries that can be redone (next redo last)
//
// Every operation returns a *new* state object so the caller can keep it in a
// `shallowRef` and get Vue reactivity for free. Entries discarded by pruning or
// by a new push (which invalidates the redo stack) are returned so the caller
// can release any resources they hold (e.g. blob URLs).
// ─────────────────────────────────────────────────────────────────────────────

export interface HistoryState<E> {
  readonly past: readonly E[]
  readonly future: readonly E[]
}

export interface HistoryLimits {
  /** Maximum number of undoable entries kept in `past`. */
  maxEntries: number
  /**
   * Maximum number of bytes the retained `past` entries may hold in total, as
   * reported by the `measure` callback. The newest entry is always kept, even
   * if it alone exceeds the budget.
   */
  maxBytes: number
}

/** Default limits: 50 steps or 512 MiB of retained audio, whichever is hit first. */
export const DEFAULT_HISTORY_LIMITS: HistoryLimits = {
  maxEntries: 50,
  maxBytes: 512 * 1024 * 1024,
}

/**
 * Reports the bytes held exclusively by the given entries. It receives the
 * whole candidate list (not a single entry) because adjacent entries typically
 * share buffers, so a per-entry sum would overestimate.
 */
export type HistoryMeasure<E> = (entries: readonly E[]) => number

export const emptyHistory = <E>(): HistoryState<E> => ({ past: [], future: [] })

/**
 * Drops the oldest `past` entries until both limits are satisfied. At least one
 * entry is always kept so the most recent action stays undoable.
 */
export function pruneHistory<E>(
  state: HistoryState<E>,
  limits: HistoryLimits,
  measure: HistoryMeasure<E>,
): { state: HistoryState<E>; discarded: E[] } {
  let past = state.past
  const discarded: E[] = []

  while (past.length > 1 && (past.length > limits.maxEntries || measure(past) > limits.maxBytes)) {
    discarded.push(past[0])
    past = past.slice(1)
  }

  if (discarded.length === 0) return { state, discarded }
  return { state: { past, future: state.future }, discarded }
}

/**
 * Records a new entry. Any redoable entries are invalidated (returned in
 * `discarded`), then the past is pruned against the limits.
 */
export function pushHistory<E>(
  state: HistoryState<E>,
  entry: E,
  limits: HistoryLimits = DEFAULT_HISTORY_LIMITS,
  measure: HistoryMeasure<E> = () => 0,
): { state: HistoryState<E>; discarded: E[] } {
  const next: HistoryState<E> = { past: [...state.past, entry], future: [] }
  const pruned = pruneHistory(next, limits, measure)
  return { state: pruned.state, discarded: [...state.future, ...pruned.discarded] }
}

/** Moves the newest `past` entry onto `future` and returns it (undefined if none). */
export function undoHistory<E>(state: HistoryState<E>): {
  state: HistoryState<E>
  entry: E | undefined
} {
  if (state.past.length === 0) return { state, entry: undefined }
  const entry = state.past[state.past.length - 1]
  return {
    state: { past: state.past.slice(0, -1), future: [...state.future, entry] },
    entry,
  }
}

/** Moves the next `future` entry back onto `past` and returns it (undefined if none). */
export function redoHistory<E>(state: HistoryState<E>): {
  state: HistoryState<E>
  entry: E | undefined
} {
  if (state.future.length === 0) return { state, entry: undefined }
  const entry = state.future[state.future.length - 1]
  return {
    state: { past: [...state.past, entry], future: state.future.slice(0, -1) },
    entry,
  }
}

/** Empties both stacks and returns every entry so resources can be released. */
export function clearHistory<E>(state: HistoryState<E>): {
  state: HistoryState<E>
  discarded: E[]
} {
  return { state: emptyHistory<E>(), discarded: [...state.past, ...state.future] }
}
