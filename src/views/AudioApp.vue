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

          <!-- Toolbar -->
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

          <!-- Send-to panel -->
          <div class="send-to-panel">
            <div class="send-to-header">
              <span class="send-to-label">
                <ExternalLink :size="12" />
                {{ t('app.sendTo') }}
              </span>
              <span v-if="!hasNormalizedFiles && audioFiles.length > 0" class="send-to-hint">
                {{ t('app.sendToHint') }}
              </span>
            </div>
            <div class="send-to-actions">
              <button
                v-for="tool in TARGET_TOOLS"
                :key="tool.key"
                class="btn btn--send"
                :disabled="isProcessing || !hasNormalizedFiles || isSending"
                @click="sendToTool(tool)"
              >
                <component :is="sentToTool === tool.key ? CheckCircle : ExternalLink" :size="12" />
                {{
                  isSending && sentToTool !== tool.key
                    ? t('app.sendToSending')
                    : sentToTool === tool.key
                      ? t('app.sendToSent')
                      : t(`app.sendTo${tool.key.charAt(0).toUpperCase() + tool.key.slice(1)}`)
                }}
              </button>
            </div>
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

          <!-- Preset selector -->
          <PresetSelector
            :disabled="isProcessing || audioFiles.length === 0"
            @apply="store.applyPreset"
          />

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

          <!-- Hint: no file marked for editing -->
          <div
            v-if="audioFiles.length > 0 && !someSelected"
            class="alert alert--warning selection-hint"
          >
            <AlertTriangle :size="15" />
            <span>{{ t('app.noSelectionHint') }}</span>
          </div>

          <!-- File meta / empty state -->
          <div v-else class="file-meta file-meta--empty">
            {{ t('app.noFiles') }}
          </div>

          <!-- Interactive playlist -->
          <div v-if="audioFiles.length > 0" class="file-list">
            <AudioFileItem
              v-for="file in audioFiles"
              :key="file.id"
              :file="file"
              :is-active="file.id === currentTrackId"
              @update="updateFile"
              @remove="removeFile"
              @export="exportFile"
              @toggle-select="toggleSelect"
              @play="playTrack"
            />
          </div>

          <!-- Sticky player bar -->
          <PlayerBar v-if="audioFiles.length > 0" class="sticky-player" />

          <!-- Status toast -->
          <div v-if="statusMessage" class="alert alert--toast" :class="'alert--' + statusType">
            <component :is="statusIcons[statusType]" :size="15" />
            <span>{{ statusMessage }}</span>
          </div>
        </div>
      </div>
    </section>

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
    ExternalLink,
  } from 'lucide-vue-next'
  import { useI18n } from '../composables/useI18n'
  import { useAudioStore } from '../stores/audioStore'
  import { useFileDrop } from '../composables/useFileDrop'
  import { useSharedFiles } from '../composables/useSharedFiles'
  import AudioFileItem from '../components/AudioFileItem.vue'
  import PlayerBar from '../components/PlayerBar.vue'
  import HeaderControls from '../components/HeaderControls.vue'
  import PresetSelector from '../components/PresetSelector.vue'
  import { useSendToTool, TARGET_TOOLS } from '../composables/useSendToTool'

  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()

  const store = useAudioStore()
  const {
    audioFiles,
    globalRmsValue,
    globalDbValue,
    downloadFormat,
    isLoading,
    loadingMessage,
    loadingProgress,
    statusMessage,
    statusType,
    isProcessing,
    r128Applied,
    allSelected,
    someSelected,
    selectedCount,
    processedCount,
    currentTrackId,
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
    toggleSelect,
    toggleSelectAll,
    playTrack,
  } = store

  const { fileInputRef, folderInputRef, isDragging, handleFiles, handleDrop } =
    useFileDrop(handleFilesInput)

  const { sharedBanner } = useSharedFiles(handleSharedFiles, t, route, router)

  const { isSending, sentToTool, hasNormalizedFiles, sendToTool } = useSendToTool(
    () => audioFiles.value,
  )

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

  .drop-label-group {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .drop-label {
    font-size: 0.82rem;
    color: var(--muted);
    font-weight: 500;
  }

  .drop-paste-hint {
    font-size: 0.7rem;
    color: var(--muted);
    opacity: 0.6;
  }

  .drop-actions {
    display: flex;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  /* ── Toolbar ─────────────────────────────────────────── */
  .toolbar {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  /* ── Send-to panel ───────────────────────────────────── */
  .send-to-panel {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: var(--panel);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
  }

  .send-to-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .send-to-hint {
    font-size: 0.68rem;
    color: var(--muted);
    opacity: 0.7;
    font-style: italic;
  }

  .send-to-label {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    font-size: 0.7rem;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .send-to-actions {
    display: flex;
    gap: 0.375rem;
    flex-wrap: wrap;
  }

  .btn--send {
    background: var(--btn);
    color: var(--text);
    border: 1px solid var(--border-color);
    font-size: 0.73rem;
  }
  .btn--send:hover:not(:disabled) {
    border-color: var(--accent);
    color: var(--accent);
    background: var(--panel-highlight);
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

  /* ── Playlist header ─────────────────────────────────── */
  .playlist-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.4rem 0.6rem;
    background: var(--panel);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
  }

  .select-all {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.73rem;
    font-weight: 600;
    color: var(--text);
    cursor: pointer;
  }

  .select-all input {
    width: 16px;
    height: 16px;
    accent-color: var(--accent);
    cursor: pointer;
  }

  .playlist-count {
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }

  .count-pill {
    padding: 0.02rem 0.4rem;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.22);
    font-size: 0.68rem;
    font-weight: 700;
    line-height: 1.3;
  }

  .selection-hint {
    font-size: 0.75rem;
  }

  /* ── Sticky player bar ───────────────────────────────── */
  .sticky-player {
    margin-top: 0.25rem;
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
    align-items: center;
    justify-content: center;
    z-index: 9999;
    backdrop-filter: blur(2px);
  }

  .loading-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    width: min(90vw, 340px);
    padding: 1.75rem 1.5rem;
    background: var(--panel);
    border: 1px solid var(--border-color);
    border-radius: 0.9rem;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.45);
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid var(--btn);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  .loading-message {
    color: var(--text);
    font-size: 0.85rem;
    font-weight: 600;
    margin: 0;
    text-align: center;
    line-height: 1.35;
  }

  .loading-progress {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    width: 100%;
  }

  .loading-progress-track {
    flex: 1;
    height: 6px;
    background: var(--btn);
    border-radius: 3px;
    overflow: hidden;
  }

  .loading-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent), var(--accent-secondary));
    border-radius: 3px;
    transition: width 0.25s ease;
  }

  .loading-progress-fill--indeterminate {
    width: 40%;
    animation: indeterminate 1.1s ease-in-out infinite;
  }

  .loading-progress-pct {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--accent);
    font-variant-numeric: tabular-nums;
    min-width: 2.6rem;
    text-align: right;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes indeterminate {
    0% {
      margin-left: -40%;
    }
    100% {
      margin-left: 100%;
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
