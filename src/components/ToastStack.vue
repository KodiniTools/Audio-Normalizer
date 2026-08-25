<template>
  <Teleport to="body">
    <TransitionGroup
      tag="div"
      name="toast"
      class="toast-stack"
      aria-live="polite"
      aria-atomic="false"
    >
      <button
        v-for="toast in toasts"
        :key="toast.id"
        type="button"
        class="toast"
        :class="'toast--' + toast.type"
        :title="t('toast.dismiss')"
        @click="dismissToast(toast.id)"
      >
        <component :is="statusIcons[toast.type]" :size="15" class="toast__icon" />
        <span class="toast__message">{{ toast.message }}</span>
      </button>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-vue-next'
  import { useI18n } from '../composables/useI18n'
  import { useAudioStore } from '../stores/audioStore'

  const { t } = useI18n()
  const store = useAudioStore()
  const { toasts } = storeToRefs(store)
  const { dismissToast } = store

  const statusIcons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }
</script>
