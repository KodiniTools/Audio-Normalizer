<template>
  <!-- Loading overlay — all processes report their progress here -->
  <div v-if="isLoading" class="loading-overlay">
    <div class="loading-card">
      <div class="spinner" />
      <p class="loading-message">{{ loadingMessage }}</p>
      <div class="loading-progress">
        <div class="loading-progress-track">
          <div
            class="loading-progress-fill"
            :class="{ 'loading-progress-fill--indeterminate': loadingProgress === null }"
            :style="loadingProgress !== null ? { width: loadingProgress + '%' } : undefined"
          />
        </div>
        <span v-if="loadingProgress !== null" class="loading-progress-pct">
          {{ Math.round(loadingProgress) }}%
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { useAudioStore } from '../stores/audioStore'

  const store = useAudioStore()
  const { isLoading, loadingMessage, loadingProgress } = storeToRefs(store)
</script>
