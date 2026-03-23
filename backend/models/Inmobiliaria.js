const mongoose = require('mongoose');

const InmobiliariaSchema = new mongoose.Schema({
  nombre: { type: String, required: true, trim: true },
  direccion: { type: String, default: '' },
  telefono: { type: String, default: '' },
  email: { type: String, default: '' },
  metadata: { type: Object, default: {} }
}, { timestamps: true });

InmobiliariaSchema.index({ nombre: 1 }, { unique: true });

module.exports = mongoose.model('Inmobiliaria', InmobiliariaSchema);
