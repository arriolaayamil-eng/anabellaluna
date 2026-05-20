# Arquitectura AI Marketing Operations — Anabella Luna CRM/ERP
# Documento técnico completo — Generado: Mayo 2026

---

## ÍNDICE

1. Principios rectores
2. Estructura de monorepo actualizada
3. MongoDB — Nuevos modelos
4. Backend — AI Orchestration Layer
5. Provider Abstraction (OpenAI/Anthropic)
6. Tool Registry y Tool Executor
7. Meta Ads Integration
8. RBAC extendido
9. Socket.IO + Streaming
10. Redis (incremental)
11. Event Bus
12. Frontend — Syncfusion-compatible components
13. PM2 + Nginx — Deployment architecture
14. Roadmap de implementación

---

## 1. PRINCIPIOS RECTORES

- **Incrementalidad**: Nada se rompe. Cada capa se agrega sin tocar lo existente.
- **Compatibilidad**: JWT, MongoDB, Express, React 17, Syncfusion — intactos.
- **RBAC-first**: Toda acción AI pasa por validación de permisos antes de ejecutarse.
- **Approval gate**: El LLM *nunca* ejecuta directamente. Siempre hay aprobación humana para acciones destructivas.
- **Auditabilidad**: Toda acción AI genera un SecurityEvent.
- **Degradación elegante**: Redis, Socket.IO y proveedores AI son opcionales en desarrollo.

---

## 2. ESTRUCTURA DE MONOREPO ACTUALIZADA

```
anabella app/
├── backend/
│   ├── server.js                    # MODIFICAR — agregar socket.io + nuevas rutas
│   ├── redis.js                     # NUEVO
│   ├── socket.js                    # NUEVO
│   ├── models/
│   │   ├── [existentes — intactos]
│   │   ├── AIConversation.js        # NUEVO
│   │   ├── AIMessage.js             # NUEVO
│   │   ├── AIToolExecution.js       # NUEVO
│   │   ├── AIProvider.js            # NUEVO
│   │   ├── AIUsageLog.js            # NUEVO
│   │   ├── MarketingCampaign.js     # NUEVO
│   │   ├── CampaignMetrics.js       # NUEVO
│   │   └── MarketingRecommendation.js # NUEVO
│   ├── routes/
│   │   ├── [existentes — intactos]
│   │   └── marketing-ai/
│   │       ├── index.js             # Router raíz + auth guard
│   │       ├── conversations.js     # Chat/Copilot endpoints
│   │       ├── campaigns.js         # Gestión de campañas
│   │       ├── metrics.js           # Métricas y KPIs
│   │       ├── recommendations.js   # Recomendaciones AI
│   │       └── providers.js        # Config providers (admin)
│   ├── services/
│   │   ├── [existentes — intactos]
│   │   └── ai/
│   │       ├── orchestrator.js      # Orquestador central
│   │       ├── providerAbstraction.js # OpenAI/Anthropic abstraction
│   │       ├── toolRegistry.js      # Definición de tools
│   │       ├── toolValidator.js     # Validación de inputs
│   │       ├── toolExecutor.js      # Ejecución + rollback
│   │       ├── executionQueue.js    # Cola de ejecución
│   │       ├── contextManager.js    # System prompts + memoria
│   │       ├── streamingService.js  # Token streaming via Socket.IO
│   │       ├── recommendationService.js # Motor de recomendaciones
│   │       ├── auditLogger.js       # Audit logs AI
│   │       └── integrations/
│   │           ├── metaAds.js       # Meta Ads API
│   │           ├── googleAds.js     # Google Ads (stub)
│   │           └── tiktokAds.js     # TikTok (stub)
│   ├── middlewares/
│   │   ├── rbac.js                  # NUEVO — RBAC centralizado
│   │   └── aiRateLimit.js           # NUEVO — Rate limiting AI
│   └── workers/
│       ├── ai-worker.js             # NUEVO — Worker AI (PM2)
│       ├── metrics-worker.js        # NUEVO — Sync métricas periódico
│       └── scheduler-worker.js      # NUEVO — Schedulers separados del API
├── admin/src/
│   ├── [existente — intacto]
│   ├── pages/
│   │   ├── MarketingAI.jsx          # NUEVO — Copilot + Campaigns
│   │   ├── AIProviders.jsx          # NUEVO — Config providers
│   │   └── CampaignMetrics.jsx      # NUEVO — Dashboard métricas
│   ├── components/ai/
│   │   ├── AICopilotChat.jsx        # Chat conversacional
│   │   ├── AIMessageBubble.jsx      # Burbuja de mensaje
│   │   ├── AIToolApproval.jsx       # Modal de aprobación
│   │   ├── AIStreamingText.jsx      # Texto streaming
│   │   ├── CampaignCard.jsx         # Card de campaña
│   │   ├── MetricWidget.jsx         # Widget KPI
│   │   └── RecommendationCard.jsx   # Recomendación AI
│   ├── hooks/
│   │   ├── useAIChat.js             # Hook chat AI
│   │   ├── useSocket.js             # Socket.IO hook
│   │   └── useMarketingMetrics.js   # Métricas hook
│   └── services/
│       ├── aiService.js             # Servicio REST AI
│       └── socketService.js         # Socket.IO client
├── agents/src/
│   ├── [existente — intacto]
│   └── pages/
│       └── MarketingAI.jsx          # NUEVO — Copilot CRM (versión agente)
├── ecosystem.config.js              # ACTUALIZAR — nuevos workers PM2
└── nginx.conf                       # ACTUALIZAR — WebSocket proxy
```

