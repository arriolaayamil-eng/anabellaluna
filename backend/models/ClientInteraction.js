const mongoose = require('mongoose');

const ClientInteractionSchema = new mongoose.Schema({
  clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true, index: true },
  agenteId: { type: String, required: true, index: true },
  propiedadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Propiedad', default: null },

  // Type of interaction
  tipo: {
    type: String,
    required: true,
    enum: [
      'nota',              // General note about the client
      'recontacto',        // Follow-up contact (call, meeting, visit)
      'visita_agendada',   // Scheduled property visit
      'visita_realizada',  // Completed property visit
      'propiedad_interes', // Client showed interest in a property
      'opcion_pago',       // Payment option discussed
      'preferencia',       // Feature preferences recorded
    ],
  },

  // Recontact-specific fields
  medioContacto: {
    type: String,
    enum: ['llamada', 'whatsapp', 'email', 'presencial', 'videollamada', ''],
    default: '',
  },
  fechaContacto: { type: Date, default: null },

  // Visit-specific
  visitaFecha: { type: Date, default: null },
  visitaAsistio: { type: Boolean, default: null },

  // Property interest
  nivelInteres: {
    type: String,
    enum: ['bajo', 'medio', 'alto', ''],
    default: '',
  },

  // Payment option
  opcionPago: {
    tipo: { type: String, default: '' },       // contado, financiado, permuta, etc.
    detalle: { type: String, default: '' },
    montoOfrecido: { type: Number, default: 0 },
    moneda: { type: String, default: 'USD' },
  },

  // Feature preferences
  preferencias: {
    tipo: { type: String, default: '' },
    detalle: { type: String, default: '' },
  },

  // Free-text description (always present)
  descripcion: { type: String, default: '' },

  // Immutability: once created, agents cannot edit or delete
  // Admin can still manage via separate endpoint
  inmutable: { type: Boolean, default: true },

}, { timestamps: true });

// Compound index for efficient queries
ClientInteractionSchema.index({ clienteId: 1, createdAt: -1 });
ClientInteractionSchema.index({ propiedadId: 1, tipo: 1 });
ClientInteractionSchema.index({ agenteId: 1, tipo: 1 });

module.exports = mongoose.model('ClientInteraction', ClientInteractionSchema);
