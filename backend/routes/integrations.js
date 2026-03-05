const express = require('express');

const Agente = require('../models/Agente');
const { authenticateToken, agentScopeId, requireCRMUser } = require('../auth');
const googleCalendar = require('../services/googleCalendar');

const router = express.Router();

function normalizeGoogleCalendar(meta) {
  const m = meta && meta.googleCalendar ? meta.googleCalendar : {};
  return {
    connected: !!m.refreshToken,
    email: m.email || '',
    calendarId: m.calendarId || 'primary',
  };
}

// ============ OAUTH CREDENTIALS MANAGEMENT (per-agent) ============

// Get OAuth credentials status (does NOT return the secret)
router.get('/google-calendar/credentials', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const agentId = scopeId || (req.query && req.query.agentId ? String(req.query.agentId) : '');
    if (!agentId) return res.status(400).json({ error: 'agentId required' });

    const agent = await Agente.findById(agentId).lean();
    if (!agent) return res.status(404).json({ error: 'Not found' });

    const oauth = agent.metadata?.googleOAuth || {};
    return res.json({
      hasCredentials: !!(oauth.clientId && oauth.clientSecret),
      clientId: oauth.clientId || '',
      // Don't return clientSecret for security
      redirectUri: googleCalendar.getRedirectUri(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Save OAuth credentials for agent
router.put('/google-calendar/credentials', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const agentId = scopeId || (req.body && req.body.agentId ? String(req.body.agentId) : '');
    if (!agentId) return res.status(400).json({ error: 'agentId required' });

    const { clientId, clientSecret } = req.body;
    if (!clientId || !clientSecret) {
      return res.status(400).json({ error: 'clientId and clientSecret are required' });
    }

    const agent = await Agente.findById(agentId).lean();
    if (!agent) return res.status(404).json({ error: 'Not found' });

    const currentMeta = agent.metadata || {};
    const newMeta = {
      ...currentMeta,
      googleOAuth: {
        clientId: String(clientId).trim(),
        clientSecret: String(clientSecret).trim(),
        updatedAt: new Date().toISOString(),
      },
    };

    await Agente.findByIdAndUpdate(agentId, { $set: { metadata: newMeta } }, { new: true });
    return res.json({ ok: true, message: 'Credentials saved successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Delete OAuth credentials for agent
router.delete('/google-calendar/credentials', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const agentId = scopeId || (req.query && req.query.agentId ? String(req.query.agentId) : '');
    if (!agentId) return res.status(400).json({ error: 'agentId required' });

    const agent = await Agente.findById(agentId).lean();
    if (!agent) return res.status(404).json({ error: 'Not found' });

    const currentMeta = agent.metadata || {};
    const newMeta = {
      ...currentMeta,
      googleOAuth: null,
      googleCalendar: null, // Also disconnect calendar
    };

    await Agente.findByIdAndUpdate(agentId, { $set: { metadata: newMeta } }, { new: true });
    return res.json({ ok: true, message: 'Credentials removed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ============ CALENDAR CONNECTION ============

router.get('/google-calendar/status', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const agentId = scopeId || (req.query && req.query.agentId ? String(req.query.agentId) : '');
    if (!agentId) return res.status(400).json({ error: 'agentId required' });

    const agent = await Agente.findById(agentId).lean();
    if (!agent) return res.status(404).json({ error: 'Not found' });

    const meta = agent.metadata || {};
    const gc = normalizeGoogleCalendar(meta);
    const configured = googleCalendar.isConfigured(meta);
    const hasOwnCredentials = googleCalendar.isAgentConfigured(meta);
    
    return res.json({ 
      configured, 
      hasOwnCredentials,
      redirectUri: googleCalendar.getRedirectUri(),
      ...gc 
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/google-calendar/auth-url', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const agentId = scopeId || (req.query && req.query.agentId ? String(req.query.agentId) : '');
    if (!agentId) return res.status(400).json({ error: 'agentId required' });

    const agent = await Agente.findById(agentId).lean();
    if (!agent) return res.status(404).json({ error: 'Not found' });

    const meta = agent.metadata || {};
    if (!googleCalendar.isConfigured(meta)) {
      return res.status(503).json({ error: 'Google OAuth is not configured. Please add your credentials first.' });
    }

    const { url } = googleCalendar.getAuthUrl(agentId, meta);
    return res.json({ url });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/google-calendar/callback', async (req, res) => {
  try {
    const code = req.query && req.query.code ? String(req.query.code) : '';
    const state = req.query && req.query.state ? String(req.query.state) : '';
    if (!code || !state) return res.status(400).json({ error: 'code and state required' });

    const parsed = googleCalendar.parseAndVerifyState(state);
    const agentId = String(parsed.agentId || '');
    if (!agentId) return res.status(400).json({ error: 'invalid state' });

    const agent = await Agente.findById(agentId).lean();
    if (!agent) return res.status(404).json({ error: 'Not found' });

    const meta = agent.metadata || {};
    if (!googleCalendar.isConfigured(meta)) {
      return res.status(503).json({ error: 'Google OAuth is not configured' });
    }

    const { tokens, email } = await googleCalendar.exchangeCodeForTokens(code, meta);

    const currentMeta = agent.metadata || {};
    const currentGc = currentMeta.googleCalendar || {};

    const refreshToken = tokens && tokens.refresh_token ? String(tokens.refresh_token) : (currentGc.refreshToken || '');
    if (!refreshToken) {
      return res.status(400).json({ error: 'Google did not return a refresh token. Remove access and try again with consent.' });
    }

    const newMeta = {
      ...currentMeta,
      googleCalendar: {
        ...currentGc,
        email: email || currentGc.email || '',
        refreshToken,
        calendarId: currentGc.calendarId || 'primary',
        updatedAt: new Date().toISOString(),
      },
    };

    await Agente.findByIdAndUpdate(agentId, { $set: { metadata: newMeta } }, { new: true });

    const successUrl = process.env.GOOGLE_OAUTH_SUCCESS_REDIRECT || 'http://localhost:3001/crm/integraciones?googleCalendar=connected';
    return res.redirect(successUrl);
  } catch (err) {
    console.error('Google Calendar callback error:', err);
    return res.status(400).json({ error: err.message });
  }
});

router.post('/google-calendar/disconnect', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const agentId = scopeId || (req.body && req.body.agentId ? String(req.body.agentId) : '');
    if (!agentId) return res.status(400).json({ error: 'agentId required' });

    const agent = await Agente.findById(agentId).lean();
    if (!agent) return res.status(404).json({ error: 'Not found' });

    const meta = agent.metadata || {};
    const gc = meta.googleCalendar || {};

    const newMeta = {
      ...meta,
      googleCalendar: {
        ...gc,
        refreshToken: '',
        email: '',
        calendarId: gc.calendarId || 'primary',
        updatedAt: new Date().toISOString(),
      },
    };

    await Agente.findByIdAndUpdate(agentId, { $set: { metadata: newMeta } }, { new: true });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ============ GOOGLE MAPS CONFIG ============

router.get('/google-maps/config', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const agentId = scopeId || (req.query && req.query.agentId ? String(req.query.agentId) : '');
    if (!agentId) return res.status(400).json({ error: 'agentId required' });

    const agent = await Agente.findById(agentId).lean();
    if (!agent) return res.status(404).json({ error: 'Not found' });

    const mapsConfig = agent.metadata?.googleMaps || {};
    return res.json({
      configured: !!mapsConfig.apiKey,
      apiKey: mapsConfig.apiKey ? '***' + mapsConfig.apiKey.slice(-4) : '',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/google-maps/config', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const agentId = scopeId || (req.body && req.body.agentId ? String(req.body.agentId) : '');
    if (!agentId) return res.status(400).json({ error: 'agentId required' });

    const { apiKey } = req.body;
    if (!apiKey) {
      return res.status(400).json({ error: 'apiKey is required' });
    }

    const agent = await Agente.findById(agentId).lean();
    if (!agent) return res.status(404).json({ error: 'Not found' });

    const currentMeta = agent.metadata || {};
    const newMeta = {
      ...currentMeta,
      googleMaps: {
        apiKey: String(apiKey).trim(),
        updatedAt: new Date().toISOString(),
      },
    };

    await Agente.findByIdAndUpdate(agentId, { $set: { metadata: newMeta } }, { new: true });
    return res.json({ ok: true, message: 'Google Maps config saved' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/google-maps/config', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const agentId = scopeId || (req.query && req.query.agentId ? String(req.query.agentId) : '');
    if (!agentId) return res.status(400).json({ error: 'agentId required' });

    const agent = await Agente.findById(agentId).lean();
    if (!agent) return res.status(404).json({ error: 'Not found' });

    const currentMeta = agent.metadata || {};
    const newMeta = {
      ...currentMeta,
      googleMaps: null,
    };

    await Agente.findByIdAndUpdate(agentId, { $set: { metadata: newMeta } }, { new: true });
    return res.json({ ok: true, message: 'Google Maps config removed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ============ GOOGLE CLOUD CONFIG ============

router.get('/google-cloud/config', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const agentId = scopeId || (req.query && req.query.agentId ? String(req.query.agentId) : '');
    if (!agentId) return res.status(400).json({ error: 'agentId required' });

    const agent = await Agente.findById(agentId).lean();
    if (!agent) return res.status(404).json({ error: 'Not found' });

    const cloudConfig = agent.metadata?.googleCloud || {};
    return res.json({
      configured: !!cloudConfig.projectId,
      projectId: cloudConfig.projectId || '',
      placesEnabled: !!cloudConfig.placesEnabled,
      geocodingEnabled: !!cloudConfig.geocodingEnabled,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/google-cloud/config', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const agentId = scopeId || (req.body && req.body.agentId ? String(req.body.agentId) : '');
    if (!agentId) return res.status(400).json({ error: 'agentId required' });

    const { projectId, placesEnabled, geocodingEnabled } = req.body;
    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required' });
    }

    const agent = await Agente.findById(agentId).lean();
    if (!agent) return res.status(404).json({ error: 'Not found' });

    const currentMeta = agent.metadata || {};
    const newMeta = {
      ...currentMeta,
      googleCloud: {
        projectId: String(projectId).trim(),
        placesEnabled: !!placesEnabled,
        geocodingEnabled: !!geocodingEnabled,
        updatedAt: new Date().toISOString(),
      },
    };

    await Agente.findByIdAndUpdate(agentId, { $set: { metadata: newMeta } }, { new: true });
    return res.json({ ok: true, message: 'Google Cloud config saved' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
