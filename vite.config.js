import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  
  // Basis-URL für das Deployment im Unterordner
  base: '/audionormalisierer/',
  
  // Build-Konfiguration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Löscht den Output-Ordner vor dem Build
    emptyOutDir: true,
    // CSS-Minifying temporär deaktivieren zum Testen
    minify: 'esbuild',
    cssMinify: false,
  },
  
  // Development Server (bleibt für lokale Entwicklung)
  server: {
    port: 3000
  }
})
