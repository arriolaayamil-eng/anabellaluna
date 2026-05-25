const mongoose = require('mongoose');

const AIToolExecutionSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AIConversation',
    index: true,
  },
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AIMessage',
    index: true,
  },
  userId:   { type: String, required: true, index: true },
  agenteId: { type: String, default: '' },
  isAdmin:  { type: Boolean, default: false },

  toolName:  { type: String, required: true, index: true },
  toolInput: { type: mongoose.Schema.Types.Mixed, required: true },
  toolOutput: mongoose.Schema.Types.Mixed,

  requiresApproval: { type: Boolean, default: true },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'auto_approved'],
    default: 'pending',
    index: true,
  },
  approvedBy:      String,
  approvedAt:      Date,
  rejectionReason: String,

  status: {
    type: String,
    enum: ['pending', 'queued', 'executing', 'completed', 'failed', 'rolled_back'],
    default: 'pending',
    index: true,
  },
  startedAt:    Date,
  completedAt:  Date,
  errorMessage: String,
  retryCount:   { type: Number, default: 0 },

  rollbackData:   mongoose.Schema.Types.Mixed,
  isRollbackable: { type: Boolean, default: false },
  rolledBackAt:   Date,
  rolledBackBy:   String,

  ipAddress: String,
  userAgent: String,
  sessionId: String,
}, {
  timestamps: true,
  collection: 'ai_tool_executions',
});

AIToolExecutionSchema.index({ status: 1, approvalStatus: 1, createdAt: -1 });
AIToolExecutionSchema.index({ userId: 1, toolName: 1, createdAt: -1 });
AIToolExecutionSchema.index({ conversationId: 1, createdAt: -1 });

module.exports = mongoose.model('AIToolExecution', AIToolExecutionSchema);
