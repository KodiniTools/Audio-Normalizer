# CONTEXT.md - Audio Normalizer

Technischer Überblick über den aktuellen Stand. Die App arbeitet zu 100 % clientseitig: kein Backend, kein Upload, keine Datenbank.

## Tech-Stack

| Bereich | Technologie |
|---|---|
| Framework | Vue 3 (Composition API, `<script setup>`), TypeScript strict |
| Build | Vite, Basis-URL `/audionormalisierer/` |
| State | Pinia (`src/stores/audioStore.ts`) |
| Routing | Vue Router (`/`, `/app`, `/anleitung`, `/blog`) |
| i18n | Eigenes Composable `useI18n`; Übersetzungen in `src/locales/{de,en}.json`, EN wird bei Bedarf nachgeladen |
| Styling | Design-Tokens v2 (`--ds-*`, siehe `src/design-system/README.md`), Schrift Supreme |
| Audio | Web Audio API (Decoding/Wiedergabe), DSP-Worker-Pool, @breezystack/lamejs (MP3, ESM), WebCodecs + webm-muxer (WebM/Opus), JSZip |
| Tests | Vitest + jsdom |
| Qualität | ESLint (Flat Config) + Prettier, `vue-tsc` |

## Ordnerstruktur

```
src/
├── App.vue, main.ts
├── assets/            # styles.css (global), audio-app.css (App), Supreme-Fonts
├── components/        # UI-Bausteine der App und HeroNav
├── composables/       # useI18n, useTheme, useSeo, useAudioExport, useFileDrop,
│                      # useSharedFiles, useSendToTool, useUndoRedoShortcuts
├── data/presets.ts    # Plattform-Presets (Ziel-LUFS / True Peak)
├── design-system/     # Tokens v2 (CSS, JSON, TS-Zugriff)
├── locales/           # de.json, en.json (gleiche Schlüssel, per Test geprüft)
├── router/index.ts
├── stores/audioStore.ts
├── types.ts
├── utils/             # audioUtils, dspPool, history, sharedFileRepository, ...
├── views/             # LandingPage, AudioApp, GuidePage, BlogPage
└── workers/           # dspCore.ts (reine DSP-Mathematik), dspWorker.ts, mp3Worker.ts
tests/                 # Vitest-Specs
```

## Datenhaltung

- **localStorage:** `theme` (`dark`/`light`), `locale` (`de`/`en`).
- **IndexedDB:** geteilte Dateien anderer KodiniTools (`sharedFileRepository.ts`).
- **Speicher:** Audio-Dateien, Verlauf (Undo/Redo, max. 50 Schritte bzw. 512 MiB) im Pinia-Store.

## Audio-Verarbeitung

Die Bearbeitung läuft im DSP-Worker-Pool (`dspCore.ts`), parallel und abseits des Main-Threads.

| Funktion | Umsetzung |
|---|---|
| EBU R128 / Presets | ITU-R BS.1770-4 Gated Loudness, True-Peak-Limit (4× Polyphase-FIR) |
| RMS / dB | Fenster-RMS (lauteste 50 % der 400-ms-Blöcke) |
| Rauschunterdrückung | Spektrale Subtraktion (STFT) |
| Clipping-Reduktion | Abrunden von Spitzen über 0.9 |
| Dynamikkompression | Kompressor (Threshold −24 dB, Ratio 12:1, Attack 3 ms, Release 250 ms) |
| Analyse | Sample-Peak, RMS, LUFS-I, True Peak, LRA (EBU Tech 3342); Report als CSV/JSON (`utils/loudnessReport.ts`) |
| Wellenform | 400-Punkte-Hüllkurve je Take (`utils/waveform.ts`), im Worker berechnet |
| Export | WAV, MP3 (320 kbps), WebM/Opus (128 kbps), mehrere Dateien als ZIP |

## Skripte

`npm run dev | build | preview | test | typecheck | lint | format`
