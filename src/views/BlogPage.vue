<template>
  <div class="blog-page">
    <HeroNav />

    <main class="blog-main">
      <header class="blog-header">
        <div>
          <h1 class="blog-title">{{ t('blog-title') }}</h1>
          <p class="blog-intro">{{ t('blog-intro') }}</p>
        </div>
        <a :href="BLOG_POST_URL" class="blog-open" target="_blank" rel="noopener">
          <ExternalLink :size="14" aria-hidden="true" />
          <span>{{ t('blog-open') }}</span>
        </a>
      </header>

      <!-- Höhe folgt dem Inhalt, wenn der Beitrag lesbar ist (gleicher Ursprung);
           sonst feste Höhe mit eigenem Scrollen. Der Link oben bleibt der Fallback,
           falls die Einbettung blockiert wird. -->
      <div class="blog-frame-wrap">
        <iframe
          ref="frame"
          :src="BLOG_POST_URL"
          :title="t('blog-frame-title')"
          :style="frameHeight ? { height: `${frameHeight}px` } : undefined"
          class="blog-frame"
          referrerpolicy="strict-origin-when-cross-origin"
          @load="fitFrame"
        ></iframe>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
  import { onUnmounted, ref } from 'vue'
  import { ExternalLink } from 'lucide-vue-next'
  import HeroNav from '../components/HeroNav.vue'
  import { useI18n } from '../composables/useI18n'
  import { BLOG_FRAME_MIN_HEIGHT, BLOG_POST_URL, measureFrameHeight } from '../utils/blogEmbed'

  const { t } = useI18n()

  const frame = ref<HTMLIFrameElement | null>(null)
  const frameHeight = ref<number | null>(null)
  let resizeObserver: ResizeObserver | null = null

  /** Passt die iframe-Höhe an den Beitrag an (nur bei gleichem Ursprung möglich). */
  function fitFrame() {
    const el = frame.value
    if (!el) return
    const update = () => {
      const height = measureFrameHeight(el)
      frameHeight.value = height === null ? null : Math.max(height, BLOG_FRAME_MIN_HEIGHT)
    }
    update()
    resizeObserver?.disconnect()
    resizeObserver = null
    const body = frameHeight.value !== null ? el.contentDocument?.body : null
    if (body && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(update)
      resizeObserver.observe(body)
    }
  }

  onUnmounted(() => {
    resizeObserver?.disconnect()
  })
</script>

<style scoped>
  .blog-page {
    min-height: 100vh;
    background: var(--ds-surface-0);
    color: var(--ds-text);
    font-size: var(--ds-text-md);
    line-height: var(--ds-leading);
  }

  .blog-main {
    max-width: var(--ds-container);
    margin: 0 auto;
    padding: var(--ds-space-8) var(--ds-gutter) var(--ds-space-12);
  }

  .blog-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: var(--ds-space-4);
    margin-bottom: var(--ds-space-6);
  }

  .blog-title {
    font-size: var(--ds-text-2xl);
    font-weight: var(--ds-weight-bold);
    line-height: var(--ds-leading-tight);
    letter-spacing: var(--ds-tracking-tight);
    margin: 0 0 var(--ds-space-2);
  }

  .blog-intro {
    color: var(--ds-text-2);
    margin: 0;
  }

  .blog-open {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-space-2);
    flex-shrink: 0;
    height: var(--ds-control-md);
    padding: 0 var(--ds-space-3);
    background: var(--ds-surface-2);
    border: var(--ds-border-width) solid var(--ds-border-strong);
    border-radius: var(--ds-radius-md);
    color: var(--ds-text);
    font-size: var(--ds-text-sm);
    font-weight: var(--ds-weight-medium);
    text-decoration: none;
    transition: background-color var(--ds-duration) var(--ds-ease);
  }

  .blog-open:hover {
    background: var(--ds-surface-3);
    color: var(--ds-text);
  }

  .blog-open:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }

  .blog-frame-wrap {
    border: var(--ds-border-width) solid var(--ds-border);
    border-radius: var(--ds-radius-lg);
    overflow: hidden;
    background: var(--ds-surface-1);
  }

  .blog-frame {
    display: block;
    width: 100%;
    height: 80vh;
    min-height: 640px;
    border: 0;
  }

  @media (max-width: 768px) {
    .blog-main {
      padding: var(--ds-space-6) var(--ds-space-4) var(--ds-space-8);
    }

    .blog-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .blog-title {
      font-size: var(--ds-text-xl);
    }

    .blog-open {
      min-height: var(--ds-row-height);
    }
  }

  @media (max-width: 480px) {
    .blog-main {
      padding: var(--ds-space-4) var(--ds-space-3) var(--ds-space-6);
    }

    .blog-frame-wrap {
      border-radius: var(--ds-radius-md);
    }
  }
</style>
