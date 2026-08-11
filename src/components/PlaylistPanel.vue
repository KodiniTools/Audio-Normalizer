<template>
  <!-- Playlist header -->
  <div v-if="audioFiles.length > 0" class="playlist-header">
    <label class="select-all">
      <input
        type="checkbox"
        :checked="allSelected"
        :indeterminate.prop="someSelected && !allSelected"
        @change="toggleSelectAll"
      />
      <span>{{ allSelected ? t('app.deselectAll') : t('app.selectAll') }}</span>
    </label>
    <span class="playlist-count">
      {{ t('app.selectedCount', { count: selectedCount, total: audioFiles.length }) }}
    </span>
  </div>

  <!-- Hint: files loaded but none marked for editing -->
  <div v-if="audioFiles.length > 0 && !someSelected" class="alert alert--warning selection-hint">
    <AlertTriangle :size="15" />
    <span>{{ t('app.noSelectionHint') }}</span>
  </div>

  <!-- Empty state: only when there are genuinely no files -->
  <div v-if="audioFiles.length === 0" class="file-meta file-meta--empty">
    {{ t('app.noFiles') }}
  </div>

  <!-- Interactive playlist -->
  <div v-if="audioFiles.length > 0" class="file-list">
    <AudioFileItem
      v-for="file in audioFiles"
      :key="file.id"
      :file="file"
      :is-active="file.id === currentTrackId"
      :default-format="downloadFormat"
      @update="updateFile"
      @reset="resetFile"
      @remove="removeFile"
      @export="exportFile"
      @toggle-select="toggleSelect"
      @play="playTrack"
    />
  </div>

  <!-- Sticky player bar -->
  <PlayerBar v-if="audioFiles.length > 0" class="sticky-player" />
</template>

<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { AlertTriangle } from 'lucide-vue-next'
  import { useI18n } from '../composables/useI18n'
  import { useAudioStore } from '../stores/audioStore'
  import AudioFileItem from './AudioFileItem.vue'
  import PlayerBar from './PlayerBar.vue'

  const { t } = useI18n()
  const store = useAudioStore()
  const { audioFiles, allSelected, someSelected, selectedCount, currentTrackId, downloadFormat } =
    storeToRefs(store)
  const {
    toggleSelectAll,
    toggleSelect,
    updateFile,
    resetFile,
    removeFile,
    exportFile,
    playTrack,
  } = store
</script>
