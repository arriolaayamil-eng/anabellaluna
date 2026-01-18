const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema({
  agenteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agente',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: [
      'login_star',           // Estrella por 5 logins/semana
      'data_completeness',    // Badge por 90% datos actualizados
      'quick_response',       // Badge por respuesta <24h
      'conversion_bronze',    // Medalla bronce 10% conversión
      'conversion_silver',    // Medalla plata 20% conversión
      'conversion_gold',      // Medalla oro 30% conversión
      'satisfaction_bronze',  // Medalla bronce 4.0-4.4 estrellas
      'satisfaction_silver',  // Medalla plata 4.5-4.7 estrellas
      'satisfaction_gold',    // Medalla oro 4.8+ estrellas
      'seniority_junior',     // Nivel Junior (hasta 20 clientes)
      'seniority_semisenior', // Nivel Semi-Senior (21-50 clientes)
      'seniority_senior',     // Nivel Senior (50+ clientes)
    ],
    required: true,
  },
  category: {
    type: String,
    enum: ['star', 'badge', 'medal', 'level'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: String,
  icon: String,
  color: String,
  period: {
    type: String,
    enum: ['weekly', 'monthly', 'quarterly', 'yearly', 'permanent'],
    default: 'monthly',
  },
  periodStart: Date,
  periodEnd: Date,
  value: {
    type: Number,
    default: 1,
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  seen: {
    type: Boolean,
    default: false,
  },
  celebrationShown: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

rewardSchema.index({ agenteId: 1, type: 1, periodStart: 1 });
rewardSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Reward', rewardSchema);
