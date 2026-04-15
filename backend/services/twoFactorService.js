/**
 * ─── Two-Factor Authentication Service ─────────────────────────────────────────
 * Implements TOTP RFC 6238 with AES-256-GCM secret encryption, bcrypt-hashed
 * recovery codes, rate limiting, and security audit logging.
 *
 * Dependencies: otpauth, qrcode, crypto (Node built-in), bcryptjs
 * Env vars:    TWO_FACTOR_ENCRYPTION_KEY (64-char hex = 32 bytes)
 *              TWO_FACTOR_ISSUER (display name in authenticator apps)
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { TOTP, Secret } = require('otpauth');
const QRCode = require('qrcode');
const SecurityEvent = require('../models/SecurityEvent');

// ─── Configuration ──────────────────────────────────────────────────────────────

const ENCRYPTION_KEY_HEX = process.env.TWO_FACTOR_ENCRYPTION_KEY || '';
const ISSUER = process.env.TWO_FACTOR_ISSUER || 'Anabella Luna';
const TOTP_PERIOD = 30;        // seconds
const TOTP_DIGITS = 6;
const TOTP_ALGORITHM = 'SHA1'; // Most compatible with authenticator apps
const TOTP_WINDOW = 1;         // Accept ±1 period (~30s tolerance)

const RECOVERY_CODE_COUNT = 10;
const RECOVERY_CODE_LENGTH = 8; // characters per code
const BCRYPT_ROUNDS = 10;

// Rate limiting constants
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// ─── Encryption Helpers (AES-256-GCM) ───────────────────────────────────────────

function getEncryptionKey() {
  if (!ENCRYPTION_KEY_HEX || ENCRYPTION_KEY_HEX.length !== 64) {
    throw new Error(
      'TWO_FACTOR_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). ' +
      'Generate with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return Buffer.from(ENCRYPTION_KEY_HEX, 'hex');
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns { encrypted, iv, tag } — all hex-encoded.
 */
function encrypt(plaintext) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag,
  };
}

/**
 * Decrypt AES-256-GCM ciphertext.
 * @param {{ encrypted: string, iv: string, tag: string }} data
 * @returns {string} plaintext
 */
function decrypt(data) {
  if (!data || !data.encrypted || !data.iv || !data.tag) {
    throw new Error('Invalid encrypted data structure');
  }
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(data.iv, 'hex')
  );
  decipher.setAuthTag(Buffer.from(data.tag, 'hex'));
  let decrypted = decipher.update(data.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// ─── TOTP Helpers ───────────────────────────────────────────────────────────────

/**
 * Generate a new random TOTP secret.
 * @returns {string} Base32-encoded secret
 */
function generateSecret() {
  const secret = new Secret({ size: 20 }); // 160 bits — standard
  return secret.base32;
}

/**
 * Create a TOTP instance from a base32 secret.
 */
function createTOTP(secretBase32, label) {
  return new TOTP({
    issuer: ISSUER,
    label: label || 'User',
    algorithm: TOTP_ALGORITHM,
    digits: TOTP_DIGITS,
    period: TOTP_PERIOD,
    secret: Secret.fromBase32(secretBase32),
  });
}

/**
 * Validate a TOTP token against a base32 secret.
 * @returns {boolean}
 */
function verifyTOTP(secretBase32, token, label) {
  const totp = createTOTP(secretBase32, label);
  const delta = totp.validate({ token: String(token), window: TOTP_WINDOW });
  return delta !== null; // null = invalid
}

/**
 * Generate the otpauth:// URI for QR code scanning.
 */
function generateOtpauthURI(secretBase32, label) {
  const totp = createTOTP(secretBase32, label);
  return totp.toString();
}

/**
 * Generate a QR code data URL from an otpauth URI.
 * @returns {Promise<string>} data:image/png;base64,...
 */
async function generateQRDataURL(otpauthURI) {
  return QRCode.toDataURL(otpauthURI, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 256,
  });
}

// ─── Recovery Codes ─────────────────────────────────────────────────────────────

/**
 * Generate plaintext recovery codes (shown once to user).
 * @returns {string[]} Array of formatted codes like "XXXX-XXXX"
 */
function generateRecoveryCodes() {
  const codes = [];
  for (let i = 0; i < RECOVERY_CODE_COUNT; i++) {
    const raw = crypto.randomBytes(RECOVERY_CODE_LENGTH).toString('hex').slice(0, RECOVERY_CODE_LENGTH).toUpperCase();
    // Format as XXXX-XXXX for readability
    codes.push(`${raw.slice(0, 4)}-${raw.slice(4, 8)}`);
  }
  return codes;
}