---

## 3. MONGODB — NUEVOS MODELOS

### 3.1 AIConversation

```javascript
// backend/models/AIConversation.js
const mongoose = require('mongoose');
const s = new mongoose.Schema({
  userId:         { type: String, required: true, index: true },
  agenteId:       { type: String, index: true },
  inmobiliariaId: { type: String, index: true },
  contextType:    { type: String, enum: ['marketing','crm','analytics','general'], default: 'marketing' },
  title:          { type: String, default: 'Nueva conversación' },
  status:         { type: String, enum: ['active','archived','deleted'], default: 'active' },
  provider:       { type: String, enum: ['openai','anthropic'], default: 'openai' },
  model:          String,
  totalTokensUsed:{ type: Number, default: 0 },
  totalCostUSD:   { type: Number, default: 0 },
  metadata: {
    campaignIds: [String], clienteIds: [String],
    tags: [String], actionsCount: { type: Number, default: 0 },
  },
  lastMessageAt: { type: Date, default: Date.now },
}, { timestamps: true, collection: 'ai_conversations' });
s.index({ userId: 1, status: 1, lastMessageAt: -1 });
s.index({ agenteId: 1, status: 1 });
module.exports = mongoose.model('AIConversation', s);
```

### 3.2 AIMessage

```javascript
// backend/models/AIMessage.js
const mongoose = require('mongoose');
const s = new mongoose.Schema({
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'AIConversation', required: true, index: true },
  userId:   { type: String, required: true, index: true },
  agenteId: String,
  role:     { type: String, enum: ['user','assistant','tool','system'], required: true },
  content:  { type: String, required: true },
  toolCall: {
    toolName: String, toolInput: mongoose.Schema.Types.Mixed,
    toolOutput: mongoose.Schema.Types.Mixed, executionId: String,
    status: { type: String, enum: ['pending','approved','rejected','executed','failed'] },
  },
  provider: String, model: String,
  tokensUsed: { type: Number, default: 0 },
  costUSD:    { type: Number, default: 0 },
  latencyMs:  { type: Number, default: 0 },
  isStreaming:{ type: Boolean, default: false },
  isComplete: { type: Boolean, default: true },
}, { timestamps: true, collection: 'ai_messages' });
s.index({ conversationId: 1, createdAt: 1 });
module.exports = mongoose.model('AIMessage', s);
```

### 3.3 AIToolExecution

```javascript
// backend/models/AIToolExecution.js
const mongoose = require('mongoose');
const s = new mongoose.Schema({
  conversationId:   { type: mongoose.Schema.Types.ObjectId, ref: 'AIConversation', index: true },
  userId:           { type: String, required: true, index: true },
  agenteId:         String,
  toolName:         { type: String, required: true, index: true },
  toolInput:        { type: mongoose.Schema.Types.Mixed, required: true },
  toolOutput:       mongoose.Schema.Types.Mixed,
  requiresApproval: { type: Boolean, default: true },
  approvalStatus:   { type: String, enum: ['pending','approved','rejected','auto_approved'], default: 'pending' },
  approvedBy:       String, approvedAt: Date, rejectionReason: String,
  status:           { type: String, enum: ['pending','queued','executing','completed','failed','rolled_back'], default: 'pending' },
  startedAt: Date, completedAt: Date, errorMessage: String,
  retryCount:     { type: Number, default: 0 },
  rollbackData:   mongoose.Schema.Types.Mixed,
  isRollbackable: { type: Boolean, default: false },
  rolledBackAt: Date, rolledBackBy: String,
  ipAddress: String, sessionId: String,
}, { timestamps: true, collection: 'ai_tool_executions' });
s.index({ status: 1, approvalStatus: 1, createdAt: -1 });
s.index({ userId: 1, toolName: 1, createdAt: -1 });
module.exports = mongoose.model('AIToolExecution', s);
```

### 3.4 AIUsageLog

