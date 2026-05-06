const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  role: { type: String, enum: ['admin', 'agent', 'user'], required: true, index: true },
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  device: { type: String, default: '' },
  // Platform detection: 'ios' | 'android' | 'desktop' | 'unknown'
  platform: { type: String, enum: ['ios', 'android', 'desktop', 'unknown'], default: 'unknown' },
  // Whether the subscription is currently active
  enabled: { type: Boolean, default: true, index: true },
  // Last time a push was successfully delivered to this subscription
  lastSeenAt: { type: Date },
  // Full user agent string for debugging
  userAgent: { type: String, default: '' },
}, { timestamps: true });

pushSubscriptionSchema.index({ userId: 1, role: 1 });
pushSubscriptionSchema.index({ enabled: 1 });

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
