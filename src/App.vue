<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useTheme } from './composables/useTheme'
import { useI18n } from './composables/useI18n'

// Initialize theme on app load (also syncs with SSI nav theme-changed events)
useTheme()

// Intercept SSI language buttons and translate all SSI includes (Nav, Footer, Cookie Banner)
const { initSsiLanguage } = useI18n()
onMounted(() => {
  initSsiLanguage()
})
</script>

<style>
/* Global CSS Variables - Navy & Gold Color Scheme */
:root {
  --primary: #c9984d;
  --primary-dark: #a67d3d;
  --primary-secondary: #014f99;
  --success: #22c55e;
  --warning: #c9984d;
  --bg-primary: #091428;
  --bg-secondary: #0E1C32;
  --bg-card: #142640;
  --text-primary: #f9f2d5;
  --text-secondary: #7A8DA0;
  --border: rgba(122, 141, 160, 0.4);
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

button, input, select, textarea {
  font-family: inherit;
}

body {
  font-family: 'Supreme', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
}

#app {
  min-height: 100vh;
}


</style>