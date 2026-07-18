<template>
  <div class="player-bar" :class="{ 'player-bar--empty': !track }">
    <!-- ── Track info ─────────────────────────────────── -->
    <div class="pb-track">
      <div class="pb-cover" :class="{ 'pb-cover--active': track }">
        <Music :size="16" />
      </div>
      <div class="pb-track-meta">
        <span class="pb-track-name" :title="track?.name">
          {{ track ? track.name : t('app.noTrackSelected') }}
        </span>
        <span class="pb-track-sub">
          <template v-if="track">
            {{ positionLabel }}
            <span v-if="track.processed" class="pb-badge">{{ t('app.processedBadge') }}</span>
          </template>
          <template v-else>{{ t('app.playerHint') }}</template>
        </span>
      </div>
    </div>

    <!-- ── Transport ──────────────────────────────────── -->
    <div class="pb-transport">
      <button class="pb-btn" :disabled="!track" :title="t('app.prev')" @click="store.playPrev()">
        <SkipBack :size="16" />
      </button>
      <button
        class="pb-btn pb-btn--play"
        :disabled="!track"
        :title="isPlaying ? t('app.pause') : t('app.playAction')"
        @click="togglePlay"
      >
        <component :is="isPlaying ? Pause : Play" :size="18" />
      </button>
      <button class="pb-btn" :disabled="!track" :title="t('app.stop')" @click="stop">
        <Square :size="15" />
      </button>
      <button class="pb-btn" :disabled="!track" :title="t('app.next')" @click="store.playNext()">
        <SkipForward :size="16" />
      </button>
    </div>

    <!-- ── Seek bar ───────────────────────────────────── -->
    <div class="pb-seek">
      <span class="pb-time">{{ formatTime(currentTime) }}</span>
      <input
        type="range"
        class="pb-range"
        min="0"
        :max="duration || 0"
        step="0.1"
        :value="currentTime"
        :disabled="!track"
        :style="{ '--pb-progress': progressPct + '%' }"
        :aria-label="t('app.seek')"
        @input="onSeek"
      />
      <span class="pb-time">{{ formatTime(duration) }}</span>
    </div>

    <!-- ── Actions (extensible cluster) ───────────────── -->
    <div class="pb-actions">
      <!-- Playback source: Original ↔ Processed -->
      <button
        class="pb-icon-btn"
        :class="{ 'pb-icon-btn--active': store.playbackMode === 'processed' }"
        :disabled="!track || !track.processed"
        :title="sourceTitle"
        @click="toggleSource"
      >
        <AudioLines :size="16" />
      </button>

      <!-- Loop current track -->
      <button
        class="pb-icon-btn"
        :class="{ 'pb-icon-btn--active': loop }"
        :disabled="!track"
        :title="t('app.loop')"
        @click="loop = !loop"
      >
        <Repeat :size="16" />
      </button>

      <!-- Volume / mute -->
      <div class="pb-volume">
        <button
          class="pb-icon-btn"
          :title="muted || volume === 0 ? t('app.unmute') : t('app.mute')"
          @click="toggleMute"
        >
          <component :is="muted || volume === 0 ? VolumeX : Volume2" :size="16" />
        </button>
        <input
          type="range"
          class="pb-range pb-range--vol"
          min="0"
          max="1"
          step="0.01"
          :value="muted ? 0 : volume"
          :style="{ '--pb-progress': (muted ? 0 : volume) * 100 + '%' }"
          :aria-label="t('app.volume')"
          @input="onVolume"
        />
      </div>
    </div>

    <audio
      ref="audioRef"
      class="pb-audio-hidden"
      :src="currentSrc"
      @timeupdate="currentTime = audioRef?.currentTime ?? 0"
      @loadedmetadata="onLoadedMeta"
      @play="isPlaying = true"
      @pause="isPlaying = false"
      @ended="onEnded"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, nextTick } from 'vue'
  import {
    Music,
    SkipBack,
    SkipForward,
    Play,
    Pause,
    Square,
    Repeat,
    AudioLines,
    Volume2,
    VolumeX,
  } from 'lucide-vue-next'
  import { useI18n } from '../composables/useI18n'
  import { useAudioStore } from '../stores/audioStore'

  const { t } = useI18n()
  const store = useAudioStore()

  const audioRef = ref<HTMLAudioElement | null>(null)

  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(1)
  const muted = ref(false)
  const loop = ref(false)

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

  const progressPct = computed(() =>
    duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0,
  )

  const sourceTitle = computed(() =>
    !track.value?.processed
      ? t('app.normalizedUnavailable')
      : store.playbackMode === 'processed'
        ? t('app.playingProcessed')
        : t('app.playingOriginal'),
  )

  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || seconds < 0) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const play = (): void => {
    const el = audioRef.value
    if (!el || !currentSrc.value) return
    el.play().catch((err: Error) => {
      if (err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
        console.error('Playback error:', err)
      }
    })
  }

  const togglePlay = (): void => {
    const el = audioRef.value
    if (!el || !track.value) return
    if (el.paused) play()
    else el.pause()
  }

  const stop = (): void => {
    const el = audioRef.value
    if (!el) return
    el.pause()
    el.currentTime = 0
    currentTime.value = 0
  }

  const onSeek = (e: Event): void => {
    const value = Number((e.target as HTMLInputElement).value)
    currentTime.value = value
    if (audioRef.value) audioRef.value.currentTime = value
  }

  const onLoadedMeta = (): void => {
    duration.value = audioRef.value?.duration ?? track.value?.duration ?? 0
  }

  const onEnded = (): void => {
    if (loop.value) {
      play()
      return
    }
    store.playNext()
  }

  const toggleSource = (): void => {
    store.setPlaybackMode(store.playbackMode === 'processed' ? 'original' : 'processed')
  }

  const applyVolume = (): void => {
    const el = audioRef.value
    if (!el) return
    el.volume = volume.value
    el.muted = muted.value
  }

  const onVolume = (e: Event): void => {
    volume.value = Number((e.target as HTMLInputElement).value)
    muted.value = volume.value === 0
    applyVolume()
  }

  const toggleMute = (): void => {
    muted.value = !muted.value
    if (!muted.value && volume.value === 0) volume.value = 1
    applyVolume()
  }

  // Auto-play whenever the selected track or playback source changes.
  watch(
    () => [store.currentTrackId, store.playbackMode, currentSrc.value],
    async () => {
      if (!currentSrc.value) {
        isPlaying.value = false
        return
      }
      await nextTick()
      const el = audioRef.value
      if (!el) return
      el.load()
      applyVolume()
      play()
    },
  )
