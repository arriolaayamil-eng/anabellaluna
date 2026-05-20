const mongoose = require('mongoose');

const CampaignMetricsSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketingCampaign',
    required: true,
    index: true,
  },
  externalId: { type: String, index: true },
  platform:   { type: String, required: true, index: true },
  agenteId:   { type: String, default: '', index: true },

  date: { type: Date, required: true, index: true },
  granularity: {
    type: String,
    enum: ['hour', 'day', 'week', 'month'],
    default: 'day',
  },

  impressions:  { type: Number, default: 0 },
  clicks:       { type: Number, default: 0 },
  spend:        { type: Number, default: 0 },
  reach:        { type: Number, default: 0 },
  frequency:    { type: Number, default: 0 },
  conversions:  { type: Number, default: 0 },
  leads:        { type: Number, default: 0 },
  revenue:      { type: Number, default: 0 },

  ctr:  { type: Number, default: 0 },
  cpc:  { type: Number, default: 0 },
  cpm:  { type: Number, default: 0 },
  cpl:  { type: Number, default: 0 },
  cac:  { type: Number, default: 0 },
  roas: { type: Number, default: 0 },

  rawData: { type: mongoose.Schema.Types.Mixed, default: {} },
}, {
  timestamps: true,
  collection: 'campaign_metrics',
});

CampaignMetricsSchema.index({ campaignId: 1, date: -1 });
CampaignMetricsSchema.index({ date: -1, platform: 1, agenteId: 1 });
CampaignMetricsSchema.index({ agenteId: 1, date: -1, granularity: 1 });
// TTL: auto-delete after 2 years
CampaignMetricsSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 365 * 2 }
);

module.exports = mongoose.model('CampaignMetrics', CampaignMetricsSchema);
