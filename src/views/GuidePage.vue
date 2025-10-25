// src/views/GuidePage.vue
<template>
  <div class="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
    <header class="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
      <div class="container mx-auto px-4 py-4">
        <div class="flex items-center gap-4">
          <button
            @click="router.push('/')"
            class="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-all"
          >
            <ArrowLeft class="w-5 h-5" />
            <span>Zurück</span>
          </button>
          <div class="flex items-center gap-3">
            <HelpCircle class="w-8 h-8" />
            <h1 class="text-2xl font-bold">Detaillierte Anleitung</h1>
          </div>
        </div>
      </div>
    </header>

    <div class="container mx-auto px-4 py-8 max-w-5xl">
      <nav class="bg-white rounded-xl shadow-lg p-6 mb-8 sticky top-4 z-10">
        <h2 class="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <List class="w-5 h-5" />
          Inhaltsverzeichnis
        </h2>
        <ul class="space-y-2">
          <li v-for="section in sections" :key="section.id">
            <a :href="`#${section.id}`" class="text-blue-600 hover:text-blue-800 hover:underline transition-colors">
              {{ section.title }}
            </a>
          </li>
        </ul>
      </nav>

      <section id="hauptfunktionen" class="bg-white rounded-xl shadow-lg p-8 mb-8">
        <h2 class="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <FileAudio class="w-8 h-8 text-blue-600" />
          Hauptfunktionen
        </h2>

        <div class="mb-8">
          <h3 class="text-2xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Upload class="w-6 h-6 text-purple-600" />
            Audio-Dateien hochladen
          </h3>
          <p class="text-gray-600 mb-3">
            Laden Sie Audio-Dateien in den unterstützten Formaten hoch: MP3, WAV, FLAC, OGG, M4A, AAC.
          </p>
          <div class="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
            <p class="text-sm text-gray-700">
              <strong>Tipp:</strong> Sie können mehrere Dateien gleichzeitig hochladen oder per Drag & Drop hinzufügen.
            </p>
          </div>
        </div>

        <div class="mb-8">
          <h3 class="text-2xl font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Activity class="w-6 h-6 text-green-600" />
            Audio analysieren
          </h3>
          <p class="text-gray-600 mb-3">
            Die Analysefunktion ermittelt wichtige Audio-Parameter:
          </p>
          <ul class="list-disc list-inside space-y-2 text-gray-700 ml-4">
            <li><strong>Peak Level (dBFS):</strong> Höchster Lautstärkepegel der Audio-Datei</li>
            <li><strong>RMS Level (dBFS):</strong> Durchschnittliche Lautstärke</li>
            <li><strong>LUFS:</strong> Loudness Units relative to Full Scale (Broadcast-Standard)</li>
            <li><strong>Dynamic Range:</strong> Unterschied zwischen lautesten und leisesten Stellen</li>
            <li><strong>Clipping:</strong> Anzahl der übersteuerter Samples</li>
            <li><strong>Noise Floor:</strong> Grundrauschen der Aufnahme</li>
          </ul>
        </div>
      </section>

      <section id="normalisierung" class="bg-white rounded-xl shadow-lg p-8 mb-8">
        <h2 class="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <Sliders class="w-8 h-8 text-blue-600" />
          Normalisierungsmethoden
        </h2>

        <div class="mb-8">
          <h3 class="text-2xl font-semibold text-gray-800 mb-3">RMS-Normalisierung</h3>
          <p class="text-gray-600 mb-3">
            Normalisiert die durchschnittliche Lautstärke auf einen Zielwert.
          </p>
          <div class="bg-gray-50 p-4 rounded-lg mb-3">
            <p class="text-sm text-gray-700 mb-2"><strong>Empfohlene Werte:</strong></p>
            <ul class="text-sm text-gray-600 space-y-1 ml-4">
              <li>Musik: -18 dB bis -14 dB</li>
              <li>Podcasts/Sprache: -20 dB bis -16 dB</li>
              <li>Mastering: -12 dB bis -8 dB</li>
            </ul>
          </div>
          <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
            <p class="text-sm text-gray-700">
              <strong>Hinweis:</strong> Niedrigere dB-Werte bedeuten leisere Audio-Signale.
            </p>
          </div>
        </div>

        <div class="mb-8">
          <h3 class="text-2xl font-semibold text-gray-800 mb-3">Peak/dB-Normalisierung</h3>
          <p class="text-gray-600 mb-3">
            Normalisiert den höchsten Pegel (Peak) auf einen Zielwert.
          </p>
          <div class="bg-gray-50 p-4 rounded-lg mb-3">
            <p class="text-sm text-gray-700 mb-2"><strong>Empfohlene Werte:</strong></p>
            <ul class="text-sm text-gray-600 space-y-1 ml-4">
              <li>Standard: -1.0 dB (verhindert Clipping)</li>
              <li>Konservativ: -3.0 dB (mehr Headroom)</li>
              <li>Streaming: -2.0 dB</li>
            </ul>
          </div>
        </div>

        <div class="mb-8">
          <h3 class="text-2xl font-semibold text-gray-800 mb-3">EBU R128 (LUFS)</h3>
          <p class="text-gray-600 mb-3">
            Broadcast-Standard für konsistente Lautstärke über verschiedene Programme/Tracks.
          </p>
          <div class="bg-gray-50 p-4 rounded-lg mb-3">
            <p class="text-sm text-gray-700 mb-2"><strong>Standard-Werte:</strong></p>
            <ul class="text-sm text-gray-600 space-y-1 ml-4">
              <li>TV/Radio (Europa): -23 LUFS</li>
              <li>Streaming (Spotify, Apple Music): -14 LUFS</li>
              <li>YouTube: -14 LUFS</li>
              <li>Film: -24 LUFS</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="verbesserung" class="bg-white rounded-xl shadow-lg p-8 mb-8">
        <h2 class="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <Sparkles class="w-8 h-8 text-blue-600" />
          Audio-Verbesserung
        </h2>

        <div class="mb-8">
          <h3 class="text-2xl font-semibold text-gray-800 mb-3">Rauschunterdrückung</h3>
          <p class="text-gray-600 mb-3">
            Reduziert Hintergrundrauschen und verbessert die Sprachverständlichkeit.
          </p>
          <div class="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
            <p class="text-sm text-gray-700">
              <strong>Ideal für:</strong> Podcasts, Voice-Overs, Interview-Aufnahmen
            </p>
          </div>
        </div>

        <div class="mb-8">
          <h3 class="text-2xl font-semibold text-gray-800 mb-3">Clipping reduzieren</h3>
          <p class="text-gray-600 mb-3">
            Korrigiert übersteuerter Signale und stellt Details in verzerrten Bereichen wieder her.
          </p>
          <div class="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
            <p class="text-sm text-gray-700">
              <strong>Wichtig:</strong> Diese Funktion kann Verzerrungen reduzieren, aber nicht vollständig entfernen.
            </p>
          </div>
        </div>

        <div class="mb-8">
          <h3 class="text-2xl font-semibold text-gray-800 mb-3">Dynamikkompression</h3>
          <p class="text-gray-600 mb-3">
            Reduziert den Unterschied zwischen lauten und leisen Passagen für konsistentere Lautstärke.
          </p>
          <div class="bg-gray-50 p-4 rounded-lg">
            <p class="text-sm text-gray-700 mb-2"><strong>Parameter:</strong></p>
            <ul class="text-sm text-gray-600 space-y-1 ml-4">
              <li><strong>Threshold:</strong> Ab welchem Pegel die Kompression einsetzt</li>
              <li><strong>Ratio:</strong> Stärke der Kompression (z.B. 4:1)</li>
              <li><strong>Attack:</strong> Wie schnell der Kompressor reagiert</li>
              <li><strong>Release:</strong> Wie schnell der Kompressor wieder loslässt</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="batch" class="bg-white rounded-xl shadow-lg p-8 mb-8">
        <h2 class="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <Layers class="w-8 h-8 text-blue-600" />
          Batch-Operationen
        </h2>

        <p class="text-gray-600 mb-4">
          Führen Sie Operationen auf alle geladenen Dateien gleichzeitig aus:
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="bg-gray-50 p-4 rounded-lg">
            <h4 class="font-semibold text-gray-800 mb-2">Alle analysieren</h4>
            <p class="text-sm text-gray-600">Analysiert alle Dateien auf einmal</p>
          </div>

          <div class="bg-gray-50 p-4 rounded-lg">
            <h4 class="font-semibold text-gray-800 mb-2">RMS/dB/EBU R128 anwenden</h4>
            <p class="text-sm text-gray-600">Normalisiert alle Dateien mit der gewählten Methode</p>
          </div>

          <div class="bg-gray-50 p-4 rounded-lg">
            <h4 class="font-semibold text-gray-800 mb-2">Verbesserung anwenden</h4>
            <p class="text-sm text-gray-600">Rauschunterdrückung, Clipping-Reduktion oder Kompression auf alle</p>
          </div>

          <div class="bg-gray-50 p-4 rounded-lg">
            <h4 class="font-semibold text-gray-800 mb-2">Alle exportieren</h4>
            <p class="text-sm text-gray-600">Exportiert alle verarbeiteten Dateien als ZIP</p>
          </div>

          <div class="bg-gray-50 p-4 rounded-lg">
            <h4 class="font-semibold text-gray-800 mb-2">Alle zurücksetzen</h4>
            <p class="text-sm text-gray-600">Setzt alle Dateien auf Original zurück</p>
          </div>

          <div class="bg-gray-50 p-4 rounded-lg">
            <h4 class="font-semibold text-gray-800 mb-2">Alle löschen</h4>
            <p class="text-sm text-gray-600">Entfernt alle Dateien aus der Liste</p>
          </div>
        </div>
      </section>

      <section id="export" class="bg-white rounded-xl shadow-lg p-8 mb-8">
        <h2 class="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <Download class="w-8 h-8 text-blue-600" />
          Export
        </h2>

        <p class="text-gray-600 mb-4">
          Exportieren Sie Ihre verarbeiteten Audio-Dateien:
        </p>

        <ul class="space-y-3 text-gray-700">
          <li class="flex items-start gap-2">
            <CheckCircle class="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span><strong>Einzelexport:</strong> Klicken Sie auf "Exportieren" bei einer Datei</span>
          </li>
          <li class="flex items-start gap-2">
            <CheckCircle class="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span><strong>Batch-Export:</strong> Nutzen Sie "Alle exportieren" für ZIP-Download</span>
          </li>
          <li class="flex items-start gap-2">
            <CheckCircle class="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <span><strong>Format:</strong> Exportiert im Original-Format oder als WAV</span>
          </li>
        </ul>
      </section>

      <section id="tipps" class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-lg p-8">
        <h2 class="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
          <Lightbulb class="w-8 h-8 text-yellow-600" />
          Tipps & Best Practices
        </h2>

        <div class="space-y-4">
          <div class="bg-white p-4 rounded-lg shadow">
            <h4 class="font-semibold text-gray-800 mb-2">1. Immer zuerst analysieren</h4>
            <p class="text-sm text-gray-600">
              Analysieren Sie Ihre Dateien vor der Normalisierung, um die optimalen Parameter zu bestimmen.
            </p>
          </div>

          <div class="bg-white p-4 rounded-lg shadow">
            <h4 class="font-semibold text-gray-800 mb-2">2. Headroom beachten</h4>
            <p class="text-sm text-gray-600">
              Lassen Sie immer etwas Headroom (z.B. -1 dB) um Clipping zu vermeiden.
            </p>
          </div>

          <div class="bg-white p-4 rounded-lg shadow">
            <h4 class="font-semibold text-gray-800 mb-2">3. Vorschau nutzen</h4>
            <p class="text-sm text-gray-600">
              Hören Sie sich das Ergebnis an, bevor Sie exportieren (Original/Normalisiert-Toggle).
            </p>
          </div>

          <div class="bg-white p-4 rounded-lg shadow">
            <h4 class="font-semibold text-gray-800 mb-2">4. Richtige Methode wählen</h4>
            <p class="text-sm text-gray-600">
              RMS für Musik, Peak für maximale Lautstärke, EBU R128 für Broadcast/Streaming.
            </p>
          </div>

          <div class="bg-white p-4 rounded-lg shadow">
            <h4 class="font-semibold text-gray-800 mb-2">5. Nicht überkomprimieren</h4>
            <p class="text-sm text-gray-600">
              Zu starke Kompression macht Audio flach und leblos. Weniger ist oft mehr.
            </p>
          </div>
        </div>
      </section>
    </div>

    <footer class="bg-gray-800 text-white py-6 mt-12">
      <div class="container mx-auto px-4 text-center">
        <p class="text-sm text-gray-400">
          Audio Normalisierung Pro - Professionelle Audio-Bearbeitung im Browser
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
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

const sections = ref([
  { id: 'hauptfunktionen', title: 'Hauptfunktionen' },
  { id: 'normalisierung', title: 'Normalisierungsmethoden' },
  { id: 'verbesserung', title: 'Audio-Verbesserung' },
  { id: 'batch', title: 'Batch-Operationen' },
  { id: 'export', title: 'Export' },
  { id: 'tipps', title: 'Tipps & Best Practices' }
])
</script>