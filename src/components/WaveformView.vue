<template>
  <figure class="waveform" :aria-label="t('app.waveformLabel')">
    <svg
      class="waveform-svg"
      :viewBox="`0 0 ${width} ${HEIGHT}`"
      preserveAspectRatio="none"
      role="img"
      aria-hidden="true"
    >
      <path class="wave" :class="processed ? 'wave--behind' : 'wave--current'" :d="originalPath" />
      <template v-if="processed">
        <path class="wave wave--current" :d="processedPath" />
        <path class="wave-outline" :d="originalPath" />
      </template>
    </svg>
    <figcaption v-if="processed" class="waveform-legend">
      <span class="legend-item"
        ><span class="legend-fill legend-fill--original" />{{ t('app.waveformOriginal') }}</span
      >
      <span class="legend-item"
        ><span class="legend-fill legend-fill--processed" />{{ t('app.waveformProcessed') }}</span
      >
    </figcaption>
  </figure>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useI18n } from '../composables/useI18n'

  const props = defineProps<{
    /** Envelope of the original (max |sample| per bucket). */
    original: Float32Array
    /** Envelope of the processed take; omitted while the file is unprocessed. */
    processed?: Float32Array
  }>()

  const { t } = useI18n()

  const HEIGHT = 100
  const MID = HEIGHT / 2

  const width = computed(() => Math.max(1, props.original.length))

  // Closed, mirrored outline: top edge left → right, bottom edge right → left.
  const toPath = (env: Float32Array | undefined): string => {
    if (!env || env.length === 0) return ''
    const amp = (i: number): number => Math.min(1, env[i]) * MID
    let d = `M0 ${MID}`
    for (let i = 0; i < env.length; i++) d += `L${i} ${(MID - amp(i)).toFixed(1)}`
    d += `L${env.length} ${MID}`
    for (let i = env.length - 1; i >= 0; i--) d += `L${i} ${(MID + amp(i)).toFixed(1)}`
    return d + 'Z'
  }

  const originalPath = computed(() => toPath(props.original))
  const processedPath = computed(() => toPath(props.processed))
</script>

<style scoped>
  .waveform {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--ds-space-1);
  }

  .waveform-svg {
    display: block;
    width: 100%;
    height: 36px;
    background: var(--ds-surface-2);
    border-radius: var(--ds-radius-sm);
  }

  .wave--current {
    fill: var(--ds-accent);
  }

  .wave--behind {
    fill: var(--ds-border-strong);
  }

  .wave-outline {
    fill: none;
    stroke: var(--ds-text-2);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  .waveform-legend {
    display: flex;
    gap: var(--ds-space-3);
    font-size: var(--ds-text-xs);
    color: var(--ds-text-2);
  }

  .legend-item {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-space-1);
  }

  .legend-fill {
    width: 10px;
    height: 10px;
    border-radius: var(--ds-radius-full);
  }

  .legend-fill--original {
    background: var(--ds-border-strong);
    border: var(--ds-border-width) solid var(--ds-text-2);
  }

  .legend-fill--processed {
    background: var(--ds-accent);
  }
</style>
