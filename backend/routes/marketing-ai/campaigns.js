const express = require('express');
const router  = express.Router();

const MarketingCampaign = require('../../models/MarketingCampaign');
const { requirePermission, agentScope } = require('../../middlewares/rbac');
const metaAds = require('../../services/ai/integrations/metaAds');

// GET /marketing-ai/campaigns
router.get('/', async (req, res) => {
  try {
    const scopeId = agentScope(req);
    const filter  = {};
    if (scopeId) filter.agenteId = scopeId;
    if (req.query.platform) filter.platform = req.query.platform;
    if (req.query.status)   filter.status   = req.query.status;

    const campaigns = await MarketingCampaign.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /marketing-ai/campaigns/sync — Sync desde Meta Ads
router.post('/sync', requirePermission('marketing:write'), async (req, res) => {
  try {
    const campaigns = await metaAds.getCampaigns({ status: 'ALL', limit: 50 });
    res.json({ synced: campaigns.length, campaigns });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /marketing-ai/campaigns/:id
router.get('/:id', async (req, res) => {
  try {
    const campaign = await MarketingCampaign.findById(req.params.id).lean();
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
