<template>
  <div
    class="drop-zone"
    :class="{ 'drop-zone--active': isDragging }"
    @drop.prevent="handleDrop"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
  >
    <input
      ref="fileInputRef"
      type="file"
      accept="audio/*"
      multiple
      style="display: none"
      @change="handleFiles"
    />
    <input
      ref="folderInputRef"
      type="file"
      accept="audio/*"
      multiple
      webkitdirectory
      style="display: none"
      @change="handleFiles"
    />
    <Upload :size="20" class="drop-icon" />
    <div class="drop-label-group">
      <span class="drop-label">{{ t('app.selectFiles') }}</span>
      <span class="drop-paste-hint">{{ t('app.pasteHint') }}</span>
    </div>
    <div class="drop-actions">
      <button type="button" class="btn btn--ghost" @click="fileInputRef?.click()">
        {{ t('app.selectFilesBtn') }}
      </button>
      <button type="button" class="btn btn--ghost" @click="folderInputRef?.click()">
        {{ t('app.selectFolderBtn') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { Upload } from 'lucide-vue-next'
  import { useI18n } from '../composables/useI18n'
  import { useAudioStore } from '../stores/audioStore'
  import { useFileDrop } from '../composables/useFileDrop'

  const { t } = useI18n()
  const store = useAudioStore()

  const { fileInputRef, folderInputRef, isDragging, handleFiles, handleDrop } = useFileDrop(
    store.handleFilesInput,
  )
</script>
