const mongoose = require('mongoose');

const AIUsageLogSchema = new mongoose.Schema({
  provider: { type: String, required: true, index: true },
  model:    { type: String, required: true },
  userId:   { type: String, required: true, index: true },
  agenteId: { type: String, default: '', index: true },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AIConversation',
  },

  promptTokens:     { type: Number, default: 0 },
  completionTokens: { type: Number, default: 0 },
  totalTokens:      { type: Number, default: 0 },
  costUSD:          { type: Number, default: 0 },
  latencyMs:        { type: Number, default: 0 },

  requestType: {
    type: String,
    enum: ['chat', 'tool_call', 'embedding', 'analysis', 'health_check'],
    default: 'chat',
  },
  success:   { type: Boolean, default: true },
  errorCode: String,

  date: {
    type: Date,
    default: () => new Date(new Date().setHours(0, 0, 0, 0)),
    index: true,
  },
  hour: {
    type: Number,
    default: () => new Date().getHours(),
  },
}, {
  timestamps: true,
  collection: 'ai_usage_logs',
});

AIUsageLogSchema.index({ date: 1, provider: 1, userId: 1 });
AIUsageLogSchema.index({ agenteId: 1, date: -1 });
// TTL: auto-delete after 90 days
AIUsageLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

module.exports = mongoose.model('AIUsageLog', AIUsageLogSchema);
