/**
 * SellerTierHistory – Annual seller category snapshots.
 *
 * Stores the tier/medal assigned to each agent per year based on billed revenue.
 * Historical records are never overwritten – a new doc is created per year.
 *
 * Tiers (from RewardConfig.sellerTiers):
 *   base       – < 24 000  (Sin categoría / Prospect)
 *   rookie     – >= 24 000 (Bronce)
 *   executive  – >= 54 000 (Plata)
 *   club100    – >= 80 000 (Oro)
 */
const mongoose = require('mongoose');

const sellerTierHistorySchema = new mongoose.Schema({
  agenteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agente', required: true, index: true },
  year: { type: Number, required: true },
  tier: { type: String, enum: ['base', 'rookie', 'executive', 'club100'], required: true },
  medal: { type: String, enum: ['none', 'Bronce', 'Plata', 'Oro'], default: 'none' },
  totalRevenue: { type: Number, default: 0 },
  // IDs of Operacion docs that contributed to this total
  operacionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Operacion' }],
  prize: { type: String, default: '' },
  calculatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

sellerTierHistorySchema.index({ agenteId: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('SellerTierHistory', sellerTierHistorySchema);
