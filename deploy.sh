#!/usr/bin/env bash
#
# deploy.sh — Baut die Vue-App aus dem aktuellen main-Branch und deployt
#             das Ergebnis in den nginx-Ordner von
#             kodinitools.com/audionormalisierer.
#
# AUF DEM VPS ausführen (dieses Repo muss dort ausgecheckt sein):
#
#     ./deploy.sh
#
# Als root oder via sudo starten, damit der Eigentümer auf www-data
# gesetzt werden kann:
#
#     sudo ./deploy.sh
#
# Ablauf:
#   1. origin/main holen und Arbeitsverzeichnis hart darauf setzen
#   2. Abhängigkeiten installieren (npm ci, inkl. devDependencies)
#   3. Produktions-Build (vite build -> dist/)
#   4. dist/ nach $DEPLOY_TARGET spiegeln (rsync --delete)
#   5. optional Eigentümer für nginx (www-data) setzen
#
# Konfiguration per Umgebungsvariable überschreibbar, z. B.:
#     DEPLOY_TARGET=/pfad ./deploy.sh
#     SKIP_GIT=1 ./deploy.sh          # ohne git-Update den Arbeitsstand bauen
#     DEPLOY_OWNER= ./deploy.sh       # kein chown

set -euo pipefail

# ── Konfiguration ────────────────────────────────────────────────────────────
DEPLOY_TARGET="${DEPLOY_TARGET:-/var/www/kodinitools.com/audionormalisierer}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
DEPLOY_OWNER="${DEPLOY_OWNER-www-data:www-data}"    # leer => kein chown
SKIP_GIT="${SKIP_GIT:-0}"                            # 1 => kein git fetch/reset

# ── Ins Repo-Verzeichnis wechseln (Verzeichnis dieses Scripts) ───────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

log()  { printf '\033[1;34m[deploy]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[deploy]\033[0m %s\n' "$*" >&2; }
die()  { printf '\033[1;31m[deploy]\033[0m %s\n' "$*" >&2; exit 1; }

# ── Vorbedingungen ───────────────────────────────────────────────────────────
command -v git   >/dev/null || die "git ist nicht installiert."
command -v node  >/dev/null || die "node ist nicht installiert."
command -v npm   >/dev/null || die "npm ist nicht installiert."
[ -f package.json ] || die "package.json nicht gefunden – Script aus dem Repo-Verzeichnis starten."

# ── 1. Aktuellen main-Stand holen ────────────────────────────────────────────
if [ "$SKIP_GIT" != "1" ]; then
  log "Hole aktuellen Stand von origin/$DEPLOY_BRANCH …"
  git fetch --prune origin "$DEPLOY_BRANCH"
  git checkout "$DEPLOY_BRANCH"
  git reset --hard "origin/$DEPLOY_BRANCH"
else
  warn "SKIP_GIT=1 – überspringe git-Update, baue aktuellen Arbeitsstand."
fi

CURRENT_COMMIT="$(git rev-parse --short HEAD)"
log "Baue Commit $CURRENT_COMMIT"

# ── 2. Abhängigkeiten installieren ───────────────────────────────────────────
# --include=dev erzwingt devDependencies (vite etc.), falls auf dem Server
# NODE_ENV=production gesetzt ist – ohne sie schlägt der Build fehl.
log "Installiere Abhängigkeiten …"
if [ -f package-lock.json ]; then
  npm ci --include=dev
else
  npm install --include=dev
fi

# ── 3. Produktions-Build ─────────────────────────────────────────────────────
log "Erstelle Produktions-Build (vite build) …"
npm run build
[ -f dist/index.html ] || die "Build fehlgeschlagen: dist/index.html fehlt."

# ── 4. Deployen ──────────────────────────────────────────────────────────────
# --delete entfernt alte (content-gehashte) Assets, die nicht mehr Teil des
# Builds sind. Das Zielverzeichnis enthält ausschließlich die statische SPA;
# api/, files/ und health werden von nginx zum Backend (Port 9001) geproxyt
# und liegen NICHT in diesem Ordner.
log "Deploye nach $DEPLOY_TARGET …"
mkdir -p "$DEPLOY_TARGET"
if command -v rsync >/dev/null; then
  rsync -a --delete dist/ "$DEPLOY_TARGET/"
else
  warn "rsync nicht gefunden – nutze cp-Fallback (leert das Zielverzeichnis vorher)."
  find "$DEPLOY_TARGET" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
  cp -a dist/. "$DEPLOY_TARGET/"
fi

# ── 5. Eigentümer für nginx setzen (nur als root) ────────────────────────────
if [ -n "$DEPLOY_OWNER" ]; then
  if [ "$(id -u)" = "0" ]; then
    log "Setze Eigentümer auf $DEPLOY_OWNER …"
    chown -R "$DEPLOY_OWNER" "$DEPLOY_TARGET"
  else
    warn "Nicht als root gestartet – überspringe chown auf $DEPLOY_OWNER."
    warn "Für korrekte nginx-Rechte ggf. 'sudo ./deploy.sh' verwenden."
  fi
fi

log "✅ Deployment abgeschlossen: $CURRENT_COMMIT → $DEPLOY_TARGET"
log "   Live: https://kodinitools.com/audionormalisierer/"
