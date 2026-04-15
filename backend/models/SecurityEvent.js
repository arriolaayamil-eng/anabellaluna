const mongoose = require('mongoose');

// ─── Security Audit Log ────────────────────────────────────────────────────────
// Records security-relevant events for auditing, compliance, and anomaly detection.
const SecurityEventSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  event: {
    type: String,
    required: true,
    enum: [
      '2fa_setup_init',
      '2fa_setup_verified',
      '2fa_setup_failed',
      '2fa_disabled',
      '2fa_login_success',
      '2fa_login_failed',
      '2fa_recovery_used',
      '2fa_recovery_regenerated',
      '2fa_locked',
      '2fa_unlocked',
      'login_success',
      'login_failed',
      'password_changed',
    ],
    index: true,
  },
  result: { type: String, enum: ['success', 'failure'], default: 'success' },
  ip: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

// TTL index: auto-delete events older than 1 year (configurable)
SecurityEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

module.exports = mongoose.model('SecurityEvent', SecurityEventSchema);
