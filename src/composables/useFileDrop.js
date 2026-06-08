import { ref } from 'vue'
import { isAudioFile } from '../utils/audioUtils.js'

export function useFileDrop(handleFilesInput) {
  const fileInputRef = ref(null)
  const folderInputRef = ref(null)
  const isDragging = ref(false)

  const handleFiles = (event) => {
    const files = event.target.files
    if (files && files.length > 0) handleFilesInput(Array.from(files))
    event.target.value = ''
  }

  const readEntry = (entry, collected) =>
    new Promise((resolve) => {
      if (entry.isFile) {
        entry.file((f) => {
          collected.push(f)
          resolve()
        }, resolve)
      } else if (entry.isDirectory) {
        const reader = entry.createReader()
        const readAll = () => {
          reader.readEntries(async (entries) => {
            if (entries.length === 0) {
              resolve()
              return
            }
            await Promise.all(entries.map((e) => readEntry(e, collected)))
            readAll()
          }, resolve)
        }
        readAll()
      } else {
        resolve()
      }
    })

  const handleDrop = async (event) => {
    isDragging.value = false
    const items = event.dataTransfer?.items
    if (!items || items.length === 0) return

    const collected = []
    const entries = Array.from(items)
      .map((item) => item.webkitGetAsEntry?.())
      .filter(Boolean)
    await Promise.all(entries.map((e) => readEntry(e, collected)))

    const audioOnly = collected.filter(isAudioFile)
    if (audioOnly.length > 0) handleFilesInput(audioOnly)
  }

  return { fileInputRef, folderInputRef, isDragging, handleFiles, handleDrop }
}
