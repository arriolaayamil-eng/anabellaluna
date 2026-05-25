const mongoose = require('mongoose');

const AIMessageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AIConversation',
    required: true,
    index: true,
  },
  userId:   { type: String, required: true, index: true },
  agenteId: { type: String, default: '' },

  role: {
    type: String,
    enum: ['user', 'assistant', 'tool', 'tool_result', 'system'],
    required: true,
  },
  content: { type: String, default: '' },

  // Legacy single tool call (old orchestrator)
  toolCall: {
    toolName:    String,
    toolInput:   mongoose.Schema.Types.Mixed,
    toolOutput:  mongoose.Schema.Types.Mixed,
    executionId: String,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'executed', 'failed'],
    },
  },

  // MCP-based: multiple tool calls per message (Anthropic content blocks)
  toolCalls:   { type: mongoose.Schema.Types.Mixed },
  toolResults: { type: mongoose.Schema.Types.Mixed },

  provider:   String,
  model:      String,
  tokensUsed: { type: Number, default: 0 },
  costUSD:    { type: Number, default: 0 },
  latencyMs:  { type: Number, default: 0 },

  isStreaming: { type: Boolean, default: false },
  isComplete:  { type: Boolean, default: true },

  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, {
  timestamps: true,
  collection: 'ai_messages',
});

AIMessageSchema.index({ conversationId: 1, createdAt: 1 });
AIMessageSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('AIMessage', AIMessageSchema);
