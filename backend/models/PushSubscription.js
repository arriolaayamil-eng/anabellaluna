const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  role: { type: String, enum: ['admin', 'agent', 'user'], required: true },
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  device: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
});

pushSubscriptionSchema.index({ userId: 1, role: 1 });

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
