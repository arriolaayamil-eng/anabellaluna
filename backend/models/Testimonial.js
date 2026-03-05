const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true },
    avatar: { type: String, default: '' },
    texto: { type: String, required: true },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    activo: { type: Boolean, default: true },
    orden: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Testimonial', testimonialSchema);
