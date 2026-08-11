<template>
  <div class="controls-panel">
    <div class="controls-row">
      <div class="ctrl-field">
        <label class="ctrl-label">{{ t('app.globalRms') }}</label>
        <div class="ctrl-row">
          <input
            v-model.number="globalRmsValue"
            type="number"
            step="0.01"
            min="0"
            max="1"
            class="ctrl-input"
            :disabled="isProcessing"
          />
          <button
            class="btn btn--accent btn--sm"
            :disabled="isProcessing || audioFiles.length === 0"
            @click="applyGlobalRms"
          >
            {{ t('app.applyRms') }}
          </button>
        </div>
      </div>
      <div class="ctrl-field">
        <label class="ctrl-label">{{ t('app.globalDb') }}</label>
        <div class="ctrl-row">
          <input
            v-model.number="globalDbValue"
            type="number"
            step="1"
            min="-60"
            max="0"
            class="ctrl-input"
            :disabled="isProcessing"
          />
          <button
            class="btn btn--accent btn--sm"
            :disabled="isProcessing || audioFiles.length === 0"
            @click="applyGlobalDb"
          >
            {{ t('app.applyDb') }}
          </button>
        </div>
      </div>
    </div>
    <!-- R128 warning: shown when RMS/dB scaling would override broadcast normalisation -->
    <div v-if="r128Applied && audioFiles.length > 0" class="r128-warning">
      <AlertTriangle :size="13" />
      <span>{{ t('app.r128Warning') }}</span>
    </div>

    <div class="controls-row controls-row--bottom">
      <div class="ctrl-field ctrl-field--format">
        <label class="ctrl-label">{{ t('app.downloadFormat') }}</label>
        <select v-model="downloadFormat" class="ctrl-select">
          <option value="wav">WAV</option>
          <option value="mp3">MP3 320 kbps</option>
          <option value="webm">WebM / Opus</option>
        </select>
      </div>
      <button
        class="btn btn--primary btn--ebu"
        :disabled="isProcessing || audioFiles.length === 0"
        @click="applyEBUR128"
      >
        <Zap :size="14" />{{ t('app.applyEBU') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { AlertTriangle, Zap } from 'lucide-vue-next'
  import { useI18n } from '../composables/useI18n'
  import { useAudioStore } from '../stores/audioStore'

  const { t } = useI18n()
  const store = useAudioStore()
  const { audioFiles, globalRmsValue, globalDbValue, downloadFormat, isProcessing, r128Applied } =
    storeToRefs(store)
  const { applyGlobalRms, applyGlobalDb, applyEBUR128 } = store
</script>
