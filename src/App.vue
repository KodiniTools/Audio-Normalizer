<template>
  <div id="app">
    <div class="controls-wrapper">
      <button 
        v-if="showGuideButton"
        class="guide-toggle" 
        @click="router.push('/anleitung')"
        :aria-label="t('nav-guide')"
        :title="t('guide-title')"
      >
        <span class="guide-icon">?</span>
      </button>
      <button 
        class="theme-toggle" 
        @click="toggleTheme" 
        :aria-label="t('nav.theme')"
      >
        <span v-if="theme === 'dark'" class="theme-icon">☀️</span>
        <span v-else class="theme-icon">🌙</span>
      </button>
      <button 
        class="lang-toggle" 
        @click="toggleLocale"
        :aria-label="'Language'"
      >
        <span class="lang-text">{{ locale === 'de' ? 'EN' : 'DE' }}</span>
      </button>
    </div>
    
    <router-view />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTheme } from './composables/useTheme'
import { useI18n } from './composables/useI18n'

const router = useRouter()
const route = useRoute()
const { theme, toggleTheme } = useTheme()
const { locale, t, toggleLocale } = useI18n()

const showGuideButton = computed(() => route.path !== '/anleitung')
</script>

<style>
/* Global CSS Variables - New Color Scheme */
:root {
  --primary: #F2E28E;
  --primary-dark: #d4c67a;
  --primary-secondary: #A28680;
  --success: #22c55e;
  --warning: #F2E28E;
  --bg-primary: #0C0C10;
  --bg-secondary: #18181c;
  --bg-card: #1e1e24;
  --text-primary: #AEAFB7;
  --text-secondary: #5E5F69;
  --border: rgba(94, 95, 105, 0.4);
  --transition-base: 0.3s ease;
}

[data-theme="light"] {
  --primary: #014f99;
  --primary-dark: #003971;
  --primary-secondary: #c9984d;
  --bg-primary: #F5F4D6;
  --bg-secondary: #FFFFFF;
  --bg-card: #FFFFFF;
  --text-primary: #003971;
  --text-secondary: #4a6a8a;
  --border: rgb(201 152 77 / 35%);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
}

#app {
  min-height: 100vh;
}

/* Controls Wrapper - Fixed Position */
.controls-wrapper {
  position: fixed;
  top: 0.75rem;
  right: 0.75rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
  z-index: 9999;
}

/* Guide Toggle Button */
.guide-toggle {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  font-weight: 600;
  font-size: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
  backdrop-filter: blur(8px);
}

.guide-toggle:hover {
  transform: scale(1.08);
  border-color: var(--primary);
  background: var(--primary);
  color: var(--bg-primary);
  box-shadow: 0 4px 12px rgba(242, 226, 142, 0.35);
}

.guide-icon {
  font-weight: 600;
  line-height: 1;
}

/* Theme Toggle Button */
.theme-toggle {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  font-size: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
  backdrop-filter: blur(8px);
}

.theme-toggle:hover {
  transform: scale(1.08);
  border-color: var(--primary);
  box-shadow: 0 4px 12px rgba(242, 226, 142, 0.35);
}

.theme-icon {
  font-size: 1.1rem;
  line-height: 1;
}

/* Language Toggle Button - Prominent Styling */
.lang-toggle {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 2px solid var(--primary);
  background: var(--primary);
  color: var(--bg-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  font-weight: 700;
  font-size: 0.75rem;
  box-shadow: 0 4px 12px rgba(242, 226, 142, 0.4);
  flex-shrink: 0;
  text-transform: uppercase;
}

.lang-toggle:hover {
  transform: scale(1.12);
  background: var(--primary-dark);
  border-color: var(--primary-dark);
  box-shadow: 0 6px 16px rgba(242, 226, 142, 0.5);
}

.lang-text {
  font-weight: 700;
  line-height: 1;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

/* Responsive */
@media (max-width: 768px) {
  .controls-wrapper {
    top: 0.5rem;
    right: 0.5rem;
    gap: 0.35rem;
  }

  .guide-toggle,
  .theme-toggle,
  .lang-toggle {
    width: 34px;
    height: 34px;
  }

  .guide-icon {
    font-size: 0.9rem;
  }

  .theme-icon {
    font-size: 0.95rem;
  }

  .lang-toggle {
    width: 38px;
    height: 38px;
  }

  .lang-text {
    font-size: 0.65rem;
  }
} 

/* ZUSÄTZLICHE FORCIERTE SICHTBARKEITS-REGELN */
/* Diese Regeln stellen sicher, dass der Toggle immer die höchste Priorität hat */
.controls-wrapper {
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  pointer-events: auto !important;
  z-index: 99999 !important;
}

.lang-toggle {
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  pointer-events: auto !important;
  background: var(--primary) !important;
  color: var(--bg-primary) !important;
}

</style>