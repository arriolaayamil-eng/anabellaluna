const express = require('express');
const router  = express.Router();

const { agentScope } = require('../../middlewares/rbac');
const {
  listRecommendations,
  markViewed,
  resolveRecommendation,
} = require('../../services/ai/recommendationService');

// GET /marketing-ai/recommendations
router.get('/', async (req, res) => {
  try {
    const scopeId = agentScope(req);
    const recs    = await listRecommendations({
      agenteId: scopeId || '',
      status:   req.query.status || 'pending',
      limit:    parseInt(req.query.limit || '20', 10),
    });
    res.json(recs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /marketing-ai/recommendations/:id/viewed
router.patch('/:id/viewed', async (req, res) => {
  try {
    const rec = await markViewed(req.params.id);
    res.json(rec);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /marketing-ai/recommendations/:id/resolve
router.patch('/:id/resolve', async (req, res) => {
  try {
    const userId = String(req.user.sub || req.user.id || req.user._id || '');
    const rec    = await resolveRecommendation(req.params.id, {
      resolution: req.body.resolution || '',
      resolvedBy: userId,
      status:     req.body.status || 'accepted',
    });
    res.json(rec);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
