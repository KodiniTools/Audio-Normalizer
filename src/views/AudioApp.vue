<template>
  <div class="audio-app">
    <div class="app-header">
      <router-link to="/" class="back-link">← {{ t('nav.backToHome') }}</router-link>
      <div class="header-titles">
        <h1 class="app-title">{{ t('app.title') }}</h1>
        <p class="app-subtitle">{{ t('app.subtitle') }}</p>
      </div>
      <div class="header-controls-slot">
        <HeaderControls />
      </div>
    </div>

    <section class="app-section">
      <div class="container">
        <div class="app-container">
          <!-- Shared files banner -->
          <div v-if="sharedBanner" class="alert" :class="'alert--' + sharedBanner.type">
            <component :is="statusIcons[sharedBanner.type]" :size="15" />
            <span>{{ sharedBanner.message }}</span>
          </div>

          <!-- Drop zone -->
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
            <span class="drop-label">{{ t('app.selectFiles') }}</span>
            <div class="drop-actions">
              <button type="button" class="btn btn--ghost" @click="fileInputRef?.click()">
                {{ t('app.selectFilesBtn') }}
              </button>
              <button type="button" class="btn btn--ghost" @click="folderInputRef?.click()">
                {{ t('app.selectFolderBtn') }}
              </button>
            </div>
          </div>

          <!-- Progress bar -->
          <div v-if="showProgress" class="progress-strip">
            <span class="progress-label">{{ progressLabel }}</span>
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: progress + '%' }" />
            </div>
            <span class="progress-pct">{{ Math.round(progress) }}%</span>
          </div>

          <!-- Toolbar -->
          <div class="toolbar">
            <button
              class="btn btn--primary btn--sm"
              :disabled="isProcessing || audioFiles.length === 0"
              @click="exportAll"
            >
              <Download :size="14" />{{ t('app.exportAll') }}
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

          <!-- Controls panel -->
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

          <!-- Effects strip -->
          <div class="effects-strip">
            <button
              class="chip"
              :disabled="isProcessing || audioFiles.length === 0"
              @click="analyzeAll"
            >
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

          <!-- File meta / empty state -->
          <div class="file-meta" :class="{ 'file-meta--empty': audioFiles.length === 0 }">
            <template v-if="audioFiles.length === 0">{{ t('app.noFiles') }}</template>
            <template v-else>{{ t('app.fileCount', { count: audioFiles.length }) }}</template>
          </div>

          <!-- File list -->
          <div v-if="audioFiles.length > 0" class="file-list">
            <AudioFileItem
              v-for="file in audioFiles"
              :key="file.id"
              :file="file"
              @update="updateFile"
              @remove="removeFile"
              @export="exportFile"
            />
          </div>

          <!-- Status toast -->
          <div v-if="statusMessage" class="alert alert--toast" :class="'alert--' + statusType">
            <component :is="statusIcons[statusType]" :size="15" />
            <span>{{ statusMessage }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Loading overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner" />
      <p>{{ loadingMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { useRoute, useRouter } from 'vue-router'
  import {
    Upload,
    CheckCircle,
    AlertCircle,
    AlertTriangle,
    Info,
    Download,
    Trash2,
    RotateCcw,
    Zap,
  } from 'lucide-vue-next'
  import { useI18n } from '../composables/useI18n'
  import { useAudioStore } from '../stores/audioStore'
  import { useFileDrop } from '../composables/useFileDrop'
  import { useSharedFiles } from '../composables/useSharedFiles'
  import AudioFileItem from '../components/AudioFileItem.vue'
  import HeaderControls from '../components/HeaderControls.vue'

  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()

  const store = useAudioStore()
  const {
    audioFiles,
    globalRmsValue,
    globalDbValue,
    downloadFormat,
    showProgress,
    progress,
    progressLabel,
    isLoading,
    loadingMessage,
    statusMessage,
    statusType,
    isProcessing,
    r128Applied,
  } = storeToRefs(store)

  const {
    handleFilesInput,
    handleSharedFiles,
    exportAll,
    deleteAll,
    resetAll,
    applyGlobalRms,
    applyGlobalDb,
    applyEBUR128,
    analyzeAll,
    applyNoiseReductionAll,
    reduceClippingAll,
    applyDynamicCompressionAll,
    updateFile,
    removeFile,
    exportFile,
  } = store

  const { fileInputRef, folderInputRef, isDragging, handleFiles, handleDrop } =
    useFileDrop(handleFilesInput)

  const { sharedBanner } = useSharedFiles(handleSharedFiles, t, route, router)

  const confirmDeleteAll = () => {
    if (audioFiles.value.length > 0 && confirm(t('app.confirmDeleteAll'))) deleteAll()
  }

  const confirmResetAll = () => {
    if (audioFiles.value.length > 0 && confirm(t('app.confirmResetAll'))) resetAll()
  }

  const statusIcons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }
</script>

<style scoped>
  /* ── Layout ─────────────────────────────────────────── */
  .container {
    max-width: 900px;
    margin: 0 auto;
    padding: 1.25rem 1.5rem;
  }

  .app-container {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
  }

  /* ── Header ──────────────────────────────────────────── */
  .app-header {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.625rem 1.25rem;
    position: relative;
    background: var(--panel);
    border-bottom: 1px solid var(--border-color);
  }

  .header-controls-slot {
    position: absolute;
    right: 1.25rem;
  }

  .back-link {
    position: absolute;
    left: 1.25rem;
    display: inline-flex;
    align-items: center;
    padding: 0.3rem 0.65rem;
    background: var(--btn);
    border: 1px solid var(--border-color);
    border-radius: 0.375rem;
    color: var(--text);
    font-size: 0.73rem;
    font-weight: 500;
    text-decoration: none;
    transition: all 0.15s ease;
  }

  .back-link:hover {
    background: var(--accent);
    color: var(--accent-text);
    border-color: var(--accent);
  }

  .header-titles {
    text-align: center;
  }

  .app-title {
    font-size: 1rem;
    font-weight: 600;
    color: var(--text);
    margin: 0;
  }

  .app-subtitle {
    font-size: 0.68rem;
    color: var(--muted);
    margin: 0.1rem 0 0;
  }

  /* ── Alert (banner + toast shared base) ──────────────── */
  .alert {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.875rem;
    border-radius: 0.5rem;
    font-size: 0.8rem;
    font-weight: 500;
  }

  .alert--toast {
    animation: slideUp 0.2s ease;
  }

  .alert--success {
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: #22c55e;
  }
  .alert--error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
  }
  .alert--warning {
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.3);
    color: #f59e0b;
  }
  .alert--info {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.3);
    color: #3b82f6;
  }

  /* ── Drop zone ───────────────────────────────────────── */
  .drop-zone {
    display: flex;
    align-items: center;
    gap: 0.875rem;
    padding: 0.875rem 1.25rem;
    background: var(--gradient-color);
    border: 1.5px dashed var(--border-color);
    border-radius: 0.625rem;
    transition:
      border-color 0.15s,
      background 0.15s;
  }

  .drop-zone--active {
    border-color: var(--accent);
    background: var(--panel-highlight);
  }

  .drop-icon {
    color: var(--accent);
    flex-shrink: 0;
  }

  .drop-label {
    flex: 1;
    font-size: 0.82rem;
    color: var(--muted);
    font-weight: 500;
  }

  .drop-actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  /* ── Progress strip ──────────────────────────────────── */
  .progress-strip {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 0.625rem;
    padding: 0.5rem 0.875rem;
    background: var(--panel);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
  }

  .progress-label {
    font-size: 0.73rem;
    font-weight: 600;
    color: var(--muted);
    white-space: nowrap;
  }

  .progress-track {
    height: 4px;
    background: var(--btn);
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent), var(--accent-secondary));
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  .progress-pct {
    font-size: 0.73rem;
    font-weight: 700;
    color: var(--accent);
    font-variant-numeric: tabular-nums;
  }

  /* ── Toolbar ─────────────────────────────────────────── */
  .toolbar {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  /* ── Controls panel ──────────────────────────────────── */
  .controls-panel {
    background: var(--panel);
    border: 1px solid var(--border-color);
    border-radius: 0.625rem;
    padding: 0.875rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
  }

  .r128-warning {
    display: flex;
    align-items: flex-start;
    gap: 0.4rem;
    padding: 0.45rem 0.65rem;
    border-radius: 0.35rem;
    background: rgba(234, 179, 8, 0.1);
    border: 1px solid rgba(234, 179, 8, 0.35);
    color: #ca8a04;
    font-size: 0.72rem;
    line-height: 1.4;
  }

  [data-theme='light'] .r128-warning {
    background: rgba(234, 179, 8, 0.08);
    color: #92400e;
  }

  .r128-warning svg {
    flex-shrink: 0;
    margin-top: 1px;
  }

  .controls-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .controls-row--bottom {
    grid-template-columns: 1fr 1fr;
    align-items: end;
  }

  .ctrl-field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .ctrl-label {
    font-size: 0.68rem;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .ctrl-row {
    display: flex;
    gap: 0.375rem;
  }

  .ctrl-input {
    flex: 1;
    min-width: 0;
    padding: 0.375rem 0.5rem;
    background: var(--btn);
    border: 1px solid var(--border-color);
    border-radius: 0.375rem;
    color: var(--text);
    font-size: 0.82rem;
    transition: border-color 0.15s;
  }

  .ctrl-input:focus {
    outline: none;
    border-color: var(--accent);
  }

  .ctrl-input:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .ctrl-select {
    padding: 0.375rem 0.5rem;
    background: var(--btn);
    border: 1px solid var(--border-color);
    border-radius: 0.375rem;
    color: var(--text);
    font-size: 0.82rem;
    cursor: pointer;
    transition: border-color 0.15s;
    min-width: 130px;
  }

  .ctrl-select:focus {
    outline: none;
    border-color: var(--accent);
  }

  .btn--ebu {
    width: 100%;
    justify-content: center;
    white-space: nowrap;
  }

  /* ── Effects strip ───────────────────────────────────── */
  .effects-strip {
    display: flex;
    gap: 0.375rem;
    flex-wrap: wrap;
  }

  .chip {
    padding: 0.3rem 0.75rem;
    background: var(--btn);
    border: 1px solid var(--border-color);
    border-radius: 9999px;
    color: var(--muted);
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .chip:hover:not(:disabled) {
    border-color: var(--accent);
    color: var(--accent);
    background: var(--panel-highlight);
  }

  .chip:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* ── File meta ───────────────────────────────────────── */
  .file-meta {
    font-size: 0.73rem;
    font-weight: 600;
    color: var(--muted);
    padding: 0 0.25rem;
  }

  .file-meta--empty {
    text-align: center;
    padding: 1.25rem;
    background: var(--panel);
    border: 1px dashed var(--border-color);
    border-radius: 0.5rem;
    font-size: 0.82rem;
  }

  /* ── File list ───────────────────────────────────────── */
  .file-list {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
    max-height: 580px;
    overflow-y: auto;
    padding-right: 0.25rem;
    scrollbar-width: thin;
    scrollbar-color: var(--border-color) transparent;
  }

  .file-list::-webkit-scrollbar {
    width: 5px;
  }
  .file-list::-webkit-scrollbar-track {
    background: transparent;
  }
  .file-list::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 3px;
  }
  .file-list::-webkit-scrollbar-thumb:hover {
    background: var(--accent);
  }

  /* ── Buttons ─────────────────────────────────────────── */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.45rem 0.875rem;
    border: none;
    border-radius: 0.4rem;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
    text-decoration: none;
  }

  .btn--sm {
    padding: 0.35rem 0.7rem;
    font-size: 0.75rem;
  }

  .btn--primary {
    background: var(--accent);
    color: var(--accent-text);
  }
  .btn--primary:hover:not(:disabled) {
    filter: brightness(1.1);
    transform: translateY(-1px);
  }

  .btn--accent {
    background: var(--btn);
    color: var(--text);
    border: 1px solid var(--border-color);
  }
  .btn--accent:hover:not(:disabled) {
    border-color: var(--accent);
    color: var(--accent);
  }

  .btn--ghost {
    background: var(--btn);
    color: var(--text);
    border: 1px solid var(--border-color);
  }
  .btn--ghost:hover:not(:disabled) {
    background: var(--btn-hover);
    transform: translateY(-1px);
  }

  .btn--danger {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }
  .btn--danger:hover:not(:disabled) {
    background: #ef4444;
    color: white;
    border-color: #ef4444;
  }

  .btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    transform: none !important;
    filter: none !important;
  }

  /* ── Loading overlay ─────────────────────────────────── */
  .loading-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.65);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    z-index: 9999;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 255, 255, 0.15);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  .loading-overlay p {
    color: white;
    font-size: 0.875rem;
    font-weight: 600;
    margin: 0;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* ── Responsive ──────────────────────────────────────── */
  @media (max-width: 640px) {
    .container {
      padding: 0.75rem;
    }

    .app-header {
      flex-wrap: wrap;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
    }

    .back-link,
    .header-controls-slot {
      position: static;
    }
    .header-titles {
      flex: 1;
      min-width: 0;
    }

    .drop-zone {
      flex-wrap: wrap;
    }
    .drop-label {
      flex: 1 0 100%;
    }

    .controls-row,
    .controls-row--bottom {
      grid-template-columns: 1fr;
    }

    .toolbar {
      gap: 0.375rem;
    }
    .toolbar .btn {
      flex: 1;
      justify-content: center;
    }
  }

  @media (max-width: 400px) {
    .app-subtitle {
      display: none;
    }
    .chip {
      font-size: 0.7rem;
      padding: 0.25rem 0.6rem;
    }
  }
</style>
