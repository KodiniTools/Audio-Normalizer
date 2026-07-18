<template>
  <div class="player-bar" :class="{ 'player-bar--empty': !track }">
    <!-- Track info -->
    <div class="pb-track">
      <div class="pb-cover" :class="{ 'pb-cover--active': track }">
        <Music :size="16" />
      </div>
      <div class="pb-track-meta">
        <span class="pb-track-name" :title="track?.name">
          {{ track ? track.name : t('app.noTrackSelected') }}
        </span>
        <span v-if="track" class="pb-track-sub">
          {{ positionLabel }} · {{ formatTime(track.duration) }}
          <span v-if="track.processed" class="pb-badge">{{ t('app.processedBadge') }}</span>
        </span>
      </div>
    </div>

    <!-- Transport -->
    <div class="pb-transport">
      <button
        class="pb-nav-btn"
        :disabled="!track"
        :title="t('app.prev')"
        @click="store.playPrev()"
      >
        <SkipBack :size="16" />
      </button>
      <audio ref="audioRef" class="pb-audio" controls :src="currentSrc" @ended="store.playNext()" />
      <button
        class="pb-nav-btn"
        :disabled="!track"
        :title="t('app.next')"
        @click="store.playNext()"
      >
        <SkipForward :size="16" />
      </button>
    </div>

    <!-- Original / Normalized toggle -->
    <div class="pb-mode" role="group" :aria-label="t('app.playbackSource')">
      <button
        class="pb-mode-btn"
        :class="{ 'pb-mode-btn--active': store.playbackMode === 'original' }"
        :disabled="!track"
        @click="store.setPlaybackMode('original')"
      >
        {{ t('app.original') }}
      </button>
      <button
        class="pb-mode-btn"
        :class="{ 'pb-mode-btn--active': store.playbackMode === 'processed' }"
        :disabled="!track || !track.processed"
        :title="!track?.processed ? t('app.normalizedUnavailable') : ''"
        @click="store.setPlaybackMode('processed')"
      >
        {{ t('app.normalized') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, nextTick } from 'vue'
  import { Music, SkipBack, SkipForward } from 'lucide-vue-next'
  import { useI18n } from '../composables/useI18n'
  import { useAudioStore } from '../stores/audioStore'

  const { t } = useI18n()
  const store = useAudioStore()

  const audioRef = ref<HTMLAudioElement | null>(null)

  const track = computed(() => store.currentTrack)

  const currentSrc = computed(() => {
    const f = track.value
    if (!f) return ''
    if (store.playbackMode === 'processed' && f.processedBlobUrl) return f.processedBlobUrl
    return f.originalBlobUrl
  })

  const positionLabel = computed(() => {
    const idx = store.audioFiles.findIndex((f) => f.id === store.currentTrackId)
    return idx === -1 ? '' : `${idx + 1} / ${store.audioFiles.length}`
  })

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || seconds < 0) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  // Auto-play whenever the selected track or playback source changes.
  watch(
    () => [store.currentTrackId, store.playbackMode, currentSrc.value],
    async () => {
      if (!currentSrc.value) return
      await nextTick()
      const el = audioRef.value
      if (!el) return
      el.load()
      el.play().catch((err: Error) => {
        if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
          console.error('Playback error:', err)
        }
      })
    },
  )
</script>

<style scoped>
  .player-bar {
    position: sticky;
    bottom: 0;
    z-index: 40;
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto;
    align-items: center;
    gap: 1rem;
    padding: 0.55rem 1rem;
    background: var(--panel);
    border: 1px solid var(--border-color);
    border-radius: 0.75rem;
    box-shadow: 0 -6px 24px rgba(0, 0, 0, 0.28);
    backdrop-filter: blur(8px);
  }

  .player-bar--empty {
    opacity: 0.85;
  }

  /* ── Track info ─────────────────────────────────────── */
  .pb-track {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    min-width: 0;
  }

  .pb-cover {
    width: 36px;
    height: 36px;
    border-radius: 0.5rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--btn);
    border: 1px solid var(--border-color);
    color: var(--muted);
    flex-shrink: 0;
  }

  .pb-cover--active {
    background: linear-gradient(135deg, var(--accent), var(--accent-secondary));
    color: var(--accent-text);
    border-color: transparent;
  }

  .pb-track-meta {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 0;
  }

  .pb-track-name {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .pb-track-sub {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.68rem;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }

  .pb-badge {
    padding: 0.05rem 0.35rem;
    border-radius: 9999px;
    background: rgba(34, 197, 94, 0.15);
    color: #22c55e;
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  /* ── Transport ──────────────────────────────────────── */
  .pb-transport {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .pb-nav-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 1px solid var(--border-color);
    background: var(--btn);
    color: var(--text);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.15s ease;
  }

  .pb-nav-btn:hover:not(:disabled) {
    border-color: var(--accent);
    color: var(--accent);
  }

  .pb-nav-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .pb-audio {
    height: 34px;
    width: 260px;
    border-radius: 0.4rem;
    color-scheme: dark;
  }

  [data-theme='light'] .pb-audio {
    color-scheme: light;
  }

  /* ── Mode toggle ────────────────────────────────────── */
  .pb-mode {
    display: inline-flex;
    padding: 2px;
    background: var(--btn);
    border: 1px solid var(--border-color);
    border-radius: 0.5rem;
  }

  .pb-mode-btn {
    padding: 0.3rem 0.65rem;
    border: none;
    background: transparent;
    color: var(--muted);
    font-size: 0.72rem;
    font-weight: 600;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .pb-mode-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .pb-mode-btn--active {
    background: var(--accent);
    color: var(--accent-text);
  }

  /* ── Responsive ─────────────────────────────────────── */
  @media (max-width: 760px) {
    .player-bar {
      grid-template-columns: 1fr auto;
      grid-template-areas:
        'track mode'
        'transport transport';
      gap: 0.55rem 0.75rem;
    }
    .pb-track {
      grid-area: track;
    }
    .pb-mode {
      grid-area: mode;
    }
    .pb-transport {
      grid-area: transport;
      justify-content: center;
    }
    .pb-audio {
      flex: 1;
      width: auto;
      min-width: 0;
    }
  }
</style>
