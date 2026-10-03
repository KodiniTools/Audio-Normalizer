import { onMounted, onUnmounted } from 'vue'

const TEXT_INPUT_TYPES = new Set(['text', 'number', 'search', 'email', 'url', 'password', 'tel'])

/**
 * True when the keyboard event originates from a control that has its own
 * native undo (text fields, textareas, contentEditable). In that case the
 * browser's text undo must win over the app-level history.
 */
export const isTextEditingTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  if (target instanceof HTMLTextAreaElement) return true
  if (target instanceof HTMLInputElement) return TEXT_INPUT_TYPES.has(target.type)
  return false
}

/**
 * Maps the usual keyboard shortcuts to the given undo/redo handlers:
 *   Ctrl/Cmd+Z           → undo
 *   Ctrl/Cmd+Shift+Z     → redo
 *   Ctrl/Cmd+Y           → redo
 * Uses `event.key`, so it follows the active keyboard layout (QWERTZ etc.).
 */
export function useUndoRedoShortcuts(undo: () => void, redo: () => void) {
  const onKeydown = (event: KeyboardEvent): void => {
    if (!(event.ctrlKey || event.metaKey) || event.altKey) return
    if (isTextEditingTarget(event.target)) return
    const key = event.key.toLowerCase()
    if (key === 'z' && !event.shiftKey) {
      event.preventDefault()
      undo()
    } else if ((key === 'z' && event.shiftKey) || key === 'y') {
      event.preventDefault()
      redo()
    }
  }

  onMounted(() => window.addEventListener('keydown', onKeydown))
  onUnmounted(() => window.removeEventListener('keydown', onKeydown))
}
