const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password_hash: String,
  role: { type: String, default: 'agent' },
  agenteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agente' },
  // Social login provider IDs
  googleId: { type: String, default: '' },
  facebookId: { type: String, default: '' },
  // Profile fields for public users (role: 'user') and admins
  nombre: { type: String, default: '' },
  email: { type: String, default: '' },
  telefono: { type: String, default: '' },
  avatar: { type: String, default: '' },
  direccion: { type: String, default: '' },
  bio: { type: String, default: '' },
  cargo: { type: String, default: '' },
  empresa: { type: String, default: '' },

  // ─── Two-Factor Authentication (TOTP RFC 6238) ───────────────────────
  twoFactorEnabled: { type: Boolean, default: false },
  // AES-256-GCM encrypted TOTP secret (active, verified)
  twoFactorSecret: {
    encrypted: { type: String, default: '' },
    iv: { type: String, default: '' },
    tag: { type: String, default: '' },
  },
  // Pending secret during setup (not yet verified by user)
  twoFactorPendingSecret: {
    encrypted: { type: String, default: '' },
    iv: { type: String, default: '' },
    tag: { type: String, default: '' },
  },
  twoFactorEnabledAt: { type: Date, default: null },
  // Recovery codes: array of { hash, used }
  twoFactorRecoveryCodes: [{
    hash: { type: String, required: true },
    used: { type: Boolean, default: false },
    usedAt: { type: Date, default: null },
  }],
  twoFactorRecoveryCodesGeneratedAt: { type: Date, default: null },
  // Rate limiting for 2FA verification attempts
  twoFactorFailedAttempts: { type: Number, default: 0 },
  twoFactorLockedUntil: { type: Date, default: null },
  // Timestamp of last successful 2FA verification (for step-up auth)
  lastTwoFactorVerifiedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
