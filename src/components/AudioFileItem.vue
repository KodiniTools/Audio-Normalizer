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
    background: var(--ds-surface-1);
    border: var(--ds-border-width) solid var(--ds-border);
    border-radius: var(--ds-radius-md);
    padding: var(--ds-space-3) var(--ds-space-4);
    display: flex;
    flex-direction: column;
    gap: var(--ds-space-2);
    transition:
      border-color var(--ds-duration) var(--ds-ease),
      background-color var(--ds-duration) var(--ds-ease);
  }

  .file-item:hover {
    border-color: var(--ds-border-strong);
  }

  .file-item--selected {
    background: var(--ds-accent-soft);
  }

  .file-item--active,
  .file-item--active:hover {
    border-color: var(--ds-accent);
  }

  /* ── Row 1 ─────────────────────────────────────────── */
  .item-header {
    display: grid;
    grid-template-columns: auto auto 1fr auto auto;
    align-items: center;
    gap: var(--ds-space-3);
  }

  .item-check {
    width: 16px;
    height: 16px;
    accent-color: var(--ds-accent);
    cursor: pointer;
    flex-shrink: 0;
  }

  .play-btn {
    width: var(--ds-control-sm);
    height: var(--ds-control-sm);
    border-radius: 50%;
    border: var(--ds-border-width) solid var(--ds-border-strong);
    background: var(--ds-surface-2);
    color: var(--ds-text);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    padding: 0;
    transition:
      background-color var(--ds-duration) var(--ds-ease),
      border-color var(--ds-duration) var(--ds-ease);
  }

  .play-btn:hover {
    background: var(--ds-surface-3);
  }

  .play-btn--active,
  .play-btn--active:hover {
    background: var(--ds-accent);
    color: var(--ds-on-accent);
    border-color: var(--ds-accent);
  }

  .play-btn:focus-visible,
  .remove-btn:focus-visible,
  .item-btn:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }

  .name-block {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .file-name {
    font-size: var(--ds-text-md);
    font-weight: var(--ds-weight-semibold);
    color: var(--ds-text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  .file-sub {
    display: flex;
    align-items: center;
    gap: var(--ds-space-2);
    font-size: var(--ds-text-xs);
    color: var(--ds-text-2);
    font-variant-numeric: tabular-nums;
  }

  .proc-badge {
    padding: 0 var(--ds-space-2);
    border-radius: var(--ds-radius-full);
    background: var(--ds-surface-2);
    color: var(--ds-success);
    font-size: var(--ds-text-xs);
    font-weight: var(--ds-weight-bold);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .meters {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 170px;
  }

  .meter-group {
    display: grid;
    grid-template-columns: 2.75rem 1fr 2.75rem;
    align-items: center;
    gap: var(--ds-space-2);
  }

  /* LUFS has no bar — just a label and a right-aligned value spanning the row. */
  .meter-group--lufs {
    grid-template-columns: 2.75rem 1fr;
  }

  .meter-val--lufs {
    color: var(--ds-text);
  }

  .meter-tag {
    font-size: var(--ds-text-xs);
    font-weight: var(--ds-weight-semibold);
    color: var(--ds-text-2);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .meter-bar {
    height: 4px;
    background: var(--ds-surface-3);
    border-radius: var(--ds-radius-full);
    overflow: hidden;
  }

  .meter-fill {
    height: 100%;
    border-radius: var(--ds-radius-full);
    transition: width var(--ds-duration-slow) var(--ds-ease);
  }

  .meter-fill--peak {
    background: var(--ds-accent);
  }
  .meter-fill--rms {
    background: var(--ds-info);
  }

  .meter-val {
    font-size: var(--ds-text-xs);
    font-weight: var(--ds-weight-semibold);
    color: var(--ds-text);
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .remove-btn {
    width: var(--ds-control-sm);
    height: var(--ds-control-sm);
    border-radius: 50%;
    border: var(--ds-border-width) solid var(--ds-border);
    background: transparent;
    color: var(--ds-text-2);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    padding: 0;
    transition:
      background-color var(--ds-duration) var(--ds-ease),
      color var(--ds-duration) var(--ds-ease);
  }

  .remove-btn:hover {
    background: var(--ds-surface-2);
    color: var(--ds-danger);
  }

  /* ── Row 2 ─────────────────────────────────────────── */
  .item-controls {
    display: flex;
    align-items: flex-end;
    gap: var(--ds-space-2);
    flex-wrap: wrap;
  }

  .input-pair {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .input-label {
    font-size: var(--ds-text-xs);
    font-weight: var(--ds-weight-semibold);
    color: var(--ds-text-2);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .item-input,
  .item-select {
    height: var(--ds-control-sm);
    padding: 0 var(--ds-space-2);
    background: var(--ds-surface-2);
    border: var(--ds-border-width) solid var(--ds-border-strong);
    border-radius: var(--ds-radius-sm);
    color: var(--ds-text);
    font: inherit;
    font-size: var(--ds-text-sm);
    transition: border-color var(--ds-duration) var(--ds-ease);
  }

  .item-input {
    width: 96px;
    font-variant-numeric: tabular-nums;
  }

  .item-select {
    width: 124px;
    cursor: pointer;
  }

  .item-input:focus-visible,
  .item-select:focus-visible {
    outline: none;
    border-color: var(--ds-accent);
    box-shadow: var(--ds-focus-ring);
  }

  .item-input--readonly {
    color: var(--ds-text-2);
    cursor: not-allowed;
  }

  .item-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-space-1);
    height: var(--ds-control-sm);
    padding: 0 var(--ds-space-3);
    border: var(--ds-border-width) solid var(--ds-border-strong);
    border-radius: var(--ds-radius-sm);
    font: inherit;
    font-size: var(--ds-text-sm);
    font-weight: var(--ds-weight-medium);
    cursor: pointer;
    transition:
      background-color var(--ds-duration) var(--ds-ease),
      color var(--ds-duration) var(--ds-ease);
    white-space: nowrap;
  }

  .item-btn--accent,
  .item-btn--reset,
  .item-btn--export {
    background: var(--ds-surface-2);
    color: var(--ds-text);
  }
  .item-btn--reset {
    color: var(--ds-text-2);
  }
  .item-btn--accent:hover,
  .item-btn--reset:hover,
  .item-btn--export:hover {
    background: var(--ds-surface-3);
    color: var(--ds-text);
  }

  /* Export is the row's own result action: the success colour marks it. */
  .item-btn--export,
  .item-btn--export:hover {
    color: var(--ds-success);
  }

  /* ── Responsive ──────────────────────────────────────── */
  @media (max-width: 640px) {
    .item-header {
      grid-template-columns: auto auto 1fr auto;
    }
    .meters {
      display: none;
    }

    .item-input {
      width: 80px;
    }
  }

  /* Larger tap targets for the playlist row controls on touch devices. */
  @media (pointer: coarse) {
    .item-check {
      width: 22px;
      height: 22px;
    }
    .play-btn,
    .remove-btn {
      width: var(--ds-control-lg);
      height: var(--ds-control-lg);
    }
    .item-btn,
    .item-input,
    .item-select {
      min-height: var(--ds-control-lg);
    }
  }
</style>
