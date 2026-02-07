<template>
  <div class="header-controls">
    <button
      v-if="showGuide"
      class="hdr-btn"
      @click="router.push('/anleitung')"
      :aria-label="t('nav-guide')"
      :title="t('guide-title')"
    >
      ?
    </button>
    <button
      class="hdr-btn"
      @click="toggleTheme"
      :aria-label="t('nav.theme')"
      :title="t('nav.theme')"
    >
      <span v-if="theme === 'dark'">&#9728;&#65039;</span>
      <span v-else>&#127769;</span>
    </button>
    <button
      class="hdr-btn"
      @click="toggleLocale"
      :aria-label="'Language'"
      :title="locale === 'de' ? 'Switch to English' : 'Auf Deutsch wechseln'"
    >
      {{ locale === 'de' ? 'EN' : 'DE' }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTheme } from '../composables/useTheme'
import { useI18n } from '../composables/useI18n'

const router = useRouter()
const route = useRoute()
const { theme, toggleTheme } = useTheme()
const { locale, t, toggleLocale } = useI18n()

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
    width: 28px;
    height: 28px;
    font-size: 0.65rem;
  }

  .header-controls {
    gap: 0.25rem;
  }
}
</style>
