<template>
  <div class="guide-page">
    <!-- Header -->
    <header class="guide-header">
      <div class="header-content">
        <button class="back-btn" :aria-label="t('guide-back')" @click="router.push('/')">
          <ArrowLeft :size="16" />
          <span>{{ t('guide-back') }}</span>
        </button>
        <div class="header-title">
          <HelpCircle :size="20" />
          <h1>{{ t('guide-title') }}</h1>
        </div>
        <HeaderControls />
      </div>
    </header>

    <main class="guide-main">
      <!-- Table of Contents -->
      <nav class="toc">
        <h2 class="toc-title">
          <List :size="14" />
          <span>{{ t('guide-toc') }}</span>
        </h2>
        <ul class="toc-list">
          <li v-for="section in sections" :key="section.id">
            <a :href="`#${section.id}`" class="toc-link">{{ t(section.titleKey) }}</a>
          </li>
        </ul>
      </nav>

      <!-- Content Sections -->
      <div class="guide-content">
        <!-- Main Functions -->
        <section id="hauptfunktionen" class="section">
          <div class="section-header">
            <FileAudio :size="18" class="section-icon" />
            <h2>{{ t('guide-section-main') }}</h2>
          </div>

          <div class="subsection">
            <h3>
              <Upload :size="14" class="subsection-icon" />
              {{ t('guide-upload-title') }}
            </h3>
            <p>{{ t('guide-upload-desc') }}</p>
            <div class="tip-box">
              <strong>{{ t('guide-tip-label') }}</strong> {{ t('guide-upload-tip') }}
            </div>
          </div>

          <div class="subsection">
            <h3>
              <Activity :size="14" class="subsection-icon" />
              {{ t('guide-analyze-title') }}
            </h3>
            <p>{{ t('guide-analyze-desc') }}</p>
            <ul class="feature-list">
              <li><strong>Peak Level (dBFS):</strong> {{ t('guide-analyze-peak-desc') }}</li>
              <li><strong>RMS Level (dBFS):</strong> {{ t('guide-analyze-rms-desc') }}</li>
              <li><strong>LUFS:</strong> {{ t('guide-analyze-lufs-desc') }}</li>
              <li><strong>Dynamic Range:</strong> {{ t('guide-analyze-dynamic-desc') }}</li>
              <li><strong>Clipping:</strong> {{ t('guide-analyze-clipping-desc') }}</li>
              <li><strong>Noise Floor:</strong> {{ t('guide-analyze-noise-desc') }}</li>
            </ul>
          </div>
        </section>

        <!-- Normalization -->
        <section id="normalisierung" class="section">
          <div class="section-header">
            <Sliders :size="18" class="section-icon" />
            <h2>{{ t('guide-section-normalization') }}</h2>
          </div>

          <div class="subsection">
            <h3>{{ t('guide-rms-title') }}</h3>
            <p>{{ t('guide-rms-desc') }}</p>
            <div class="info-box">
              <strong>{{ t('guide-recommended-values') }}</strong>
              <ul>
                <li>{{ t('guide-rms-music') }}</li>
                <li>{{ t('guide-rms-podcast') }}</li>
                <li>{{ t('guide-rms-mastering') }}</li>
              </ul>
            </div>
            <div class="warning-box">
              <strong>{{ t('guide-note-label') }}</strong> {{ t('guide-rms-note') }}
            </div>
          </div>

          <div class="subsection">
            <h3>{{ t('guide-peak-title') }}</h3>
            <p>{{ t('guide-peak-desc') }}</p>
            <div class="info-box">
              <strong>{{ t('guide-recommended-values') }}</strong>
              <ul>
                <li>{{ t('guide-peak-standard') }}</li>
                <li>{{ t('guide-peak-conservative') }}</li>
                <li>{{ t('guide-peak-streaming') }}</li>
              </ul>
            </div>
          </div>

          <div class="subsection">
            <h3>{{ t('guide-ebu-title') }}</h3>
            <p>{{ t('guide-ebu-desc') }}</p>
            <div class="info-box">
              <strong>{{ t('guide-standard-values') }}</strong>
              <ul>
                <li>{{ t('guide-ebu-tv') }}</li>
                <li>{{ t('guide-ebu-streaming') }}</li>
                <li>{{ t('guide-ebu-youtube') }}</li>
                <li>{{ t('guide-ebu-film') }}</li>
              </ul>
            </div>
          </div>
        </section>

        <!-- Enhancement -->
        <section id="verbesserung" class="section">
          <div class="section-header">
            <Sparkles :size="18" class="section-icon" />
            <h2>{{ t('guide-section-enhancement') }}</h2>
          </div>

          <div class="subsection">
            <h3>{{ t('guide-noise-title') }}</h3>
            <p>{{ t('guide-noise-desc') }}</p>
            <div class="tip-box">
              <strong>{{ t('guide-ideal-for') }}</strong> {{ t('guide-noise-ideal') }}
            </div>
          </div>

          <div class="subsection">
            <h3>{{ t('guide-clipping-title') }}</h3>
            <p>{{ t('guide-clipping-desc') }}</p>
            <div class="warning-box">
              <strong>{{ t('guide-important-label') }}</strong> {{ t('guide-clipping-note') }}
            </div>
          </div>

          <div class="subsection">
            <h3>{{ t('guide-compression-title') }}</h3>
            <p>{{ t('guide-compression-desc') }}</p>
            <div class="info-box">
              <strong>{{ t('guide-parameters') }}</strong>
              <ul>
                <li><strong>Threshold:</strong> {{ t('guide-compression-threshold-desc') }}</li>
                <li><strong>Ratio:</strong> {{ t('guide-compression-ratio-desc') }}</li>
                <li><strong>Attack:</strong> {{ t('guide-compression-attack-desc') }}</li>
                <li><strong>Release:</strong> {{ t('guide-compression-release-desc') }}</li>
              </ul>
            </div>
          </div>
        </section>

        <!-- Batch -->
        <section id="batch" class="section">
          <div class="section-header">
            <Layers :size="18" class="section-icon" />
            <h2>{{ t('guide-section-batch') }}</h2>
          </div>

          <p class="section-intro">{{ t('guide-batch-desc') }}</p>

          <div class="grid-2">
            <div class="grid-item">
              <h4>{{ t('guide-batch-analyze') }}</h4>
              <p>{{ t('guide-batch-analyze-desc') }}</p>
            </div>
            <div class="grid-item">
              <h4>{{ t('guide-batch-normalize') }}</h4>
              <p>{{ t('guide-batch-normalize-desc') }}</p>
            </div>
            <div class="grid-item">
              <h4>{{ t('guide-batch-enhance') }}</h4>
              <p>{{ t('guide-batch-enhance-desc') }}</p>
            </div>
            <div class="grid-item">
              <h4>{{ t('guide-batch-export') }}</h4>
              <p>{{ t('guide-batch-export-desc') }}</p>
            </div>
            <div class="grid-item">
              <h4>{{ t('guide-batch-reset') }}</h4>
              <p>{{ t('guide-batch-reset-desc') }}</p>
            </div>
            <div class="grid-item">
              <h4>{{ t('guide-batch-delete') }}</h4>
              <p>{{ t('guide-batch-delete-desc') }}</p>
            </div>
          </div>
        </section>

        <!-- Export -->
        <section id="export" class="section">
          <div class="section-header">
            <Download :size="18" class="section-icon" />
            <h2>{{ t('guide-section-export') }}</h2>
          </div>

          <p class="section-intro">{{ t('guide-export-desc') }}</p>

          <ul class="check-list">
            <li>
              <CheckCircle :size="14" class="check-icon" />
              <span
                ><strong>{{ t('guide-export-single-label') }}</strong>
                {{ t('guide-export-single') }}</span
              >
            </li>
            <li>
              <CheckCircle :size="14" class="check-icon" />
              <span
                ><strong>{{ t('guide-export-batch-label') }}</strong>
                {{ t('guide-export-batch') }}</span
              >
            </li>
            <li>
              <CheckCircle :size="14" class="check-icon" />
              <span
                ><strong>{{ t('guide-export-format-label') }}</strong>
                {{ t('guide-export-format') }}</span
              >
            </li>
          </ul>
        </section>

        <!-- Tips -->
        <section id="tipps" class="section section-highlight">
          <div class="section-header">
            <Lightbulb :size="18" class="section-icon highlight" />
            <h2>{{ t('guide-section-tips') }}</h2>
          </div>

          <div class="tips-grid">
            <div class="tip-card">
              <span class="tip-number">1</span>
              <h4>{{ t('guide-tip1-title') }}</h4>
              <p>{{ t('guide-tip1-desc') }}</p>
            </div>
            <div class="tip-card">
              <span class="tip-number">2</span>
              <h4>{{ t('guide-tip2-title') }}</h4>
              <p>{{ t('guide-tip2-desc') }}</p>
            </div>
            <div class="tip-card">
              <span class="tip-number">3</span>
              <h4>{{ t('guide-tip3-title') }}</h4>
              <p>{{ t('guide-tip3-desc') }}</p>
            </div>
            <div class="tip-card">
              <span class="tip-number">4</span>
              <h4>{{ t('guide-tip4-title') }}</h4>
              <p>{{ t('guide-tip4-desc') }}</p>
            </div>
            <div class="tip-card">
              <span class="tip-number">5</span>
              <h4>{{ t('guide-tip5-title') }}</h4>
              <p>{{ t('guide-tip5-desc') }}</p>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- Footer -->
    <footer class="guide-footer">
      <p>{{ t('guide-footer') }}</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useRouter } from 'vue-router'
  import { useI18n } from '../composables/useI18n'
  import {
    ArrowLeft,
    HelpCircle,
    List,
    FileAudio,
    Upload,
    Activity,
    Sliders,
    Sparkles,
    Layers,
    Download,
    CheckCircle,
    Lightbulb,
  } from 'lucide-vue-next'
  import HeaderControls from '../components/HeaderControls.vue'

  const router = useRouter()
  const { t } = useI18n()

  const sections = computed(() => [
    { id: 'hauptfunktionen', titleKey: 'guide-section-main' },
    { id: 'normalisierung', titleKey: 'guide-section-normalization' },
    { id: 'verbesserung', titleKey: 'guide-section-enhancement' },
    { id: 'batch', titleKey: 'guide-section-batch' },
    { id: 'export', titleKey: 'guide-section-export' },
    { id: 'tipps', titleKey: 'guide-section-tips' },
  ])
