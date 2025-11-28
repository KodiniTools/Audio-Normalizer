<template>
  <div class="guide-page">
    <!-- Header -->
    <header class="guide-header">
      <div class="header-content">
        <button @click="router.push('/')" class="back-btn">
          <ArrowLeft :size="16" />
          <span>{{ t('nav.backToHome') }}</span>
        </button>
        <div class="header-title">
          <HelpCircle :size="20" />
          <h1>{{ t('guide-title') }}</h1>
        </div>
      </div>
    </header>

    <main class="guide-main">
      <!-- Table of Contents -->
      <nav class="toc">
        <h2 class="toc-title">
          <List :size="14" />
          <span>inhalt</span>
        </h2>
        <ul class="toc-list">
          <li v-for="section in sections" :key="section.id">
            <a :href="`#${section.id}`" class="toc-link">{{ section.title }}</a>
          </li>
        </ul>
      </nav>

      <!-- Content Sections -->
      <div class="guide-content">
        <!-- Hauptfunktionen -->
        <section id="hauptfunktionen" class="section">
          <div class="section-header">
            <FileAudio :size="18" class="section-icon" />
            <h2>hauptfunktionen</h2>
          </div>

          <div class="subsection">
            <h3>
              <Upload :size="14" class="subsection-icon" />
              audio-dateien hochladen
            </h3>
            <p>Laden Sie Audio-Dateien in den unterstützten Formaten hoch: MP3, WAV, FLAC, OGG, M4A, AAC.</p>
            <div class="tip-box">
              <strong>tipp:</strong> Sie können mehrere Dateien gleichzeitig hochladen oder per Drag & Drop hinzufügen.
            </div>
          </div>

          <div class="subsection">
            <h3>
              <Activity :size="14" class="subsection-icon" />
              audio analysieren
            </h3>
            <p>Die Analysefunktion ermittelt wichtige Audio-Parameter:</p>
            <ul class="feature-list">
              <li><strong>Peak Level (dBFS):</strong> Höchster Lautstärkepegel</li>
              <li><strong>RMS Level (dBFS):</strong> Durchschnittliche Lautstärke</li>
              <li><strong>LUFS:</strong> Loudness Units (Broadcast-Standard)</li>
              <li><strong>Dynamic Range:</strong> Lautstärkeunterschied</li>
              <li><strong>Clipping:</strong> Übersteuerte Samples</li>
              <li><strong>Noise Floor:</strong> Grundrauschen</li>
            </ul>
          </div>
        </section>

        <!-- Normalisierung -->
        <section id="normalisierung" class="section">
          <div class="section-header">
            <Sliders :size="18" class="section-icon" />
            <h2>normalisierungsmethoden</h2>
          </div>

          <div class="subsection">
            <h3>rms-normalisierung</h3>
            <p>Normalisiert die durchschnittliche Lautstärke auf einen Zielwert.</p>
            <div class="info-box">
              <strong>empfohlene werte:</strong>
              <ul>
                <li>Musik: -18 dB bis -14 dB</li>
                <li>Podcasts/Sprache: -20 dB bis -16 dB</li>
                <li>Mastering: -12 dB bis -8 dB</li>
              </ul>
            </div>
            <div class="warning-box">
              <strong>hinweis:</strong> Niedrigere dB-Werte bedeuten leisere Audio-Signale.
            </div>
          </div>

          <div class="subsection">
            <h3>peak/db-normalisierung</h3>
            <p>Normalisiert den höchsten Pegel (Peak) auf einen Zielwert.</p>
            <div class="info-box">
              <strong>empfohlene werte:</strong>
              <ul>
                <li>Standard: -1.0 dB (verhindert Clipping)</li>
                <li>Konservativ: -3.0 dB (mehr Headroom)</li>
                <li>Streaming: -2.0 dB</li>
              </ul>
            </div>
          </div>

          <div class="subsection">
            <h3>ebu r128 (lufs)</h3>
            <p>Broadcast-Standard für konsistente Lautstärke.</p>
            <div class="info-box">
              <strong>standard-werte:</strong>
              <ul>
                <li>TV/Radio (Europa): -23 LUFS</li>
                <li>Streaming (Spotify, Apple): -14 LUFS</li>
                <li>YouTube: -14 LUFS</li>
                <li>Film: -24 LUFS</li>
              </ul>
            </div>
          </div>
        </section>

        <!-- Verbesserung -->
        <section id="verbesserung" class="section">
          <div class="section-header">
            <Sparkles :size="18" class="section-icon" />
            <h2>audio-verbesserung</h2>
          </div>

          <div class="subsection">
            <h3>rauschunterdrückung</h3>
            <p>Reduziert Hintergrundrauschen und verbessert die Sprachverständlichkeit.</p>
            <div class="tip-box">
              <strong>ideal für:</strong> Podcasts, Voice-Overs, Interview-Aufnahmen
            </div>
          </div>

          <div class="subsection">
            <h3>clipping reduzieren</h3>
            <p>Korrigiert übersteuerte Signale und stellt Details wieder her.</p>
            <div class="warning-box">
              <strong>wichtig:</strong> Kann Verzerrungen reduzieren, aber nicht vollständig entfernen.
            </div>
          </div>

          <div class="subsection">
            <h3>dynamikkompression</h3>
            <p>Reduziert den Unterschied zwischen lauten und leisen Passagen.</p>
            <div class="info-box">
              <strong>parameter:</strong>
              <ul>
                <li><strong>Threshold:</strong> Ab welchem Pegel komprimiert wird</li>
                <li><strong>Ratio:</strong> Stärke der Kompression (z.B. 4:1)</li>
                <li><strong>Attack:</strong> Reaktionsgeschwindigkeit</li>
                <li><strong>Release:</strong> Abklingzeit</li>
              </ul>
            </div>
          </div>
        </section>

        <!-- Batch -->
        <section id="batch" class="section">
          <div class="section-header">
            <Layers :size="18" class="section-icon" />
            <h2>batch-operationen</h2>
          </div>

          <p class="section-intro">Führen Sie Operationen auf alle geladenen Dateien gleichzeitig aus:</p>

          <div class="grid-2">
            <div class="grid-item">
              <h4>alle analysieren</h4>
              <p>Analysiert alle Dateien auf einmal</p>
            </div>
            <div class="grid-item">
              <h4>normalisierung anwenden</h4>
              <p>RMS/dB/EBU R128 auf alle Dateien</p>
            </div>
            <div class="grid-item">
              <h4>verbesserung anwenden</h4>
              <p>Rauschunterdrückung, Clipping, Kompression</p>
            </div>
            <div class="grid-item">
              <h4>alle exportieren</h4>
              <p>Exportiert als ZIP-Download</p>
            </div>
            <div class="grid-item">
              <h4>alle zurücksetzen</h4>
              <p>Setzt alle auf Original zurück</p>
            </div>
            <div class="grid-item">
              <h4>alle löschen</h4>
              <p>Entfernt alle aus der Liste</p>
            </div>
          </div>
        </section>

        <!-- Export -->
        <section id="export" class="section">
          <div class="section-header">
            <Download :size="18" class="section-icon" />
            <h2>export</h2>
          </div>

          <p class="section-intro">Exportieren Sie Ihre verarbeiteten Audio-Dateien:</p>

          <ul class="check-list">
            <li>
              <CheckCircle :size="14" class="check-icon" />
              <span><strong>Einzelexport:</strong> Klicken Sie auf "Exportieren" bei einer Datei</span>
            </li>
            <li>
              <CheckCircle :size="14" class="check-icon" />
              <span><strong>Batch-Export:</strong> Nutzen Sie "Alle exportieren" für ZIP-Download</span>
            </li>
            <li>
              <CheckCircle :size="14" class="check-icon" />
              <span><strong>Format:</strong> WAV oder MP3 (320 kbps)</span>
            </li>
          </ul>
        </section>

        <!-- Tipps -->
        <section id="tipps" class="section section-highlight">
          <div class="section-header">
            <Lightbulb :size="18" class="section-icon highlight" />
            <h2>tipps & best practices</h2>
          </div>

          <div class="tips-grid">
            <div class="tip-card">
              <span class="tip-number">1</span>
              <h4>immer zuerst analysieren</h4>
              <p>Analysieren Sie Ihre Dateien vor der Normalisierung, um die optimalen Parameter zu bestimmen.</p>
            </div>
            <div class="tip-card">
              <span class="tip-number">2</span>
              <h4>headroom beachten</h4>
              <p>Lassen Sie immer etwas Headroom (z.B. -1 dB) um Clipping zu vermeiden.</p>
            </div>
            <div class="tip-card">
              <span class="tip-number">3</span>
              <h4>vorschau nutzen</h4>
              <p>Hören Sie sich das Ergebnis an, bevor Sie exportieren.</p>
            </div>
            <div class="tip-card">
              <span class="tip-number">4</span>
              <h4>richtige methode wählen</h4>
              <p>RMS für Musik, Peak für maximale Lautstärke, EBU R128 für Streaming.</p>
            </div>
            <div class="tip-card">
              <span class="tip-number">5</span>
              <h4>nicht überkomprimieren</h4>
              <p>Zu starke Kompression macht Audio flach und leblos.</p>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- Footer -->
    <footer class="guide-footer">
      <p>audio normalizer — professionelle audio-bearbeitung im browser</p>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
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

