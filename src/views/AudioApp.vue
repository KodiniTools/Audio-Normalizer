<template>
  <div class="audio-app">
    <div class="app-header">
      <router-link to="/" class="back-link">← {{ t('nav.backToHome') }}</router-link>
      <div class="header-titles">
        <h1 class="app-title">{{ t('app.title') }}</h1>
        <p class="app-subtitle">{{ t('app.subtitle') }}</p>
      </div>
      <div class="header-controls-slot">
        <HeaderControls />
      </div>
    </div>

    <section class="app-section">
      <div class="container">
        <div class="app-container">
          <!-- Shared files banner -->
          <div v-if="sharedBanner" class="alert" :class="'alert--' + sharedBanner.type">
            <component :is="statusIcons[sharedBanner.type]" :size="15" />
            <span>{{ sharedBanner.message }}</span>
          </div>

          <!-- Upload / drop zone -->
          <AppDropZone />

          <!-- Toolbar: export / delete / reset -->
          <AppToolbar />

          <!-- Send-to panel -->
          <SendToPanel />

          <!-- Global normalisation controls -->
          <NormalizationControls />

          <!-- Preset selector -->
          <PresetSelector
            :disabled="isProcessing || audioFiles.length === 0"
            @apply="store.applyPreset"
          />

          <!-- Effects strip -->
          <EffectsStrip />

          <!-- Interactive playlist + player bar -->
          <PlaylistPanel />

          <!-- Status toast -->
          <div v-if="statusMessage" class="alert alert--toast" :class="'alert--' + statusType">
            <component :is="statusIcons[statusType]" :size="15" />
            <span>{{ statusMessage }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Loading overlay — all processes report their progress here -->
    <LoadingOverlay />
  </div>
</template>

<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { useRoute, useRouter } from 'vue-router'
  import { CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-vue-next'
  import { useI18n } from '../composables/useI18n'
  import { useAudioStore } from '../stores/audioStore'
  import { useSharedFiles } from '../composables/useSharedFiles'
  import HeaderControls from '../components/HeaderControls.vue'
  import PresetSelector from '../components/PresetSelector.vue'
  import AppDropZone from '../components/AppDropZone.vue'
  import AppToolbar from '../components/AppToolbar.vue'
  import SendToPanel from '../components/SendToPanel.vue'
  import NormalizationControls from '../components/NormalizationControls.vue'
  import EffectsStrip from '../components/EffectsStrip.vue'
  import PlaylistPanel from '../components/PlaylistPanel.vue'
  import LoadingOverlay from '../components/LoadingOverlay.vue'
  import '../assets/audio-app.css'

  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()

  const store = useAudioStore()
  const { audioFiles, statusMessage, statusType, isProcessing } = storeToRefs(store)

  const { sharedBanner } = useSharedFiles(store.handleSharedFiles, t, route, router)

  const statusIcons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }
</script>