```javascript
// backend/models/AIUsageLog.js — TTL 90 días
const mongoose = require('mongoose');
const s = new mongoose.Schema({
  provider: { type: String, required: true },
  model:    { type: String, required: true },
  userId:   { type: String, required: true, index: true },
  agenteId: { type: String, index: true },
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'AIConversation' },
  promptTokens: { type: Number, default: 0 },
  completionTokens: { type: Number, default: 0 },
  totalTokens: { type: Number, default: 0 },
  costUSD:   { type: Number, default: 0 },
  latencyMs: { type: Number, default: 0 },
  requestType: { type: String, enum: ['chat','tool_call','embedding','analysis'] },
  success:   { type: Boolean, default: true },
  errorCode: String,
  date: { type: Date, default: () => new Date(new Date().setHours(0,0,0,0)), index: true },
}, { timestamps: true, collection: 'ai_usage_logs' });
s.index({ date: 1, provider: 1, userId: 1 });
s.index({ createdAt: 1 }, { expireAfterSeconds: 60*60*24*90 }); // TTL 90d
module.exports = mongoose.model('AIUsageLog', s);
```

### 3.5 MarketingCampaign + CampaignMetrics + MarketingRecommendation

```javascript
// backend/models/MarketingCampaign.js
const mongoose = require('mongoose');
const s = new mongoose.Schema({
  agenteId: { type: String, index: true },
  inmobiliariaId: { type: String, index: true },
  createdBy: { type: String, required: true },
  platform:  { type: String, enum: ['meta','google_ads','tiktok'], required: true },
  externalId: { type: String, index: true },
  accountId: String,
  name:      { type: String, required: true },
  status:    { type: String, enum: ['active','paused','deleted','archived','draft','syncing'], default: 'draft' },
  objective: String,
  budget:    Number,
  budgetType:{ type: String, enum: ['daily','lifetime'], default: 'daily' },
  currency:  { type: String, default: 'ARS' },
  startDate: Date, endDate: Date,
  lastSyncAt: Date, lastSyncError: String,
  syncStatus: { type: String, enum: ['ok','error','pending'], default: 'pending' },
  metadata: {
    propiedadIds: [String], clienteIds: [String], tags: [String],
    aiGenerated: { type: Boolean, default: false },
    aiRecommendation: String,
  },
}, { timestamps: true, collection: 'marketing_campaigns' });
s.index({ platform: 1, externalId: 1 }, { unique: true, sparse: true });
s.index({ agenteId: 1, status: 1 });
module.exports = mongoose.model('MarketingCampaign', s);

// backend/models/CampaignMetrics.js
const s2 = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketingCampaign', required: true, index: true },
  externalId: { type: String, index: true },
  platform:   { type: String, required: true },
  agenteId:   { type: String, index: true },
  date:       { type: Date, required: true, index: true },
  granularity:{ type: String, enum: ['hour','day','week','month'], default: 'day' },
  impressions: { type: Number, default: 0 }, clicks: { type: Number, default: 0 },
  spend:       { type: Number, default: 0 }, reach:  { type: Number, default: 0 },
  frequency:   { type: Number, default: 0 }, conversions: { type: Number, default: 0 },
  leads:       { type: Number, default: 0 }, revenue: { type: Number, default: 0 },
  ctr: Number, cpc: Number, cpm: Number, cpl: Number, cac: Number, roas: Number,
  rawData: mongoose.Schema.Types.Mixed,
}, { timestamps: true, collection: 'campaign_metrics' });
s2.index({ campaignId: 1, date: -1 });
s2.index({ createdAt: 1 }, { expireAfterSeconds: 60*60*24*365*2 }); // TTL 2 años
mongoose.model('CampaignMetrics', s2);
```

---

## 4. PROVIDER ABSTRACTION (OpenAI / Anthropic)

### Patrón: Config en GlobalConfig — igual que MercadoLibre

```javascript
// backend/services/ai/providerAbstraction.js (resumen)
// Config almacenada en GlobalConfig key: 'ai_provider_config'
// Estructura en DB:
// {
//   defaultProvider: 'openai',
//   fallbackProvider: 'anthropic',
//   openai: { enabled: true, apiKeyEncrypted: '...', model: 'gpt-4o', temperature: 0.3, maxTokens: 4096 },
//   anthropic: { enabled: true, apiKeyEncrypted: '...', model: 'claude-3-5-sonnet-20241022', temperature: 0.3, maxTokens: 4096 }
// }

// Flujo:
// 1. Leer config de GlobalConfig (cache 1 min — igual que googleCalendar.js)
// 2. Intentar defaultProvider
// 3. Si falla → intentar fallbackProvider
// 4. Log usage en AIUsageLog
// 5. Emitir evento 'ai.provider.failed' si falla
// 6. Normalizar respuesta Anthropic → formato OpenAI-like
```

