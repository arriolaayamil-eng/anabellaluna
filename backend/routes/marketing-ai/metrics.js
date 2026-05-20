const express = require('express');
const router  = express.Router();

const CampaignMetrics   = require('../../models/CampaignMetrics');
const MarketingCampaign = require('../../models/MarketingCampaign');
const { agentScope }    = require('../../middlewares/rbac');

// GET /marketing-ai/metrics/overview — Agregado por agente/inmobiliaria
router.get('/overview', async (req, res) => {
  try {
    const scopeId = agentScope(req);
    const days    = parseInt(req.query.days || '30', 10);
    const since   = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const filter = { date: { $gte: since }, granularity: 'day' };
    if (scopeId) filter.agenteId = scopeId;

    const pipeline = [
      { $match: filter },
      {
        $group: {
          _id: null,
          totalImpressions: { $sum: '$impressions' },
          totalClicks:      { $sum: '$clicks' },
          totalSpend:       { $sum: '$spend' },
          totalLeads:       { $sum: '$leads' },
          totalConversions: { $sum: '$conversions' },
          avgCTR:           { $avg: '$ctr' },
          avgCPC:           { $avg: { $cond: [{ $gt: ['$cpc', 0] }, '$cpc', null] } },
          avgROAS:          { $avg: { $cond: [{ $gt: ['$roas', 0] }, '$roas', null] } },
          days:             { $sum: 1 },
        },
      },
    ];

    const [agg] = await CampaignMetrics.aggregate(pipeline);
    if (!agg) return res.json({ message: 'No metrics available for the selected period' });

    const result = {
      period: `${days}d`,
      totalImpressions: agg.totalImpressions || 0,
      totalClicks:      agg.totalClicks      || 0,
      totalSpend:       +(agg.totalSpend      || 0).toFixed(2),
      totalLeads:       agg.totalLeads       || 0,
      totalConversions: agg.totalConversions || 0,
      avgCTR:  +(agg.avgCTR  || 0).toFixed(4),
      avgCPC:  +(agg.avgCPC  || 0).toFixed(2),
      avgROAS: +(agg.avgROAS || 0).toFixed(2),
      cpl: agg.totalLeads > 0 ? +((agg.totalSpend || 0) / agg.totalLeads).toFixed(2) : 0,
    };

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /marketing-ai/metrics/:campaignId — Timeline de métricas de una campaña
router.get('/:campaignId', async (req, res) => {
  try {
    const days  = parseInt(req.query.days || '30', 10);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const metrics = await CampaignMetrics.find({
      campaignId:   req.params.campaignId,
      date:         { $gte: since },
      granularity:  'day',
    }).sort({ date: 1 }).lean();

    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
