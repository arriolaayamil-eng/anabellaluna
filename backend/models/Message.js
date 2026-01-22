const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  // Sender info
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agente', required: true },
  senderType: { type: String, enum: ['agent', 'erp'], default: 'agent' },
  
  // Receiver info (can be an agent or 'erp' for admin messages)
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agente' },
  receiverType: { type: String, enum: ['agent', 'erp'], default: 'agent' },
  
  // For group conversations (optional)
  conversationId: { type: String, index: true },
  
  // Message content
  content: { type: String, required: true },
  contentType: { type: String, enum: ['text', 'image', 'file', 'system'], default: 'text' },
  
  // File attachment (if any)
  attachment: {
    url: { type: String },
    filename: { type: String },
    mimeType: { type: String },
    size: { type: Number }
  },
  
  // Read status
  read: { type: Boolean, default: false },
  readAt: { type: Date },
  
  // Metadata
  metadata: { type: Object, default: {} }
}, { timestamps: true });

// Index for efficient querying of conversations
MessageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
MessageSchema.index({ conversationId: 1, createdAt: -1 });

// Static method to get conversation ID between two users
MessageSchema.statics.getConversationId = function(userId1, userId2) {
  // Sort IDs to ensure consistent conversation ID regardless of who sends
  const sorted = [userId1.toString(), userId2.toString()].sort();
  return `${sorted[0]}_${sorted[1]}`;
};

// Static method to get all conversations for a user
MessageSchema.statics.getConversationsForUser = async function(userId) {
  const userIdStr = userId.toString();
  
  // Get all unique conversation partners
  const sent = await this.distinct('receiverId', { senderId: userId });
  const received = await this.distinct('senderId', { receiverId: userId });
  
  // Combine and dedupe
  const allPartners = [...new Set([...sent, ...received].map(id => id?.toString()).filter(Boolean))];
  
  return allPartners;
};

module.exports = mongoose.model('Message', MessageSchema);
