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
    top: calc(100% + 0.35rem);
    left: 0;
    z-index: 60;
    min-width: 260px;
    max-width: min(360px, calc(100vw - 2rem));
    max-height: 320px;
    overflow-y: auto;
    padding: 0.35rem;
    background: var(--panel);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  }

  .history-empty {
    padding: 0.5rem 0.6rem;
    font-size: 0.75rem;
    color: var(--muted);
  }

  .history-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    width: 100%;
    padding: 0.4rem 0.6rem;
    border: none;
    border-radius: 0.35rem;
    background: transparent;
    color: var(--text);
    font-size: 0.75rem;
    text-align: left;
    cursor: pointer;
    transition: background 0.12s ease;
  }

  .history-row:hover {
    background: var(--btn-hover);
  }

  .history-row--future,
  .history-row--initial {
    color: var(--muted);
  }

  .history-row--current {
    background: var(--panel-highlight);
    color: var(--text);
    font-weight: 600;
  }

  .history-label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  .history-badge {
    flex-shrink: 0;
    padding: 0.02rem 0.4rem;
    border-radius: 9999px;
    background: var(--btn);
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--muted);
  }

  .history-badge--current {
    background: var(--accent);
    color: var(--accent-text);
  }

  .history-footer {
    margin-top: 0.25rem;
    padding: 0.4rem 0.6rem 0.2rem;
    border-top: 1px solid var(--border-color);
    font-size: 0.62rem;
    color: var(--muted);
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
