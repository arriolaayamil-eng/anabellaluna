/**
 * BadgeRecord – Tracks badge lifecycle (earned, active, inactive, reactivated).
 *
 * Currently supports:
 *   - pre_listing : Pre-Listing badge (5/week minimum)
 *
 * Designed to be extensible for future badge types.
 * Each record captures a state transition for audit/history purposes.
 */
const mongoose = require('mongoose');

const badgeRecordSchema = new mongoose.Schema({
  agenteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agente', required: true, index: true },
  badgeType: { type: String, enum: ['pre_listing'], required: true },
  status: { type: String, enum: ['active', 'inactive', 'earned', 'lost', 'reactivated'], required: true },
  earnedAt: { type: Date },
  lostAt: { type: Date },
  reactivatedAt: { type: Date },
  // Snapshot of the evidence that triggered this state
  evidence: {
    weekStart: Date,
    weekEnd: Date,
    count: Number,
    required: Number,
  },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

badgeRecordSchema.index({ agenteId: 1, badgeType: 1, createdAt: -1 });

module.exports = mongoose.model('BadgeRecord', badgeRecordSchema);
