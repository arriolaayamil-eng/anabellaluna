const mongoose = require('mongoose');

const ClienteSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, default: '' },
  telefono: { type: String, default: '' },
  direccion: { type: String, default: '' },
  agenteId: { type: String, default: '', index: true },
  notas: { type: String, default: '' },
  metadata: { type: Object, default: {} },
  // ---- Rewards V2: loyalty tracking ----
  fidelizado: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Cliente', ClienteSchema);
