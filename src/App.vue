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
/* Global CSS Variables */
:root {
  --primary: #6366f1;
  --primary-dark: #4f46e5;
  --success: #22c55e;
  --warning: #f59e0b;
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-card: #1e293b;
  --text-primary: #f1f5f9;
  --text-secondary: #cbd5e1;
  --border: #334155;
  --transition-base: 0.3s ease;
}

[data-theme="light"] {
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --bg-card: #ffffff;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --border: #e2e8f0;
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
  top: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.75rem;
  z-index: 9999;
}

/* Guide Toggle Button */
.guide-toggle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid var(--border);
  background: var(--bg-card);
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  font-weight: 700;
  font-size: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.guide-toggle:hover {
  transform: scale(1.1);
  border-color: var(--primary);
  background: var(--primary);
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.guide-icon {
  font-weight: 700;
  line-height: 1;
}

/* Theme Toggle Button */
.theme-toggle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid var(--border);
  background: var(--bg-card);
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  font-size: 1.2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.theme-toggle:hover {
  transform: scale(1.1);
  border-color: var(--primary);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.theme-icon {
  font-size: 1.5rem;
  line-height: 1;
}

/* Language Toggle Button */
.lang-toggle {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid var(--border);
  background: var(--bg-card);
  color: var(--text-primary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  font-weight: 700;
  font-size: 0.875rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.lang-toggle:hover {
  transform: scale(1.1);
  border-color: var(--primary);
  background: var(--primary);
  color: white;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.lang-text {
  font-weight: 700;
  line-height: 1;
  font-size: 0.875rem;
}

/* Responsive */
@media (max-width: 768px) {
  .controls-wrapper {
    top: 0.5rem;
    right: 0.5rem;
  }
  
  .guide-toggle,
  .theme-toggle,
  .lang-toggle {
    width: 40px;
    height: 40px;
  }
  
  .guide-icon {
    font-size: 1.2rem;
  }
  
  .theme-icon {
    font-size: 1.2rem;
  }
  
  .lang-text {
    font-size: 0.75rem;
  }
} 

/* ZUSÄTZLICHE FORCIERTE SICHTBARKEITS-REGELN (müssen außerhalb der Media Query stehen) */
/* Diese Regeln stellen sicher, dass der Toggle immer die höchste Priorität hat */
.controls-wrapper {
  display: flex !important;
  /* Erhöhen der Z-Index-Priorität, falls die Leiste verdeckt wird */
  z-index: 99999 !important; 
}

.lang-toggle {
  display: flex !important;
}

</style>