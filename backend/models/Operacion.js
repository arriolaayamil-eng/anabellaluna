const mongoose = require('mongoose');

const OperacionSchema = new mongoose.Schema({
  propiedadId: { type: String },
  clienteId: { type: String },
  agenteId: { type: String },
  tipo: { type: String, enum: ['Venta', 'Alquiler', 'Reserva'], default: 'Venta' },
  monto: { type: Number, default: 0 },
  moneda: { type: String, default: 'USD' },
  estado: { type: String, default: 'En Curso' },
  notas: { type: String, default: '' },
  fechaCierre: { type: Date },
  formaPago: { type: String, default: 'Contado' },
  duracion: { type: Number },
  deposito: { type: Number, default: 0 },
  comisionPorcentaje: { type: Number, default: 3.5 },
  // ---- Denormalized display names (fast stats, no populate) ----
  metadata: {
    propiedad: { type: String, default: '' },
    cliente: { type: String, default: '' },
    agente: { type: String, default: '' },
    tipoPropiedad: { type: String, default: '' },
    barrio: { type: String, default: '' },
    ingresoMarketing: { type: Number, default: 0 },
    costoAdquisicion: { type: Number, default: 0 },
  },
  // ---- Rewards V2: commission tracking ----
  comisionMonto: { type: Number, default: 0 },
  comisionCobrada: { type: Boolean, default: false },
  comisionFechaCobro: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Operacion', OperacionSchema);