const router = useRouter()
const { t } = useI18n()

const sections = ref([
  { id: 'hauptfunktionen', title: 'hauptfunktionen' },
  { id: 'normalisierung', title: 'normalisierung' },
  { id: 'verbesserung', title: 'audio-verbesserung' },
  { id: 'batch', title: 'batch-operationen' },
  { id: 'export', title: 'export' },
  { id: 'tipps', title: 'tipps' }
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
  text-transform: lowercase;
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
  text-transform: lowercase;
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
  text-transform: uppercase;
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
  text-transform: lowercase;
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
  background: linear-gradient(135deg, var(--bg-card), rgba(242, 226, 142, 0.03));
  border-color: rgba(242, 226, 142, 0.2);
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
  text-transform: lowercase;
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
  text-transform: lowercase;
}

.subsection-icon {
  color: var(--primary-secondary, #A28680);
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
  background: rgba(242, 226, 142, 0.08);
  border-left: 2px solid var(--primary);
}

.warning-box {
  background: rgba(162, 134, 128, 0.1);
  border-left: 2px solid var(--primary-secondary, #A28680);
}

.info-box strong,
.tip-box strong,
.warning-box strong {
  display: block;
  font-size: 0.7rem;
  text-transform: lowercase;
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
  text-transform: lowercase;
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
  text-transform: lowercase;
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
  text-transform: lowercase;
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
