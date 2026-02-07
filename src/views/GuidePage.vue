<template>
  <div class="guide-page">
    <!-- Header -->
    <header class="guide-header">
      <div class="header-content">
        <button @click="router.push('/')" class="back-btn">
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
              <span><strong>{{ t('guide-export-single-label') }}</strong> {{ t('guide-export-single') }}</span>
            </li>
            <li>
              <CheckCircle :size="14" class="check-icon" />
              <span><strong>{{ t('guide-export-batch-label') }}</strong> {{ t('guide-export-batch') }}</span>
            </li>
            <li>
              <CheckCircle :size="14" class="check-icon" />
              <span><strong>{{ t('guide-export-format-label') }}</strong> {{ t('guide-export-format') }}</span>
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

<script setup>
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
  Lightbulb
} from 'lucide-vue-next'
import HeaderControls from '../components/HeaderControls.vue'

const router = useRouter()
const { t, locale } = useI18n()

const sections = computed(() => [
  { id: 'hauptfunktionen', titleKey: 'guide-section-main' },
  { id: 'normalisierung', titleKey: 'guide-section-normalization' },
  { id: 'verbesserung', titleKey: 'guide-section-enhancement' },
  { id: 'batch', titleKey: 'guide-section-batch' },
  { id: 'export', titleKey: 'guide-section-export' },
  { id: 'tipps', titleKey: 'guide-section-tips' }
])
</script>

<style scoped>
/* Base */
.guide-page {
  min-height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 0.8rem;
  line-height: 1.6;
  letter-spacing: -0.01em;
}

/* Header */
.guide-header {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
  padding: 0.75rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(12px);
}

.header-content {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.35rem 0.75rem;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 0.375rem;
  color: var(--text-primary);
  font-size: 0.7rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: none;
}

.back-btn:hover {
  background: var(--primary);
  color: var(--bg-primary);
  border-color: var(--primary);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-primary);
}

.header-title h1 {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0;
  text-transform: none;
  letter-spacing: -0.02em;
}

/* Main */
.guide-main {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem;
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: 2rem;
}

/* Table of Contents */
.toc {
  position: sticky;
  top: 4rem;
  height: fit-content;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  padding: 1rem;
}

.toc-title {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: none;
  letter-spacing: 0.05em;
  margin: 0 0 0.75rem 0;
}

.toc-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.toc-link {
  display: block;
  padding: 0.3rem 0.5rem;
  font-size: 0.7rem;
  color: var(--text-secondary);
  text-decoration: none;
  border-radius: 0.25rem;
  transition: all 0.2s ease;
  text-transform: none;
}

.toc-link:hover {
  background: var(--bg-secondary);
  color: var(--primary);
}

/* Content */
.guide-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Section */
.section {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 0.5rem;
  padding: 1.25rem;
}

.section-highlight {
  background: linear-gradient(135deg, var(--bg-card), rgba(201, 152, 77, 0.03));
  border-color: rgba(201, 152, 77, 0.2);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border);
}

.section-icon {
  color: var(--primary);
}

.section-icon.highlight {
  color: var(--primary);
}

.section-header h2 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  text-transform: none;
  letter-spacing: -0.02em;
}

.section-intro {
  color: var(--text-secondary);
  margin: 0 0 1rem 0;
  font-size: 0.8rem;
}

/* Subsection */
.subsection {
  margin-bottom: 1.25rem;
}

.subsection:last-child {
  margin-bottom: 0;
}

.subsection h3 {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: var(--text-primary);
  text-transform: none;
}

.subsection-icon {
  color: var(--primary-secondary, #014f99);
}

.subsection p {
  color: var(--text-secondary);
  margin: 0 0 0.75rem 0;
  font-size: 0.8rem;
}

/* Lists */
.feature-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.feature-list li {
  font-size: 0.75rem;
  color: var(--text-secondary);
  padding-left: 0.75rem;
  position: relative;
}

.feature-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: var(--primary);
}

.feature-list li strong {
  color: var(--text-primary);
}

/* Info Boxes */
.info-box,
.tip-box,
.warning-box {
  padding: 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  margin-top: 0.5rem;
}

.info-box {
  background: var(--bg-secondary);
  border-left: 2px solid var(--text-secondary);
}

.tip-box {
  background: rgba(201, 152, 77, 0.08);
  border-left: 2px solid var(--primary);
}

.warning-box {
  background: rgba(162, 134, 128, 0.1);
  border-left: 2px solid var(--primary-secondary, #014f99);
}

.info-box strong,
.tip-box strong,
.warning-box strong {
  display: block;
  font-size: 0.7rem;
  text-transform: none;
  margin-bottom: 0.35rem;
  color: var(--text-primary);
}

.info-box ul,
.tip-box ul,
.warning-box ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.info-box li {
  font-size: 0.7rem;
  color: var(--text-secondary);
  padding: 0.15rem 0;
}

/* Grid */
.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.grid-item {
  background: var(--bg-secondary);
  padding: 0.75rem;
  border-radius: 0.375rem;
}

.grid-item h4 {
  font-size: 0.75rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
  color: var(--text-primary);
  text-transform: none;
}

.grid-item p {
  font-size: 0.7rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Check List */
.check-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.check-list li {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.check-icon {
  color: var(--success);
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.check-list li strong {
  color: var(--text-primary);
}

/* Tips Grid */
.tips-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.tip-card {
  display: grid;
  grid-template-columns: 1.5rem 1fr;
  grid-template-rows: auto auto;
  gap: 0.25rem 0.5rem;
  background: var(--bg-secondary);
  padding: 0.75rem;
  border-radius: 0.375rem;
}

.tip-number {
  grid-row: 1 / 3;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  background: var(--primary);
  color: var(--bg-primary);
  border-radius: 50%;
  font-size: 0.65rem;
  font-weight: 600;
}

.tip-card h4 {
  font-size: 0.75rem;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
  text-transform: none;
}

.tip-card p {
  font-size: 0.7rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Footer */
.guide-footer {
  background: var(--bg-secondary);
  border-top: 1px solid var(--border);
  padding: 1.5rem;
  text-align: center;
  margin-top: 2rem;
}

.guide-footer p {
  font-size: 0.7rem;
  color: var(--text-secondary);
  margin: 0;
  text-transform: none;
}

/* Responsive */
@media (max-width: 768px) {
  .guide-main {
    grid-template-columns: 1fr;
    padding: 1rem;
    gap: 1rem;
  }

  .toc {
    position: relative;
    top: 0;
  }

  .toc-list {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .toc-link {
    font-size: 0.65rem;
    padding: 0.25rem 0.5rem;
    background: var(--bg-secondary);
  }

  .grid-2 {
    grid-template-columns: 1fr;
  }

  .header-content {
    padding: 0 1rem;
  }

  .section {
    padding: 1rem;
  }
}
</style>
