<template>
  <div class="app-page">
    <!-- Navigation -->
    <nav class="nav">
      <div class="nav-container">
        <router-link to="/" class="btn-back">
          ← {{ t('app-back') }}
        </router-link>
        <h2>{{ t('app-title') }}</h2>
      </div>
    </nav>

    <!-- Main Content -->
    <div class="container">
      <div class="app-content">
        <!-- File Upload Section -->
        <section class="upload-section">
          <div class="upload-area" @dragover.prevent @drop.prevent="handleDrop">
            <input 
              type="file" 
              ref="fileInput" 
              multiple 
              accept="audio/*"
              @change="handleFileSelect"
              style="display: none"
            />
            <div v-if="files.length === 0" class="upload-placeholder">
              <div class="upload-icon">📁</div>
              <p>{{ t('app-drag-drop') }}</p>
              <button @click="$refs.fileInput.click()" class="btn-upload">
                {{ t('app-upload') }}
              </button>
            </div>
            <div v-else class="file-list">
              <div v-for="(file, index) in files" :key="index" class="file-item">
                <span class="file-name">{{ file.name }}</span>
                <button @click="removeFile(index)" class="btn-remove">✕</button>
              </div>
              <button @click="$refs.fileInput.click()" class="btn-add-more">
                + {{ t('app-upload') }}
              </button>
            </div>
          </div>
        </section>

        <!-- Settings Section -->
        <section class="settings-section">
          <div class="setting-group">
            <label>{{ t('app-target-level') }}</label>
            <input 
              v-model.number="targetLevel" 
              type="range" 
              min="-20" 
              max="0" 
              step="0.5"
              class="slider"
            />
            <span class="setting-value">{{ targetLevel }} dB</span>
          </div>

          <div class="setting-group">
            <label>{{ t('app-silence-threshold') }}</label>
            <input 
              v-model.number="silenceThreshold" 
              type="range" 
              min="-60" 
              max="-20" 
              step="1"
              class="slider"
            />
            <span class="setting-value">{{ silenceThreshold }} dB</span>
          </div>

          <div class="setting-group">
            <label class="checkbox-label">
              <input 
                v-model="removeSilence" 
                type="checkbox"
              />
              <span>{{ t('app-remove-silence') }}</span>
            </label>
          </div>
        </section>

        <!-- Action Buttons -->
        <section class="action-section">
          <button 
            @click="processFiles" 
            :disabled="files.length === 0 || isProcessing"
            class="btn-process"
          >
            {{ isProcessing ? t('app-processing') : t('app-normalize') }}
          </button>
          
          <button 
            v-if="processedFiles.length > 0"
            @click="downloadAll"
            class="btn-download"
          >
            {{ t('app-download') }}
          </button>
        </section>

        <!-- Progress Section -->
        <section v-if="isProcessing" class="progress-section">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progress + '%' }"></div>
          </div>
          <p class="progress-text">{{ progress }}%</p>
        </section>

        <!-- Results Section -->
        <section v-if="processedFiles.length > 0" class="results-section">
          <h3>{{ t('app-download') }}</h3>
          <div class="results-list">
            <div v-for="(file, index) in processedFiles" :key="index" class="result-item">
              <span>{{ file.name }}</span>
              <button @click="downloadFile(file)" class="btn-download-single">
                ⬇️ {{ t('app-download') }}
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from '../i18n'

const { t, setLocale, currentLocale } = useI18n()
const fileInput = ref(null)
const files = ref([])
const processedFiles = ref([])
const isProcessing = ref(false)
const progress = ref(0)

// Settings
const targetLevel = ref(-3)
const silenceThreshold = ref(-40)
const removeSilence = ref(false)

const handleFileSelect = (event) => {
  const selectedFiles = Array.from(event.target.files)
  files.value.push(...selectedFiles)
}

const handleDrop = (event) => {
  const droppedFiles = Array.from(event.dataTransfer.files)
  files.value.push(...droppedFiles.filter(f => f.type.startsWith('audio/')))
}

const removeFile = (index) => {
  files.value.splice(index, 1)
}

