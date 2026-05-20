/**
 * AI Worker — proceso PM2 dedicado para tareas AI asíncronas.
 *
 * Responsabilidades:
 * - Procesar AIToolExecutions encoladas que no requieren aprobación inmediata
 * - Health checks periódicos de providers AI
 * - Limpieza de conversaciones expiradas
 *
 * PM2: name = 'ai-worker', instances = 1
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

require('../db');

const AIToolExecution = require('../models/AIToolExecution');
const AIProvider      = require('../models/AIProvider');
const AIConversation  = require('../models/AIConversation');

const POLL_INTERVAL_MS   = 5000;   // Revisar queue cada 5 segundos
const HEALTH_CHECK_MS    = 60000;  // Health check providers cada 60 segundos
const CLEANUP_INTERVAL   = 3600000; // Limpiar conversaciones cada hora

console.log('[AIWorker] Starting...');

// ── Queue processor ────────────────────────────────────────────────────────────

async function processQueue() {
  try {
    // Buscar executions auto-aprobadas pendientes
    const pending = await AIToolExecution.find({
      status: 'pending',
      approvalStatus: 'auto_approved',
    }).limit(10).lean();

    for (const execution of pending) {
      try {
        const { executeApprovedTool } = require('../services/ai/toolExecutor');
        await executeApprovedTool(execution._id.toString(), 'ai-worker');
      } catch (err) {
        console.error(`[AIWorker] Failed to execute ${execution._id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[AIWorker] Queue processing error:', err.message);
  }
}

// ── Provider health checks ─────────────────────────────────────────────────────

async function checkProviderHealth() {
  try {
    const GlobalConfig = require('../models/GlobalConfig');
    const config = await GlobalConfig.getValue('ai_provider_config', null);
    if (!config) return;

    const providers = ['openai', 'anthropic'].filter(
      (p) => config[p] && config[p].enabled && config[p].apiKey
    );

    for (const providerName of providers) {
      try {
        // Ping rápido con prompt mínimo
        const { chatCompletion } = require('../services/ai/providerAbstraction');
        await chatCompletion({
          messages: [{ role: 'user', content: 'ping' }],
          userId: 'health-check',
          provider: providerName,
          maxTokens: 5,
        });

        await AIProvider.findOneAndUpdate(
          { name: providerName },
          {
            $set: {
              healthStatus: 'healthy',
              lastHealthCheck: new Date(),
              consecutiveErrors: 0,
            },
          },
          { upsert: true }
        );
        console.log(`[AIWorker] Health check OK: ${providerName}`);
      } catch (err) {
        await AIProvider.findOneAndUpdate(
          { name: providerName },
          {
            $set: { healthStatus: 'degraded', lastHealthCheck: new Date() },
            $inc: { consecutiveErrors: 1 },
          },
          { upsert: true }
        );
        console.warn(`[AIWorker] Health check FAILED: ${providerName} — ${err.message}`);
      }
    }
  } catch (err) {
    console.error('[AIWorker] Health check error:', err.message);
  }
}

// ── Cleanup de conversaciones viejas ──────────────────────────────────────────

async function cleanupOldConversations() {
  try {
    const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 días
    const result = await AIConversation.updateMany(
      { lastMessageAt: { $lt: cutoff }, status: 'active' },
      { $set: { status: 'archived' } }
    );
    if (result.modifiedCount > 0) {
      console.log(`[AIWorker] Archived ${result.modifiedCount} old conversations`);
    }
  } catch (err) {
    console.error('[AIWorker] Cleanup error:', err.message);
  }
}

// ── Iniciar loops ──────────────────────────────────────────────────────────────

setInterval(processQueue, POLL_INTERVAL_MS);
setInterval(checkProviderHealth, HEALTH_CHECK_MS);
setInterval(cleanupOldConversations, CLEANUP_INTERVAL);

// Ejecutar inmediatamente al arrancar
setTimeout(checkProviderHealth, 10000);

console.log('[AIWorker] All intervals started.');

process.on('SIGTERM', () => {
  console.log('[AIWorker] Graceful shutdown');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('[AIWorker] Uncaught exception:', err.message, err.stack);
});

process.on('unhandledRejection', (reason) => {
  console.error('[AIWorker] Unhandled rejection:', reason);
});
