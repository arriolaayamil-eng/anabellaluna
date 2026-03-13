/**
 * QuarterlyAward – Prizes assigned to top-billing agents each quarter.
 *
 * One document per agent per quarter (Q1-Q4).
 * Stores ranking position, total billed revenue, prize description,
 * and the list of Operacion IDs that contributed.
 */
const mongoose = require('mongoose');

const quarterlyAwardSchema = new mongoose.Schema({
  agenteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agente', required: true, index: true },
  year: { type: Number, required: true },
  quarter: { type: Number, enum: [1, 2, 3, 4], required: true },
  ranking: { type: Number, required: true }, // 1 = top, 2 = second, etc.
  totalRevenue: { type: Number, default: 0 },
  prize: { type: String, default: '' },
  operacionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Operacion' }],
  calculatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

quarterlyAwardSchema.index({ year: 1, quarter: 1, ranking: 1 });
quarterlyAwardSchema.index({ agenteId: 1, year: 1, quarter: 1 }, { unique: true });

module.exports = mongoose.model('QuarterlyAward', quarterlyAwardSchema);
