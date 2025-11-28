<template>
  <div class="audio-app">
    <div class="app-header">
      <div class="container">
        <router-link to="/" class="back-link">
          ← {{ t('nav.backToHome') }}
        </router-link>
        <div class="section-header">
          <h1 class="section-title">{{ t('app.title') }}</h1>
          <p class="section-subtitle">{{ t('app.subtitle') }}</p>
        </div>
      </div>
    </div>

    <section class="app-section">
      <div class="container">
        <div class="app-container">
          <!-- File Input -->
          <div 
            class="file-input-wrapper"
            @drop.prevent="handleDrop"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            :class="{ 'dragging': isDragging }"
          >
            <input 
              type="file" 
              ref="fileInputRef"
              @change="handleFiles" 
              accept="audio/*" 
              multiple 
              style="display: none"
            />
            <div class="file-input-content" @click="$refs.fileInputRef.click()">
              <Upload class="file-input-icon" :size="48" :stroke-width="1.5" />
              <p class="file-input-text">{{ t('app.selectFiles') }}</p>
            </div>
          </div>

          <!-- Progress Bar -->
          <div v-if="showProgress" class="progress-container">
            <div class="progress-header">
              <span class="progress-label">{{ progressLabel }}</span>
              <span class="progress-percentage">{{ Math.round(progress) }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-bar-fill" :style="{ width: progress + '%' }"></div>
            </div>
          </div>

          <!-- Main Actions -->
          <div class="action-group">
            <button @click="exportAll" class="btn btn-primary">
              {{ t('app.exportAll') }}
            </button>
            <button @click="deleteAll" class="btn btn-danger">
              {{ t('app.deleteAll') }}
            </button>
            <button @click="resetAll" class="btn btn-secondary">
              {{ t('app.resetAll') }}
            </button>
          </div>

          <!-- Global Controls -->
          <div class="control-section">
            <div class="control-grid">
              <div class="control-item">
                <label>{{ t('app.globalRms') }}</label>
                <div class="control-input-group">
                  <input 
                    type="number" 
                    v-model.number="globalRmsValue" 
                    step="0.01" 
                    min="0" 
                    max="1" 
                    class="control-input"
                  />
                  <button @click="applyGlobalRms" class="btn btn-sm btn-secondary">
                    {{ t('app.applyRms') }}
                  </button>
                </div>
              </div>

              <div class="control-item">
                <label>{{ t('app.globalDb') }}</label>
                <div class="control-input-group">
                  <input 
                    type="number" 
                    v-model.number="globalDbValue" 
                    step="1" 
                    min="-60" 
                    max="0" 
                    class="control-input"
                  />
                  <button @click="applyGlobalDb" class="btn btn-sm btn-secondary">
                    {{ t('app.applyDb') }}
                  </button>
                </div>
              </div>
            </div>

            <div class="control-item">
              <label>{{ t('app.applyEBU') }}</label>
              <button @click="applyEBUR128" class="btn btn-primary btn-block">
                {{ t('app.applyEBU') }}
              </button>
            </div>
          </div>

          <!-- Effect Controls -->
          <div class="action-group">
            <button @click="analyzeAll" class="btn btn-secondary">
              {{ t('app.analyzeAll') }}
            </button>
            <button @click="applyNoiseReductionAll" class="btn btn-secondary">
              {{ t('app.noiseReduction') }}
            </button>
            <button @click="reduceClippingAll" class="btn btn-secondary">
              {{ t('app.reduceClipping') }}
            </button>
            <button @click="applyDynamicCompressionAll" class="btn btn-secondary">
              {{ t('app.dynamicCompression') }}
            </button>
          </div>

          <!-- Download Format -->
          <div class="control-section">
            <div class="control-item">
              <label>{{ t('app.downloadFormat') }}</label>
              <select v-model="downloadFormat" class="select-input">
                <option value="wav">WAV</option>
                <option value="mp3">MP3 (320 kbps)</option>
              </select>
            </div>
          </div>

          <!-- File Count -->
          <div class="file-count">
            <template v-if="audioFiles.length === 0">
              {{ t('app.noFiles') }}
            </template>
            <template v-else>
              {{ t('app.fileCount', { count: audioFiles.length }) }}
            </template>
          </div>

          <!-- File List -->
          <div class="file-list">
            <AudioFileItem
              v-for="file in audioFiles"
              :key="file.id"
              :file="file"
              @update="updateFile"
              @remove="removeFile"
              @export="exportFile"
            />
          </div>

          <!-- Status Message -->
          <div v-if="statusMessage" class="status-message">
            {{ statusMessage }}
          </div>
        </div>
      </div>
    </section>

    <!-- Loading Spinner -->
    <div v-if="isLoading" class="loading-spinner">
      <div class="spinner"></div>
      <p>{{ loadingMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Upload } from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n'
import { useAudioProcessor } from '../composables/useAudioProcessor'
import AudioFileItem from '../components/AudioFileItem.vue'

const { t } = useI18n()

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
  handleFilesInput,
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
  exportFile
} = useAudioProcessor()

const fileInputRef = ref(null)
const isDragging = ref(false)

const handleFiles = (event) => {
  const files = event.target.files
  if (files && files.length > 0) {
    handleFilesInput(Array.from(files))
  }
  event.target.value = ''
}

const handleDrop = (event) => {
  isDragging.value = false
  const files = event.dataTransfer.files
  if (files && files.length > 0) {
    handleFilesInput(Array.from(files))
  }
}
</script>

<style scoped>
/* Container */
.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 1.5rem;
}

