import { ref, onMounted, onUnmounted } from 'vue'
import { isAudioFile } from '../utils/audioUtils'

export function useFileDrop(handleFilesInput: (files: File[]) => void) {
  const fileInputRef = ref<HTMLInputElement | null>(null)
  const folderInputRef = ref<HTMLInputElement | null>(null)
  const isDragging = ref(false)

  const handleFiles = (event: Event): void => {
    const input = event.target as HTMLInputElement
    if (input.files && input.files.length > 0) handleFilesInput(Array.from(input.files))
    input.value = ''
  }

  const readEntry = (entry: FileSystemEntry, collected: File[]): Promise<void> =>
    new Promise((resolve) => {
      if (entry.isFile) {
        ;(entry as FileSystemFileEntry).file(
          (f) => {
            collected.push(f)
            resolve()
          },
          () => resolve(),
        )
      } else if (entry.isDirectory) {
        const reader = (entry as FileSystemDirectoryEntry).createReader()
        const readAll = () => {
          reader.readEntries(
            async (entries) => {
              if (entries.length === 0) {
                resolve()
                return
              }
              await Promise.all(entries.map((e) => readEntry(e, collected)))
              readAll()
            },
            () => resolve(),
          )
        }
        readAll()
      } else {
        resolve()
      }
    })

  const handleDrop = async (event: DragEvent): Promise<void> => {
    isDragging.value = false
    const items = event.dataTransfer?.items
    if (!items || items.length === 0) return

    const collected: File[] = []
    const entries = Array.from(items)
      .map((item) => item.webkitGetAsEntry())
      .filter((e): e is FileSystemEntry => e !== null)
    await Promise.all(entries.map((e) => readEntry(e, collected)))

    const audioOnly = collected.filter(isAudioFile)
    if (audioOnly.length > 0) handleFilesInput(audioOnly)
  }

  const handlePaste = (event: ClipboardEvent): void => {
    const items = event.clipboardData?.items
    if (!items) return
    const files: File[] = []
    for (const item of Array.from(items)) {
      if (item.kind === 'file') {
        const file = item.getAsFile()
        if (file && isAudioFile(file)) files.push(file)
      }
    }
    if (files.length > 0) handleFilesInput(files)
  }

  onMounted(() => window.addEventListener('paste', handlePaste))
  onUnmounted(() => window.removeEventListener('paste', handlePaste))

  return { fileInputRef, folderInputRef, isDragging, handleFiles, handleDrop }
}
