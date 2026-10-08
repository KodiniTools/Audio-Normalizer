<template>
  <div ref="rootRef" class="history-menu">
    <button
      class="btn btn--ghost btn--sm"
      :disabled="disabled"
      :title="t('history.menuTitle')"
      :aria-expanded="open"
      aria-haspopup="listbox"
      @click="toggle"
    >
      <History :size="14" />{{ t('history.title') }}
      <span v-if="historyPast.length > 0" class="count-pill">{{ historyPast.length }}</span>
    </button>

    <div v-if="open" class="history-pop" role="listbox" :aria-label="t('history.title')">
      <div v-if="historyPast.length === 0 && historyFuture.length === 0" class="history-empty">
        {{ t('history.empty') }}
      </div>

      <template v-else>
        <!-- Redoable steps (chronological, i.e. the newest state at the top) -->
        <button
          v-for="entry in futureNewestFirst"
          :key="entry.id"
          class="history-row history-row--future"
          role="option"
          :aria-selected="false"
          :title="t('history.jumpHint')"
          @click="jump(entry.id)"
        >
          <span class="history-label">{{ t(entry.label.key, entry.label.params) }}</span>
          <span class="history-badge">{{ t('history.undoneBadge') }}</span>
        </button>

        <!-- Undoable steps, newest first; the top one is the current state -->
        <button
          v-for="(entry, i) in pastNewestFirst"
          :key="entry.id"
          class="history-row"
          :class="{ 'history-row--current': i === 0 }"
          role="option"
          :aria-selected="i === 0"
          :title="t('history.jumpHint')"
          @click="jump(entry.id)"
        >
          <span class="history-label">{{ t(entry.label.key, entry.label.params) }}</span>
          <span v-if="i === 0" class="history-badge history-badge--current">
            {{ t('history.current') }}
          </span>
        </button>

        <!-- Base state before the oldest retained step -->
        <button
          class="history-row history-row--initial"
          :class="{ 'history-row--current': historyPast.length === 0 }"
          role="option"
          :aria-selected="historyPast.length === 0"
          :title="t('history.jumpHint')"
          @click="jump(null)"
        >
          <span class="history-label">{{ t('history.initial') }}</span>
          <span v-if="historyPast.length === 0" class="history-badge history-badge--current">
            {{ t('history.current') }}
          </span>
        </button>
      </template>

      <div class="history-footer">{{ t('history.shortcuts') }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import { storeToRefs } from 'pinia'
  import { History } from 'lucide-vue-next'
  import { useI18n } from '../composables/useI18n'
  import { useAudioStore } from '../stores/audioStore'

  defineProps({
    disabled: { type: Boolean, default: false },
  })

  const { t } = useI18n()
  const store = useAudioStore()
  const { historyPast, historyFuture } = storeToRefs(store)

  const rootRef = ref<HTMLElement | null>(null)
  const open = ref(false)

  const pastNewestFirst = computed(() => historyPast.value.slice().reverse())
  const futureNewestFirst = computed(() => historyFuture.value.slice().reverse())

  const toggle = (): void => {
    open.value = !open.value
  }

  const jump = (id: number | null): void => {
    store.jumpToHistory(id)
    open.value = false
  }

  const onPointerDown = (event: MouseEvent): void => {
    if (!open.value) return
    if (rootRef.value && !rootRef.value.contains(event.target as Node)) open.value = false
  }

  const onKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && open.value) open.value = false
  }

  onMounted(() => {
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeydown)
  })
  onUnmounted(() => {
    document.removeEventListener('mousedown', onPointerDown)
    document.removeEventListener('keydown', onKeydown)
  })
</script>

<style scoped>
  .history-menu {
    position: relative;
    display: inline-flex;
  }

  .history-pop {
    position: absolute;
    top: calc(100% + var(--ds-space-1));
    left: 0;
    z-index: 60;
    min-width: 260px;
    max-width: min(360px, calc(100vw - 2rem));
    max-height: 320px;
    overflow-y: auto;
    padding: var(--ds-space-1);
    background: var(--ds-surface-1);
    border: var(--ds-border-width) solid var(--ds-border);
    border-radius: var(--ds-radius-md);
    box-shadow: var(--ds-shadow-overlay);
  }

  .history-empty {
    padding: var(--ds-space-2) var(--ds-space-3);
    font-size: var(--ds-text-sm);
    color: var(--ds-text-2);
  }

  .history-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ds-space-2);
    width: 100%;
    padding: var(--ds-space-2) var(--ds-space-3);
    border: none;
    border-radius: var(--ds-radius-sm);
    background: transparent;
    color: var(--ds-text);
    font: inherit;
    font-size: var(--ds-text-sm);
    text-align: left;
    cursor: pointer;
    transition: background-color var(--ds-duration) var(--ds-ease);
  }

  .history-row:hover {
    background: var(--ds-surface-3);
  }

  .history-row:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }

  .history-row--future,
  .history-row--initial {
    color: var(--ds-text-2);
  }

  .history-row--current {
    background: var(--ds-accent-soft);
    color: var(--ds-text);
    font-weight: var(--ds-weight-semibold);
  }

  .history-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  .history-badge {
    flex-shrink: 0;
    padding: 0 var(--ds-space-2);
    border-radius: var(--ds-radius-full);
    background: var(--ds-surface-2);
    font-size: var(--ds-text-xs);
    font-weight: var(--ds-weight-bold);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--ds-text-2);
  }

  .history-badge--current {
    background: var(--ds-accent);
    color: var(--ds-on-accent);
  }

  .history-footer {
    margin-top: var(--ds-space-1);
    padding: var(--ds-space-2) var(--ds-space-3) var(--ds-space-1);
    border-top: var(--ds-border-width) solid var(--ds-border);
    font-size: var(--ds-text-xs);
    color: var(--ds-text-3);
  }

  @media (max-width: 768px) {
    .history-menu {
      flex: 1;
    }
    .history-menu > .btn {
      width: 100%;
      justify-content: center;
    }
  }
</style>