.app-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Header */
.back-link {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  color: var(--text-primary);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s ease;
  margin-bottom: 1rem;
}

.back-link:hover {
  background: var(--primary);
  color: var(--bg-primary);
  border-color: var(--primary);
  transform: translateY(-1px);
}

.section-header {
  margin-bottom: 1rem;
}

.section-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.section-subtitle {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
}

/* File Input */
.file-input-wrapper {
  background: var(--bg-card);
  border: 2px dashed var(--border);
  border-radius: 0.75rem;
  padding: 2rem;
  transition: all 0.2s ease;
  cursor: pointer;
}

.file-input-wrapper:hover {
  border-color: var(--primary);
  background: var(--bg-secondary);
}

.file-input-wrapper.dragging {
  border-color: var(--primary);
  background: var(--bg-secondary);
  transform: scale(1.01);
}

.file-input-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.file-input-icon {
  color: var(--primary);
  opacity: 0.9;
}

.file-input-text {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
  font-weight: 500;
}

/* Progress */
.progress-container {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  padding: 1rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.progress-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
}

.progress-percentage {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--primary);
  font-variant-numeric: tabular-nums;
}

.progress-bar {
  height: 8px;
  background: var(--bg-secondary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--primary-secondary, #A28680));
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* Buttons */
.btn {
  padding: 0.6rem 1.25rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  text-transform: lowercase;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn:active {
  transform: translateY(0);
}

.btn-primary {
  background: var(--primary);
  color: var(--bg-primary);
}

.btn-primary:hover {
  background: var(--primary-dark);
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.btn-secondary:hover {
  background: var(--bg-card);
  border-color: var(--primary);
  color: var(--primary);
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-sm {
  padding: 0.4rem 0.75rem;
  font-size: 0.8rem;
}

.btn-block {
  width: 100%;
}

/* Action Group */
.action-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
}

/* Control Section */
.control-section {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.control-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
}

.control-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-item label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.control-input-group {
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
}

.control-input {
  flex: 1;
  min-width: 0;
  padding: 0.5rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 0.375rem;
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.control-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

.control-input-group .btn {
  flex-shrink: 0;
  white-space: nowrap;
}

.select-input {
  padding: 0.5rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 0.375rem;
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
}

.select-input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
}

/* File Count */
.file-count {
  text-align: center;
  padding: 0.75rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
}

/* File List */
.file-list {
  max-height: 600px;
  overflow-y: auto;
  padding: 0.5rem;
  background: var(--bg-secondary);
  border-radius: 0.75rem;
  border: 1px solid var(--border);
}

/* Scrollbar Styling */
.file-list::-webkit-scrollbar {
  width: 8px;
}

.file-list::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}

.file-list::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 4px;
  transition: background 0.2s ease;
}

.file-list::-webkit-scrollbar-thumb:hover {
  background: var(--primary);
}

/* Firefox Scrollbar */
.file-list {
  scrollbar-width: thin;
  scrollbar-color: var(--border) transparent;
}

/* Status Message */
.status-message {
  padding: 0.75rem 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  font-size: 0.875rem;
  color: var(--text-primary);
  text-align: center;
}

/* Loading Spinner */
.loading-spinner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  z-index: 9999;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-spinner p {
  color: white;
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }

  .section-title {
    font-size: 1.5rem;
  }

  .action-group {
    grid-template-columns: 1fr;
  }

  .control-grid {
    grid-template-columns: 1fr;
  }

  .file-input-wrapper {
    padding: 1.5rem;
  }

  .file-input-icon {
    font-size: 2rem;
  }
}
</style>