const processFiles = async () => {
  isProcessing.value = true
  progress.value = 0
  processedFiles.value = []

  for (let i = 0; i < files.value.length; i++) {
    // Simulate processing (in real app, this would be actual audio processing)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    processedFiles.value.push({
      name: files.value[i].name.replace(/\.[^/.]+$/, '_normalized.mp3'),
      blob: files.value[i] // In real app, this would be the processed blob
    })
    
    progress.value = Math.round(((i + 1) / files.value.length) * 100)
  }

  isProcessing.value = false
}

const downloadFile = (file) => {
  const url = URL.createObjectURL(file.blob)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.click()
  URL.revokeObjectURL(url)
}

const downloadAll = () => {
  processedFiles.value.forEach(file => {
    downloadFile(file)
  })
}
</script>

<style scoped>
/* Variables are inherited from root */

.app-page {
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  position: relative;
  z-index: 1;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
}

/* Navigation */
.nav {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  padding: 1rem 0;
}

.nav-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-container h2 {
  margin: 0;
  font-size: 1.5rem;
}

.btn-back {
  padding: 0.5rem 1rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  color: var(--text-primary);
  text-decoration: none;
  transition: all 0.2s;
}

.btn-back:hover {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

/* App Content */
.app-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Upload Section */
.upload-section {
  background: var(--bg-card);
  border: 2px dashed var(--border);
  border-radius: 1rem;
  padding: 2rem;
}

.upload-area {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-placeholder {
  text-align: center;
}

.upload-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.upload-placeholder p {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.btn-upload {
  padding: 0.75rem 2rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-upload:hover {
  background: var(--primary-dark);
  transform: translateY(-2px);
}

[data-theme="light"] .btn-upload {
  color: black !important;
}

/* File List */
.file-list {
  width: 100%;
}

.file-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  margin-bottom: 0.5rem;
}

.file-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.btn-remove {
  padding: 0.25rem 0.75rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-remove:hover {
  background: #dc2626;
}

.btn-add-more {
  width: 100%;
  padding: 1rem;
  background: var(--bg-secondary);
  border: 1px dashed var(--border);
  border-radius: 0.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 1rem;
}

.btn-add-more:hover {
  background: var(--bg-primary);
  border-color: var(--primary);
  color: var(--primary);
}

/* Settings Section */
.settings-section {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 1rem;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.setting-group label {
  font-weight: 600;
  color: var(--text-primary);
}

.slider {
  width: 100%;
  height: 8px;
  border-radius: 5px;
  background: var(--bg-secondary);
  outline: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--primary);
  cursor: pointer;
}

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--primary);
  cursor: pointer;
  border: none;
}

.setting-value {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--primary);
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

/* Action Section */
.action-section {
  display: flex;
  gap: 1rem;
}

.btn-process,
.btn-download {
  flex: 1;
  padding: 1rem 2rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-process {
  background: var(--primary);
  color: white;
}

.btn-process:hover:not(:disabled) {
  background: var(--primary-dark);
  transform: translateY(-2px);
}

.btn-process:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-download {
  background: var(--success);
  color: white;
}

.btn-download:hover {
  background: #16a34a;
  transform: translateY(-2px);
}

[data-theme="light"] .btn-process {
  color: black !important;
}

[data-theme="light"] .btn-download {
  color: black !important;
}

/* Progress Section */
.progress-section {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 1rem;
  padding: 2rem;
}

.progress-bar {
  width: 100%;
  height: 30px;
  background: var(--bg-secondary);
  border-radius: 15px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--success));
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--primary);
}

/* Results Section */
.results-section {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 1rem;
  padding: 2rem;
}

.results-section h3 {
  margin-bottom: 1rem;
  font-size: 1.5rem;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.result-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
}

.btn-download-single {
  padding: 0.5rem 1rem;
  background: var(--success);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-download-single:hover {
  background: #16a34a;
  transform: translateY(-2px);
}

[data-theme="light"] .btn-download-single {
  color: black !important;
}

/* Responsive */
@media (max-width: 768px) {
  .action-section {
    flex-direction: column;
  }
  
  .nav-container {
    flex-wrap: wrap;
    gap: 1rem;
  }
}
</style>
