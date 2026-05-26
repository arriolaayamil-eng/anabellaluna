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

    const orEnvValid = !!(process.env.OPENROUTER_API_KEY);

    const safeConfig = {
      defaultProvider: 'openrouter',
      openrouter: {
        enabled:   true,
        hasKey:    !!(config.openrouter && config.openrouter.apiKeyEncrypted) || orEnvValid,
        keySource: (config.openrouter && config.openrouter.apiKeyEncrypted) ? 'db' : (orEnvValid ? 'env' : 'none'),
        model:     (config.openrouter && config.openrouter.model)     || process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini',
        maxTokens: (config.openrouter && config.openrouter.maxTokens) || 4096,
        stats:     statsMap['openrouter'] || null,
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
    const { openrouter } = req.body;
    const userId = String(req.user.sub || req.user.id || req.user._id || '');

    const existing = await GlobalConfig.getValue('ai_provider_config', {});
    const update   = { ...existing, defaultProvider: 'openrouter' };

    if (openrouter) {
      const prev = existing.openrouter || {};
      update.openrouter = {
        ...prev,
        enabled:   true,
        model:     openrouter.model     || prev.model     || 'openai/gpt-4o-mini',
        maxTokens: openrouter.maxTokens || prev.maxTokens || 4096,
      };
      if (openrouter.apiKey && openrouter.apiKey.trim()) {
        update.openrouter.apiKeyEncrypted = encrypt(openrouter.apiKey.trim());
      } else if (prev.apiKeyEncrypted) {
        update.openrouter.apiKeyEncrypted = prev.apiKeyEncrypted;
      }
    }

    await GlobalConfig.setValue('ai_provider_config', update, 'AI provider config', userId);
    invalidateCache();

    res.json({ success: true, message: 'OpenRouter config updated' });
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
