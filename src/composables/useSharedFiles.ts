import { ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'
import { getSharedFiles, clearSharedFiles } from '../utils/sharedFileRepository'
import type { BatchResult, StatusBanner, SharedFileRecord } from '../types'

type HandleSharedFiles = (records: SharedFileRecord[]) => Promise<BatchResult>
type TranslateFn = (key: string, values?: Record<string, unknown>) => string

export function useSharedFiles(
  handleSharedFiles: HandleSharedFiles,
  t: TranslateFn,
  route: RouteLocationNormalizedLoaded,
  router: Router,
) {
  const sharedBanner: Ref<StatusBanner | null> = ref(null)
  let handled = false

  const load = async (): Promise<void> => {
    if (handled) return
    handled = true

    try {
      const records = await getSharedFiles()

      if (!records || records.length === 0) {
        sharedBanner.value = { type: 'warning', message: t('app.sharedFilesEmpty') }
        return
      }

      sharedBanner.value = {
        type: 'info',
        message: t('app.sharedFilesLoading', { count: records.length }),
      }

      const { processed } = await handleSharedFiles(records)

      if (processed > 0) {
        sharedBanner.value = {
          type: 'success',
          message: t('app.sharedFilesLoaded', { count: processed }),
        }
        await clearSharedFiles()
        setTimeout(() => {
          sharedBanner.value = null
        }, 6000)
      } else {
        sharedBanner.value = { type: 'error', message: t('app.sharedFilesError') }
      }
    } catch (error) {
      console.error('[AudioNormalizer] Error loading shared files:', error)
      sharedBanner.value = { type: 'error', message: t('app.sharedFilesError') }
    }
  }

  router.isReady().then(() => {
    if (route.query.source === 'audiokonverter') load()
  })

  watch(
    () => route.query.source,
    (source) => {
      if (source === 'audiokonverter') load()
    },
  )

  return { sharedBanner }
}
