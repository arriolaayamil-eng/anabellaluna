const express = require('express');
const { authenticateToken } = require('../auth');
const Propiedad = require('../models/Propiedad');
const ml = require('../services/mercadoLibre');

const router = express.Router();

// ── Admin-only guard ──────────────────────────────────────────────────────────

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  return next();
}

// ── CRUD credentials ──────────────────────────────────────────────────────────

// GET /admin/ml/config — returns masked credential status
router.get('/config', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const status = await ml.getConnectionStatus();
    const creds = await ml.loadMLCredentials();
    res.json({
      hasCredentials: status.hasCredentials,
      isAuthenticated: status.isAuthenticated,
      userId: status.userId,
      expiresAt: status.expiresAt,
      // Return masked values so the UI can show placeholders
      clientId: creds ? creds.clientId : '',
      redirectUri: creds ? creds.redirectUri : '',
      webhookUrl: creds ? creds.webhookUrl : '',
      // Never return the actual secret
      clientSecret: (creds && creds.clientSecret) ? '••••••••' : '',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /admin/ml/config — save encrypted credentials
router.put('/config', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { clientId, clientSecret, redirectUri, webhookUrl } = req.body || {};
    if (!clientId || !clientSecret || !redirectUri) {
      return res.status(400).json({ error: 'clientId, clientSecret y redirectUri son requeridos' });
    }
    await ml.saveMLCredentials({ clientId, clientSecret, redirectUri, webhookUrl: webhookUrl || '' });
    res.json({ ok: true, message: 'Credenciales guardadas correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /admin/ml/config — remove all ML config and token
router.delete('/config', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await ml.deleteMLCredentials();
    const GlobalConfig = require('../models/GlobalConfig');
    await GlobalConfig.deleteOne({ key: 'mercadolibre_token' });
    res.json({ ok: true, message: 'Credenciales e token eliminados' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── OAuth flow ────────────────────────────────────────────────────────────────

// GET /admin/ml/auth — redirect to ML authorization URL
router.get('/auth', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const url = await ml.buildAuthUrl();
    res.redirect(url);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/ml/callback — ML redirects here with ?code=
router.get('/callback', async (req, res) => {
  const { code, error } = req.query;
  if (error) {
    console.error('[ML] OAuth error:', error);
    return res.redirect('/integraciones?ml=error');
  }
  if (!code) {
    return res.status(400).json({ error: 'Missing authorization code' });
  }
  try {
    await ml.exchangeCodeForToken(code);
    console.log('[ML] OAuth token exchange successful');
    return res.redirect('/integraciones?ml=connected');
  } catch (err) {
    console.error('[ML] Token exchange error:', err.message);
    return res.redirect('/integraciones?ml=error');
  }
});

// POST /admin/ml/disconnect — revoke token only (keep credentials)
router.post('/disconnect', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const GlobalConfig = require('../models/GlobalConfig');
    await GlobalConfig.deleteOne({ key: 'mercadolibre_token' });
    res.json({ ok: true, message: 'Desconectado de Mercado Libre' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Per-property controls (admin only) ───────────────────────────────────────

// PATCH /admin/ml/propiedades/:id/estrellas — set mlEstrellas (0-5)
router.patch('/propiedades/:id/estrellas', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const estrellas = Number(req.body.estrellas);
    if (!Number.isFinite(estrellas) || estrellas < 0 || estrellas > 5) {
      return res.status(400).json({ error: 'estrellas debe ser un número entre 0 y 5' });
    }
    const prop = await Propiedad.findByIdAndUpdate(
      req.params.id,
      { mlEstrellas: estrellas },
      { new: true }
    );
    if (!prop) return res.status(404).json({ error: 'Propiedad no encontrada' });

    // If already published on ML, update listing type immediately
    if (prop.published && prop.ml && prop.ml.itemId) {
      try {
        await ml.mlRequest('PUT', `/items/${prop.ml.itemId}`, {
          listing_type_id: ml.listingTypeFromEstrellas(estrellas),
        });
      } catch (mlErr) {
        console.warn(`[ML] Could not update listing_type_id for ${prop.ml.itemId}:`, mlErr.message);
      }
    }

    res.json({ ok: true, mlEstrellas: prop.mlEstrellas, listingType: ml.listingTypeFromEstrellas(estrellas) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /admin/ml/propiedades/:id/sync — manual sync (admin override)
router.post('/propiedades/:id/sync', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const prop = await Propiedad.findById(req.params.id);
    if (!prop) return res.status(404).json({ error: 'Propiedad no encontrada' });

    const result = await ml.syncPropertyToML(prop);

    // Persist ML state back to the property
    if (result.ok && result.itemId) {
      prop.ml = {
        itemId: result.itemId,
        status: result.status || (prop.published ? 'active' : 'paused'),
        permalink: result.permalink || (prop.ml && prop.ml.permalink) || '',
        lastSyncAt: new Date().toISOString(),
        lastError: null,
      };
      await prop.save();
    } else if (!result.ok) {
      prop.ml = Object.assign({}, prop.ml || {}, {
        lastSyncAt: new Date().toISOString(),
        lastError: result.error || 'Unknown error',
      });
      await prop.save();
    }

    res.json({ ok: result.ok, action: result.action, ml: prop.ml, error: result.error || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /admin/ml/propiedades/:id — get ML publication status for a property
router.get('/propiedades/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const prop = await Propiedad.findById(req.params.id).select('title published mlEstrellas ml').lean();
    if (!prop) return res.status(404).json({ error: 'Propiedad no encontrada' });
    res.json({
      _id: prop._id,
      title: prop.title,
      published: prop.published,
      mlEstrellas: prop.mlEstrellas || 0,
      listingType: ml.listingTypeFromEstrellas(prop.mlEstrellas || 0),
      ml: prop.ml || null,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Webhook ───────────────────────────────────────────────────────────────────
// ML sends POST notifications to WEBHOOK_URL. No auth required — ML signs with x-signature.
// Conservative: just log and return 200. Future: verify signature, process updates.

router.post('/webhook', async (req, res) => {
  try {
    const body = req.body || {};
    const topic = body.topic || req.query.topic || '';
    const resource = body.resource || req.query.resource || '';

    console.log(`[ML Webhook] topic=${topic} resource=${resource}`);

    // If it's an item notification, try to update our DB record
    if ((topic === 'items' || topic === 'item') && resource) {
      // resource is like "/items/MLA123456"
      const itemId = resource.replace('/items/', '').split('/')[0];
      if (itemId) {
        setImmediate(async () => {
          try {
            const prop = await Propiedad.findOne({ 'ml.itemId': itemId });
            if (prop) {
              const accessToken = await ml.getValidAccessToken().catch(() => null);
              if (accessToken) {
                const itemRes = await fetch(`https://api.mercadolibre.com/items/${itemId}`, {
                  headers: { Authorization: `Bearer ${accessToken}` },
                });
                if (itemRes.ok) {
                  const item = await itemRes.json();
                  prop.ml = Object.assign({}, prop.ml, {
                    status: item.status,
                    permalink: item.permalink || prop.ml.permalink,
                    lastSyncAt: new Date().toISOString(),
                    lastError: null,
                  });
                  await prop.save();
                  console.log(`[ML Webhook] Updated prop ${prop._id} status → ${item.status}`);
                }
              }
            }
          } catch (e) {
            console.error('[ML Webhook] Background update error:', e.message);
          }
        });
      }
    }

    // Always return 200 immediately
    res.json({ ok: true });
  } catch (err) {
    console.error('[ML Webhook] Error:', err.message);
    res.json({ ok: true }); // Always 200 to avoid ML retries
  }
});

module.exports = router;
