const mongoose = require('mongoose');

const CitaSchema = new mongoose.Schema({
  fecha: { type: Date, required: true },
  fechaFin: { type: Date },
  titulo: { type: String, default: '' },
  tipo: { type: String, default: 'Visita' },
  ubicacion: { type: String, default: '' },
  clienteId: { type: String },
  agenteId: { type: String },
  propiedadId: { type: String },
  notas: { type: String, default: '' },
  estado: { type: String, enum: ['Programada', 'Completada', 'Cancelada'], default: 'Programada' },
  metadata: { type: Object, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('Cita', CitaSchema);
