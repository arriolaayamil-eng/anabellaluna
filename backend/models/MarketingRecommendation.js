const mongoose = require('mongoose');

const MarketingRecommendationSchema = new mongoose.Schema({
  agenteId:       { type: String, default: '', index: true },
  inmobiliariaId: { type: String, default: '' },
  generatedBy:    String,

  source: {
    type: String,
    enum: ['ai_analysis', 'scheduler', 'manual', 'anomaly_detection'],
    default: 'ai_analysis',
  },
  provider:       String,
  model:          String,
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AIConversation',
  },

  type: {
    type: String,
    enum: [
      'budget_optimization',
      'audience_targeting',
      'creative_refresh',
      'bid_strategy',
      'campaign_pause',
      'anomaly_alert',
      'general',
    ],
    required: true,
  },
  priority: {
    type: String,
    enum: ['critical', 'high', 'medium', 'low'],
    default: 'medium',
    index: true,
  },
  title:   { type: String, required: true },
  body:    { type: String, required: true },
  actions: { type: [String], default: [] },

  campaignIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MarketingCampaign',
  }],
  metrics: { type: mongoose.Schema.Types.Mixed, default: {} },

  status: {
    type: String,
    enum: ['pending', 'viewed', 'accepted', 'rejected', 'expired'],
    default: 'pending',
    index: true,
  },
  viewedAt:   Date,
  resolvedAt: Date,
  resolvedBy: String,
  resolution: String,

  expiresAt: { type: Date, index: true },
}, {
  timestamps: true,
  collection: 'marketing_recommendations',
});

MarketingRecommendationSchema.index({ status: 1, priority: 1, createdAt: -1 });
MarketingRecommendationSchema.index({ agenteId: 1, status: 1, createdAt: -1 });
MarketingRecommendationSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
);

module.exports = mongoose.model('MarketingRecommendation', MarketingRecommendationSchema);
