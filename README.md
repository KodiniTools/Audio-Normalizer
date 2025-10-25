# Audio Normalizer Vue 3

Eine moderne Audio-Normalisierungs-Anwendung, die mit Vue 3 und der Composition API erstellt wurde.

## Features

- 🎵 **EBU R128 Standard-Normalisierung** - Professionelle Loudness-Messung und -Anpassung
- 🔇 **Rauschunterdrückung** - Intelligente Filterung von Hintergrundgeräuschen
- ⚡ **Dynamikkompression** - Professionelle Audio-Kompression
- 📋 **Batch-Verarbeitung** - Mehrere Dateien gleichzeitig bearbeiten
- 💾 **Flexible Exporte** - WAV oder MP3 (320 kbps)
- 🔒 **100% Privat** - Alle Verarbeitung erfolgt lokal im Browser
- 🌓 **Dark/Light Mode** - Umschaltbares Farbschema
- 🌍 **Zweisprachig** - Deutsch und Englisch

## Projektstruktur

```
audio-normalizer-vue/
├── src/
│   ├── assets/
│   │   └── styles.css          # Globale Styles
│   ├── components/
│   │   └── AudioFileItem.vue   # Einzelne Audiodatei-Komponente
│   ├── composables/
│   │   ├── useTheme.js         # Theme-Management
│   │   ├── useI18n.js          # Internationalisierung
│   │   └── useAudioProcessor.js # Audio-Verarbeitungslogik
│   ├── router/
│   │   └── index.js            # Vue Router Konfiguration
│   ├── views/
│   │   ├── LandingPage.vue     # Landing Page mit Features & FAQ
│   │   └── AudioApp.vue        # Haupt-Anwendung
│   ├── App.vue                 # Root-Komponente
│   └── main.js                 # Entry Point
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Installation

```bash
# Dependencies installieren
npm install

# Entwicklungsserver starten
npm run dev

# Für Produktion bauen
npm run build

# Preview der Production-Build
npm run preview
```

## Technologie-Stack

- **Vue 3** - Progressive JavaScript Framework
- **Vue Router 4** - Offizieller Router für Vue.js
- **Vite** - Schnelles Build-Tool und Dev-Server
- **Web Audio API** - Browser-native Audio-Verarbeitung
- **LameJS** - MP3-Encoding im Browser

## Verwendung

### Landing Page
Die Landing Page zeigt alle Features, Vorteile und FAQs. Benutzer können über den "Zur Anwendung"-Button zur Haupt-Anwendung navigieren.

### Audio-Anwendung
1. **Dateien hochladen**: Drag & Drop oder Dateiauswahl
2. **Globale Einstellungen**: RMS, dB oder EBU R128 auf alle Dateien anwenden
3. **Einzelne Anpassungen**: Jede Datei individuell bearbeiten
4. **Effekte anwenden**: Rauschunterdrückung, Clipping-Reduktion, Kompression
5. **Exportieren**: Als WAV oder MP3 herunterladen

## Audio-Verarbeitung

### Unterstützte Formate
- **Input**: WAV, MP3, OGG, FLAC, AAC (alle vom Browser unterstützten Formate)
- **Output**: WAV (unkomprimiert) oder MP3 (320 kbps)

### Verarbeitungsfunktionen

#### EBU R128 Normalisierung
- Standard-Zielwert: -23 LUFS
- Professioneller Broadcast-Standard
- K-gewichtete Loudness-Messung

#### RMS-Normalisierung
- Root Mean Square Normalisierung
- Werte von 0.0 bis 1.0
- Peak-Normalisierung inklusive

#### dB-Normalisierung
- Dezibel-basierte Anpassung
- Bereich: -60 dB bis 0 dB
- Automatische Peak-Limitierung

#### Rauschunterdrückung
- Lowpass-Filter bei 8000 Hz
- Reduziert Hochfrequenz-Rauschen

#### Clipping-Reduktion
- Waveshaping mit Tanh-Funktion
- Soft-Clipping für natürlicheren Sound

#### Dynamikkompression
- Threshold: -24 dB
- Ratio: 12:1
- Attack: 3ms, Release: 250ms

## Datenschutz

Alle Audio-Verarbeitung erfolgt **100% lokal im Browser**. Keine Dateien werden zu einem Server hochgeladen. Die gesamte Verarbeitung nutzt die Web Audio API und läuft clientseitig.

## Browser-Kompatibilität

- Chrome/Edge: ✅ Vollständig unterstützt
- Firefox: ✅ Vollständig unterstützt
- Safari: ✅ Vollständig unterstützt (Web Audio API)
- Opera: ✅ Vollständig unterstützt

## Entwicklung

### Composables

**useTheme.js**: Verwaltet Dark/Light Mode
```javascript
const { theme, toggleTheme, isDark } = useTheme()
```

**useI18n.js**: Internationalisierung
```javascript
const { locale, t, setLocale, toggleLocale } = useI18n()
```

**useAudioProcessor.js**: Audio-Verarbeitung
```javascript
const { 
  audioFiles, 
  applyGlobalRms, 
  applyEBUR128,
  exportFile 
} = useAudioProcessor()
```

## Lizenz

ISC

## Änderungen von der Original-Version

1. ✅ Umgewandelt in Vue 3 mit Composition API
2. ✅ Vue Router für Navigation zwischen Landing Page und App
3. ✅ Testimonials-Sektion entfernt (waren nicht von echten Nutzern)
4. ✅ Vollständige Zweisprachigkeit (DE/EN)
5. ✅ Dark/Light Theme mit LocalStorage-Persistenz
6. ✅ Moderne Komponentenarchitektur
7. ✅ Drag & Drop Datei-Upload
8. ✅ Verbesserte Benutzerführung mit Zurück-Navigation

## Bekannte Einschränkungen

- MP3-Export kann bei sehr großen Dateien langsam sein
- Browser-Speicherlimit kann bei sehr vielen/großen Dateien erreicht werden
- Web Audio API Performance ist browserabhängig