**Estimación de costos** (USD por 1M tokens):

| Modelo | Input | Output |
|--------|-------|--------|
| gpt-4o | $2.5 | $10 |
| gpt-4o-mini | $0.15 | $0.6 |
| claude-3-5-sonnet | $3 | $15 |
| claude-3-haiku | $0.25 | $1.25 |

---

## 5. TOOL REGISTRY — TOOLS DISPONIBLES

| Tool | Permisos | Aprobación requerida | Rollbackable |
|------|----------|----------------------|--------------|
| `get_campaigns` | marketing:read | ❌ Auto | ❌ |
| `get_campaign_metrics` | marketing:read | ❌ Auto | ❌ |
| `get_crm_summary` | crm:read | ❌ Auto | ❌ |
| `update_campaign_budget` | marketing:write | ✅ Siempre | ✅ |
| `pause_campaign` | marketing:write | ✅ Siempre | ✅ |
| `resume_campaign` | marketing:write | ✅ Siempre | ✅ |
| `generate_recommendation` | marketing:read | ❌ Auto | ❌ |

### Flujo de ejecución de tool (CRÍTICO)

```
Usuario → Mensaje → Orchestrator
    → LLM solicita tool
    → toolValidator.validateInput()
    → AIToolExecution.create({ status: 'pending', approvalStatus: 'pending' })
    → Si requiresApproval: Socket.IO → Frontend → Modal de aprobación
    → Usuario aprueba/rechaza
    → Si aprobado: toolExecutor.executeApprovedTool()
        → captureRollbackData() si rollbackable
        → executor(toolInput)
        → AIToolExecution.update({ status: 'completed', toolOutput })
        → logAIAction() → SecurityEvent
        → eventBus.emit('ai.tool.executed')
    → Si rechazado: AIToolExecution.update({ approvalStatus: 'rejected' })
```

---

## 6. RBAC EXTENDIDO

### Roles nuevos (no rompen JWT existente)

Los nuevos roles se almacenan en `User.metadata.marketingRole` y se incluyen en el JWT como campo adicional `marketingRole` en el próximo login.

| Rol | Permisos |
|-----|----------|
| `MARKETING_ADMIN` | marketing:read, marketing:write, marketing:admin, crm:read |
| `MEDIA_BUYER` | marketing:read, marketing:write, crm:read |
| `ANALYST` | marketing:read, crm:read |
| `VIEWER` | marketing:read |

Roles existentes mantienen sus permisos + se les agrega:
- `admin` → todos los permisos marketing
- `agent` → marketing:read

```javascript
// backend/middlewares/rbac.js
function requirePermission(...perms) {
  return (req, res, next) => {
    const userPerms = resolvePermissions(req.user); // combina role + marketingRole
    if (!perms.every(p => userPerms.includes(p))) {
      return res.status(403).json({ error: 'Insufficient permissions', required: perms });
    }
    req.permissions = userPerms;
    next();
  };
}
```

---

## 7. SOCKET.IO ARCHITECTURE

```javascript
// backend/socket.js — Puntos clave:
// - Autenticación: JWT en handshake.auth.token
// - Salas: user:{userId}, agent:{agenteId}, admin
// - Si Redis disponible: @socket.io/redis-adapter para escalar
// - Si Redis no disponible: in-memory (un solo proceso)

// Eventos emitidos al cliente:
// ai:approval_required  → { executionId, toolName, toolInput, message }
// ai:tool_result        → { executionId, result, success }
// ai:streaming_token    → { conversationId, token, isComplete }
// ai:metrics_updated    → { campaignId, metrics }

// Eventos recibidos del cliente:
// ai:approve_tool       → { executionId }
// ai:reject_tool        → { executionId, reason }
```

**Configuración Nginx para WebSocket:**

```nginx
# nginx.conf — agregar dentro del bloque server existente
location /socket.io/ {
    proxy_pass http://localhost:4000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_read_timeout 86400;
    proxy_send_timeout 86400;
}
```

---

## 8. REDIS — ESTRATEGIA INCREMENTAL

Redis es **opcional**. El sistema funciona sin él.

```
REDIS_URL no configurado → sistema funciona con fallbacks en memoria

Con Redis habilitado:
- Socket.IO adapter → escala horizontal (múltiples PM2 instancias)
- Cache de credenciales AI (TTL 60s) → menos hits a MongoDB
- Rate limiting AI (max 20 req/min por usuario)
- Context cache de conversación (TTL 5min) → menos queries MongoDB
- Queue de tool executions (BullMQ futuro)
```

**Instalación Redis en Ubuntu:**
```bash
sudo apt-get install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
# REDIS_URL=redis://localhost:6379 en .env
```

---

