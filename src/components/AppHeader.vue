// src/components/AppHeader.vue
<template>
  <header class="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
    <div class="container mx-auto px-4 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <Music class="w-8 h-8" />
          <h1 class="text-2xl font-bold">Audio Normalisierung Pro</h1>
        </div>
        
        <!-- Buttons rechts -->
        <div class="flex items-center gap-3">
          <!-- Sprachumschalter -->
          <button
            @click="toggleLocale"
            class="flex items-center justify-center w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200 font-bold text-sm"
            :title="locale === 'de' ? 'Switch to English' : 'Auf Deutsch wechseln'"
          >
            {{ locale === 'de' ? 'EN' : 'DE' }}
          </button>
          
          <!-- Anleitung Button -->
          <button
            @click="router.push('/anleitung')"
            class="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200 font-medium"
            :title="t('guide-title')"
          >
            <HelpCircle class="w-5 h-5" />
            <span class="hidden sm:inline">{{ locale === 'de' ? 'Anleitung' : 'Guide' }}</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Music, HelpCircle } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { useI18n } from '../composables/useI18n'

const router = useRouter()
const { locale, t, toggleLocale } = useI18n()
</script>