/**
 * Hash recovery codes for storage.
 * @param {string[]} plaintextCodes
 * @returns {Promise<Array<{ hash: string, used: boolean }>>}
 */
async function hashRecoveryCodes(plaintextCodes) {
  const hashed = [];
  for (const code of plaintextCodes) {
    const normalized = code.replace(/-/g, '').toUpperCase();
    const hash = await bcrypt.hash(normalized, BCRYPT_ROUNDS);
    hashed.push({ hash, used: false, usedAt: null });
  }
  return hashed;
}

/**
 * Verify a recovery code against stored hashes. Returns the index if valid, -1 otherwise.
 * @param {string} inputCode
 * @param {Array<{ hash: string, used: boolean }>} storedCodes
 * @returns {Promise<number>} index of matching code, or -1
 */
async function verifyRecoveryCode(inputCode, storedCodes) {
  const normalized = String(inputCode).replace(/-/g, '').toUpperCase();
  for (let i = 0; i < storedCodes.length; i++) {
    if (storedCodes[i].used) continue;
    const match = await bcrypt.compare(normalized, storedCodes[i].hash);
    if (match) return i;
  }
  return -1;
}

// ─── Rate Limiting ──────────────────────────────────────────────────────────────

/**
 * Check if a user is currently locked out of 2FA attempts.
 * @param {object} user Mongoose user document
 * @returns {{ locked: boolean, remainingMs: number }}
 */
function checkLockout(user) {
  if (!user.twoFactorLockedUntil) return { locked: false, remainingMs: 0 };
  const now = Date.now();
  const until = new Date(user.twoFactorLockedUntil).getTime();
  if (now < until) {
    return { locked: true, remainingMs: until - now };
  }
  return { locked: false, remainingMs: 0 };
}

/**
 * Record a failed 2FA attempt. Returns true if the user is now locked.
 * @param {object} user Mongoose user document
 * @returns {Promise<boolean>} true if locked
 */
async function recordFailedAttempt(user) {
  user.twoFactorFailedAttempts = (user.twoFactorFailedAttempts || 0) + 1;
  if (user.twoFactorFailedAttempts >= MAX_FAILED_ATTEMPTS) {
    user.twoFactorLockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
    await user.save();
    return true;
  }
  await user.save();
  return false;
}

/**
 * Reset failed attempts counter after successful verification.
 * @param {object} user Mongoose user document
 */
async function resetFailedAttempts(user) {
  if (user.twoFactorFailedAttempts > 0 || user.twoFactorLockedUntil) {
    user.twoFactorFailedAttempts = 0;
    user.twoFactorLockedUntil = null;
    await user.save();
  }
}

// ─── Audit Logging ──────────────────────────────────────────────────────────────

/**
 * Log a security event.
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.event - SecurityEvent.event enum value
 * @param {string} [params.result='success']
 * @param {string} [params.ip='']
 * @param {string} [params.userAgent='']
 * @param {object} [params.metadata={}]
 */
async function logSecurityEvent({ userId, event, result = 'success', ip = '', userAgent = '', metadata = {} }) {
  try {
    await SecurityEvent.create({ userId, event, result, ip, userAgent, metadata });
  } catch (err) {
    // Audit logging must never break the main flow
    console.error('[SecurityAudit] Failed to log event:', err.message);
  }
}

// ─── High-Level Operations ──────────────────────────────────────────────────────

/**
 * Initialize 2FA setup: generate secret, encrypt pending, return QR + secret.
 * Does NOT activate 2FA — user must verify a code first.
 * @param {object} user Mongoose user document
 * @returns {{ qrDataURL: string, secret: string, otpauthURI: string }}
 */
async function initSetup(user) {
  const secretBase32 = generateSecret();
  const label = user.email || user.username || String(user._id);
  const otpauthURI = generateOtpauthURI(secretBase32, label);
  const qrDataURL = await generateQRDataURL(otpauthURI);

  // Encrypt and store as pending (not yet verified)
  const encryptedSecret = encrypt(secretBase32);
  user.twoFactorPendingSecret = encryptedSecret;
  await user.save();

  return { qrDataURL, secret: secretBase32, otpauthURI };
}

/**
 * Verify setup: validate the code against the pending secret, activate 2FA,
 * generate recovery codes.
 * @param {object} user Mongoose user document
 * @param {string} token 6-digit TOTP code
 * @returns {{ success: boolean, recoveryCodes?: string[] }}
 */
