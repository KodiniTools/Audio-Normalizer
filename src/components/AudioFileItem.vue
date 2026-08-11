<template>
  <div
    class="file-item"
    :class="{ 'file-item--active': isActive, 'file-item--selected': file.selected }"
  >
    <!-- Row 1: select + play + name + meters + remove -->
    <div class="item-header">
      <input
        type="checkbox"
        class="item-check"
        :checked="file.selected"
        :aria-label="t('app.selectFile')"
        @change="$emit('toggle-select', file.id)"
      />

      <button
        class="play-btn"
        :class="{ 'play-btn--active': isActive }"
        :title="t('app.play')"
        @click="$emit('play', file.id)"
      >
        <component :is="isActive ? Volume2 : Play" :size="13" />
      </button>

      <div class="name-block">
        <span class="file-name" :title="file.name">{{ file.name }}</span>
        <span class="file-sub">
          {{ formatTime(file.duration) }}
          <span v-if="file.processed" class="proc-badge">{{ t('app.processedBadge') }}</span>
        </span>
      </div>

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
        <div v-if="file.lufs != null" class="meter-group meter-group--lufs">
          <span class="meter-tag">LUFS</span>
          <span class="meter-val meter-val--lufs">{{ file.lufs.toFixed(1) }}</span>
        </div>
      </div>

      <button class="remove-btn" :title="t('app.removeFile')" @click="$emit('remove', file)">
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
        v-if="file.processed"
        class="item-btn item-btn--reset"
        :title="t('app.resetFile')"
        @click="$emit('reset', file)"
      >
        <RotateCcw :size="13" />{{ t('app.reset') }}
      </button>
      <div class="input-pair">
        <label class="input-label">{{ t('app.format') }}</label>
        <select v-model="localFormat" class="item-select" :aria-label="t('app.downloadFormat')">
          <option value="wav">WAV</option>
          <option value="mp3">MP3 320 kbps</option>
          <option value="webm">WebM / Opus</option>
        </select>
      </div>
      <button class="item-btn item-btn--export" @click="$emit('export', file, localFormat)">
        <Download :size="13" />{{ t('app.export') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { X, Download, Play, Volume2, RotateCcw } from 'lucide-vue-next'
  import { useI18n } from '../composables/useI18n'

  const props = defineProps({
    file: { type: Object, required: true },
    isActive: { type: Boolean, default: false },
    defaultFormat: { type: String, default: 'wav' },
  })

  const emit = defineEmits(['update', 'reset', 'remove', 'export', 'toggle-select', 'play'])

  const { t } = useI18n()

  const localRms = ref(props.file.rms || 0)
  // Per-file export format, seeded from the global default at mount time.
  const localFormat = ref(props.defaultFormat)

  watch(
    () => props.file.rms,
    (v) => {
      localRms.value = v
    },
  )

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || seconds < 0) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const applyValues = () => {
    emit('update', { ...props.file, targetRms: localRms.value })
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
    transition:
      border-color 0.15s,
      background 0.15s;
  }

  .file-item:hover {
    border-color: var(--accent);
  }

  .file-item--selected {
    background: var(--panel-highlight);
  }

  .file-item--active {
    border-color: var(--accent);
    box-shadow: inset 3px 0 0 var(--accent);
  }

  /* ── Row 1 ─────────────────────────────────────────── */
  .item-header {
    display: grid;
    grid-template-columns: auto auto 1fr auto auto;
    align-items: center;
    gap: 0.625rem;
  }

  .item-check {
    width: 16px;
    height: 16px;
    accent-color: var(--accent);
    cursor: pointer;
    flex-shrink: 0;
  }

  .play-btn {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 1px solid var(--border-color);
    background: var(--btn);
    color: var(--text);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.15s ease;
  }

  .play-btn:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  .play-btn--active {
    background: var(--accent);
    color: var(--accent-text);
    border-color: var(--accent);
  }

  .name-block {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 0;
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

  .file-sub {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.65rem;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }

  .proc-badge {
    padding: 0.02rem 0.3rem;
    border-radius: 9999px;
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
    font-size: 0.58rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
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

  /* LUFS has no bar — just a label and a right-aligned value spanning the row. */
  .meter-group--lufs {
    grid-template-columns: 2.5rem 1fr;
  }

  .meter-val--lufs {
    color: var(--accent);
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
    align-items: flex-end;
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

  .item-select {
    width: 112px;
    padding: 0.3rem 0.4rem;
    background: var(--btn);
    border: 1px solid var(--border-color);
    border-radius: 0.3rem;
    color: var(--text);
    font-size: 0.78rem;
    cursor: pointer;
    transition: border-color 0.15s;
  }

  .item-select:focus {
    outline: none;
    border-color: var(--accent);
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
  }

  .item-btn--accent {
    background: var(--btn);
    color: var(--text);
  }
  .item-btn--accent:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  .item-btn--reset {
    background: var(--btn);
    color: var(--muted);
  }
  .item-btn--reset:hover {
    border-color: #f59e0b;
    color: #f59e0b;
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

  /* ── Responsive ──────────────────────────────────────── */
  @media (max-width: 640px) {
    .item-header {
      grid-template-columns: auto auto 1fr auto;
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

  /* Larger tap targets for the playlist row controls on touch devices. */
  @media (pointer: coarse) {
    .item-check {
      width: 22px;
      height: 22px;
    }
    .play-btn {
      width: 40px;
      height: 40px;
    }
    .remove-btn {
      width: 38px;
      height: 38px;
    }
    .item-btn {
      min-height: 40px;
    }
  }
</style>
