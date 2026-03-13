/**
 * PreListing – Records of pre-listing interviews (entrevistas previas).
 *
 * Each document represents one interview with a buyer or seller.
 * Used to calculate the Pre-Listing badge (minimum 5/week to keep it active).
 */
const mongoose = require('mongoose');

const preListingSchema = new mongoose.Schema({
  agenteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agente', required: true, index: true },
  clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
  tipo: { type: String, enum: ['comprador', 'vendedor'], required: true },
  fecha: { type: Date, required: true, index: true },
  observaciones: { type: String, default: '' },
  valido: { type: Boolean, default: true },
  createdBy: { type: String, default: '' },
}, { timestamps: true });

preListingSchema.index({ agenteId: 1, fecha: -1 });

module.exports = mongoose.model('PreListing', preListingSchema);
