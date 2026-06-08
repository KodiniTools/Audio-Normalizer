import { ref, watch } from 'vue'
import { getSharedFiles, clearSharedFiles } from '../utils/sharedFileRepository.js'

export function useSharedFiles(handleSharedFiles, t, route, router) {
  const sharedBanner = ref(null)
  let handled = false

  const load = async () => {
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
