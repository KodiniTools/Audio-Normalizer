<template>
  <div class="file-item">
    <div class="file-header">
      <h3 class="file-name">{{ file.name }}</h3>
      <button @click="$emit('remove', file)" class="remove-btn" title="Entfernen">
        ✕
      </button>
    </div>
    
    <!-- Manual Inputs -->
    <div class="manual-inputs">
      <div class="input-group">
        <label>{{ t('app.rms') }}</label>
        <input 
          type="number" 
          v-model.number="localRms" 
          step="0.01" 
          min="0" 
          max="1" 
        />
      </div>
      
      <div class="input-group">
        <label>{{ t('app.peak') }}</label>
        <input 
          type="number" 
          :value="file.peak?.toFixed(3)" 
          readonly 
        />
      </div>
      
      <button @click="applyValues" class="apply-btn">
        {{ t('app.apply') }}
      </button>
    </div>

    <!-- Meters -->
    <div class="meters">
      <!-- Peak Bar -->
      <div class="meter">
        <div class="meter-label">{{ t('app.peak') }}</div>
        <div class="meter-bar">
          <div 
            class="meter-fill" 
            :style="{ width: Math.min((file.peak || 0) * 100, 100) + '%' }"
          ></div>
        </div>
        <div class="meter-value">{{ (file.peak || 0).toFixed(2) }}</div>
      </div>

      <!-- RMS Bar -->
      <div class="meter">
        <div class="meter-label">{{ t('app.rms') }}</div>
        <div class="meter-bar">
          <div 
            class="meter-fill rms" 
            :style="{ width: Math.min((file.rms || 0) * 100, 100) + '%' }"
          ></div>
        </div>
        <div class="meter-value">{{ (file.rms || 0).toFixed(2) }}</div>
      </div>
    </div>

    <!-- Audio Preview -->
    <audio 
      :ref="el => audioRef = el"
      controls 
      :src="currentAudioSrc"
      class="audio-player"
    ></audio>

    <!-- File Controls -->
    <div class="file-controls">
      <button @click="togglePlayback" class="control-btn secondary">
        {{ isNormalizedPlaying ? t('app.playOriginal') : t('app.playNormalized') }}
      </button>
      <button @click="$emit('export', file)" class="control-btn primary">
        {{ t('app.export') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from '../composables/useI18n'

const props = defineProps({
  file: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update', 'remove', 'export'])

const { t } = useI18n()

const localRms = ref(props.file.rms || 0)
const isNormalizedPlaying = ref(false)
const audioRef = ref(null)

watch(() => props.file.rms, (newRms) => {
  localRms.value = newRms
})

const currentAudioSrc = computed(() => {
  if (isNormalizedPlaying.value && props.file.processedBlobUrl) {
    return props.file.processedBlobUrl
  }
  return props.file.originalBlobUrl || URL.createObjectURL(props.file.file)
})

const applyValues = () => {
  emit('update', {
    ...props.file,
    targetRms: localRms.value
  })
}

const togglePlayback = () => {
  isNormalizedPlaying.value = !isNormalizedPlaying.value
  
  // Stop and replay
  if (audioRef.value) {
    audioRef.value.pause()
    audioRef.value.currentTime = 0
    audioRef.value.play().catch(err => {
      if (err.name !== 'AbortError') {
        console.error('Playback error:', err)
      }
    })
  }
}
</script>

<style scoped>
.file-item {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 0.75rem;
  transition: all 0.2s ease;
}

.file-item:hover {
  border-color: var(--primary);
  box-shadow: 0 2px 8px rgba(201, 152, 77, 0.15);
}

/* Header */
.file-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  gap: 0.5rem;
}

.file-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.remove-btn {
  width: 28px;
  height: 28px;
  min-width: 28px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.remove-btn:hover {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
  transform: scale(1.05);
}

/* Manual Inputs */
.manual-inputs {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.input-group label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.input-group input {
  padding: 0.4rem 0.5rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 0.375rem;
  color: var(--text-primary);
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.input-group input:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(201, 152, 77, 0.15);
}

.input-group input:read-only {
  cursor: not-allowed;
  opacity: 0.7;
}

.apply-btn {
  padding: 0 1rem;
  background: var(--primary);
  color: var(--bg-primary);
  border: none;
  border-radius: 0.375rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  align-self: end;
  white-space: nowrap;
  text-transform: lowercase;
}

.apply-btn:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
}

/* Meters */
.meters {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.meter {
  display: grid;
  grid-template-columns: 3rem 1fr 3rem;
  align-items: center;
  gap: 0.5rem;
}

.meter-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.meter-bar {
  height: 6px;
  background: var(--bg-secondary);
  border-radius: 3px;
  overflow: hidden;
  position: relative;
}

.meter-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary), var(--primary-secondary, #014f99));
  border-radius: 3px;
  transition: width 0.3s ease;
}

.meter-fill.rms {
  background: linear-gradient(90deg, var(--primary-secondary, #014f99), var(--success));
}

.meter-value {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-primary);
  text-align: right;
  font-variant-numeric: tabular-nums;
}

/* Audio Player */
.audio-player {
  width: 100%;
  height: 36px;
  margin-bottom: 0.75rem;
  border-radius: 0.375rem;
  background: var(--bg-secondary);
}

.audio-player::-webkit-media-controls-panel {
  background: var(--bg-secondary);
}

/* File Controls */
.file-controls {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.control-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  text-transform: lowercase;
}

.control-btn.primary {
  background: var(--success);
  color: white;
}

.control-btn.primary:hover {
  background: #16a34a;
  transform: translateY(-1px);
}

.control-btn.secondary {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border);
}

.control-btn.secondary:hover {
  background: var(--primary);
  color: var(--bg-primary);
  border-color: var(--primary);
  transform: translateY(-1px);
}

/* Responsive */
@media (max-width: 640px) {
  .manual-inputs {
    grid-template-columns: 1fr;
  }
  
  .file-controls {
    grid-template-columns: 1fr;
  }
  
  .meter {
    grid-template-columns: 2.5rem 1fr 2.5rem;
  }
}
</style>
