# Deployment-Optionen für Audio Normalizer Vue 3

## 🌐 Vercel (Empfohlen - Einfachste Option)

### Schritt-für-Schritt:

1. **Vercel Account erstellen** (falls noch nicht vorhanden)
   - Gehen Sie zu [vercel.com](https://vercel.com)
   - Registrieren Sie sich mit GitHub

2. **Projekt deployen**
   ```bash
   npm install -g vercel
   vercel
   ```
   
   Oder über das Vercel Dashboard:
   - "Add New Project" klicken
   - Repository auswählen oder Git Repository verbinden
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Deploy klicken

3. **Fertig!** 
   Ihre App ist live unter: `https://ihr-projekt.vercel.app`

### Vorteile:
- ✅ Kostenloses Hosting
- ✅ Automatische SSL-Zertifikate
- ✅ CDN weltweit
- ✅ Automatische Deployments bei Git Push

---

## 🚀 Netlify

### Deployment:

1. **Via Drag & Drop:**
   ```bash
   npm run build
   ```
   Ziehen Sie den `dist/` Ordner auf [netlify.com/drop](https://app.netlify.com/drop)

2. **Via Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod
   ```

3. **Via Git:**
   - Projekt zu GitHub/GitLab pushen
   - Bei Netlify einloggen
   - "New site from Git" wählen
   - Build Command: `npm run build`
   - Publish directory: `dist`

### Vorteile:
- ✅ Kostenloses Hosting
- ✅ Einfaches Deployment
- ✅ Automatische HTTPS
- ✅ Formulare und Serverless Functions

---

## 📦 GitHub Pages

### Vorbereitung:

1. **vite.config.js anpassen:**
   ```javascript
   export default defineConfig({
     plugins: [vue()],
     base: '/repository-name/', // Ihr Repository-Name
   })
   ```

2. **Package.json anpassen:**
   ```json
   {
     "scripts": {
       "deploy": "npm run build && gh-pages -d dist"
     }
   }
   ```

3. **gh-pages installieren:**
   ```bash
   npm install --save-dev gh-pages
   ```

### Deployment:
```bash
npm run deploy
```

Ihre App ist dann verfügbar unter:
`https://ihr-username.github.io/repository-name/`

### Vorteile:
- ✅ Kostenlos für öffentliche Repositories
- ✅ Direkt von GitHub aus
- ✅ Versionskontrolle inklusive

---

## 🐳 Docker

### Dockerfile erstellen:

```dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Deployment:
```bash
docker build -t audio-normalizer .
docker run -p 80:80 audio-normalizer
```

### Vorteile:
- ✅ Konsistente Umgebung
- ✅ Skalierbar
- ✅ Portabel

---

## ☁️ AWS S3 + CloudFront

### Schritte:

1. **S3 Bucket erstellen:**
   - Static Website Hosting aktivieren
   - Public Access erlauben

2. **Build hochladen:**
   ```bash
   npm run build
   aws s3 sync dist/ s3://ihr-bucket-name
   ```

3. **CloudFront Distribution (optional):**
   - Für bessere Performance und HTTPS
   - Origin auf S3 Bucket setzen

### Vorteile:
- ✅ Hochverfügbar
- ✅ Skalierbar
- ✅ Pay-per-use

---

## 🔧 Eigener Server (VPS/Dedicated)

### Mit Nginx:

1. **Build erstellen:**
   ```bash
   npm run build
   ```

2. **Dateien auf Server kopieren:**
   ```bash
   scp -r dist/* user@server:/var/www/audio-normalizer/
   ```

3. **Nginx konfigurieren:**
   ```nginx
   server {
       listen 80;
       server_name ihr-domain.com;
       root /var/www/audio-normalizer;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```

4. **SSL mit Let's Encrypt:**
   ```bash
   certbot --nginx -d ihr-domain.com
   ```

### Vorteile:
- ✅ Volle Kontrolle
- ✅ Anpassbar
- ✅ Keine Plattform-Abhängigkeit

---

## 📊 Vergleich der Optionen

| Option | Kosten | Einfachheit | Performance | Support |
|--------|--------|-------------|-------------|---------|
| **Vercel** | Kostenlos | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Netlify** | Kostenlos | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **GitHub Pages** | Kostenlos | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Docker** | Variabel | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **AWS S3** | Pay-per-use | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Eigener Server** | Variabel | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |

---

## 🎯 Empfehlung

**Für Anfänger:** Vercel oder Netlify
- Einfachstes Setup
- Kostenlos
- Automatische Deployments

**Für erfahrene Entwickler:** Docker + AWS/Azure/GCP
- Maximale Kontrolle
- Enterprise-ready
- Skalierbar

**Für GitHub-Nutzer:** GitHub Pages
- Direkt aus Repository
- Versionskontrolle
- Kostenlos

---

## ⚠️ Wichtige Hinweise

1. **Router Mode:** Die App nutzt HTML5 History Mode. Stellen Sie sicher, dass Ihr Server korrekt konfiguriert ist (alle Routen zu index.html umleiten).

2. **Environment Variables:** Für API-Keys o.ä. nutzen Sie `.env` Dateien:
   ```
   VITE_API_KEY=your_key_here
   ```

3. **Base URL:** Passen Sie `base` in `vite.config.js` an, wenn die App nicht im Root-Verzeichnis liegt.

4. **Build-Optimierung:** 
   ```bash
   npm run build -- --mode production
   ```

---

## 🔄 CI/CD Pipeline (Beispiel für GitHub Actions)

```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## 🆘 Troubleshooting

### "404 beim Reload"
→ Server muss alle Routen zu index.html umleiten

### "Assets nicht gefunden"
→ `base` in vite.config.js überprüfen

### "CORS-Fehler"
→ Externe APIs benötigen korrekte CORS-Header

---

## 📚 Weitere Ressourcen

- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Vue Router History Mode](https://router.vuejs.org/guide/essentials/history-mode.html)
- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)

---

**Viel Erfolg beim Deployment! 🚀**
