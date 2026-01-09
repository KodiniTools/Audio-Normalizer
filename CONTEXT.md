# CONTEXT.md - Audio Normalizer

Dieses Dokument bietet einen umfassenden Überblick über die technische Struktur des Audio-Normalizer-Projekts.

---

## Tech-Stack

### Frontend-Framework & Build-Tools

| Technologie | Version | Beschreibung |
|-------------|---------|--------------|
| **Vue 3** | 3.4.0 | Progressive JavaScript Framework mit Composition API |
| **Vite** | 5.0.0 | Modernes Build-Tool und Development Server |
| **@vitejs/plugin-vue** | 5.0.0 | Vue-Plugin für Vite |

### Routing & Internationalisierung

| Technologie | Version | Beschreibung |
|-------------|---------|--------------|
| **Vue Router** | 4.2.0 | Offizielle Vue-Routing-Bibliothek |
| **Vue i18n** | 9.14.5 | Internationalisierung (Deutsch & Englisch) |

### Audio-Verarbeitung & Utilities

| Technologie | Version | Beschreibung |
|-------------|---------|--------------|
| **Web Audio API** | Browser-nativ | Audio-Verarbeitung im Browser |
| **LameJS** | 1.2.0 | MP3-Encoding via Web Worker |
| **JSZip** | 3.10.1 | ZIP-Dateiverwaltung für Batch-Operationen |
| **Lucide Vue Next** | 0.546.0 | SVG-Icon-Bibliothek |

### Analytics & Monitoring

| Technologie | Beschreibung |
|-------------|--------------|
| **Google Tag Manager** | GTM-T7NS656K |
| **Kodini Tools Analytics** | Custom Analytics Tracking |

---

## Ordnerstruktur

```
Audio-Normalizer/
├── src/
│   ├── components/
│   │   ├── AppHeader.vue              # Header-Komponente mit Navigation
│   │   └── AudioFileItem.vue          # Einzelne Audio-Datei Komponente
│   │
│   ├── views/
│   │   ├── LandingPage.vue            # Marketing-/Landing-Page mit Features & FAQ
│   │   ├── LandingPage-v2.vue         # Alternative Landing-Page Version
│   │   ├── AudioApp.vue               # Haupt-Anwendung (780 Zeilen)
│   │   ├── AppPage.vue                # Alternatives App-Layout
│   │   └── GuidePage.vue              # Detaillierte Benutzeranleitung
│   │
│   ├── composables/
│   │   ├── useAudioProcessor.js       # Kern-Audio-Verarbeitungslogik (886 Zeilen)
│   │   │                              # → RMS/Peak/EBU R128 Normalisierung
│   │   │                              # → Effekte, WAV/MP3 Export
│   │   ├── useI18n.js                 # i18n Composable (508 Zeilen)
│   │   │                              # → Deutsch/Englisch Übersetzungen
│   │   └── useTheme.js                # Dark/Light Theme Management
│   │
│   ├── router/
│   │   └── index.js                   # Vue Router Konfiguration
│   │                                  # → Routes: /, /app, /anleitung
│   │
│   ├── lokales/
│   │   ├── de.json                    # Deutsche Sprachdateien
│   │   └── en.json                    # Englische Sprachdateien
│   │
│   ├── assets/
│   │   └── styles.css                 # Globale CSS mit CSS-Variablen
│   │
│   ├── App.vue                        # Root-Komponente
│   └── main.js                        # Entry Point
│
├── Documentation/
│   ├── README.md                      # Haupt-Projektdokumentation
│   ├── CHANGES.md                     # Changelog (Vanilla JS → Vue 3)
│   ├── DEPLOYMENT.md                  # Deployment-Optionen
│   ├── BACKEND_INTEGRATION.md         # Backend API Integration Guide
│   ├── SCHNELLSTART.md                # Schnellstart-Anleitung
│   └── LICENSE                        # ISC Lizenz
│
├── Configuration/
│   └── .env.example                   # Umgebungsvariablen-Template
│
├── backup/
│   └── App.vue                        # Backup der Root-Komponente
│
├── index.html                         # HTML Entry Point (GTM & Analytics)
├── vite.config.js                     # Vite-Konfiguration
├── package.json                       # Projektabhängigkeiten
└── package-lock.json                  # Lock-Datei
```

### Verzeichnis-Beschreibungen

