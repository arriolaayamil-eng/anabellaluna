const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../auth');
const GlobalConfig = require('../models/GlobalConfig');

// Middleware to check if user is admin
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Get Google OAuth credentials (admin only)
router.get('/google-oauth', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const config = await GlobalConfig.getValue('google_oauth_credentials', {});
    res.json({
      clientId: config.clientId || '',
      clientSecret: config.clientSecret ? '••••••••' : '', // Masked
      hasCredentials: !!(config.clientId && config.clientSecret),
      redirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI || '',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Google OAuth credentials (admin only)
router.put('/google-oauth', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { clientId, clientSecret } = req.body;
    
    if (!clientId || !clientSecret) {
      return res.status(400).json({ error: 'clientId and clientSecret are required' });
    }

    await GlobalConfig.setValue(
      'google_oauth_credentials',
      { clientId, clientSecret },
      'Google OAuth credentials for Calendar integration',
      req.user._id
    );

    res.json({ success: true, message: 'Google OAuth credentials updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Google OAuth credentials (admin only)
router.delete('/google-oauth', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await GlobalConfig.deleteOne({ key: 'google_oauth_credentials' });
    res.json({ success: true, message: 'Google OAuth credentials removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all configs (admin only) - for debugging
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const configs = await GlobalConfig.find({}).select('-value.clientSecret').lean();
    // Mask sensitive values
    const masked = configs.map(c => {
      if (c.key === 'google_oauth_credentials' && c.value) {
        return {
          ...c,
          value: {
            clientId: c.value.clientId || '',
            clientSecret: c.value.clientSecret ? '••••••••' : '',
          }
        };
      }
      return c;
    });
    res.json(masked);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
