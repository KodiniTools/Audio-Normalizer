import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { localizeHtml } from './src/utils/localizeHtml'
import { ROUTE_SEO, SITE_ORIGIN } from './src/config/routeSeo'

const landing = ROUTE_SEO.landing
/** Öffentliche URL der deutschen Startseite (Englisch: `?lang=en`). */
const LANDING_URL = `${SITE_ORIGIN}${landing.canonicalPath}`
const LANDING_EN = { title: landing.title.en, description: landing.description.en }

/**
 * Schreibt neben dist/index.html eine englische Fassung dist/index.en.html mit
 * englischem <html lang>, Titel, Description, Canonical (?lang=en) sowie og:* und twitter:*.
 * nginx liefert sie für /audionormalisierer/?lang=en aus, damit Crawler ohne JavaScript schon im
 * HTML Englisch sehen. Laufzeit-i18n und die deutsche index.html bleiben unverändert.
 */
function localizedIndexHtml() {
  return {
    name: 'localized-index-html',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const index = bundle['index.html']
      if (!index || index.type !== 'asset') {
        this.error('localized-index-html: index.html fehlt im Bundle')
      }
      const html =
        typeof index.source === 'string' ? index.source : new TextDecoder().decode(index.source)
      this.emitFile({
        type: 'asset',
        fileName: 'index.en.html',
        source: localizeHtml(html, { lang: 'en', ...LANDING_EN, canonical: `${LANDING_URL}?lang=en` }),
      })
    },
  }
}

export default defineConfig({
  plugins: [vue(), localizedIndexHtml()],
  
  // Basis-URL für das Deployment im Unterordner
  base: '/audionormalisierer/',
  
  // Build-Konfiguration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Löscht den Output-Ordner vor dem Build
    emptyOutDir: true,
  },
  
  // Development Server (bleibt für lokale Entwicklung)
  server: {
    port: 3000
  }
})
