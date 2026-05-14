const mongoose = require('mongoose');

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

const PropiedadSchema = new mongoose.Schema({
  slug: { type: String, unique: true, sparse: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  address: { type: String, default: '' },
  price: { type: Number, default: 0 },
  moneda: { type: String, default: 'ARS' },
  featured: { type: Boolean, default: false, index: true },
  ownerId: { type: String }, // cliente id
  agentId: { type: String },
  status: { type: String, enum: ['Disponible', 'Reservada', 'Vendida', 'Alquilada'], default: 'Disponible' },
  published: { type: Boolean, default: true, index: true },
  privateToken: { type: String, default: '', index: true },
  metadata: { type: Object, default: {} },
  createdBy: { type: String },
  // ---- Rewards V2: capture / exclusivity tracking ----
  exclusiva: { type: Boolean, default: false },
  exclusividadDias: { type: Number, default: 0 },
  exclusividadDesde: { type: Date },
  fechaCaptacion: { type: Date },
  // ---- Mercado Libre integration ----
  // 0=free 1=bronze 2=silver 3=gold 4=gold_special 5=gold_premium
  mlEstrellas: { type: Number, default: 0, min: 0, max: 5 },
  // ml: { itemId, status, permalink, lastSyncAt, lastError }
  ml: { type: Object, default: null },
}, { timestamps: true });

PropiedadSchema.pre('validate', async function preValidate(next) {
  try {
    if (this.slug) return next();
    const base = slugify(this.title);
    if (!base) return next();

    let candidate = base;
    for (let i = 1; i <= 1000; i += 1) {
      const existing = await this.constructor
        .findOne({ slug: candidate, _id: { $ne: this._id } })
        .lean();
      if (!existing) break;
      candidate = `${base}-${i + 1}`;
    }
    this.slug = candidate;
    return next();
  } catch (err) {
    return next(err);
  }
});

module.exports = mongoose.model('Propiedad', PropiedadSchema);
