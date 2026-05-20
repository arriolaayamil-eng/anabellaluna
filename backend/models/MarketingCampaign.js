const mongoose = require('mongoose');

const MarketingCampaignSchema = new mongoose.Schema({
  agenteId:       { type: String, default: '', index: true },
  inmobiliariaId: { type: String, default: '', index: true },
  createdBy:      { type: String, required: true },

  platform: {
    type: String,
    enum: ['meta', 'google_ads', 'tiktok'],
    required: true,
    index: true,
  },
  externalId:     { type: String, index: true },
  externalAdSetId: String,
  externalAdId:    String,
  accountId:       String,

  name: { type: String, required: true },
  status: {
    type: String,
    enum: ['active', 'paused', 'deleted', 'archived', 'draft', 'syncing'],
    default: 'draft',
    index: true,
  },
  objective:  String,
  budget:     Number,
  budgetType: { type: String, enum: ['daily', 'lifetime'], default: 'daily' },
  currency:   { type: String, default: 'ARS' },
  startDate:  Date,
  endDate:    Date,

  lastSyncAt:    Date,
  lastSyncError: String,
  syncStatus:    { type: String, enum: ['ok', 'error', 'pending'], default: 'pending' },

  metadata: {
    propiedadIds:     { type: [String], default: [] },
    clienteIds:       { type: [String], default: [] },
    tags:             { type: [String], default: [] },
    targetAudience:   mongoose.Schema.Types.Mixed,
    aiGenerated:      { type: Boolean, default: false },
    aiRecommendation: String,
  },
}, {
  timestamps: true,
  collection: 'marketing_campaigns',
});

MarketingCampaignSchema.index(
  { platform: 1, externalId: 1 },
  { unique: true, sparse: true }
);
MarketingCampaignSchema.index({ agenteId: 1, status: 1, createdAt: -1 });
MarketingCampaignSchema.index({ inmobiliariaId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('MarketingCampaign', MarketingCampaignSchema);
