const mongoose = require('mongoose');

const AIProviderSchema = new mongoose.Schema({
  name: {
    type: String,
    enum: ['openai', 'anthropic', 'google'],
    required: true,
    unique: true,
  },
  isEnabled:  { type: Boolean, default: false },
  isDefault:  { type: Boolean, default: false },
  isFallback: { type: Boolean, default: false },

  lastHealthCheck: Date,
  healthStatus: {
    type: String,
    enum: ['healthy', 'degraded', 'unavailable', 'unknown'],
    default: 'unknown',
  },
  consecutiveErrors: { type: Number, default: 0 },
  lastError:         String,

  totalTokensUsed: { type: Number, default: 0 },
  totalCostUSD:    { type: Number, default: 0 },
  totalRequests:   { type: Number, default: 0 },
  totalErrors:     { type: Number, default: 0 },
}, {
  timestamps: true,
  collection: 'ai_providers',
});

module.exports = mongoose.model('AIProvider', AIProviderSchema);
