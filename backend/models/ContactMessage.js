const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    email: { type: String, default: '' },
    telefono: { type: String, default: '' },
    asunto: { type: String, default: '' },
    mensaje: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
