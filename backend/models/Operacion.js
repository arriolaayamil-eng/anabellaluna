const mongoose = require('mongoose');

const OperacionSchema = new mongoose.Schema({
  propiedadId: { type: String },
  clienteId: { type: String },
  agenteId: { type: String },
  tipo: { type: String, enum: ['Venta', 'Alquiler', 'Reserva'], default: 'Venta' },
  monto: { type: Number, default: 0 },
  estado: { type: String, default: 'Pendiente' },
  notas: { type: String, default: '' },
  // ---- Rewards V2: commission tracking ----
  comisionMonto: { type: Number, default: 0 },
  comisionCobrada: { type: Boolean, default: false },
  comisionFechaCobro: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Operacion', OperacionSchema);