## 9. PM2 ECOSYSTEM — ARQUITECTURA DE WORKERS

```javascript
// ecosystem.config.js — ACTUALIZACIÓN (no reemplazar, agregar)
module.exports = {
  apps: [
    // ── Existente ──────────────────────────────────────────────────────
    {
      name: 'backend',
      script: './backend/server.js',
      cwd: '/var/www/anabella',
      instances: 1,          // Escalar a 2+ solo con Redis habilitado
      exec_mode: 'fork',
      env: { NODE_ENV: 'production', PORT: 4000 },
      error_file: '/var/log/anabella/backend-error.log',
      out_file:   '/var/log/anabella/backend-out.log',
    },

    // ── NUEVOS ─────────────────────────────────────────────────────────
    {
      name: 'ai-worker',
      script: './backend/workers/ai-worker.js',
      cwd: '/var/www/anabella',
      instances: 1,
      exec_mode: 'fork',
      env: { NODE_ENV: 'production' },
      error_file: '/var/log/anabella/ai-worker-error.log',
      out_file:   '/var/log/anabella/ai-worker-out.log',
    },
    {
      name: 'metrics-worker',
      script: './backend/workers/metrics-worker.js',
      cwd: '/var/www/anabella',
      instances: 1,
      exec_mode: 'fork',
      env: { NODE_ENV: 'production' },
      cron_restart: '0 */2 * * *', // Reinicio cada 2 horas como safety net
    },
    {
      name: 'scheduler-worker',
      script: './backend/workers/scheduler-worker.js',
      cwd: '/var/www/anabella',
      instances: 1,          // SIEMPRE 1 — evita schedulers duplicados
      exec_mode: 'fork',
      env: { NODE_ENV: 'production' },
    },
  ],
};
```

**Migración de Schedulers (soluciona problema crítico existente):**

```javascript
// backend/workers/scheduler-worker.js
// Mueve initAutomationScheduler, initReportScheduler, initRewardsScheduler
// FUERA del proceso del API → evita duplicación en escala horizontal

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
require('../db');

const { initReportScheduler }       = require('../services/reportScheduler');
const { initAutomationScheduler }   = require('../services/automationScheduler');
const { initRewardsScheduler }      = require('../services/rewardsScheduler');
const { initTaskAutomationScheduler } = require('../services/taskAutomationService');

console.log('[SchedulerWorker] Starting...');
initReportScheduler();
initAutomationScheduler();
initRewardsScheduler();
initTaskAutomationScheduler();
console.log('[SchedulerWorker] All schedulers initialized');

// Mantener proceso vivo
process.on('SIGTERM', () => { console.log('[SchedulerWorker] Graceful shutdown'); process.exit(0); });
```

> **NOTA:** Una vez habilitado `scheduler-worker`, remover las 4 llamadas `initXxxScheduler()` de `server.js` para evitar doble ejecución.

---

## 10. VARIABLES DE ENTORNO NUEVAS

```bash
# .env — agregar a las existentes

# ── AI Providers ────────────────────────────────────────────────────────
# Clave maestra para encriptar API keys de OpenAI/Anthropic en MongoDB
# Generar: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
AI_ENCRYPTION_KEY=

# ── Redis (opcional) ────────────────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ── Meta Ads ────────────────────────────────────────────────────────────
# Solo esta clave en .env — credenciales Meta se configuran desde ERP → Integraciones
META_ENCRYPTION_KEY=

# ── Socket.IO ───────────────────────────────────────────────────────────
# Usar el JWT_SECRET existente — no se necesita uno nuevo
```

---

## 11. CONFIGURACIÓN DESDE ERP (GlobalConfig)

La estructura de configuración AI en MongoDB (key: `'ai_provider_config'`):

```json
{
  "key": "ai_provider_config",
  "value": {
    "defaultProvider": "openai",
    "fallbackProvider": "anthropic",
    "openai": {
      "enabled": true,
      "apiKeyEncrypted": "<AES-256-GCM encrypted>",
      "model": "gpt-4o",
      "temperature": 0.3,
      "maxTokens": 4096,
      "monthlyBudgetUSD": 100
    },
    "anthropic": {
      "enabled": true,
      "apiKeyEncrypted": "<AES-256-GCM encrypted>",
      "model": "claude-3-5-sonnet-20241022",
      "temperature": 0.3,
      "maxTokens": 4096
    }
  }
}
```

Endpoint admin: `PUT /admin/config/ai-providers` (nuevo, dentro del router `/admin/config` existente).

---

## 12. FRONTEND — COMPONENTES SYNCFUSION-COMPATIBLE

### Estrategia UI

- **No reemplazar Syncfusion** — los nuevos componentes AI usan inline styles y React puro
- **Sin dependencias nuevas** — solo React Icons (ya instalado) y Socket.IO client
- **Mismos patrones** de servicios, hooks y routing que el resto del codebase

