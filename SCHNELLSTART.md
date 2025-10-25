# Audio Normalizer Vue 3 - Schnellstart

## 🚀 Installation und Start

### Voraussetzungen
- Node.js (Version 16 oder höher)
- npm oder yarn

### Schritt 1: Dependencies installieren
```bash
cd audio-normalizer-vue
npm install
```

### Schritt 2: Entwicklungsserver starten
```bash
npm run dev
```

Die Anwendung läuft nun auf: `http://localhost:3000`

### Schritt 3: Für Produktion bauen (optional)
```bash
npm run build
```

Die produktionsreifen Dateien befinden sich dann im `dist/` Ordner.

## 📁 Projektstruktur (Übersicht)

```
audio-normalizer-vue/
├── src/
│   ├── views/
│   │   ├── LandingPage.vue    ← Landing Page mit Features & FAQ
│   │   └── AudioApp.vue       ← Haupt-Anwendung für Audio-Verarbeitung
│   ├── components/
│   │   └── AudioFileItem.vue  ← Komponente für einzelne Audio-Dateien
│   ├── composables/
│   │   ├── useTheme.js        ← Dark/Light Mode
│   │   ├── useI18n.js         ← Deutsch/Englisch
│   │   └── useAudioProcessor.js ← Audio-Verarbeitungslogik
│   └── router/
│       └── index.js           ← Navigation zwischen Landing Page und App
```

## ✨ Hauptfunktionen

### Landing Page (/)
- Feature-Übersicht
- Vorteile-Sektion
- FAQ-Bereich
- CTA-Button zur Anwendung

### Audio App (/app)
- Datei-Upload (Drag & Drop oder Auswahl)
- Globale Normalisierung:
  - RMS-Normalisierung
  - dB-Normalisierung
  - EBU R128 Standard (-23 LUFS)
- Effekte:
  - Rauschunterdrückung
  - Clipping-Reduktion
  - Dynamikkompression
- Export:
  - WAV (unkomprimiert)
  - MP3 (320 kbps)

## 🎨 Themes & Sprachen

### Theme wechseln
Klicken Sie auf das Sonne/Mond-Symbol oben rechts

### Sprache wechseln
Klicken Sie auf den DE/EN-Button oben rechts

Die Einstellungen werden im LocalStorage gespeichert.

## 🔧 Anpassungen

### Farben ändern
Bearbeiten Sie die CSS-Variablen in `src/assets/styles.css`:
```css
:root {
  --color-green: #22c55e;
  --color-red: #ef4444;
  --accent: #6ea8fe;
  /* ... weitere Variablen */
}
```

### Übersetzungen hinzufügen
Bearbeiten Sie `src/composables/useI18n.js`:
```javascript
const translations = {
  de: { /* Deutsche Texte */ },
  en: { /* Englische Texte */ },
  // Weitere Sprachen hinzufügen...
}
```

### Audio-Parameter anpassen
Bearbeiten Sie die Konstanten in `src/composables/useAudioProcessor.js`:
```javascript
const CONSTANTS = {
  EBU_R128_TARGET_LUFS: -23,
  COMPRESSOR_THRESHOLD: -24,
  // ... weitere Parameter
}
```

## 🐛 Troubleshooting

### Port bereits in Verwendung
```bash
# Port ändern in vite.config.js oder:
npm run dev -- --port 3001
```

### Probleme beim npm install
```bash
# Cache löschen und neu installieren
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Browser-Kompatibilität
Die App benötigt einen modernen Browser mit Web Audio API Support:
- Chrome/Edge 90+
- Firefox 85+
- Safari 14+

## 📝 Wichtige Hinweise

1. **Datenschutz**: Alle Audio-Verarbeitung erfolgt lokal im Browser. Keine Server-Uploads!

2. **Performance**: Bei sehr großen Dateien (>100MB) kann die Verarbeitung langsam sein.

3. **MP3-Export**: Die MP3-Konvertierung nutzt LameJS und kann bei großen Dateien Zeit benötigen.

4. **Testimonials entfernt**: Die ursprüngliche Testimonials-Sektion wurde entfernt, da sie keine echten Bewertungen enthielt.

## 🆘 Support

Bei Fragen oder Problemen:
1. Prüfen Sie die README.md für detaillierte Dokumentation
2. Überprüfen Sie die Browser-Konsole auf Fehler
3. Stellen Sie sicher, dass alle Dependencies installiert sind

## 🎉 Viel Erfolg!

Die Anwendung ist jetzt bereit zur Verwendung. Viel Spaß beim Normalisieren Ihrer Audio-Dateien!
