const mongoose = require('mongoose');

const faqSchema = new mongoose.Schema(
  {
    pregunta: { type: String, required: true },
    respuesta: { type: String, required: true },
    categoria: { type: String, default: '' },
    orden: { type: Number, default: 0 },
    activo: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FAQ', faqSchema);
