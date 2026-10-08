<template>
  <div v-if="showGuide" class="header-controls">
    <button
      class="hdr-btn"
      :aria-label="t('nav-guide')"
      :title="t('guide-title')"
      @click="router.push('/anleitung')"
    >
      ?
    </button>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { useI18n } from '../composables/useI18n'

  const router = useRouter()
  const route = useRoute()
  const { t } = useI18n()

  const showGuide = computed(() => route.path !== '/anleitung')
</script>

<style scoped>
  .header-controls {
    display: flex;
    align-items: center;
    gap: var(--ds-space-2);
  }

  .hdr-btn {
    width: var(--ds-control-md);
    height: var(--ds-control-md);
    border-radius: var(--ds-radius-md);
    border: var(--ds-border-width) solid var(--ds-border-strong);
    background: var(--ds-surface-2);
    color: var(--ds-text);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      background-color var(--ds-duration) var(--ds-ease),
      border-color var(--ds-duration) var(--ds-ease);
    font: inherit;
    font-size: var(--ds-text-md);
    font-weight: var(--ds-weight-semibold);
    flex-shrink: 0;
    padding: 0;
    line-height: 1;
  }

  .hdr-btn:hover {
    background: var(--ds-surface-3);
  }

  .hdr-btn:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }

  @media (pointer: coarse) {
    .hdr-btn {
      width: var(--ds-row-height);
      height: var(--ds-row-height);
    }
  }
</style>
