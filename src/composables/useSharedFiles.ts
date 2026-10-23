import { ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'
import { getSharedFiles, clearSharedFiles, isReceivableSource } from '../utils/sharedFileRepository'
import type { ReceivableSource } from '../utils/sharedFileRepository'
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

  const load = async (source: ReceivableSource): Promise<void> => {
    if (handled) return
    handled = true
    const tool = t(`app.sharedSource.${source}`)

    try {
      const records = await getSharedFiles()

      if (!records || records.length === 0) {
        sharedBanner.value = { type: 'warning', message: t('app.sharedFilesEmpty', { tool }) }
        return
      }

      sharedBanner.value = {
        type: 'info',
        message: t('app.sharedFilesLoading', { count: records.length, tool }),
      }

      const { processed } = await handleSharedFiles(records)

      if (processed > 0) {
        sharedBanner.value = {
          type: 'success',
          message: t('app.sharedFilesLoaded', { count: processed, tool }),
        }
        await clearSharedFiles()
        setTimeout(() => {
          sharedBanner.value = null
        }, 6000)
      } else {
        sharedBanner.value = { type: 'error', message: t('app.sharedFilesError', { tool }) }
      }
    } catch (error) {
      console.error('[AudioNormalizer] Error loading shared files:', error)
      sharedBanner.value = { type: 'error', message: t('app.sharedFilesError', { tool }) }
    }
  }

  router.isReady().then(() => {
    const source = route.query.source
    if (isReceivableSource(source)) load(source)
  })

  watch(
    () => route.query.source,
    (source) => {
      if (isReceivableSource(source)) load(source)
    },
  )

  return { sharedBanner }
}
