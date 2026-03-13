/**
 * CustomerLoyalty – Per-agent snapshot of closed & loyal clients.
 *
 * Recalculated periodically. Each doc = one agent's current state.
 * Contains the list of client IDs that qualify as "closed" or "loyal"
 * so every metric is auditable.
 *
 * Definitions (from business rules):
 *   closed  = client linked to at least one completed Operacion
 *   loyal   = closed client additionally flagged as recurrent/active in CRM
 *
 * Seniority thresholds come from RewardConfig.clientLoyalty.
 */
const mongoose = require('mongoose');

const customerLoyaltySchema = new mongoose.Schema({
  agenteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agente', required: true, index: true },
  year: { type: Number, required: true },
  closedClientIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Cliente' }],
  loyalClientIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Cliente' }],
  closedCount: { type: Number, default: 0 },
  loyalCount: { type: Number, default: 0 },
  totalCount: { type: Number, default: 0 }, // unique union of closed + loyal
  seniority: { type: String, enum: ['junior', 'semi_senior', 'senior', 'none'], default: 'none' },
  calculatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

customerLoyaltySchema.index({ agenteId: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('CustomerLoyalty', customerLoyaltySchema);
