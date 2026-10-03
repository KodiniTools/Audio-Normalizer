import { describe, it, expect } from 'vitest'
import {
  emptyHistory,
  pushHistory,
  undoHistory,
  redoHistory,
  clearHistory,
  pruneHistory,
  type HistoryState,
} from '../src/utils/history'

interface E {
  id: number
  bytes: number
}

const e = (id: number, bytes = 0): E => ({ id, bytes })
const sum = (entries: readonly E[]): number => entries.reduce((acc, x) => acc + x.bytes, 0)
const ids = (list: readonly E[]): number[] => list.map((x) => x.id)
const big = { maxEntries: 100, maxBytes: Number.MAX_SAFE_INTEGER }

const fill = (count: number): HistoryState<E> => {
  let s = emptyHistory<E>()
  for (let i = 1; i <= count; i++) s = pushHistory(s, e(i), big).state
  return s
}

describe('history stack', () => {
  it('pushes onto past and clears future', () => {
    const s0 = fill(2)
    const { state: s1 } = undoHistory(s0)
    expect(ids(s1.past)).toEqual([1])
    expect(ids(s1.future)).toEqual([2])

    const { state: s2, discarded } = pushHistory(s1, e(3), big)
    expect(ids(s2.past)).toEqual([1, 3])
    expect(s2.future).toEqual([])
    expect(ids(discarded)).toEqual([2])
  })

  it('undo and redo move entries between the stacks in order', () => {
    const s0 = fill(3)
    const u1 = undoHistory(s0)
    expect(u1.entry?.id).toBe(3)
    const u2 = undoHistory(u1.state)
    expect(u2.entry?.id).toBe(2)
    expect(ids(u2.state.past)).toEqual([1])
    expect(ids(u2.state.future)).toEqual([3, 2])

    const r1 = redoHistory(u2.state)
    expect(r1.entry?.id).toBe(2)
    const r2 = redoHistory(r1.state)
    expect(r2.entry?.id).toBe(3)
    expect(ids(r2.state.past)).toEqual([1, 2, 3])
    expect(r2.state.future).toEqual([])
  })

  it('returns undefined and the same state when there is nothing to undo/redo', () => {
    const s = emptyHistory<E>()
    expect(undoHistory(s)).toEqual({ state: s, entry: undefined })
    expect(redoHistory(s)).toEqual({ state: s, entry: undefined })
  })

  it('does not mutate the previous state objects', () => {
    const s0 = fill(1)
    const pastBefore = s0.past
    pushHistory(s0, e(2), big)
    undoHistory(s0)
    expect(s0.past).toBe(pastBefore)
    expect(ids(s0.past)).toEqual([1])
    expect(s0.future).toEqual([])
  })

  it('prunes the oldest entries beyond maxEntries', () => {
    let s = emptyHistory<E>()
    const discardedAll: E[] = []
    for (let i = 1; i <= 5; i++) {
      const r = pushHistory(s, e(i), { maxEntries: 3, maxBytes: big.maxBytes })
      s = r.state
      discardedAll.push(...r.discarded)
    }
    expect(ids(s.past)).toEqual([3, 4, 5])
    expect(ids(discardedAll)).toEqual([1, 2])
  })

  it('prunes by the measured byte budget but always keeps the newest entry', () => {
    const limits = { maxEntries: 100, maxBytes: 100 }
    let s = emptyHistory<E>()
    s = pushHistory(s, e(1, 60), limits, sum).state
    s = pushHistory(s, e(2, 30), limits, sum).state
    expect(ids(s.past)).toEqual([1, 2])

    // 60 + 30 + 40 = 130 > 100 → drop entry 1
    const r3 = pushHistory(s, e(3, 40), limits, sum)
    expect(ids(r3.state.past)).toEqual([2, 3])
    expect(ids(r3.discarded)).toEqual([1])

    // A single oversized entry is still retained.
    const r4 = pushHistory(r3.state, e(4, 500), limits, sum)
    expect(ids(r4.state.past)).toEqual([4])
    expect(ids(r4.discarded)).toEqual([2, 3])
  })

  it('pruneHistory is a no-op when within limits', () => {
    const s = fill(3)
    const r = pruneHistory(s, big, sum)
    expect(r.state).toBe(s)
    expect(r.discarded).toEqual([])
  })

  it('clearHistory returns every entry for release', () => {
    const s = undoHistory(fill(3)).state
    const r = clearHistory(s)
    expect(r.state).toEqual({ past: [], future: [] })
    expect(ids(r.discarded)).toEqual([1, 2, 3])
  })
})