### Componentes nuevos

| Componente | Descripción |
|------------|-------------|
| `AICopilotChat.jsx` | Chat conversacional estilo ChatGPT. Input + historial + streaming |
| `AIMessageBubble.jsx` | Burbuja de mensaje (user/assistant/tool) |
| `AIToolApproval.jsx` | Panel de aprobación de acción AI (aparece antes de ejecutar) |
| `AIStreamingText.jsx` | Texto con cursor parpadeante mientras llega el stream |
| `CampaignCard.jsx` | Card de campaña Meta con métricas inline |
| `MetricWidget.jsx` | Widget KPI (ROAS, CTR, CPL, etc.) con trend indicator |
| `RecommendationCard.jsx` | Card de recomendación AI con botones Aceptar/Rechazar |

### Hook principal: `useAIChat.js`

```javascript
// admin/src/hooks/useAIChat.js
import { useState, useEffect, useCallback } from 'react';
import aiService from '../services/aiService';
import { useSocket } from './useSocket';

export function useAIChat(conversationId) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [streamingContent, setStreamingContent] = useState('');
  const { socket } = useSocket();

  // Cargar historial inicial
  useEffect(() => {
    if (!conversationId) return;
    aiService.getMessages(conversationId).then(setMessages);
  }, [conversationId]);

  // Escuchar eventos Socket.IO
  useEffect(() => {
    if (!socket) return;

    socket.on('ai:approval_required', (data) => {
      setPendingApprovals(prev => [...prev, data]);
    });

    socket.on('ai:tool_result', ({ executionId, result, success }) => {
      setPendingApprovals(prev => prev.filter(a => a.executionId !== executionId));
      // Recargar mensajes para obtener resultado
      aiService.getMessages(conversationId).then(setMessages);
    });

    socket.on('ai:streaming_token', ({ token, isComplete }) => {
      if (isComplete) {
        setStreamingContent('');
        aiService.getMessages(conversationId).then(setMessages);
      } else {
        setStreamingContent(prev => prev + token);
      }
    });

    return () => {
      socket.off('ai:approval_required');
      socket.off('ai:tool_result');
      socket.off('ai:streaming_token');
    };
  }, [socket, conversationId]);

  const sendMessage = useCallback(async (content) => {
    setIsLoading(true);
    // Mensaje optimista
    const tempMsg = { tempId: Date.now(), role: 'user', content, createdAt: new Date() };
    setMessages(prev => [...prev, tempMsg]);

    try {
      const result = await aiService.sendMessage(conversationId, content);
      // Reemplazar mensaje temporal con real
      aiService.getMessages(conversationId).then(setMessages);
      return result;
    } catch (err) {
      setMessages(prev => prev.filter(m => m.tempId !== tempMsg.tempId));
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  const approveAction = useCallback(async (executionId) => {
    if (socket) {
      socket.emit('ai:approve_tool', { executionId });
    } else {
      await aiService.approveTool(executionId);
    }
    setPendingApprovals(prev => prev.filter(a => a.executionId !== executionId));
  }, [socket]);

  const rejectAction = useCallback(async (executionId, reason) => {
    if (socket) {
      socket.emit('ai:reject_tool', { executionId, reason });
    } else {
      await aiService.rejectTool(executionId, reason);
    }
    setPendingApprovals(prev => prev.filter(a => a.executionId !== executionId));
  }, [socket]);

  return { messages, isLoading, pendingApprovals, streamingContent, sendMessage, approveAction, rejectAction };
}
```

### Servicio API: `aiService.js`

```javascript
// admin/src/services/aiService.js
import api from '../config/api'; // Instancia axios existente

const aiService = {
  // Conversaciones
  listConversations:  ()     => api.get('/marketing-ai/conversations').then(r => r.data),
  createConversation: (data) => api.post('/marketing-ai/conversations', data).then(r => r.data),
  getMessages:        (id)   => api.get(`/marketing-ai/conversations/${id}/messages`).then(r => r.data),
  sendMessage:        (id, message) => api.post(`/marketing-ai/conversations/${id}/messages`, { message }).then(r => r.data),

  // Tool approval (fallback sin Socket.IO)
  approveTool: (executionId) => api.post(`/marketing-ai/tools/${executionId}/approve`).then(r => r.data),
  rejectTool:  (executionId, reason) => api.post(`/marketing-ai/tools/${executionId}/reject`, { reason }).then(r => r.data),

  // Campañas
  getCampaigns:       (params) => api.get('/marketing-ai/campaigns', { params }).then(r => r.data),
  getCampaignMetrics: (id, dateRange) => api.get(`/marketing-ai/metrics/${id}`, { params: { dateRange } }).then(r => r.data),

  // Recomendaciones
  getRecommendations: (params) => api.get('/marketing-ai/recommendations', { params }).then(r => r.data),
  resolveRecommendation: (id, resolution) => api.patch(`/marketing-ai/recommendations/${id}`, { resolution }).then(r => r.data),

  // Providers (solo admin)
  getProviderConfig:  ()     => api.get('/admin/config/ai-providers').then(r => r.data),
  saveProviderConfig: (data) => api.put('/admin/config/ai-providers', data).then(r => r.data),
  checkProviderHealth: ()    => api.get('/admin/config/ai-providers/health').then(r => r.data),
};

export default aiService;
```

