# Audio Normalizer Vue 3

Eine moderne Audio-Normalisierungs-Anwendung, die mit Vue 3 und der Composition API erstellt wurde.

## Features

- 🎵 **EBU R128 Standard-Normalisierung** - Professionelle Loudness-Messung und -Anpassung
- 🔇 **Rauschunterdrückung** - Intelligente Filterung von Hintergrundgeräuschen
- ⚡ **Dynamikkompression** - Professionelle Audio-Kompression
- 📋 **Batch-Verarbeitung** - Mehrere Dateien gleichzeitig bearbeiten
- 〰️ **Wellenform** - Original und bearbeitete Fassung pro Datei im Vergleich
- 📊 **Loudness-Report** - LUFS, True Peak, LRA und PLR aller Dateien als CSV oder JSON
- ↩️ **Undo/Redo** - Jede Bearbeitung, jedes Zurücksetzen sowie Hinzufügen/Entfernen von Dateien lässt sich rückgängig machen (Strg+Z / Strg+Shift+Z) und wiederherstellen; Verlaufsmenü zum Springen zwischen Schritten
- 💾 **Flexible Exporte** - WAV, MP3 (320 kbps) oder WebM/Opus
- 🔒 **100% Privat** - Alle Verarbeitung erfolgt lokal im Browser
- 🌓 **Dark/Light Mode** - Umschaltbares Farbschema
- 🌍 **Zweisprachig** - Deutsch und Englisch

## Projektstruktur

Aufbau, Datenhaltung und Audio-Verarbeitung im Detail: siehe [CONTEXT.md](CONTEXT.md).

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

- **Vue 3** + **TypeScript** - Composition API
- **Pinia** - State-Management
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
5. **Rückgängig/Wiederherstellen**: Strg+Z bzw. Strg+Shift+Z (oder Strg+Y), Toolbar-Buttons oder das Verlaufsmenü. Der Verlauf hält bis zu 50 Schritte bzw. 512 MiB an zurückgehaltenen Audiodaten.
6. **Exportieren**: Als WAV, MP3 oder WebM herunterladen

## Audio-Verarbeitung

### Unterstützte Formate
- **Input**: WAV, MP3, OGG, FLAC, AAC (alle vom Browser unterstützten Formate)
- **Output**: WAV (unkomprimiert), MP3 (320 kbps) oder WebM/Opus (128 kbps)

### Verarbeitungsfunktionen

#### EBU R128 Normalisierung
- Standard-Zielwert: -23 LUFS
- Professioneller Broadcast-Standard
- K-gewichtete Loudness-Messung

#### RMS-Normalisierung
- Root Mean Square Normalisierung
- Werte von 0.0 bis 1.0
- Fenster-RMS: misst die lautesten 50 % der Passagen, Fades und Pausen zählen nicht

#### dB-Normalisierung
- Dezibel-basierte Anpassung
- Bereich: -60 dB bis 0 dB
- Automatische Peak-Limitierung

#### Rauschunterdrückung
- Spektrale Subtraktion (STFT)
- Rauschprofil aus den leisesten Passagen, reduziert stationäres Breitbandrauschen

#### Clipping-Reduktion
- Rundet nur Spitzen oberhalb von 0.9 ab, darunter bleibt das Signal unverändert

#### Dynamikkompression
- Threshold: -24 dB
- Ratio: 12:1
- Attack: 3ms, Release: 250ms

## Datenschutz

Alle Audio-Verarbeitung erfolgt **100% lokal im Browser**. Keine Dateien werden zu einem Server hochgeladen. Die Verarbeitung läuft clientseitig in Web Workern.

## Browser-Kompatibilität

- Chrome/Edge: ✅ Vollständig unterstützt
- Firefox: ✅ Vollständig unterstützt
- Safari: ✅ Vollständig unterstützt (Web Audio API)
- Opera: ✅ Vollständig unterstützt

## Entwicklung

```bash
npm run typecheck
npm run lint
npm test
```

## Lizenz

ISC

## Bekannte Einschränkungen

- MP3-Export kann bei sehr großen Dateien langsam sein
- Browser-Speicherlimit kann bei sehr vielen/großen Dateien erreicht werden
- Web Audio API Performance ist browserabhängig
