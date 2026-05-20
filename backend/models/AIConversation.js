const mongoose = require('mongoose');

const AIConversationSchema = new mongoose.Schema({
  userId:         { type: String, required: true, index: true },
  agenteId:       { type: String, index: true, default: '' },
  inmobiliariaId: { type: String, index: true, default: '' },

  contextType: {
    type: String,
    enum: ['marketing', 'crm', 'analytics', 'general'],
    default: 'marketing',
  },
  title:  { type: String, default: 'Nueva conversación' },
  status: { type: String, enum: ['active', 'archived', 'deleted'], default: 'active' },

  messageCount: { type: Number, default: 0 },

  provider: { type: String, enum: ['openai', 'anthropic', 'auto'], default: 'auto' },
  model:    String,

  totalTokensUsed: { type: Number, default: 0 },
  totalCostUSD:    { type: Number, default: 0 },

  metadata: {
    campaignIds:  { type: [String], default: [] },
    clienteIds:   { type: [String], default: [] },
    propiedadIds: { type: [String], default: [] },
    tags:         { type: [String], default: [] },
    lastToolUsed: String,
    actionsCount: { type: Number, default: 0 },
  },

  lastMessageAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
  collection: 'ai_conversations',
});

AIConversationSchema.index({ userId: 1, status: 1, lastMessageAt: -1 });
AIConversationSchema.index({ agenteId: 1, status: 1, lastMessageAt: -1 });
AIConversationSchema.index({ contextType: 1, createdAt: -1 });

module.exports = mongoose.model('AIConversation', AIConversationSchema);
