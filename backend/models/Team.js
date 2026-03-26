const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, default: '' },
    leaderId: { type: String, default: '', index: true },
    leaderName: { type: String, default: '' },
    miembros: [
      {
        userId: { type: String, required: true },
        userName: { type: String, default: '' },
        role: { type: String, enum: ['lider', 'miembro'], default: 'miembro' },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    color: { type: String, default: '#6366f1' },
    activo: { type: Boolean, default: true },
    createdBy: { type: String },
    metadata: { type: Object, default: {} },
  },
  { timestamps: true }
);

TeamSchema.index({ activo: 1 });
TeamSchema.index({ 'miembros.userId': 1 });

module.exports = mongoose.model('Team', TeamSchema);
