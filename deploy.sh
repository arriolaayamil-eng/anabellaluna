#!/bin/bash
set -e

# ═══════════════════════════════════════════════════════════
#  AnabellaLuna — Script de Deploy Completo
#  Uso:  bash /var/www/anabella/deploy.sh
#        bash /var/www/anabella/deploy.sh --skip-frontend
#        bash /var/www/anabella/deploy.sh --only backend
#        bash /var/www/anabella/deploy.sh --only admin
#        bash /var/www/anabella/deploy.sh --only agents
#        bash /var/www/anabella/deploy.sh --only frontend
# ═══════════════════════════════════════════════════════════

PROJECT_DIR="/var/www/anabella"
LOGFILE="$PROJECT_DIR/deploy.log"

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${CYAN}[$(date '+%H:%M:%S')]${NC} $1" | tee -a "$LOGFILE"; }
ok()   { echo -e "${GREEN}  ✔ $1${NC}" | tee -a "$LOGFILE"; }
warn() { echo -e "${YELLOW}  ⚠ $1${NC}" | tee -a "$LOGFILE"; }
fail() { echo -e "${RED}  ✖ $1${NC}" | tee -a "$LOGFILE"; exit 1; }

# ── Parsear argumentos ──────────────────────────────────────
SKIP_FRONTEND=false
ONLY=""
for arg in "$@"; do
  case $arg in
    --skip-frontend) SKIP_FRONTEND=true ;;
    --only)          shift; ONLY="$1" ;;
    backend|admin|agents|frontend)
      if [ "$ONLY" = "" ] && [ "${prev_arg}" = "--only" ]; then
        ONLY="$arg"
      fi
      ;;
  esac
  prev_arg="$arg"
done

# Corregir --only parsing
for i in "$@"; do
  if [ "$prev" = "--only" ]; then
    ONLY="$i"
  fi
  prev="$i"
done

should_run() {
  local component="$1"
  if [ -n "$ONLY" ]; then
    [ "$ONLY" = "$component" ] && return 0 || return 1
  fi
  if [ "$SKIP_FRONTEND" = true ] && [ "$component" != "backend" ]; then
    return 1
  fi
  return 0
}

# ══════════════════════════════════════════════════════════════
echo "" | tee -a "$LOGFILE"
log "═══════════════════════════════════════════════════"
log "  DEPLOY AnabellaLuna — $(date '+%Y-%m-%d %H:%M:%S')"
log "═══════════════════════════════════════════════════"

# ── 1. Git Pull ──────────────────────────────────────────────
log "📥 Descargando últimos cambios..."
cd "$PROJECT_DIR"
git stash --include-untracked 2>/dev/null || true
git pull origin main || fail "git pull falló"
ok "Código actualizado"

# ── 2. Backend ───────────────────────────────────────────────
if should_run "backend"; then
  log "🔧 Backend — Instalando dependencias..."
  cd "$PROJECT_DIR/backend"
  NODE_ENV=production npm ci --no-audit --no-fund 2>&1 | tail -1 | tee -a "$LOGFILE"
  ok "Dependencias del backend instaladas"

  log "🔄 Backend — Reiniciando con PM2..."
  if pm2 describe backend > /dev/null 2>&1; then
    pm2 restart backend --update-env 2>&1 | tee -a "$LOGFILE"
  else
    pm2 start server.js --name backend --cwd "$PROJECT_DIR/backend" 2>&1 | tee -a "$LOGFILE"
  fi
  pm2 save 2>/dev/null
  ok "Backend reiniciado"
fi

# ── 3. Admin (ERP) ──────────────────────────────────────────
if should_run "admin"; then
  log "🏗️  Admin (ERP) — Instalando dependencias..."
  cd "$PROJECT_DIR/admin"
  NODE_ENV=development npm ci --no-audit --no-fund 2>&1 | tail -1 | tee -a "$LOGFILE"
  ok "Dependencias admin instaladas"

  log "🏗️  Admin (ERP) — Compilando..."
  NODE_ENV=production DISABLE_ESLINT_PLUGIN=true npm run build 2>&1 | tail -5 | tee -a "$LOGFILE"
  ok "Admin build completado"
fi

# ── 4. Agents (CRM) ─────────────────────────────────────────
if should_run "agents"; then
  log "🏗️  Agents (CRM) — Instalando dependencias..."
  cd "$PROJECT_DIR/agents"
  NODE_ENV=development npm ci --no-audit --no-fund 2>&1 | tail -1 | tee -a "$LOGFILE"
  ok "Dependencias agents instaladas"

  log "🏗️  Agents (CRM) — Compilando..."
  NODE_ENV=production DISABLE_ESLINT_PLUGIN=true npm run build 2>&1 | tail -5 | tee -a "$LOGFILE"
  ok "Agents build completado"
fi

# ── 5. Frontend (Público) ───────────────────────────────────
if should_run "frontend"; then
  log "🏗️  Frontend (Público) — Instalando dependencias..."
  cd "$PROJECT_DIR/frontend"
  NODE_ENV=development npm ci --no-audit --no-fund 2>&1 | tail -1 | tee -a "$LOGFILE"
  ok "Dependencias frontend instaladas"

  log "🏗️  Frontend (Público) — Compilando..."
  NODE_ENV=production npm run build 2>&1 | tail -5 | tee -a "$LOGFILE"
  ok "Frontend build completado"
fi

# ── 6. Resumen ───────────────────────────────────────────────
echo "" | tee -a "$LOGFILE"
log "═══════════════════════════════════════════════════"
log "  ✅ DEPLOY COMPLETADO — $(date '+%H:%M:%S')"
log "═══════════════════════════════════════════════════"

if should_run "backend"; then
  echo "" | tee -a "$LOGFILE"
  log "Estado PM2:"
  pm2 list | tee -a "$LOGFILE"
fi

echo "" | tee -a "$LOGFILE"
log "Log guardado en: $LOGFILE"
