<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
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
