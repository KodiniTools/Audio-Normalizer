import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { localizeHtml } from './src/utils/localizeHtml'
import { DE_PAGES, EN_PAGES, ROUTE_SEO, SITE_ORIGIN } from './src/config/routeSeo'

/**
 * Schreibt neben dist/index.html je Seite aus EN_PAGES eine englische Fassung mit
 * englischem <html lang>, Titel, Description, Canonical (?lang=en), hreflang sowie og:* und twitter:*.
 * nginx liefert sie für /audionormalisierer/?lang=en, /audionormalisierer/app?lang=en und
 * /audionormalisierer/anleitung?lang=en aus, damit Crawler ohne JavaScript schon im HTML
 * Englisch sehen. Laufzeit-i18n und die deutsche index.html bleiben unverändert.
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
      for (const { file, route } of EN_PAGES) {
        const seo = ROUTE_SEO[route]
        if (!seo) this.error(`localized-index-html: ROUTE_SEO.${route} fehlt`)
        const url = `${SITE_ORIGIN}${seo.canonicalPath}`
        this.emitFile({
          type: 'asset',
          fileName: file,
          source: localizeHtml(html, {
            lang: 'en',
            title: seo.title.en,
            description: seo.description.en,
            canonical: `${url}?lang=en`,
            alternates: { de: url, en: `${url}?lang=en`, 'x-default': url },
          }),
        })
      }
      // Deutsche Unterseiten (z. B. anleitung.html): eigener Titel und Canonical statt Startseite.
      for (const { file, route } of DE_PAGES) {
        const seo = ROUTE_SEO[route]
        if (!seo) this.error(`localized-index-html: ROUTE_SEO.${route} fehlt`)
        const url = `${SITE_ORIGIN}${seo.canonicalPath}`
        this.emitFile({
          type: 'asset',
          fileName: file,
          source: localizeHtml(html, {
            lang: 'de',
            title: seo.title.de,
            description: seo.description.de,
            canonical: url,
            alternates: { de: url, en: `${url}?lang=en`, 'x-default': url },
          }),
        })
      }
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
