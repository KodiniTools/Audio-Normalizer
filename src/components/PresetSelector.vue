<template>
  <div class="preset-section">
    <span class="preset-title">{{ t('presets.title') }}</span>
    <div class="preset-grid">
      <button
        v-for="preset in PRESETS"
        :key="preset.id"
        class="preset-btn"
        :class="{ 'preset-btn--disabled': disabled }"
        :disabled="disabled"
        :title="`${preset.lufs} LUFS · ${preset.truePeakDbtp} dBTP`"
        @click="$emit('apply', preset)"
      >
        <span class="preset-icon">
          <component :is="presetIcons[preset.id]" :size="13" />
        </span>
        <span class="preset-name">{{ t(`presets.${preset.id}`) }}</span>
        <span class="preset-meta">{{ preset.lufs }} LUFS</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import {
    Music,
    Youtube,
    Music2,
    ShoppingCart,
    Video,
    Mic,
    BookOpen,
    Radio,
  } from 'lucide-vue-next'
  import { useI18n } from '../composables/useI18n'
  import { PRESETS } from '../data/presets'
  import type { Preset } from '../data/presets'

  defineProps<{ disabled: boolean }>()
  defineEmits<{ apply: [preset: Preset] }>()

  const { t } = useI18n()

  const presetIcons: Record<string, unknown> = {
    spotify: Music,
    youtube: Youtube,
    apple: Music2,
    amazon: ShoppingCart,
    tiktok: Video,
    podcast: Mic,
    audiobook: BookOpen,
    broadcast: Radio,
  }
</script>

<style scoped>
  .preset-section {
    display: flex;
    flex-direction: column;
    gap: var(--ds-space-2);
  }

  .preset-title {
    font-size: var(--ds-text-xs);
    font-weight: var(--ds-weight-semibold);
    color: var(--ds-text-2);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .preset-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(176px, 1fr));
    gap: var(--ds-space-2);
  }

  .preset-btn {
    display: flex;
    align-items: center;
    gap: var(--ds-space-2);
    height: var(--ds-control-md);
    padding: 0 var(--ds-space-3);
    border-radius: var(--ds-radius-md);
    border: var(--ds-border-width) solid var(--ds-border);
    background: var(--ds-surface-2);
    color: var(--ds-text);
    font: inherit;
    cursor: pointer;
    transition:
      background-color var(--ds-duration) var(--ds-ease),
      border-color var(--ds-duration) var(--ds-ease);
    text-align: left;
    min-width: 0;
  }

  .preset-btn:not(.preset-btn--disabled):hover {
    border-color: var(--ds-accent);
    background: var(--ds-accent-soft);
  }

  .preset-btn:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }

  .preset-btn--disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .preset-icon {
    display: flex;
    align-items: center;
    color: var(--ds-text-2);
    flex-shrink: 0;
  }

  .preset-btn:not(.preset-btn--disabled):hover .preset-icon {
    color: var(--ds-accent);
  }

  .preset-name {
    font-size: var(--ds-text-sm);
    font-weight: var(--ds-weight-semibold);
    color: var(--ds-text);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .preset-meta {
    font-size: var(--ds-text-xs);
    font-weight: var(--ds-weight-medium);
    color: var(--ds-text-2);
    white-space: nowrap;
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;
  }

  @media (max-width: 640px) {
    .preset-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (pointer: coarse) {
    .preset-btn {
      min-height: var(--ds-row-height);
    }
  }
</style>
