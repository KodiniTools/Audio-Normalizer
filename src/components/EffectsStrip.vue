<template>
  <div class="effects-strip">
    <button class="chip" :disabled="isProcessing || audioFiles.length === 0" @click="analyzeAll">
      {{ t('app.analyzeAll') }}
    </button>
    <button
      class="chip"
      :disabled="isProcessing || audioFiles.length === 0"
      @click="applyNoiseReductionAll"
    >
      {{ t('app.noiseReduction') }}
    </button>
    <button
      class="chip"
      :disabled="isProcessing || audioFiles.length === 0"
      @click="reduceClippingAll"
    >
      {{ t('app.reduceClipping') }}
    </button>
    <button
      class="chip"
      :disabled="isProcessing || audioFiles.length === 0"
      @click="applyDynamicCompressionAll"
    >
      {{ t('app.dynamicCompression') }}
    </button>
  </div>
</template>

<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { useI18n } from '../composables/useI18n'
  import { useAudioStore } from '../stores/audioStore'

  const { t } = useI18n()
  const store = useAudioStore()
  const { audioFiles, isProcessing } = storeToRefs(store)
  const { analyzeAll, applyNoiseReductionAll, reduceClippingAll, applyDynamicCompressionAll } =
    store
</script>
