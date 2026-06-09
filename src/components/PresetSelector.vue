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
        :style="{ '--preset-color': preset.color }"
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
    gap: 0.5rem;
  }

  .preset-title {
    font-size: 0.68rem;
    font-weight: 700;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.07em;
  }

  .preset-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 0.4rem;
  }

  .preset-btn {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 0.65rem;
    border-radius: 0.4rem;
    border: 1px solid var(--border-color);
    background: var(--btn);
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
    min-width: 0;
  }

  .preset-btn:not(.preset-btn--disabled):hover {
    border-color: var(--preset-color);
    background: color-mix(in srgb, var(--preset-color) 10%, transparent);
  }

  .preset-btn--disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .preset-icon {
    display: flex;
    align-items: center;
    color: var(--preset-color);
    flex-shrink: 0;
  }

  .preset-name {
    font-size: 0.73rem;
    font-weight: 600;
    color: var(--text);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .preset-meta {
    font-size: 0.62rem;
    font-weight: 500;
    color: var(--muted);
    white-space: nowrap;
    flex-shrink: 0;
  }

  @media (max-width: 640px) {
    .preset-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>
