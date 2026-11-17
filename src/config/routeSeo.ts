// Titel und Beschreibung je Route und Sprache, ohne Laufzeit-Abhängigkeiten (kein Vue,
// kein DOM), damit auch der Build (vite.config.js) sie importieren kann.
import type { Locale } from '../utils/localeUrl'

export const SITE_ORIGIN = 'https://kodinitools.com'
export const BASE_PATH = '/audionormalisierer'

export interface RouteSeo {
  title: Record<Locale, string>
  description: Record<Locale, string>
  /** Absolute path on the site (already includes the deploy base). */
  canonicalPath: string
}

// Per-route, per-language metadata. Keyed by route name.
export const ROUTE_SEO: Record<string, RouteSeo> = {
  landing: {
    title: {
      de: 'Audio Lautstärke normalisieren online – LUFS | KodiniTools',
      en: 'Normalize Audio Online – LUFS Loudness Normalizer | KodiniTools',
    },
    description: {
      de: 'Audio Lautstärke normalisieren, kostenlos und ohne Upload im Browser: MP3 gleich laut machen nach EBU R128/LUFS, RMS oder Peak. Export als WAV, MP3, WebM.',
      en: 'Normalize audio online for free with no upload: make MP3 files the same volume with EBU R128/LUFS, RMS or Peak. Batch processing, export to WAV, MP3 and WebM.',
    },
    canonicalPath: `${BASE_PATH}/`,
  },
  app: {
    title: {
      de: 'Audio normalisieren – Audio Normalizer App (EBU R128, RMS, Peak)',
      en: 'Normalize Audio – Audio Normalizer App (EBU R128, RMS, Peak)',
    },
    description: {
      de: 'Lade deine Audiodateien und normalisiere sie mit EBU R128, RMS oder Peak – inklusive Plattform-Presets, Rauschunterdrückung und Export als WAV, MP3 & WebM. Alles lokal im Browser.',
      en: 'Load your audio files and normalize them with EBU R128, RMS or Peak – including platform presets, noise reduction and export to WAV, MP3 & WebM. All local in your browser.',
    },
    canonicalPath: `${BASE_PATH}/app`,
  },
  guide: {
    title: {
      de: 'Anleitung – Audio Normalizer: EBU R128, LUFS, RMS & Peak erklärt',
      en: 'Guide – Audio Normalizer: EBU R128, LUFS, RMS & Peak Explained',
    },
    description: {
      de: 'Schritt-für-Schritt-Anleitung zur Audio-Normalisierung: RMS, Peak und EBU R128 (LUFS) verstehen, richtige Zielwerte für Streaming, Podcast & Broadcast wählen und Dateien exportieren.',
      en: 'Step-by-step guide to audio normalization: understand RMS, Peak and EBU R128 (LUFS), pick the right targets for streaming, podcast & broadcast, and export your files.',
    },
    canonicalPath: `${BASE_PATH}/anleitung`,
  },
}