### Routing — agregar a App.js (admin y agents)

```javascript
// admin/src/App.js — agregar dentro del Router existente:
import MarketingAI      from './pages/MarketingAI';
import AIProviders      from './pages/AIProviders';
import CampaignMetrics  from './pages/CampaignMetrics';

// Dentro de <Routes>:
<Route path="/marketing-ai"      element={<MarketingAI />} />
<Route path="/ai-providers"      element={<AIProviders />} />   {/* Solo admin */}
<Route path="/campaign-metrics"  element={<CampaignMetrics />} />

// agents/src/App.js — agregar:
import MarketingAI from './pages/MarketingAI';
<Route path="/crm/marketing-ai" element={<MarketingAI />} />
```

---

## 13. META ADS — CONFIGURACIÓN DESDE ERP

Configuración almacenada en `GlobalConfig key: 'meta_ads_credentials'`:

```json
{
  "key": "meta_ads_credentials",
  "value": {
    "accessTokenEncrypted": "<AES-256-GCM>",
    "adAccountId": "act_123456789",
    "pixelId": "987654321",
    "appId": "111111111",
    "appSecretEncrypted": "<AES-256-GCM>"
  }
}
```

Endpoint admin: `GET/PUT/DELETE /admin/config/meta-ads` — mismo patrón que `/admin/config/google-oauth`.

Integración futura Google Ads / TikTok: mismos stubs en `services/ai/integrations/` con mismo patrón de configuración GlobalConfig.

---

## 14. MÉTRICAS KPI — ARQUITECTURA

### Aggregation pipeline para dashboard

```javascript
// KPIs del período (ejemplo 30 días)
db.campaign_metrics.aggregate([
  { $match: { agenteId, date: { $gte: startDate, $lte: endDate } } },
  { $group: {
    _id: '$campaignId',
    totalSpend:       { $sum: '$spend' },
    totalImpressions: { $sum: '$impressions' },
    totalClicks:      { $sum: '$clicks' },
    totalLeads:       { $sum: '$leads' },
    totalRevenue:     { $sum: '$revenue' },
    avgCTR:           { $avg: '$ctr' },
    avgCPC:           { $avg: '$cpc' },
  }},
  { $addFields: {
    roas:  { $cond: [{ $gt: ['$totalSpend', 0] }, { $divide: ['$totalRevenue', '$totalSpend'] }, 0] },
    cpl:   { $cond: [{ $gt: ['$totalLeads', 0] }, { $divide: ['$totalSpend', '$totalLeads'] }, 0] },
  }},
  { $sort: { totalSpend: -1 } }
])
```

### Detección de anomalías (scheduler diario)

```javascript
// metrics-worker.js — lógica de detección
// Si CTR cae >30% respecto a media últimos 7 días → generar MarketingRecommendation tipo 'anomaly_alert'
// Si ROAS < 1.5 por 3 días consecutivos → alerta 'budget_optimization'
// Si frecuencia > 3.5 → alerta 'creative_refresh'
```

---

## 15. ROADMAP DE IMPLEMENTACIÓN

### Fase 0 — Infraestructura (Semana 1-2)
- [ ] Crear `redis.js` con degradación elegante
- [ ] Crear `socket.js` con auth JWT
- [ ] Crear `middlewares/rbac.js`
- [ ] Crear `utils/eventBus.js`
- [ ] Agregar socket.io a `server.js`
- [ ] Crear `ecosystem.config.js` con workers
- [ ] Agregar `scheduler-worker.js` → mover schedulers fuera del API
- [ ] Actualizar nginx con WebSocket proxy
- [ ] Agregar variables de entorno: `AI_ENCRYPTION_KEY`, `REDIS_URL`, `META_ENCRYPTION_KEY`

### Fase 1 — Modelos MongoDB (Semana 2-3)
- [ ] `AIConversation.js`
- [ ] `AIMessage.js`
- [ ] `AIToolExecution.js`
- [ ] `AIProvider.js`
- [ ] `AIUsageLog.js`
- [ ] `MarketingCampaign.js`
- [ ] `CampaignMetrics.js`
- [ ] `MarketingRecommendation.js`