async function verifySetup(user, token) {
  const pending = user.twoFactorPendingSecret;
  if (!pending || !pending.encrypted) {
    return { success: false };
  }

  let secretBase32;
  try {
    secretBase32 = decrypt(pending);
  } catch {
    return { success: false };
  }

  const label = user.email || user.username || String(user._id);
  if (!verifyTOTP(secretBase32, token, label)) {
    return { success: false };
  }

  // Promote pending → active
  user.twoFactorSecret = { ...pending };
  user.twoFactorPendingSecret = { encrypted: '', iv: '', tag: '' };
  user.twoFactorEnabled = true;
  user.twoFactorEnabledAt = new Date();

  // Generate recovery codes
  const plaintextCodes = generateRecoveryCodes();
  user.twoFactorRecoveryCodes = await hashRecoveryCodes(plaintextCodes);
  user.twoFactorRecoveryCodesGeneratedAt = new Date();

  // Reset any failed attempts
  user.twoFactorFailedAttempts = 0;
  user.twoFactorLockedUntil = null;

  await user.save();

  return { success: true, recoveryCodes: plaintextCodes };
}

/**
 * Verify a TOTP code for login (against the active secret).
 * @param {object} user Mongoose user document
 * @param {string} token 6-digit TOTP code
 * @returns {boolean}
 */
function verifyLoginToken(user, token) {
  const secret = user.twoFactorSecret;
  if (!secret || !secret.encrypted) return false;

  let secretBase32;
  try {
    secretBase32 = decrypt(secret);
  } catch {
    return false;
  }

  const label = user.email || user.username || String(user._id);
  return verifyTOTP(secretBase32, token, label);
}

/**
 * Use a recovery code for login. Marks the code as used.
 * @param {object} user Mongoose user document
 * @param {string} code Recovery code
 * @returns {Promise<boolean>}
 */
async function useRecoveryCode(user, code) {
  const idx = await verifyRecoveryCode(code, user.twoFactorRecoveryCodes || []);
  if (idx === -1) return false;

  user.twoFactorRecoveryCodes[idx].used = true;
  user.twoFactorRecoveryCodes[idx].usedAt = new Date();
  user.markModified('twoFactorRecoveryCodes');
  await user.save();
  return true;
}

/**
 * Disable 2FA for a user. Clears all 2FA-related fields.
 * @param {object} user Mongoose user document
 */
async function disable(user) {
  user.twoFactorEnabled = false;
  user.twoFactorSecret = { encrypted: '', iv: '', tag: '' };
  user.twoFactorPendingSecret = { encrypted: '', iv: '', tag: '' };
  user.twoFactorEnabledAt = null;
  user.twoFactorRecoveryCodes = [];
  user.twoFactorRecoveryCodesGeneratedAt = null;
  user.twoFactorFailedAttempts = 0;
  user.twoFactorLockedUntil = null;
  user.lastTwoFactorVerifiedAt = null;
  await user.save();
}

/**
 * Regenerate recovery codes (requires 2FA to be active).
 * @param {object} user Mongoose user document
 * @returns {{ recoveryCodes: string[] }}
 */
async function regenerateRecoveryCodes(user) {
  const plaintextCodes = generateRecoveryCodes();
  user.twoFactorRecoveryCodes = await hashRecoveryCodes(plaintextCodes);
  user.twoFactorRecoveryCodesGeneratedAt = new Date();
  user.markModified('twoFactorRecoveryCodes');
  await user.save();
  return { recoveryCodes: plaintextCodes };
}

/**
 * Get the 2FA status for a user (safe for frontend consumption).
 */
function getStatus(user) {
  const remaining = (user.twoFactorRecoveryCodes || []).filter(c => !c.used).length;
  return {
    enabled: !!user.twoFactorEnabled,
    enabledAt: user.twoFactorEnabledAt || null,
    recoveryCodesRemaining: remaining,
    recoveryCodesGeneratedAt: user.twoFactorRecoveryCodesGeneratedAt || null,
    hasPendingSetup: !!(user.twoFactorPendingSecret && user.twoFactorPendingSecret.encrypted),
  };
}

module.exports = {
  // Low-level
  encrypt,
  decrypt,
  generateSecret,
  verifyTOTP,
  generateRecoveryCodes,
  hashRecoveryCodes,
  verifyRecoveryCode,
  checkLockout,
  recordFailedAttempt,
  resetFailedAttempts,
  logSecurityEvent,
  // High-level
  initSetup,
  verifySetup,
  verifyLoginToken,
  useRecoveryCode,
  disable,
  regenerateRecoveryCodes,
  getStatus,
  // Constants (for tests)
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_DURATION_MS,
};
