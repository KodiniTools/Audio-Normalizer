<template>
  <div class="send-to-panel">
    <div class="send-to-header">
      <span class="send-to-label">
        <ExternalLink :size="12" />
        {{ t('app.sendTo') }}
      </span>
      <span v-if="!hasNormalizedFiles && audioFiles.length > 0" class="send-to-hint">
        {{ t('app.sendToHint') }}
      </span>
    </div>
    <div class="send-to-actions">
      <button
        v-for="tool in TARGET_TOOLS"
        :key="tool.key"
        class="btn btn--send"
        :disabled="isProcessing || !hasNormalizedFiles || isSending"
        @click="sendToTool(tool)"
      >
        <component :is="sentToTool === tool.key ? CheckCircle : ExternalLink" :size="12" />
        {{
          isSending && sentToTool !== tool.key
            ? t('app.sendToSending')
            : sentToTool === tool.key
              ? t('app.sendToSent')
              : t(`app.sendTo${tool.key.charAt(0).toUpperCase() + tool.key.slice(1)}`)
        }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { storeToRefs } from 'pinia'
  import { CheckCircle, ExternalLink } from 'lucide-vue-next'
  import { useI18n } from '../composables/useI18n'
  import { useAudioStore } from '../stores/audioStore'
  import { useSendToTool, TARGET_TOOLS } from '../composables/useSendToTool'

  const { t } = useI18n()
  const store = useAudioStore()
  const { audioFiles, isProcessing } = storeToRefs(store)

  const { isSending, sentToTool, hasNormalizedFiles, sendToTool } = useSendToTool(
    () => audioFiles.value,
  )
</script>
