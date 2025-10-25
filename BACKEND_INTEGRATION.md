# Backend-Integration für Audio Normalizer Vue 3

## 🔄 Überblick

Diese Vue 3 Anwendung ist derzeit für **clientseitige Audio-Verarbeitung** konzipiert. Für die Integration mit Ihrem Backend für serverseitige Konvertierung folgen Sie dieser Anleitung.

---

## 📋 Aktuelle Architektur (Client-seitig)

```
Browser (Client)
    ↓
Web Audio API
    ↓
Verarbeitung lokal
    ↓
Download (WAV/MP3)
```

---

## 🎯 Ziel-Architektur (Server-seitig)

```
Vue Frontend
    ↓
HTTP Request (Datei-Upload)
    ↓
Backend API (Nginx + Backend)
    ↓
Audio-Verarbeitung auf Server
    ↓
Verarbeitete Datei zurück
```

---

## 🔧 Benötigte Änderungen im Frontend

### 1. API-Service erstellen

**Datei:** `src/services/audioApi.js`

```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export const audioApi = {
  // Datei zum Server hochladen
  async uploadFile(file) {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) throw new Error('Upload failed')
    return await response.json()
  },

  // Audio normalisieren (RMS)
  async normalizeRms(fileId, targetRms) {
    const response = await fetch(`${API_BASE_URL}/normalize/rms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId, targetRms })
    })
    
    if (!response.ok) throw new Error('Normalization failed')
    return await response.json()
  },

  // EBU R128 Normalisierung
  async normalizeEBU(fileId, targetLufs = -23) {
    const response = await fetch(`${API_BASE_URL}/normalize/ebu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId, targetLufs })
    })
    
    if (!response.ok) throw new Error('EBU normalization failed')
    return await response.json()
  },

  // Rauschunterdrückung
  async noiseReduction(fileId) {
    const response = await fetch(`${API_BASE_URL}/effects/noise-reduction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId })
    })
    
    if (!response.ok) throw new Error('Noise reduction failed')
    return await response.json()
  },

  // Dynamikkompression
  async compression(fileId, settings) {
    const response = await fetch(`${API_BASE_URL}/effects/compression`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId, ...settings })
    })
    
    if (!response.ok) throw new Error('Compression failed')
    return await response.json()
  },

  // Datei herunterladen
  async downloadFile(fileId, format = 'wav') {
    const response = await fetch(`${API_BASE_URL}/download/${fileId}?format=${format}`)
    
    if (!response.ok) throw new Error('Download failed')
    return await response.blob()
  },

  // Datei vom Server löschen
  async deleteFile(fileId) {
    const response = await fetch(`${API_BASE_URL}/files/${fileId}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) throw new Error('Delete failed')
    return await response.json()
  }
}
```

---

### 2. useAudioProcessor.js anpassen

**Änderungen in:** `src/composables/useAudioProcessor.js`

```javascript
import { ref } from 'vue'
import { audioApi } from '../services/audioApi'

export function useAudioProcessor() {
  const audioFiles = ref([])
  const uploadProgress = ref(0)
  const isUploading = ref(false)
  
  // Datei hochladen zum Server
  const handleFilesInput = async (files) => {
    isUploading.value = true
    uploadProgress.value = 0
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      try {
        // Datei zum Server hochladen
        const response = await audioApi.uploadFile(file)
        
        // Datei zur Liste hinzufügen
        audioFiles.value.push({
          id: response.fileId,
          name: file.name,
          serverPath: response.path,
          originalFile: file,
          peak: response.analysis?.peak || 0,
          rms: response.analysis?.rms || 0,
          status: 'uploaded'
        })
        
        uploadProgress.value = ((i + 1) / files.length) * 100
      } catch (error) {
        console.error('Upload error:', error)
        setStatus(`Fehler beim Upload von ${file.name}`)
      }
    }
    
    isUploading.value = false
  }

  // RMS Normalisierung (Server)
  const applyGlobalRms = async () => {
    for (const file of audioFiles.value) {
      try {
        const response = await audioApi.normalizeRms(file.id, globalRmsValue.value)
        file.peak = response.analysis.peak
        file.rms = response.analysis.rms
        file.status = 'processed'
      } catch (error) {
        console.error('RMS normalization error:', error)
      }
    }
  }

  // EBU R128 (Server)
  const applyEBUR128 = async () => {
    for (const file of audioFiles.value) {
      try {
        const response = await audioApi.normalizeEBU(file.id)
        file.peak = response.analysis.peak
        file.rms = response.analysis.rms
        file.lufs = response.analysis.lufs
        file.status = 'processed'
      } catch (error) {
        console.error('EBU normalization error:', error)
      }
    }
  }

  // Export (Server)
  const exportFile = async (file) => {
    try {
      const blob = await audioApi.downloadFile(file.id, downloadFormat.value)
      const baseName = "processed_" + file.name.replace(/\.[^/.]+$/, "")
      const extension = downloadFormat.value === 'mp3' ? '.mp3' : '.wav'
      triggerDownload(blob, baseName + extension)
    } catch (error) {
      console.error('Export error:', error)
    }
  }

  // Datei entfernen (auch vom Server)
  const removeFile = async (file) => {
    try {
      await audioApi.deleteFile(file.id)
      const index = audioFiles.value.findIndex(f => f.id === file.id)
      if (index !== -1) {
        audioFiles.value.splice(index, 1)
      }
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  return {
    audioFiles,
    uploadProgress,
    isUploading,
    handleFilesInput,
    applyGlobalRms,
    applyEBUR128,
    exportFile,
    removeFile,
    // ... weitere Funktionen
  }
}
```

---

### 3. Environment Variables

**Datei:** `.env.development`

```env
VITE_API_URL=http://localhost:8000/api
```

**Datei:** `.env.production`

```env
VITE_API_URL=https://ihre-domain.com/api
```

---

## 🔌 Backend-API Endpoints (Beispiel)

Ihr Backend sollte folgende Endpoints bereitstellen:

### Upload
```
POST /api/upload
Content-Type: multipart/form-data
Body: file

Response:
{
  "fileId": "uuid-v4",
  "path": "/uploads/uuid.wav",
  "analysis": {
    "peak": 0.85,
    "rms": 0.45,
    "duration": 120.5
  }
}
```

### RMS Normalisierung
```
POST /api/normalize/rms
Content-Type: application/json
Body: { "fileId": "uuid", "targetRms": 0.5 }

Response:
{
  "fileId": "uuid",
  "analysis": {
    "peak": 0.98,
    "rms": 0.5
  }
}
```

### EBU R128 Normalisierung
```
POST /api/normalize/ebu
Content-Type: application/json
Body: { "fileId": "uuid", "targetLufs": -23 }

Response:
{
  "fileId": "uuid",
  "analysis": {
    "peak": 0.92,
    "rms": 0.48,
    "lufs": -23.0
  }
}
```

### Effects
```
POST /api/effects/noise-reduction
POST /api/effects/compression
POST /api/effects/clipping-reduction
```

### Download
```
GET /api/download/{fileId}?format=wav|mp3

Response: Audio file (binary)
```

### Delete
```
DELETE /api/files/{fileId}

Response: { "success": true }
```

---

## 🔒 Nginx Konfiguration

### Reverse Proxy für API

```nginx
server {
    listen 80;
    server_name ihre-domain.com;

    # Vue Frontend (statische Dateien)
    location / {
        root /var/www/audio-normalizer/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Wichtig für Datei-Uploads
        client_max_body_size 100M;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Statische Dateien mit Cache
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        root /var/www/audio-normalizer/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 🚀 Deployment-Prozess

### 1. Frontend bauen
```bash
cd audio-normalizer-vue
npm run build
```

### 2. Dateien auf Server kopieren
```bash
# Alte Anwendung sichern (falls vorhanden)
ssh user@server "mv /var/www/audio-normalizer /var/www/audio-normalizer.backup"

# Neue Dateien hochladen
scp -r dist/* user@server:/var/www/audio-normalizer/
```

### 3. Nginx neustarten
```bash
ssh user@server "nginx -t && systemctl reload nginx"
```

### 4. Backend starten
```bash
ssh user@server "cd /opt/audio-backend && systemctl restart audio-backend"
```

---

## 🔄 Migrations-Strategie

### Phase 1: Hybrid-Modus (Optional)
Beide Modi parallel laufen lassen:
- Client-seitig für kleine Dateien (<10 MB)
- Server-seitig für große Dateien (>10 MB)

```javascript
const shouldUseServer = (fileSize) => {
  const maxClientSize = 10 * 1024 * 1024 // 10 MB
  return fileSize > maxClientSize
}
```

### Phase 2: Vollständig Server-seitig
Alle Verarbeitung auf den Server verlagern.

---

## 📊 Monitoring & Logging

### Frontend-Fehlerbehandlung

```javascript
// Error Interceptor
const handleApiError = (error) => {
  console.error('API Error:', error)
  
  if (error.response) {
    // Server-Fehler
    const status = error.response.status
    if (status === 413) {
      setStatus('Datei zu groß für Upload')
    } else if (status === 500) {
      setStatus('Server-Fehler bei der Verarbeitung')
    }
  } else if (error.request) {
    // Netzwerk-Fehler
    setStatus('Netzwerk-Fehler. Bitte Verbindung prüfen.')
  }
}
```

---

## 🔐 Sicherheit

### CORS-Einstellungen (Backend)

```javascript
// Express.js Beispiel
app.use(cors({
  origin: 'https://ihre-domain.com',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}))
```

### File Upload Limits

```javascript
// Backend
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ limit: '50mb', extended: true }))
```

---

## 📋 Checkliste für Backend-Integration

- [ ] API-Service erstellt (`src/services/audioApi.js`)
- [ ] useAudioProcessor angepasst
- [ ] Environment Variables konfiguriert
- [ ] Backend-Endpoints implementiert
- [ ] Nginx als Reverse Proxy konfiguriert
- [ ] CORS richtig eingestellt
- [ ] File Upload Limits gesetzt
- [ ] Fehlerbehandlung implementiert
- [ ] Tests durchgeführt
- [ ] Monitoring eingerichtet

---

## 🎯 Vorteile der Server-seitigen Verarbeitung

✅ **Performance:** Schnellere Verarbeitung großer Dateien  
✅ **Konsistenz:** Gleiche Ergebnisse für alle Nutzer  
✅ **Ressourcen:** Schont Client-Ressourcen  
✅ **Features:** Mehr Audio-Processing-Möglichkeiten  
✅ **Skalierung:** Einfacher zu skalieren  

---

## 📞 Weitere Anpassungen

Bei Fragen zur Integration oder spezifischen Backend-Anforderungen, können folgende Dateien angepasst werden:

- `src/services/audioApi.js` - API-Kommunikation
- `src/composables/useAudioProcessor.js` - Haupt-Logik
- `.env.production` - Produktions-URLs
- `vite.config.js` - Proxy-Konfiguration für Development

---

**Viel Erfolg bei der Backend-Integration! 🚀**