### Fase 2 — Backend AI Core (Semana 3-5)
- [ ] `services/ai/providerAbstraction.js`
- [ ] `services/ai/toolRegistry.js`
- [ ] `services/ai/toolValidator.js`
- [ ] `services/ai/toolExecutor.js`
- [ ] `services/ai/orchestrator.js`
- [ ] `services/ai/contextManager.js`
- [ ] `services/ai/auditLogger.js`
- [ ] `routes/marketing-ai/` (conversations, campaigns, metrics, recommendations)
- [ ] Registrar `/marketing-ai` en `server.js`

### Fase 3 — Integraciones (Semana 5-7)
- [ ] `services/ai/integrations/metaAds.js`
- [ ] Endpoint admin `PUT /admin/config/meta-ads`
- [ ] Endpoint admin `PUT /admin/config/ai-providers`
- [ ] `metrics-worker.js` — sync periódico métricas
- [ ] `services/ai/recommendationService.js`

### Fase 4 — Frontend (Semana 7-10)
- [ ] `services/aiService.js`
- [ ] `services/socketService.js`
- [ ] `hooks/useSocket.js`
- [ ] `hooks/useAIChat.js`
- [ ] `hooks/useMarketingMetrics.js`
- [ ] `components/ai/AICopilotChat.jsx`
- [ ] `components/ai/AIMessageBubble.jsx`
- [ ] `components/ai/AIToolApproval.jsx`
- [ ] `components/ai/MetricWidget.jsx`
- [ ] `components/ai/CampaignCard.jsx`
- [ ] `components/ai/RecommendationCard.jsx`
- [ ] `pages/MarketingAI.jsx` (admin + agents)
- [ ] `pages/AIProviders.jsx` (admin)
- [ ] `pages/CampaignMetrics.jsx` (admin + agents)
- [ ] Routing en `App.js` (admin y agents)
- [ ] Sidebar entries (admin y agents)

### Fase 5 — QA y producción (Semana 10-12)
- [ ] Tests unitarios: toolValidator, providerAbstraction, RBAC middleware
- [ ] Tests de integración: conversación completa, approval flow
- [ ] Build verification: `npx craco build` en admin/ y agents/
- [ ] Deploy con `ecosystem.config.js` actualizado
- [ ] Monitoreo: logs PM2, alertas Redis, health checks providers
- [ ] Documentación de operación

---

## 16. PROBLEMAS CRÍTICOS EXISTENTES — PLAN DE RESOLUCIÓN INCREMENTAL

| Problema | Solución propuesta | Fase |
|----------|-------------------|------|
| Schedulers en proceso API | `scheduler-worker.js` separado (PM2) | 0 |
| Permisos duplicados (agentScopeId) | `middlewares/rbac.js` centralizado | 0 |
| Errores silenciosos en integraciones | `eventBus.emit('integration.error')` + SecurityEvent | 2 |
| JWT fields inconsistentes | Documentar en RBAC middleware; NO romper JWT existente | 0 |
| Mensajería fragmentada | Backlog Ticket 1.1 — no bloquea módulo AI | Post-Fase 5 |
| Modelo identidad User/Agente | Backlog Ticket 0.2 — migración gradual futura | Post-Fase 5 |

---

## 17. ESTÁNDARES DE CÓDIGO

```
1. Nomenclatura
   - Models: PascalCase, singular (AIConversation, MarketingCampaign)
   - Routes: kebab-case, plural (/marketing-ai/conversations)
   - Services: camelCase, descriptivos (providerAbstraction, toolExecutor)
   - React components: PascalCase (AICopilotChat, MetricWidget)
   - Hooks: use + PascalCase (useAIChat, useMarketingMetrics)

2. Estructura de archivos por feature
   - Un archivo por responsabilidad
   - No archivos >400 líneas (splitear si supera)

3. Error handling
   - NUNCA silenciar errores de integraciones AI/Meta
   - Usar console.error + SecurityEvent/eventBus.emit para todas las fallas
   - Respuestas de error consistentes: { error: string, code?: string }

4. Imports
   - Siempre al top del archivo (regla ESLint existente)
   - require() para backend, import para frontend React

5. Compatibilidad ESLint
   - Antes de cada push: npx craco build en admin/ y agents/
   - no-unused-vars es ERROR — verificar antes de commit

6. Metadata enriquecida (regla existente)
   - AIToolExecution debe incluir userId, agenteId, sessionId, ipAddress
   - CampaignMetrics debe incluir agenteId, inmobiliariaId, externalId
```

---

*Documento generado automáticamente para el equipo de Anabella Luna.*
*Versión: 1.0 — Mayo 2026*
*Estado: ARQUITECTURA — Pendiente de implementación*