| Verzeichnis | Zweck |
|-------------|-------|
| `src/components/` | Wiederverwendbare Vue-Komponenten für UI |
| `src/views/` | Vollständige Seiten-Komponenten (Vue Router) |
| `src/composables/` | Composition API Logik-Module |
| `src/router/` | Vue Router Konfiguration |
| `src/lokales/` | Übersetzungsdateien (DE/EN) |
| `src/assets/` | Globale Styles und Assets |
| `Documentation/` | Projektdokumentation |
| `Configuration/` | Konfigurationsdateien |
| `backup/` | Backup-Dateien |

---

## Datenbankschema

### Status: Keine Datenbank vorhanden

Dies ist eine **100% clientseitige Anwendung**. Es existiert kein persistentes Datenbankschema.

### Datenspeicherung

#### LocalStorage (Browser)

| Schlüssel | Typ | Beschreibung |
|-----------|-----|--------------|
| `theme` | string | Theme-Präferenz (`dark` / `light`) |
| `language` | string | Sprachauswahl (`de` / `en`) |

#### In-Memory State (Vue Reactive Refs)

Alle Audio-Daten werden während der Session im Speicher gehalten:

```javascript
// Hauptzustandsvariablen in useAudioProcessor.js
audioFiles        // Array - Hochgeladene Audio-Dateien mit Metadaten
globalRmsValue    // Number - Globaler RMS-Normalisierungswert
globalDbValue     // Number - Globaler dB-Normalisierungswert
downloadFormat    // String - Export-Format (WAV/MP3)
```

### Optionale Backend-Integration

Das Projekt enthält dokumentierte API-Endpunkte für optionale Backend-Integration (siehe `BACKEND_INTEGRATION.md`):

| Endpunkt | Methode | Beschreibung |
|----------|---------|--------------|
| `/api/upload` | POST | Datei-Upload |
| `/api/normalize/rms` | POST | RMS-Normalisierung |
| `/api/normalize/ebu` | POST | EBU R128 Normalisierung |
| `/api/effects/noise-reduction` | POST | Rauschunterdrückung |
| `/api/effects/compression` | POST | Dynamik-Kompression |
| `/api/download/{fileId}` | GET | Datei-Download |
| `/api/files/{fileId}` | DELETE | Datei löschen |

---

## Audio-Verarbeitungsfunktionen

### Normalisierungsarten

| Funktion | Beschreibung | Parameter |
|----------|--------------|-----------|
| **EBU R128** | Professioneller Broadcast-Standard | Ziel: -23 LUFS |
| **RMS** | Root Mean Square Lautstärke | Bereich: 0.0-1.0 |
| **Peak/dB** | Spitzenpegel-Anpassung | Bereich: -60 bis 0 dB |

### Effekte

| Effekt | Beschreibung | Parameter |
|--------|--------------|-----------|
| **Rauschunterdrückung** | Tiefpassfilter | Grenzfrequenz: 8000 Hz |
| **Clipping-Reduktion** | Soft Clipping via tanh | Waveshaping |
| **Dynamik-Kompression** | Professioneller Kompressor | Threshold: -24 dB, Ratio: 12:1, Attack: 3ms, Release: 250ms |

### Export-Formate

| Format | Qualität | Beschreibung |
|--------|----------|--------------|
| **WAV** | Unkomprimiert | PCM Audio |
| **MP3** | 320 kbps | Via LameJS Web Worker |

### Audio-Analyse

- Peak Level (dBFS)
- RMS Level (dBFS)
- LUFS (Loudness Units relative to Full Scale)
- Dynamikbereich
- Clipping-Erkennung
- Rauschpegel-Messung

---

## Projektkonfiguration

| Einstellung | Wert |
|-------------|------|
| Build-Output | `dist/` |
| Dev Server Port | 3000 |
| Base URL | `/audionormalisierer/` |
| Entry Point | `index.html` → `src/main.js` |
| Module Type | ES Modules |

---

## Metriken

| Metrik | Wert |
|--------|------|
| Hauptcode-Zeilen | ~2.174 |
| Quelldateien | 16 |
| Dokumentationsdateien | 6 |
| NPM-Abhängigkeiten | 6 |
| Vue-Komponenten | 6 |
| Routes | 3 |
| Unterstützte Sprachen | 2 (DE, EN) |
| Theme-Modi | 2 (Dark, Light) |

---

## Browser-Unterstützung

| Browser | Status |
|---------|--------|
| Chrome/Edge | Vollständig unterstützt |
| Firefox | Vollständig unterstützt |
| Safari | Vollständig unterstützt |
| Opera | Vollständig unterstützt |

---

*Zuletzt aktualisiert: Januar 2026*
