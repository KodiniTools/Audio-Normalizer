import { ref, computed } from 'vue'
import type { AudioFileData } from '../types'
import { bufferToWave } from '../utils/audioUtils'
import { shareFiles } from '../utils/sharedFileRepository'

export interface TargetTool {
  key: string
  url: string
}

export const TARGET_TOOLS: TargetTool[] = [
  { key: 'musikplayer', url: 'https://kodinitools.com/ultimativer-musikplayer/app/' },
  { key: 'playlistGenerator', url: 'https://kodinitools.com/playlist_generator/app' },
  { key: 'playlistKonverter', url: 'https://kodinitools.com/playlistkonverter/app.html' },
]

export function useSendToTool(getFiles: () => AudioFileData[]) {
  const isSending = ref(false)
  const sentToTool = ref<string | null>(null)

  const hasNormalizedFiles = computed(() => getFiles().some((f) => f.processedBlobUrl !== null))

  const sendToTool = async (tool: TargetTool): Promise<void> => {
    if (!hasNormalizedFiles.value || isSending.value) return

    isSending.value = true
    sentToTool.value = null

    try {
      // Open the window SYNCHRONOUSLY within the user-gesture context so the
      // browser popup-blocker does not suppress it. autoShare() has already
      // pre-populated IndexedDB after the last processing step, so the target
      // tool will find the files immediately on load.
      const separator = tool.url.includes('?') ? '&' : '?'
      const targetUrl = `${tool.url}${separator}source=audionormalizer`
      window.open(targetUrl, '_blank')
      sentToTool.value = tool.key

      // Refresh IndexedDB in the background with the latest buffers.
      const blobs = getFiles()
        .map((f) => {
          const buf = f.processedBuffer ?? f.originalBuffer
          if (!buf) return null
          const blob = bufferToWave(buf, 0, buf.length)
          const baseName = f.name.replace(/\.[^/.]+$/, '')
          return { name: `${baseName}.wav`, blob }
        })
        .filter((x): x is { name: string; blob: Blob } => x !== null)

      if (blobs.length > 0) {
        await shareFiles(blobs, 'audionormalizer')
      }
    } finally {
      isSending.value = false
      setTimeout(() => {
        sentToTool.value = null
      }, 4000)
    }
  }

  return { isSending, sentToTool, hasNormalizedFiles, sendToTool, TARGET_TOOLS }
}
