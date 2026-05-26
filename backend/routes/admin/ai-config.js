/**
 * Admin AI Config — Gestión de providers AI y Meta Ads desde ERP.
 * Mismo patrón que routes/globalConfig.js.
 * Prefix: /admin/config/ai
 */

const express = require('express');
const router  = express.Router();

const { authenticateToken }  = require('../../auth');
const { requireAdmin }       = require('../../middlewares/rbac');
const GlobalConfig           = require('../../models/GlobalConfig');
const AIProvider             = require('../../models/AIProvider');
const AIUsageLog             = require('../../models/AIUsageLog');
const { encrypt, invalidateCache } = require('../../services/ai/providerAbstraction');

// Todos los endpoints requieren auth + admin
router.use(authenticateToken, requireAdmin);

// ── AI Providers ──────────────────────────────────────────────────────────────

// GET /admin/config/ai/providers
router.get('/providers', async (req, res) => {
  try {
    const config = await GlobalConfig.getValue('ai_provider_config', {});
    const providerStats = await AIProvider.find({}).lean();

    const statsMap = {};
    providerStats.forEach((p) => { statsMap[p.name] = p; });

    const geminiEnvValid = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.startsWith('AIza') && process.env.GEMINI_API_KEY.length > 20;

    const safeConfig = {
      defaultProvider:  config.defaultProvider  || 'openai',
      fallbackProvider: config.fallbackProvider || '',
      openai: {
        enabled:         !!(config.openai && config.openai.enabled),
        hasKey:          !!(config.openai && config.openai.apiKeyEncrypted),
        model:           (config.openai && config.openai.model)       || 'gpt-4o',
        maxTokens:       (config.openai && config.openai.maxTokens)   || 4096,
        temperature:     (config.openai && config.openai.temperature) ?? 0.3,
        stats:           statsMap['openai'] || null,
      },
      anthropic: {
        enabled:         !!(config.anthropic && config.anthropic.enabled),
        hasKey:          !!(config.anthropic && config.anthropic.apiKeyEncrypted),
        model:           (config.anthropic && config.anthropic.model)       || 'claude-sonnet-4-20250514',
        maxTokens:       (config.anthropic && config.anthropic.maxTokens)   || 4096,
        temperature:     (config.anthropic && config.anthropic.temperature) ?? 0.3,
        stats:           statsMap['anthropic'] || null,
      },
      gemini: {
        enabled:         config.gemini ? config.gemini.enabled !== false : !!geminiEnvValid,
        hasKey:          !!(config.gemini && config.gemini.apiKeyEncrypted) || !!geminiEnvValid,
        keySource:       (config.gemini && config.gemini.apiKeyEncrypted) ? 'db' : (geminiEnvValid ? 'env' : 'none'),
        model:           (config.gemini && config.gemini.model)       || 'gemini-2.0-flash',
        maxTokens:       (config.gemini && config.gemini.maxTokens)   || 4096,
        temperature:     (config.gemini && config.gemini.temperature) ?? 0.3,
        stats:           statsMap['gemini'] || null,
      },
      openclaw: {
        enabled:         !!(config.openclaw && config.openclaw.enabled),
        baseUrl:         (config.openclaw && config.openclaw.baseUrl) || process.env.OPENCLAW_BASE_URL || '',
        hasToken:        !!(config.openclaw && config.openclaw.apiKeyEncrypted) || !!(process.env.OPENCLAW_TOKEN),
        tokenSource:     (config.openclaw && config.openclaw.apiKeyEncrypted) ? 'db' : (process.env.OPENCLAW_TOKEN ? 'env' : 'none'),
        model:           (config.openclaw && config.openclaw.model)       || 'openclaw',
        maxTokens:       (config.openclaw && config.openclaw.maxTokens)   || 4096,
        temperature:     (config.openclaw && config.openclaw.temperature) ?? 0.3,
        stats:           statsMap['openclaw'] || null,
      },
    };

    res.json(safeConfig);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /admin/config/ai/providers
router.put('/providers', async (req, res) => {
  try {
    const { defaultProvider, fallbackProvider, openai, anthropic, gemini, openclaw } = req.body;
    const userId = String(req.user.sub || req.user.id || req.user._id || '');

    const existing = await GlobalConfig.getValue('ai_provider_config', {});
    const update = { ...existing };

    // SIEMPRE guardar defaultProvider y fallbackProvider del request
    update.defaultProvider  = defaultProvider  || existing.defaultProvider  || 'openai';
    update.fallbackProvider = fallbackProvider || existing.fallbackProvider || '';

    // Helper para actualizar un provider
    const updateProvider = (name, incoming, defaults) => {
      if (!incoming) return;
      const prev = existing[name] || {};
      update[name] = {
        ...prev,
        enabled:     incoming.enabled     !== undefined ? incoming.enabled     : (prev.enabled || false),
        model:       incoming.model       || prev.model       || defaults.model,
        maxTokens:   incoming.maxTokens   || prev.maxTokens   || 4096,
        temperature: incoming.temperature ?? prev.temperature ?? 0.3,
      };
      // Solo sobreescribir key si se envió una nueva
      if (incoming.apiKey && incoming.apiKey.trim()) {
        update[name].apiKeyEncrypted = encrypt(incoming.apiKey.trim());
      } else if (prev.apiKeyEncrypted) {
        // Conservar key existente
        update[name].apiKeyEncrypted = prev.apiKeyEncrypted;
      }
    };

    updateProvider('openai',    openai,    { model: 'gpt-4o' });
    updateProvider('anthropic', anthropic, { model: 'claude-3-5-sonnet-20241022' });
    updateProvider('gemini',    gemini,    { model: 'gemini-2.0-flash' });

    // OpenClaw: baseUrl stored in plain (not sensitive), token optionally encrypted
    if (openclaw) {
      const prev = existing.openclaw || {};
      update.openclaw = {
        ...prev,
        enabled:     openclaw.enabled !== undefined ? openclaw.enabled : (prev.enabled || false),
        model:       openclaw.model       || prev.model       || 'openclaw',
        maxTokens:   openclaw.maxTokens   || prev.maxTokens   || 4096,
        temperature: openclaw.temperature ?? prev.temperature ?? 0.3,
        baseUrl:     openclaw.baseUrl     || prev.baseUrl     || '',
      };
      if (openclaw.token && openclaw.token.trim()) {
        update.openclaw.apiKeyEncrypted = encrypt(openclaw.token.trim());
      } else if (prev.apiKeyEncrypted) {
        update.openclaw.apiKeyEncrypted = prev.apiKeyEncrypted;
      }
    }

    await GlobalConfig.setValue('ai_provider_config', update, 'AI provider config', userId);
    invalidateCache();

    res.json({ success: true, message: 'AI provider config updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Meta Ads Config ───────────────────────────────────────────────────────────

// GET /admin/config/ai/meta-ads
router.get('/meta-ads', async (req, res) => {
  try {
    const config = await GlobalConfig.getValue('meta_ads_credentials', null);
    res.json({
      configured:  !!(config && config.accessTokenEncrypted),
      adAccountId: config?.adAccountId || '',
      appId:       config?.appId       || '',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /admin/config/ai/meta-ads
router.put('/meta-ads', async (req, res) => {
  try {
    const { accessToken, adAccountId, appId } = req.body;
    const userId = String(req.user.sub || req.user.id || req.user._id || '');

    if (!accessToken || !adAccountId) {
      return res.status(400).json({ error: 'accessToken and adAccountId are required' });
    }

    const crypto = require('crypto');
    const rawKey = process.env.META_ENCRYPTION_KEY || process.env.AI_ENCRYPTION_KEY;
    if (!rawKey) return res.status(500).json({ error: 'META_ENCRYPTION_KEY not configured in .env' });

    const key = Buffer.from(rawKey.padEnd(64, '0').substring(0, 64), 'hex');
    const iv  = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let enc = cipher.update(accessToken, 'utf8', 'hex');
    enc += cipher.final('hex');
    const tag = cipher.getAuthTag();
    const accessTokenEncrypted = `${iv.toString('hex')}:${tag.toString('hex')}:${enc}`;

    await GlobalConfig.setValue(
      'meta_ads_credentials',
      { accessTokenEncrypted, adAccountId, appId: appId || '' },
      'Meta Ads credentials',
      userId
    );

    res.json({ success: true, message: 'Meta Ads credentials saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /admin/config/ai/meta-ads
router.delete('/meta-ads', async (req, res) => {
  try {
    await GlobalConfig.deleteOne({ key: 'meta_ads_credentials' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Usage Stats ───────────────────────────────────────────────────────────────

// GET /admin/config/ai/usage — Estadísticas de uso AI (últimos 30 días)
router.get('/usage', async (req, res) => {
  try {
    const days  = parseInt(req.query.days || '30', 10);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const pipeline = [
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id:            '$provider',
          totalTokens:    { $sum: '$totalTokens' },
          totalCost:      { $sum: '$costUSD' },
          totalRequests:  { $sum: 1 },
          successCount:   { $sum: { $cond: ['$success', 1, 0] } },
          failureCount:   { $sum: { $cond: ['$success', 0, 1] } },
          avgLatency:     { $avg: '$latencyMs' },
        },
      },
    ];

    const stats = await AIUsageLog.aggregate(pipeline);
    res.json({ period: `${days}d`, providers: stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
