const mongoose = require('mongoose');

const OperacionSchema = new mongoose.Schema({
  propiedadId: { type: String },
  clienteId: { type: String },
  agenteId: { type: String },
  tipo: { type: String, enum: ['Venta', 'Alquiler'], default: 'Venta' },
  monto: { type: Number, default: 0 },
  estado: { type: String, default: 'Pendiente' },
  notas: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Operacion', OperacionSchema);
