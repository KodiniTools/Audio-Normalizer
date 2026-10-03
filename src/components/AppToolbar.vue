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

    <!-- Undo / redo (Ctrl+Z / Ctrl+Shift+Z, see useUndoRedoShortcuts) -->
    <button
      class="btn btn--ghost btn--sm"
      :disabled="historyBusy || !canUndo"
      :title="undoTitle"
      :aria-label="t('history.undo')"
      @click="undo"
    >
      <Undo2 :size="14" />{{ t('history.undo') }}
    </button>
    <button
      class="btn btn--ghost btn--sm"
      :disabled="historyBusy || !canRedo"
      :title="redoTitle"
      :aria-label="t('history.redo')"
      @click="redo"
    >
      <Redo2 :size="14" />{{ t('history.redo') }}
    </button>
    <HistoryMenu :disabled="historyBusy" />
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { storeToRefs } from 'pinia'
  import { Download, Trash2, RotateCcw, Undo2, Redo2 } from 'lucide-vue-next'
  import { useI18n } from '../composables/useI18n'
  import { useAudioStore } from '../stores/audioStore'
  import HistoryMenu from './HistoryMenu.vue'

  const { t } = useI18n()
  const store = useAudioStore()
  const {
    audioFiles,
    isProcessing,
    isLoading,
    processedCount,
    canUndo,
    canRedo,
    undoLabel,
    redoLabel,
  } = storeToRefs(store)
  const { exportAll, deleteAll, resetAll, undo, redo } = store

  // Undo/redo must not interleave with a running batch or export.
  const historyBusy = computed(() => isProcessing.value || isLoading.value)

  const undoTitle = computed(() =>
    undoLabel.value
      ? t('history.undoTitle', { action: t(undoLabel.value.key, undoLabel.value.params) })
      : t('history.nothingToUndo'),
  )

  const redoTitle = computed(() =>
    redoLabel.value
      ? t('history.redoTitle', { action: t(redoLabel.value.key, redoLabel.value.params) })
      : t('history.nothingToRedo'),
  )

  const confirmDeleteAll = () => {
    if (audioFiles.value.length > 0 && confirm(t('app.confirmDeleteAll'))) deleteAll()
  }

  const confirmResetAll = () => {
    if (audioFiles.value.length > 0 && confirm(t('app.confirmResetAll'))) resetAll()
  }
</script>
