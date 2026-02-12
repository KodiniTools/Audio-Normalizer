<template>
  <div v-if="showGuide" class="header-controls">
    <button
      class="hdr-btn"
      @click="router.push('/anleitung')"
      :aria-label="t('nav-guide')"
      :title="t('guide-title')"
    >
      ?
    </button>
  </div>
</template>

<script setup>
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
  gap: 0.375rem;
}

.hdr-btn {
  width: 30px;
  height: 30px;
  border-radius: 4px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 0.7rem;
  font-weight: 600;
  flex-shrink: 0;
  padding: 0;
  line-height: 1;
}

.hdr-btn:hover {
  background: var(--primary);
  color: var(--bg-primary);
  border-color: var(--primary);
}

@media (max-width: 768px) {
  .hdr-btn {
    width: 40px;
    height: 40px;
    font-size: 0.8rem;
    border-radius: 6px;
  }

  .header-controls {
    gap: 0.35rem;
  }
}

@media (max-width: 480px) {
  .hdr-btn {
    width: 44px;
    height: 44px;
    font-size: 0.85rem;
  }
}
</style>
