// src/composables/i18n.js
import { reactive } from 'vue'

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
    
    // Features
    'features-title': 'Leistungsstarke Funktionen',
    'feature1-title': 'Echtzeit-Analyse',
    'feature1-desc': 'Visualisieren Sie Ihre Audio-Wellenformen und -Pegel in Echtzeit während der Verarbeitung.',
    'feature2-title': 'Stille-Erkennung',
    'feature2-desc': 'Automatische Erkennung und Entfernung von stillen Abschnitten am Anfang und Ende Ihrer Dateien.',
    'feature3-title': 'Schnelle Verarbeitung',
    'feature3-desc': 'Nutzen Sie die Power Ihres Browsers für blitzschnelle Audio-Normalisierung ohne Wartezeiten.',
    'feature4-title': 'Batch-Verarbeitung',
    'feature4-desc': 'Laden Sie mehrere Dateien gleichzeitig hoch und verarbeiten Sie diese in einem Durchgang.',
    'feature5-title': 'Lokale Verarbeitung',
    'feature5-desc': 'Ihre Dateien bleiben auf Ihrem Gerät. Keine Uploads, keine Cloud – maximale Privatsphäre.',
    'feature6-title': 'Kostenlos & Sicher',
    'feature6-desc': 'Komplett kostenfrei nutzbar. Ihre Daten verlassen niemals Ihren Browser.',
    
    // Benefits
    'benefits-title': 'Warum Audio Normalizer?',
    'benefit1-title': 'Keine Installation nötig',
    'benefit1-desc': 'Arbeiten Sie direkt im Browser ohne komplizierte Software-Installation.',
    'benefit2-title': 'Datenschutz garantiert',
    'benefit2-desc': 'Ihre Audio-Dateien werden ausschließlich lokal verarbeitet und nie hochgeladen.',
    'benefit3-title': 'Professionelle Qualität',
    'benefit3-desc': 'Erhalten Sie studio-qualitative Ergebnisse mit präziser Peak-Normalisierung.',
    'benefit4-title': 'Zeitersparnis',
    'benefit4-desc': 'Verarbeiten Sie mehrere Dateien gleichzeitig und sparen Sie wertvolle Zeit.',
    'benefit5-title': 'Intuitive Bedienung',
    'benefit5-desc': 'Einfache und übersichtliche Benutzeroberfläche für schnelle Ergebnisse.',
    'benefit6-title': 'Plattformunabhängig',
    'benefit6-desc': 'Funktioniert auf Windows, Mac, Linux und sogar auf mobilen Geräten.',
    
    // FAQ
    'faq-title': 'Häufig gestellte Fragen',
    'faq1-q': 'Was ist Audio-Normalisierung?',
    'faq1-a': 'Audio-Normalisierung ist der Prozess, bei dem die Lautstärke einer Audio-Datei angepasst wird, um einen bestimmten Zielpegel zu erreichen. Dies sorgt für eine konstante Lautstärke über mehrere Tracks hinweg.',
    'faq2-q': 'Welche Dateiformate werden unterstützt?',
    'faq2-a': 'Der Audio Normalizer unterstützt alle gängigen Audio-Formate, die von modernen Browsern verarbeitet werden können, einschließlich MP3, WAV, OGG, M4A und FLAC.',
    'faq3-q': 'Werden meine Dateien hochgeladen?',
    'faq3-a': 'Nein! Alle Verarbeitungen erfolgen vollständig lokal in Ihrem Browser. Ihre Audio-Dateien verlassen niemals Ihr Gerät, was maximale Privatsphäre und Sicherheit garantiert.',
    'faq4-q': 'Wie funktioniert die Stille-Erkennung?',
    'faq4-a': 'Die Stille-Erkennung analysiert Ihre Audio-Datei und identifiziert Bereiche mit sehr geringer Lautstärke am Anfang und Ende. Diese können automatisch entfernt werden, um saubere Audio-Dateien zu erhalten.',
    'faq5-q': 'Kann ich mehrere Dateien gleichzeitig verarbeiten?',
    'faq5-a': 'Ja! Der Audio Normalizer unterstützt Batch-Verarbeitung. Sie können mehrere Audio-Dateien gleichzeitig hochladen und verarbeiten lassen.',
    'faq6-q': 'Ist die Nutzung wirklich kostenlos?',
    'faq6-a': 'Ja, der Audio Normalizer ist komplett kostenlos und ohne Einschränkungen nutzbar. Es gibt keine versteckten Kosten, Premium-Features oder Abonnements.',
    
    // Footer
    'footer-text': '© 2024 Audio Normalizer. Alle Rechte vorbehalten.',
    'footer-privacy': 'Datenschutz',
    'footer-terms': 'Nutzungsbedingungen',
    
    // App Page
    'app-title': 'Audio Normalisierung',
    'app-back': 'Zurück zur Startseite',
    'app-upload': 'Dateien hochladen',
    'app-target-level': 'Zielpegel (dB)',
    'app-silence-threshold': 'Stille-Schwellwert (dB)',
    'app-remove-silence': 'Stille entfernen',
    'app-normalize': 'Normalisieren',
    'app-processing': 'Verarbeite...',
    'app-download': 'Herunterladen',
    'app-no-files': 'Keine Dateien ausgewählt',
    'app-drag-drop': 'Dateien hier ablegen oder klicken zum Auswählen',
    
    // Theme
    'theme-light': 'Hell',
    'theme-dark': 'Dunkel'
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
    'guide-tip5-title': '5. Don\'t over-compress',
    'guide-tip5-desc': 'Too much compression makes audio flat and lifeless. Less is often more.',
    
    'guide-footer': 'Audio Normalization Pro - Professional Audio Processing in Browser',
    
    // Features
    'features-title': 'Powerful Features',
    'feature1-title': 'Real-time Analysis',
    'feature1-desc': 'Visualize your audio waveforms and levels in real-time during processing.',
    'feature2-title': 'Silence Detection',
    'feature2-desc': 'Automatic detection and removal of silent sections at the beginning and end of your files.',
    'feature3-title': 'Fast Processing',
    'feature3-desc': 'Leverage your browser\'s power for lightning-fast audio normalization without wait times.',
    'feature4-title': 'Batch Processing',
    'feature4-desc': 'Upload multiple files at once and process them in one go.',
    'feature5-title': 'Local Processing',
    'feature5-desc': 'Your files stay on your device. No uploads, no cloud – maximum privacy.',
    'feature6-title': 'Free & Secure',
    'feature6-desc': 'Completely free to use. Your data never leaves your browser.',
    
    // Benefits
    'benefits-title': 'Why Audio Normalizer?',
    'benefit1-title': 'No Installation Required',
    'benefit1-desc': 'Work directly in your browser without complicated software installation.',
    'benefit2-title': 'Privacy Guaranteed',
    'benefit2-desc': 'Your audio files are processed exclusively locally and never uploaded.',
    'benefit3-title': 'Professional Quality',
    'benefit3-desc': 'Get studio-quality results with precise peak normalization.',
    'benefit4-title': 'Time Savings',
    'benefit4-desc': 'Process multiple files simultaneously and save valuable time.',
    'benefit5-title': 'Intuitive Operation',
    'benefit5-desc': 'Simple and clear user interface for quick results.',
    'benefit6-title': 'Cross-platform',
    'benefit6-desc': 'Works on Windows, Mac, Linux, and even mobile devices.',
    
    // FAQ
    'faq-title': 'Frequently Asked Questions',
    'faq1-q': 'What is audio normalization?',
    'faq1-a': 'Audio normalization is the process of adjusting the volume of an audio file to reach a specific target level. This ensures consistent volume across multiple tracks.',
    'faq2-q': 'Which file formats are supported?',
    'faq2-a': 'Audio Normalizer supports all common audio formats that can be processed by modern browsers, including MP3, WAV, OGG, M4A, and FLAC.',
    'faq3-q': 'Are my files uploaded?',
    'faq3-a': 'No! All processing happens completely locally in your browser. Your audio files never leave your device, guaranteeing maximum privacy and security.',
    'faq4-q': 'How does silence detection work?',
    'faq4-a': 'Silence detection analyzes your audio file and identifies areas with very low volume at the beginning and end. These can be automatically removed to obtain clean audio files.',
    'faq5-q': 'Can I process multiple files at once?',
    'faq5-a': 'Yes! Audio Normalizer supports batch processing. You can upload and process multiple audio files simultaneously.',
    'faq6-q': 'Is it really free to use?',
    'faq6-a': 'Yes, Audio Normalizer is completely free and usable without restrictions. There are no hidden costs, premium features, or subscriptions.',
    
    // Footer
    'footer-text': '© 2024 Audio Normalizer. All rights reserved.',
    'footer-privacy': 'Privacy Policy',
    'footer-terms': 'Terms of Service',
    
    // App Page
    'app-title': 'Audio Normalization',
    'app-back': 'Back to Home',
    'app-upload': 'Upload Files',
    'app-target-level': 'Target Level (dB)',
    'app-silence-threshold': 'Silence Threshold (dB)',
    'app-remove-silence': 'Remove Silence',
    'app-normalize': 'Normalize',
    'app-processing': 'Processing...',
    'app-download': 'Download',
    'app-no-files': 'No files selected',
    'app-drag-drop': 'Drop files here or click to select',
    
    // Theme
    'theme-light': 'Light',
    'theme-dark': 'Dark'
  }
}

const state = reactive({
  currentLocale: 'de'
})

export function useI18n() {
  const t = (key) => {
    return translations[state.currentLocale][key] || key
  }
  
  const setLocale = (locale) => {
    if (translations[locale]) {
      state.currentLocale = locale
    }
  }
  
  const currentLocale = () => state.currentLocale
  
  return {
    t,
    setLocale,
    currentLocale
  }
}