</script>

<style scoped>
  /* Base */
  .guide-page {
    min-height: 100vh;
    background: var(--ds-surface-0);
    color: var(--ds-text);
    font-size: var(--ds-text-md);
    line-height: var(--ds-leading);
  }

  /* Header */
  .guide-header {
    background: var(--ds-surface-1);
    border-bottom: var(--ds-border-width) solid var(--ds-border);
    position: sticky;
    top: 0;
    z-index: var(--ds-z-topbar);
  }

  .header-content {
    max-width: 960px;
    min-height: var(--ds-topbar-height);
    margin: 0 auto;
    padding: 0 var(--ds-gutter);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ds-space-3);
  }

  .back-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--ds-space-2);
    height: var(--ds-control-md);
    padding: 0 var(--ds-space-3);
    background: var(--ds-surface-2);
    border: var(--ds-border-width) solid var(--ds-border-strong);
    border-radius: var(--ds-radius-md);
    color: var(--ds-text);
    font: inherit;
    font-size: var(--ds-text-sm);
    font-weight: var(--ds-weight-medium);
    cursor: pointer;
    transition: background-color var(--ds-duration) var(--ds-ease);
  }

  .back-btn:hover {
    background: var(--ds-surface-3);
  }

  .back-btn:focus-visible,
  .toc-link:focus-visible {
    outline: none;
    box-shadow: var(--ds-focus-ring);
  }

  .header-title {
    display: flex;
    align-items: center;
    gap: var(--ds-space-2);
    color: var(--ds-text);
    min-width: 0;
  }

  .header-title h1 {
    font-size: var(--ds-text-lg);
    font-weight: var(--ds-weight-semibold);
    line-height: var(--ds-leading-tight);
    margin: 0;
  }

  /* Main */
  .guide-main {
    max-width: 960px;
    margin: 0 auto;
    padding: var(--ds-space-6) var(--ds-gutter);
    display: grid;
    grid-template-columns: 200px 1fr;
    gap: var(--ds-space-8);
  }

  /* Table of Contents */
  .toc {
    position: sticky;
    top: calc(var(--ds-topbar-height) + var(--ds-space-4));
    height: fit-content;
    background: var(--ds-surface-1);
    border: var(--ds-border-width) solid var(--ds-border);
    border-radius: var(--ds-radius-md);
    padding: var(--ds-space-4);
  }

  .toc-title {
    display: flex;
    align-items: center;
    gap: var(--ds-space-1);
    font-size: var(--ds-text-xs);
    font-weight: var(--ds-weight-semibold);
    color: var(--ds-text-2);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin: 0 0 var(--ds-space-3) 0;
  }

  .toc-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .toc-link {
    display: block;
    padding: var(--ds-space-1) var(--ds-space-2);
    font-size: var(--ds-text-sm);
    color: var(--ds-text-2);
    text-decoration: none;
    border-radius: var(--ds-radius-sm);
    transition:
      background-color var(--ds-duration) var(--ds-ease),
      color var(--ds-duration) var(--ds-ease);
  }

  .toc-link:hover {
    background: var(--ds-surface-2);
    color: var(--ds-text);
  }

  /* Content */
  .guide-content {
    display: flex;
    flex-direction: column;
    gap: var(--ds-space-6);
    min-width: 0;
  }

  /* Section */
  .section {
    background: var(--ds-surface-1);
    border: var(--ds-border-width) solid var(--ds-border);
    border-radius: var(--ds-radius-md);
    padding: var(--ds-space-5);
    scroll-margin-top: calc(var(--ds-topbar-height) + var(--ds-space-4));
  }

  .section-highlight {
    border-color: var(--ds-accent);
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: var(--ds-space-2);
    margin-bottom: var(--ds-space-4);
    padding-bottom: var(--ds-space-3);
    border-bottom: var(--ds-border-width) solid var(--ds-border);
  }

  .section-icon {
    color: var(--ds-accent);
    flex-shrink: 0;
  }

  .section-header h2 {
    font-size: var(--ds-text-xl);
    font-weight: var(--ds-weight-semibold);
    line-height: var(--ds-leading-tight);
    margin: 0;
  }

  .section-intro {
    color: var(--ds-text-2);
    margin: 0 0 var(--ds-space-4) 0;
  }

  /* Subsection */
  .subsection {
    margin-bottom: var(--ds-space-5);
  }

  .subsection:last-child {
    margin-bottom: 0;
  }

  .subsection h3 {
    display: flex;
    align-items: center;
    gap: var(--ds-space-2);
    font-size: var(--ds-text-lg);
    font-weight: var(--ds-weight-semibold);
    line-height: var(--ds-leading-tight);
    margin: 0 0 var(--ds-space-2) 0;
    color: var(--ds-text);
  }

  .subsection-icon {
    color: var(--ds-text-2);
    flex-shrink: 0;
  }

  .subsection p {
    color: var(--ds-text-2);
    margin: 0 0 var(--ds-space-3) 0;
  }

  /* Lists */
  .feature-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--ds-space-1);
  }

  .feature-list li {
    font-size: var(--ds-text-sm);
    color: var(--ds-text-2);
    padding-left: var(--ds-space-4);
    position: relative;
  }

  .feature-list li::before {
    content: '•';
    position: absolute;
    left: var(--ds-space-1);
    color: var(--ds-accent);
  }

  .feature-list li strong {
    color: var(--ds-text);
  }

  /* Info boxes: calm notes on surface 2, no coloured stripe. */
  .info-box,
  .tip-box,
  .warning-box {
    padding: var(--ds-space-3);
    border-radius: var(--ds-radius-md);
    background: var(--ds-surface-2);
    color: var(--ds-text-2);
    font-size: var(--ds-text-sm);
    margin-top: var(--ds-space-2);
  }

  .info-box strong,
  .tip-box strong,
  .warning-box strong {
    display: block;
    font-size: var(--ds-text-sm);
    font-weight: var(--ds-weight-semibold);
    margin-bottom: var(--ds-space-1);
    color: var(--ds-text);
  }

  .tip-box strong {
    color: var(--ds-accent);
  }

  .warning-box strong {
    color: var(--ds-warning);
  }

  .info-box ul,
  .tip-box ul,
  .warning-box ul {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .info-box li {
    font-size: var(--ds-text-sm);
    color: var(--ds-text-2);
    padding: 2px 0;
  }

  /* Grid */
  .grid-2 {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--ds-space-3);
  }

  .grid-item {
    background: var(--ds-surface-2);
    padding: var(--ds-space-3);
    border-radius: var(--ds-radius-md);
  }

  .grid-item h4 {
    font-size: var(--ds-text-md);
    font-weight: var(--ds-weight-semibold);
    margin: 0 0 var(--ds-space-1) 0;
    color: var(--ds-text);
  }

  .grid-item p {
    font-size: var(--ds-text-sm);
    color: var(--ds-text-2);
    margin: 0;
  }

  /* Check List */
  .check-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--ds-space-2);
  }

  .check-list li {
    display: flex;
    align-items: flex-start;
    gap: var(--ds-space-2);
    color: var(--ds-text-2);
  }

  .check-icon {
    color: var(--ds-success);
    flex-shrink: 0;
    margin-top: 3px;
  }

  .check-list li strong {
    color: var(--ds-text);
  }

  /* Tips Grid */
  .tips-grid {
    display: flex;
    flex-direction: column;
    gap: var(--ds-space-3);
  }

  .tip-card {
    display: grid;
    grid-template-columns: var(--ds-control-sm) 1fr;
    grid-template-rows: auto auto;
    gap: var(--ds-space-1) var(--ds-space-3);
    background: var(--ds-surface-2);
    padding: var(--ds-space-3);
    border-radius: var(--ds-radius-md);
  }

  .tip-number {
    grid-row: 1 / 3;
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--ds-control-sm);
    height: var(--ds-control-sm);
    background: var(--ds-accent-soft);
    color: var(--ds-text);
    border-radius: 50%;
    font-size: var(--ds-text-sm);
    font-weight: var(--ds-weight-semibold);
  }

  .tip-card h4 {
    font-size: var(--ds-text-md);
    font-weight: var(--ds-weight-semibold);
    margin: 0;
    color: var(--ds-text);
  }

  .tip-card p {
    font-size: var(--ds-text-sm);
    color: var(--ds-text-2);
    margin: 0;
  }

  /* Footer */
  .guide-footer {
    background: var(--ds-surface-1);
    border-top: var(--ds-border-width) solid var(--ds-border);
    padding: var(--ds-space-6);
    text-align: center;
    margin-top: var(--ds-space-8);
  }

  .guide-footer p {
    font-size: var(--ds-text-sm);
    color: var(--ds-text-2);
    margin: 0;
  }

  /* Responsive - Tablet */
  @media (max-width: 768px) {
    .guide-main {
      grid-template-columns: 1fr;
      padding: var(--ds-space-4);
      gap: var(--ds-space-4);
    }

    .toc {
      position: relative;
      top: 0;
    }

    .toc-list {
      flex-direction: row;
      flex-wrap: wrap;
      gap: var(--ds-space-1);
    }

    .toc-link {
      background: var(--ds-surface-2);
      min-height: var(--ds-control-md);
      display: flex;
      align-items: center;
      padding: 0 var(--ds-space-3);
    }

    .grid-2 {
      grid-template-columns: 1fr;
    }

    .header-content {
      padding: 0 var(--ds-space-4);
    }

    .section {
      padding: var(--ds-space-4);
    }

    .back-btn {
      min-height: var(--ds-control-lg);
    }
  }

  /* Responsive - Phone */
  @media (max-width: 480px) {
    .guide-main {
      padding: var(--ds-space-3);
      gap: var(--ds-space-3);
    }

    .header-content {
      padding: 0 var(--ds-space-3);
    }

    .header-title h1 {
      font-size: var(--ds-text-md);
    }

    .back-btn span {
      display: none;
    }

    .section {
      padding: var(--ds-space-3);
    }

    .section-header h2 {
      font-size: var(--ds-text-lg);
    }
  }
</style>
