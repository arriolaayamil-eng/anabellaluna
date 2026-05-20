/**
 * Recommendation Service — Crea y gestiona MarketingRecommendations.
 */

const MarketingRecommendation = require('../../models/MarketingRecommendation');
const MarketingCampaign       = require('../../models/MarketingCampaign');
const { eventBus }            = require('../../utils/eventBus');

/**
 * Crea una nueva recomendación (llamado por el tool generate_recommendation).
 */
async function createRecommendation({
  type,
  priority = 'medium',
  title,
  body,
  actions = [],
  campaignIds = [],
  agenteId = '',
  inmobiliariaId = '',
  generatedBy,
  provider,
  model,
  conversationId,
}) {
  // Resolver IDs internos de campañas a partir de external IDs
  const resolvedCampaignIds = [];
  for (const extId of campaignIds) {
    const campaign = await MarketingCampaign.findOne({
      $or: [
        { externalId: extId },
        { _id: extId.match(/^[0-9a-fA-F]{24}$/) ? extId : null },
      ],
    }).lean();
    if (campaign) resolvedCampaignIds.push(campaign._id);
  }

  const rec = await MarketingRecommendation.create({
    agenteId,
    inmobiliariaId,
    generatedBy,
    source:     'ai_analysis',
    provider,
    model,
    conversationId,
    type,
    priority,
    title,
    body,
    actions,
    campaignIds: resolvedCampaignIds,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
  });

  eventBus.emitAsync('recommendation.generated', { type, priority, agenteId });

  return {
    id:       rec._id,
    type:     rec.type,
    priority: rec.priority,
    title:    rec.title,
    created:  true,
  };
}

/**
 * Lista recomendaciones pendientes para un agente/admin.
 */
async function listRecommendations({ agenteId, status = 'pending', limit = 20 }) {
  const filter = { status };
  if (agenteId) filter.agenteId = agenteId;

  return MarketingRecommendation.find(filter)
    .sort({ priority: 1, createdAt: -1 })
    .limit(limit)
    .lean();
}

/**
 * Marca una recomendación como vista.
 */
async function markViewed(id) {
  return MarketingRecommendation.findByIdAndUpdate(
    id,
    { $set: { status: 'viewed', viewedAt: new Date() } },
    { new: true }
  );
}

/**
 * Resuelve una recomendación (accepted/rejected).
 */
async function resolveRecommendation(id, { resolution, resolvedBy, status }) {
  return MarketingRecommendation.findByIdAndUpdate(
    id,
    {
      $set: {
        status:     status || 'accepted',
        resolution,
        resolvedBy,
        resolvedAt: new Date(),
      },
    },
    { new: true }
  );
}

module.exports = { createRecommendation, listRecommendations, markViewed, resolveRecommendation };
