<template>
  <div class="file-item">
    <!-- Row 1: name + meters + remove -->
    <div class="item-header">
      <span class="file-name" :title="file.name">{{ file.name }}</span>
      <div class="meters">
        <div class="meter-group">
          <span class="meter-tag">Peak</span>
          <div class="meter-bar">
            <div
              class="meter-fill meter-fill--peak"
              :style="{ width: Math.min((file.peak || 0) * 100, 100) + '%' }"
            />
          </div>
          <span class="meter-val">{{ (file.peak || 0).toFixed(2) }}</span>
        </div>
        <div class="meter-group">
          <span class="meter-tag">RMS</span>
          <div class="meter-bar">
            <div
              class="meter-fill meter-fill--rms"
              :style="{ width: Math.min((file.rms || 0) * 100, 100) + '%' }"
            />
          </div>
          <span class="meter-val">{{ (file.rms || 0).toFixed(2) }}</span>
        </div>
      </div>
      <button class="remove-btn" title="Entfernen" @click="$emit('remove', file)">
        <X :size="12" />
      </button>
    </div>

    <!-- Row 2: controls -->
    <div class="item-controls">
      <div class="input-pair">
        <label class="input-label">{{ t('app.rms') }}</label>
        <input
          v-model.number="localRms"
          type="number"
          step="0.01"
          min="0"
          max="1"
          class="item-input"
        />
      </div>
      <div class="input-pair">
        <label class="input-label">{{ t('app.peak') }}</label>
        <input
          type="number"
          :value="file.peak?.toFixed(3)"
          readonly
          class="item-input item-input--readonly"
        />
      </div>
      <button class="item-btn item-btn--accent" @click="applyValues">{{ t('app.apply') }}</button>
      <button
        class="item-btn item-btn--toggle"
        :title="isNormalizedPlaying ? t('app.playOriginal') : t('app.playNormalized')"
        @click="togglePlayback"
      >
        <component :is="isNormalizedPlaying ? Music : Music2" :size="13" />
        {{ isNormalizedPlaying ? t('app.playOriginal') : t('app.playNormalized') }}
      </button>
      <button class="item-btn item-btn--export" @click="$emit('export', file)">
        <Download :size="13" />{{ t('app.export') }}
      </button>
    </div>

    <!-- Row 3: audio player -->
    <audio
      :ref="(el) => (audioRef = el as HTMLAudioElement | null)"
      controls
      :src="currentAudioSrc"
      class="audio-player"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { X, Download, Music, Music2 } from 'lucide-vue-next'
  import { useI18n } from '../composables/useI18n'

  const props = defineProps({
    file: { type: Object, required: true },
  })

  const emit = defineEmits(['update', 'remove', 'export'])

  const { t } = useI18n()

  const localRms = ref(props.file.rms || 0)
  const isNormalizedPlaying = ref(false)
  const audioRef = ref<HTMLAudioElement | null>(null)

  watch(
    () => props.file.rms,
    (v) => {
      localRms.value = v
    },
  )

  const currentAudioSrc = computed(() => {
    if (isNormalizedPlaying.value && props.file.processedBlobUrl) {
      return props.file.processedBlobUrl
    }
    return props.file.originalBlobUrl || URL.createObjectURL(props.file.file)
  })

  const applyValues = () => {
    emit('update', { ...props.file, targetRms: localRms.value })
  }

  const togglePlayback = () => {
    isNormalizedPlaying.value = !isNormalizedPlaying.value
    if (audioRef.value) {
      audioRef.value.pause()
      audioRef.value.currentTime = 0
      audioRef.value.play().catch((err: Error) => {
        if (err.name !== 'AbortError') console.error('Playback error:', err)
      })
    }
  }
</script>

<style scoped>
  .file-item {
    background: var(--panel);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    padding: 0.625rem 0.875rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    transition: border-color 0.15s;
  }

  .file-item:hover {
    border-color: var(--accent);
  }

  /* ── Row 1 ─────────────────────────────────────────── */
  .item-header {
    display: grid;
    grid-template-columns: 1fr auto auto;
    align-items: center;
    gap: 0.625rem;
  }

  .file-name {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  .meters {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 160px;
  }

  .meter-group {
    display: grid;
    grid-template-columns: 2.5rem 1fr 2.5rem;
    align-items: center;
    gap: 0.375rem;
  }

  .meter-tag {
    font-size: 0.62rem;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .meter-bar {
    height: 4px;
    background: var(--btn);
    border-radius: 2px;
    overflow: hidden;
  }

  .meter-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  .meter-fill--peak {
    background: linear-gradient(90deg, var(--accent), #e8b06a);
  }
  .meter-fill--rms {
    background: linear-gradient(90deg, var(--accent-secondary), #4a90d9);
  }

  .meter-val {
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--text);
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .remove-btn {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 1px solid var(--border-color);
    background: transparent;
    color: var(--muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.15s ease;
  }

  .remove-btn:hover {
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.4);
    color: #ef4444;
  }

  /* ── Row 2 ─────────────────────────────────────────── */
  .item-controls {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    flex-wrap: wrap;
  }

  .input-pair {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .input-label {
    font-size: 0.6rem;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .item-input {
    width: 72px;
    padding: 0.3rem 0.4rem;
    background: var(--btn);
    border: 1px solid var(--border-color);
    border-radius: 0.3rem;
    color: var(--text);
    font-size: 0.78rem;
    transition: border-color 0.15s;
  }

  .item-input:focus {
    outline: none;
    border-color: var(--accent);
  }

  .item-input--readonly {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .item-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.3rem 0.6rem;
    border: 1px solid var(--border-color);
    border-radius: 0.3rem;
    font-size: 0.73rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
    align-self: flex-end;
  }

  .item-btn--accent {
    background: var(--btn);
    color: var(--text);
  }
  .item-btn--accent:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  .item-btn--toggle {
    background: var(--btn);
    color: var(--muted);
  }
  .item-btn--toggle:hover {
    border-color: var(--accent-secondary);
    color: var(--accent-secondary);
  }

  .item-btn--export {
    background: rgba(34, 197, 94, 0.1);
    color: #22c55e;
    border-color: rgba(34, 197, 94, 0.3);
  }
  .item-btn--export:hover {
    background: #22c55e;
    color: white;
    border-color: #22c55e;
  }

  /* ── Row 3 ─────────────────────────────────────────── */
  .audio-player {
    width: 100%;
    height: 32px;
    border-radius: 0.3rem;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--border-color);
    color-scheme: dark;
  }

  [data-theme='light'] .audio-player {
    background: var(--btn);
    color-scheme: light;
  }

  /* ── Responsive ──────────────────────────────────────── */
  @media (max-width: 640px) {
    .item-header {
      grid-template-columns: 1fr auto;
    }
    .meters {
      display: none;
    }

    .item-controls {
      gap: 0.3rem;
    }
    .item-input {
      width: 60px;
    }
  }
</style>
