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

  // Only true when at least one file has actually been processed (not just loaded)
  const hasNormalizedFiles = computed(() => getFiles().some((f) => f.processedBlobUrl !== null))

  const sendToTool = async (tool: TargetTool): Promise<void> => {
    if (!hasNormalizedFiles.value || isSending.value) return

    isSending.value = true
    sentToTool.value = null

    try {
      const blobs = getFiles()
        .map((f) => {
          const buf = f.processedBuffer ?? f.originalBuffer
          if (!buf) return null
          const blob = bufferToWave(buf, 0, buf.length)
          const baseName = f.name.replace(/\.[^/.]+$/, '')
          return { name: `${baseName}.wav`, blob }
        })
        .filter((x): x is { name: string; blob: Blob } => x !== null)

      if (blobs.length === 0) return

      await shareFiles(blobs, 'audionormalizer')
      sentToTool.value = tool.key

      const separator = tool.url.includes('?') ? '&' : '?'
      window.open(`${tool.url}${separator}source=audionormalizer`, '_blank')
    } finally {
      isSending.value = false
      setTimeout(() => {
        sentToTool.value = null
      }, 4000)
    }
  }

  return { isSending, sentToTool, hasNormalizedFiles, sendToTool, TARGET_TOOLS }
}
