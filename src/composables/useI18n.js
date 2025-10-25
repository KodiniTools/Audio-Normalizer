import { ref, computed } from 'vue'

// Globaler reaktiver State für die Sprache
const currentLocale = ref(localStorage.getItem('locale') || 'de')

const translations = {
  de: {
    // Navigation
    'nav-landing': 'Startseite',
    'nav-app': 'Zur Anwendung',
    'nav-guide': 'Anleitung',
    
    // Hero Section
    'hero-title': 'Audio Normalizer',
    'hero-subtitle': 'Professionelle Audio-Normalisierung direkt im Browser',
    'hero-description': 'Normalisieren Sie Ihre Audio-Dateien schnell und einfach – kostenlos, sicher und ohne Upload. Alle Verarbeitungen erfolgen lokal in Ihrem Browser.',
    'hero-cta': 'Jetzt starten',
    
    // Guide Page
    'guide-back': 'Zurück',
    'guide-title': 'Detaillierte Anleitung',
    'guide-toc': 'Inhaltsverzeichnis',
    
    // Guide Sections
    'guide-section-main': 'Hauptfunktionen',
    'guide-section-normalization': 'Normalisierungsmethoden',
    'guide-section-enhancement': 'Audio-Verbesserung',
    'guide-section-batch': 'Batch-Operationen',
    'guide-section-export': 'Export',
    'guide-section-tips': 'Tipps & Best Practices',
    
    // Main Functions
    'guide-upload-title': 'Audio-Dateien hochladen',
    'guide-upload-desc': 'Laden Sie Audio-Dateien in den unterstützten Formaten hoch: MP3, WAV, FLAC, OGG, M4A, AAC.',
    'guide-upload-tip': 'Tipp: Sie können mehrere Dateien gleichzeitig hochladen oder per Drag & Drop hinzufügen.',
    
    'guide-analyze-title': 'Audio analysieren',
    'guide-analyze-desc': 'Die Analysefunktion ermittelt wichtige Audio-Parameter:',
    'guide-analyze-peak': 'Peak Level (dBFS): Höchster Lautstärkepegel der Audio-Datei',
    'guide-analyze-rms': 'RMS Level (dBFS): Durchschnittliche Lautstärke',
    'guide-analyze-lufs': 'LUFS: Loudness Units relative to Full Scale (Broadcast-Standard)',
    'guide-analyze-dynamic': 'Dynamic Range: Unterschied zwischen lautesten und leisesten Stellen',
    'guide-analyze-clipping': 'Clipping: Anzahl der übersteuerter Samples',
    'guide-analyze-noise': 'Noise Floor: Grundrauschen der Aufnahme',
    
    // Normalization Methods
    'guide-rms-title': 'RMS-Normalisierung',
    'guide-rms-desc': 'Normalisiert die durchschnittliche Lautstärke auf einen Zielwert.',
    'guide-rms-values': 'Empfohlene Werte:',
    'guide-rms-music': 'Musik: -18 dB bis -14 dB',
    'guide-rms-podcast': 'Podcasts/Sprache: -20 dB bis -16 dB',
    'guide-rms-mastering': 'Mastering: -12 dB bis -8 dB',
    'guide-rms-note': 'Hinweis: Niedrigere dB-Werte bedeuten leisere Audio-Signale.',
    
    'guide-peak-title': 'Peak/dB-Normalisierung',
    'guide-peak-desc': 'Normalisiert den höchsten Pegel (Peak) auf einen Zielwert.',
    'guide-peak-values': 'Empfohlene Werte:',
    'guide-peak-standard': 'Standard: -1.0 dB (verhindert Clipping)',
    'guide-peak-conservative': 'Konservativ: -3.0 dB (mehr Headroom)',
    'guide-peak-streaming': 'Streaming: -2.0 dB',
    
    'guide-ebu-title': 'EBU R128 (LUFS)',
    'guide-ebu-desc': 'Broadcast-Standard für konsistente Lautstärke über verschiedene Programme/Tracks.',
    'guide-ebu-values': 'Standard-Werte:',
    'guide-ebu-tv': 'TV/Radio (Europa): -23 LUFS',
    'guide-ebu-streaming': 'Streaming (Spotify, Apple Music): -14 LUFS',
    'guide-ebu-youtube': 'YouTube: -14 LUFS',
    'guide-ebu-film': 'Film: -24 LUFS',
    
    // Enhancement
    'guide-noise-title': 'Rauschunterdrückung',
    'guide-noise-desc': 'Reduziert Hintergrundrauschen und verbessert die Sprachverständlichkeit.',
    'guide-noise-ideal': 'Ideal für: Podcasts, Voice-Overs, Interview-Aufnahmen',
    
    'guide-clipping-title': 'Clipping reduzieren',
    'guide-clipping-desc': 'Korrigiert übersteuerter Signale und stellt Details in verzerrten Bereichen wieder her.',
    'guide-clipping-note': 'Wichtig: Diese Funktion kann Verzerrungen reduzieren, aber nicht vollständig entfernen.',
    
    'guide-compression-title': 'Dynamikkompression',
    'guide-compression-desc': 'Reduziert den Unterschied zwischen lauten und leisen Passagen für konsistentere Lautstärke.',
    'guide-compression-params': 'Parameter:',
    'guide-compression-threshold': 'Threshold: Ab welchem Pegel die Kompression einsetzt',
    'guide-compression-ratio': 'Ratio: Stärke der Kompression (z.B. 4:1)',
    'guide-compression-attack': 'Attack: Wie schnell der Kompressor reagiert',
    'guide-compression-release': 'Release: Wie schnell der Kompressor wieder loslässt',
    
    // Batch Operations
    'guide-batch-desc': 'Führen Sie Operationen auf alle geladenen Dateien gleichzeitig aus:',
    'guide-batch-analyze': 'Alle analysieren',
    'guide-batch-analyze-desc': 'Analysiert alle Dateien auf einmal',
    'guide-batch-normalize': 'RMS/dB/EBU R128 anwenden',
    'guide-batch-normalize-desc': 'Normalisiert alle Dateien mit der gewählten Methode',
    'guide-batch-enhance': 'Verbesserung anwenden',
    'guide-batch-enhance-desc': 'Rauschunterdrückung, Clipping-Reduktion oder Kompression auf alle',
    'guide-batch-export': 'Alle exportieren',
    'guide-batch-export-desc': 'Exportiert alle verarbeiteten Dateien als ZIP',
    'guide-batch-reset': 'Alle zurücksetzen',
    'guide-batch-reset-desc': 'Setzt alle Dateien auf Original zurück',
    'guide-batch-delete': 'Alle löschen',
    'guide-batch-delete-desc': 'Entfernt alle Dateien aus der Liste',
    
    // Export
    'guide-export-desc': 'Exportieren Sie Ihre verarbeiteten Audio-Dateien:',
    'guide-export-single': 'Einzelexport: Klicken Sie auf "Exportieren" bei einer Datei',
    'guide-export-batch': 'Batch-Export: Nutzen Sie "Alle exportieren" für ZIP-Download',
    'guide-export-format': 'Format: Exportiert im Original-Format oder als WAV',
    
    // Tips
    'guide-tip1-title': '1. Immer zuerst analysieren',
    'guide-tip1-desc': 'Analysieren Sie Ihre Dateien vor der Normalisierung, um die optimalen Parameter zu bestimmen.',
    'guide-tip2-title': '2. Headroom beachten',
    'guide-tip2-desc': 'Lassen Sie immer etwas Headroom (z.B. -1 dB) um Clipping zu vermeiden.',
    'guide-tip3-title': '3. Vorschau nutzen',
    'guide-tip3-desc': 'Hören Sie sich das Ergebnis an, bevor Sie exportieren (Original/Normalisiert-Toggle).',
    'guide-tip4-title': '4. Richtige Methode wählen',
    'guide-tip4-desc': 'RMS für Musik, Peak für maximale Lautstärke, EBU R128 für Broadcast/Streaming.',
    'guide-tip5-title': '5. Nicht überkomprimieren',
    'guide-tip5-desc': 'Zu starke Kompression macht Audio flach und leblos. Weniger ist oft mehr.',
    
    'guide-footer': 'Audio Normalisierung Pro - Professionelle Audio-Bearbeitung im Browser',
    
    // Theme
    'theme-light': 'Hell',
    'theme-dark': 'Dunkel',
    'nav.theme': 'Theme wechseln'
  },
  
  en: {
    // Navigation
    'nav-landing': 'Home',
    'nav-app': 'Go to App',
    'nav-guide': 'Guide',
    
    // Hero Section
    'hero-title': 'Audio Normalizer',
    'hero-subtitle': 'Professional Audio Normalization Directly in Your Browser',
    'hero-description': 'Normalize your audio files quickly and easily – free, secure, and without uploads. All processing happens locally in your browser.',
    'hero-cta': 'Get Started',
    
    // Guide Page
    'guide-back': 'Back',
    'guide-title': 'Detailed Guide',
    'guide-toc': 'Table of Contents',
    
    // Guide Sections
    'guide-section-main': 'Main Functions',
    'guide-section-normalization': 'Normalization Methods',
    'guide-section-enhancement': 'Audio Enhancement',
    'guide-section-batch': 'Batch Operations',
    'guide-section-export': 'Export',
    'guide-section-tips': 'Tips & Best Practices',
    
    // Main Functions
    'guide-upload-title': 'Upload Audio Files',
    'guide-upload-desc': 'Upload audio files in supported formats: MP3, WAV, FLAC, OGG, M4A, AAC.',
    'guide-upload-tip': 'Tip: You can upload multiple files at once or add them via drag & drop.',
    
    'guide-analyze-title': 'Analyze Audio',
    'guide-analyze-desc': 'The analysis function determines important audio parameters:',
    'guide-analyze-peak': 'Peak Level (dBFS): Highest volume level of the audio file',
    'guide-analyze-rms': 'RMS Level (dBFS): Average loudness',
    'guide-analyze-lufs': 'LUFS: Loudness Units relative to Full Scale (Broadcast Standard)',
    'guide-analyze-dynamic': 'Dynamic Range: Difference between loudest and quietest parts',
    'guide-analyze-clipping': 'Clipping: Number of overdriven samples',
    'guide-analyze-noise': 'Noise Floor: Background noise of the recording',
    
    // Normalization Methods
    'guide-rms-title': 'RMS Normalization',
    'guide-rms-desc': 'Normalizes the average loudness to a target value.',
    'guide-rms-values': 'Recommended Values:',
    'guide-rms-music': 'Music: -18 dB to -14 dB',
    'guide-rms-podcast': 'Podcasts/Speech: -20 dB to -16 dB',
    'guide-rms-mastering': 'Mastering: -12 dB to -8 dB',
    'guide-rms-note': 'Note: Lower dB values mean quieter audio signals.',
    
    'guide-peak-title': 'Peak/dB Normalization',
    'guide-peak-desc': 'Normalizes the highest level (peak) to a target value.',
    'guide-peak-values': 'Recommended Values:',
    'guide-peak-standard': 'Standard: -1.0 dB (prevents clipping)',
    'guide-peak-conservative': 'Conservative: -3.0 dB (more headroom)',
    'guide-peak-streaming': 'Streaming: -2.0 dB',
    
    'guide-ebu-title': 'EBU R128 (LUFS)',
    'guide-ebu-desc': 'Broadcast standard for consistent loudness across different programs/tracks.',
    'guide-ebu-values': 'Standard Values:',
    'guide-ebu-tv': 'TV/Radio (Europe): -23 LUFS',
    'guide-ebu-streaming': 'Streaming (Spotify, Apple Music): -14 LUFS',
    'guide-ebu-youtube': 'YouTube: -14 LUFS',
    'guide-ebu-film': 'Film: -24 LUFS',
    
    // Enhancement
    'guide-noise-title': 'Noise Reduction',
    'guide-noise-desc': 'Reduces background noise and improves speech intelligibility.',
    'guide-noise-ideal': 'Ideal for: Podcasts, Voice-Overs, Interview recordings',
    
    'guide-clipping-title': 'Reduce Clipping',
    'guide-clipping-desc': 'Corrects overdriven signals and restores details in distorted areas.',
    'guide-clipping-note': 'Important: This function can reduce distortion but not completely remove it.',
    
    'guide-compression-title': 'Dynamic Compression',
    'guide-compression-desc': 'Reduces the difference between loud and quiet passages for more consistent loudness.',
    'guide-compression-params': 'Parameters:',
    'guide-compression-threshold': 'Threshold: Level at which compression starts',
    'guide-compression-ratio': 'Ratio: Strength of compression (e.g. 4:1)',
    'guide-compression-attack': 'Attack: How quickly the compressor responds',
    'guide-compression-release': 'Release: How quickly the compressor releases',
    
    // Batch Operations
    'guide-batch-desc': 'Perform operations on all loaded files simultaneously:',
    'guide-batch-analyze': 'Analyze All',
    'guide-batch-analyze-desc': 'Analyzes all files at once',
    'guide-batch-normalize': 'Apply RMS/dB/EBU R128',
    'guide-batch-normalize-desc': 'Normalizes all files with the selected method',
    'guide-batch-enhance': 'Apply Enhancement',
    'guide-batch-enhance-desc': 'Noise reduction, clipping reduction, or compression on all',
    'guide-batch-export': 'Export All',
    'guide-batch-export-desc': 'Exports all processed files as ZIP',
    'guide-batch-reset': 'Reset All',
    'guide-batch-reset-desc': 'Resets all files to original',
    'guide-batch-delete': 'Delete All',
    'guide-batch-delete-desc': 'Removes all files from the list',
    
    // Export
    'guide-export-desc': 'Export your processed audio files:',
    'guide-export-single': 'Single Export: Click "Export" on a file',
    'guide-export-batch': 'Batch Export: Use "Export All" for ZIP download',
    'guide-export-format': 'Format: Exports in original format or as WAV',
    
    // Tips
    'guide-tip1-title': '1. Always analyze first',
    'guide-tip1-desc': 'Analyze your files before normalization to determine optimal parameters.',
    'guide-tip2-title': '2. Watch headroom',
    'guide-tip2-desc': 'Always leave some headroom (e.g. -1 dB) to avoid clipping.',
    'guide-tip3-title': '3. Use preview',
    'guide-tip3-desc': 'Listen to the result before exporting (Original/Normalized toggle).',
    'guide-tip4-title': '4. Choose the right method',
    'guide-tip4-desc': 'RMS for music, Peak for maximum loudness, EBU R128 for broadcast/streaming.',
    'guide-tip5-title': "5. Don't over-compress",
    'guide-tip5-desc': 'Too much compression makes audio flat and lifeless. Less is often more.',
    
    'guide-footer': 'Audio Normalization Pro - Professional Audio Processing in Browser',
    
    // Theme
    'theme-light': 'Light',
    'theme-dark': 'Dark',
    'nav.theme': 'Toggle theme'
  }
}

export function useI18n() {
  const locale = computed(() => currentLocale.value)
  
  const t = (key) => {
    return translations[currentLocale.value]?.[key] || key
  }
  
  const toggleLocale = () => {
    currentLocale.value = currentLocale.value === 'de' ? 'en' : 'de'
    localStorage.setItem('locale', currentLocale.value)
    console.log('Sprache gewechselt zu:', currentLocale.value)
  }
  
  const setLocale = (newLocale) => {
    if (translations[newLocale]) {
      currentLocale.value = newLocale
      localStorage.setItem('locale', newLocale)
    }
  }
  
  return {
    locale,
    t,
    toggleLocale,
    setLocale
  }
}