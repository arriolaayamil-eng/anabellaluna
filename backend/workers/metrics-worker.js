/**
 * Metrics Worker — sincronización periódica de métricas desde plataformas de ads.
 *
 * Responsabilidades:
 * - Sync diario de métricas Meta Ads → CampaignMetrics MongoDB
 * - Detección de anomalías (CTR drop, ROAS bajo, frecuencia alta)
 * - Generación automática de MarketingRecommendations
 *
 * PM2: name = 'metrics-worker', instances = 1
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

require('../db');

const MarketingCampaign      = require('../models/MarketingCampaign');
const CampaignMetrics        = require('../models/CampaignMetrics');
const MarketingRecommendation = require('../models/MarketingRecommendation');

const SYNC_INTERVAL_MS     = 2 * 60 * 60 * 1000; // Sync cada 2 horas
const ANOMALY_CHECK_MS     = 4 * 60 * 60 * 1000; // Anomaly detection cada 4 horas

console.log('[MetricsWorker] Starting...');

// ── Sync de métricas desde Meta Ads ───────────────────────────────────────────

async function syncMetaMetrics() {
  try {
    const GlobalConfig = require('../models/GlobalConfig');
    const creds = await GlobalConfig.getValue('meta_ads_credentials', null);
    if (!creds || !creds.accessTokenEncrypted) {
      return; // Meta Ads no configurado — skip silencioso
    }

    const campaigns = await MarketingCampaign.find({
      platform: 'meta',
      status: { $in: ['active', 'paused'] },
    }).lean();

    if (campaigns.length === 0) return;

    const metaAds = require('../services/ai/integrations/metaAds');
    let synced = 0;

    for (const campaign of campaigns) {
      try {
        await metaAds.getCampaignMetrics({
          campaignId: campaign.externalId,
          dateRange: 'today',
        });
        synced++;
      } catch (err) {
        console.error(`[MetricsWorker] Failed to sync campaign ${campaign.externalId}:`, err.message);
        await MarketingCampaign.findByIdAndUpdate(campaign._id, {
          $set: { syncStatus: 'error', lastSyncError: err.message },
        });
      }
    }

    if (synced > 0) {
      console.log(`[MetricsWorker] Synced metrics for ${synced}/${campaigns.length} campaigns`);
    }
  } catch (err) {
    console.error('[MetricsWorker] syncMetaMetrics error:', err.message);
  }
}

// ── Detección de anomalías ─────────────────────────────────────────────────────

async function detectAnomalies() {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const campaigns = await MarketingCampaign.find({ status: 'active' }).lean();

    for (const campaign of campaigns) {
      // Obtener métricas de los últimos 7 días
      const metrics = await CampaignMetrics.find({
        campaignId: campaign._id,
        date: { $gte: sevenDaysAgo },
        granularity: 'day',
      }).sort({ date: -1 }).lean();

      if (metrics.length < 2) continue;

      const latest = metrics[0];
      const previous = metrics.slice(1);
      const avgCTR = previous.reduce((s, m) => s + (m.ctr || 0), 0) / previous.length;
      const avgROAS = previous.reduce((s, m) => s + (m.roas || 0), 0) / previous.length;
      const avgFreq = previous.reduce((s, m) => s + (m.frequency || 0), 0) / previous.length;

      const recommendations = [];

      // CTR drop >30%
      if (avgCTR > 0 && latest.ctr < avgCTR * 0.7) {
        recommendations.push({
          type: 'anomaly_alert',
          priority: 'high',
          title: `CTR bajo en "${campaign.name}"`,
          body: `El CTR cayó de ${avgCTR.toFixed(2)}% a ${(latest.ctr || 0).toFixed(2)}% (>30% de caída). Revisar creativos y targeting.`,
          actions: ['Revisar creativos', 'Refrescar audiencia', 'Pausar si CTR < 0.5%'],
        });
      }

      // ROAS bajo por 3 días
      if (avgROAS > 0 && latest.roas < 1.5) {
        recommendations.push({
          type: 'budget_optimization',
          priority: 'high',
          title: `ROAS crítico en "${campaign.name}"`,
          body: `ROAS actual: ${(latest.roas || 0).toFixed(2)}x. Umbral mínimo: 1.5x. Considerar reducir presupuesto o revisar oferta.`,
          actions: ['Reducir presupuesto 20%', 'Revisar página de destino', 'Optimizar segmentación'],
        });
      }

      // Frecuencia alta (ad fatigue)
      if (latest.frequency > 3.5) {
        recommendations.push({
          type: 'creative_refresh',
          priority: 'medium',
          title: `Fatiga de creativos en "${campaign.name}"`,
          body: `Frecuencia: ${(latest.frequency || 0).toFixed(1)}x. Alta frecuencia indica que la audiencia ya vio el anuncio muchas veces. Refrescar creativos.`,
          actions: ['Crear nuevos creativos', 'Ampliar audiencia', 'Rotar copys'],
        });
      }

      // Crear recomendaciones que no existan ya
      for (const rec of recommendations) {
        const exists = await MarketingRecommendation.findOne({
          'metadata.campaignId': campaign._id.toString(),
          type: rec.type,
          status: { $in: ['pending', 'viewed'] },
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        }).lean();

        if (!exists) {
          await MarketingRecommendation.create({
            agenteId: campaign.agenteId || '',
            inmobiliariaId: campaign.inmobiliariaId || '',
            source: 'anomaly_detection',
            campaignIds: [campaign._id],
            metrics: { ctr: latest.ctr, roas: latest.roas, frequency: latest.frequency },
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            ...rec,
          });

          console.log(`[MetricsWorker] Created recommendation: ${rec.type} for campaign ${campaign.name}`);
        }
      }
    }
  } catch (err) {
    console.error('[MetricsWorker] detectAnomalies error:', err.message);
  }
}

// ── Iniciar loops ──────────────────────────────────────────────────────────────

setInterval(syncMetaMetrics, SYNC_INTERVAL_MS);
setInterval(detectAnomalies, ANOMALY_CHECK_MS);

// Primera ejecución al arrancar (con delay para que MongoDB conecte)
setTimeout(syncMetaMetrics, 15000);
setTimeout(detectAnomalies, 30000);

console.log('[MetricsWorker] Intervals started.');

process.on('SIGTERM', () => {
  console.log('[MetricsWorker] Graceful shutdown');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('[MetricsWorker] Uncaught exception:', err.message, err.stack);
});

process.on('unhandledRejection', (reason) => {
  console.error('[MetricsWorker] Unhandled rejection:', reason);
});
