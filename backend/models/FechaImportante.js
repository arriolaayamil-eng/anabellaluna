const mongoose = require('mongoose');

const FechaImportanteSchema = new mongoose.Schema({
  codigo: { type: String, required: true, unique: true, index: true },
  nombre: { type: String, required: true },
  descripcion: { type: String, default: '' },
  tipo: {
    type: String,
    enum: ['feriado_nacional', 'dia_especial', 'comercial', 'conmemorativo'],
    required: true,
  },
  mes: { type: Number, required: true, min: 1, max: 12 },
  dia: { type: Number, required: true, min: 1, max: 31 },
  esFechaFija: { type: Boolean, default: true },
  calculoEspecial: { type: String, default: '' },
  segmentacion: {
    genero: { type: String, enum: ['todos', 'masculino', 'femenino'], default: 'todos' },
    requierePadre: { type: Boolean, default: false },
    requiereMadre: { type: Boolean, default: false },
    requiereHijos: { type: Boolean, default: false },
    profesiones: [{ type: String }],
    edadMinima: { type: Number },
    edadMaxima: { type: Number },
  },
  plantillaTitulo: { type: String, default: '' },
  plantillaMensaje: { type: String, default: '' },
  prioridad: { type: String, enum: ['baja', 'media', 'alta', 'urgente'], default: 'media' },
  activo: { type: Boolean, default: true },
  metadata: { type: Object, default: {} },
}, { timestamps: true });

FechaImportanteSchema.index({ mes: 1, dia: 1 });

module.exports = mongoose.model('FechaImportante', FechaImportanteSchema);