</script>

<style scoped>
  .player-bar {
    position: sticky;
    bottom: 0;
    z-index: 40;
    display: grid;
    grid-template-columns: minmax(150px, 1.2fr) auto minmax(180px, 2fr) auto;
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
    opacity: 0.9;
  }

  /* ── Track info ─────────────────────────────────────── */
  .pb-track {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    min-width: 0;
  }

  .pb-cover {
    width: 38px;
    height: 38px;
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
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
    gap: 0.3rem;
  }

  .pb-btn {
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

  .pb-btn:hover:not(:disabled) {
    border-color: var(--accent);
    color: var(--accent);
  }

  .pb-btn--play {
    width: 40px;
    height: 40px;
    background: var(--accent);
    color: var(--accent-text);
    border-color: var(--accent);
  }

  .pb-btn--play:hover:not(:disabled) {
    filter: brightness(1.1);
    color: var(--accent-text);
  }

  .pb-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* ── Seek bar ───────────────────────────────────────── */
  .pb-seek {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    min-width: 0;
  }

  .pb-time {
    font-size: 0.68rem;
    font-weight: 600;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
    width: 2.4rem;
    text-align: center;
  }

  .pb-range {
    flex: 1;
    min-width: 0;
    -webkit-appearance: none;
    appearance: none;
    height: 5px;
    border-radius: 3px;
    background: linear-gradient(
      to right,
      var(--accent) 0%,
      var(--accent) var(--pb-progress, 0%),
      var(--btn) var(--pb-progress, 0%),
      var(--btn) 100%
    );
    cursor: pointer;
    outline: none;
    /* Horizontal drag scrubs the slider; vertical drag still scrolls the page. */
    touch-action: pan-y;
  }

  .pb-range:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .pb-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: var(--accent);
    border: 2px solid var(--panel);
    cursor: pointer;
  }

  .pb-range::-moz-range-thumb {
    width: 13px;
    height: 13px;
    border-radius: 50%;
    background: var(--accent);
    border: 2px solid var(--panel);
    cursor: pointer;
  }

  /* ── Actions ────────────────────────────────────────── */
  .pb-actions {
    display: flex;
    align-items: center;
    gap: 0.3rem;
  }

  .pb-icon-btn {
    width: 32px;
    height: 32px;
    border-radius: 0.45rem;
    border: 1px solid var(--border-color);
    background: var(--btn);
    color: var(--muted);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.15s ease;
  }

  .pb-icon-btn:hover:not(:disabled) {
    border-color: var(--accent);
    color: var(--accent);
  }

  .pb-icon-btn--active {
    background: var(--accent);
    color: var(--accent-text);
    border-color: var(--accent);
  }

  .pb-icon-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .pb-volume {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .pb-range--vol {
    width: 68px;
    flex: none;
    height: 4px;
  }

  .pb-audio-hidden {
    display: none;
  }

  /* ── Responsive ─────────────────────────────────────── */
  @media (max-width: 900px) {
    .player-bar {
      grid-template-columns: 1fr auto;
      grid-template-areas:
        'track actions'
        'seek seek'
        'transport transport';
      gap: 0.5rem 0.75rem;
    }
    .pb-track {
      grid-area: track;
    }
    .pb-actions {
      grid-area: actions;
    }
    .pb-seek {
      grid-area: seek;
    }
    .pb-transport {
      grid-area: transport;
      justify-content: center;
    }
    .pb-range--vol {
      width: 54px;
    }
  }

  @media (max-width: 480px) {
    .pb-range--vol {
      display: none;
    }
  }

  /* Larger, easier-to-hit controls and grab handles on touch devices. */
  @media (pointer: coarse) {
    .pb-btn {
      width: 44px;
      height: 44px;
    }
    .pb-btn--play {
      width: 52px;
      height: 52px;
    }
    .pb-icon-btn {
      width: 44px;
      height: 44px;
    }
    .pb-range {
      height: 8px;
    }
    .pb-range::-webkit-slider-thumb {
      width: 22px;
      height: 22px;
    }
    .pb-range::-moz-range-thumb {
      width: 22px;
      height: 22px;
    }
    .pb-range--vol {
      height: 6px;
    }
  }
</style>
