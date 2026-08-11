<template>
  <div class="toolbar">
    <button
      class="btn btn--primary btn--sm"
      :disabled="isProcessing || processedCount === 0"
      :title="processedCount === 0 ? t('app.exportHint') : ''"
      @click="exportAll"
    >
      <Download :size="14" />{{ t('app.exportProcessed') }}
      <span v-if="processedCount > 0" class="count-pill">{{ processedCount }}</span>
    </button>
    <button
      class="btn btn--danger btn--sm"
      :disabled="isProcessing || audioFiles.length === 0"
      @click="confirmDeleteAll"
    >
      <Trash2 :size="14" />{{ t('app.deleteAll') }}
    </button>
    <button
      class="btn btn--ghost btn--sm"
      :disabled="isProcessing || audioFiles.length === 0"
      @click="confirmResetAll"
    >
      <RotateCcw :size="14" />{{ t('app.resetAll') }}
    </button>
  </div>
</template>

<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { Download, Trash2, RotateCcw } from 'lucide-vue-next'
  import { useI18n } from '../composables/useI18n'
  import { useAudioStore } from '../stores/audioStore'

  const { t } = useI18n()
  const store = useAudioStore()
  const { audioFiles, isProcessing, processedCount } = storeToRefs(store)
  const { exportAll, deleteAll, resetAll } = store

  const confirmDeleteAll = () => {
    if (audioFiles.value.length > 0 && confirm(t('app.confirmDeleteAll'))) deleteAll()
  }

  const confirmResetAll = () => {
    if (audioFiles.value.length > 0 && confirm(t('app.confirmResetAll'))) resetAll()
  }
</script>
