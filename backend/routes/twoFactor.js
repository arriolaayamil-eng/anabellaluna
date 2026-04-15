/**
 * ─── Two-Factor Authentication Routes ──────────────────────────────────────────
 * All endpoints require a full session JWT (authenticateToken) except
 * POST /verify-login which accepts the short-lived 2FA temp token.
 *
 * Endpoints:
 *   GET    /status              — current 2FA status
 *   POST   /setup/init          — start 2FA setup (generates QR)
 *   POST   /setup/verify        — confirm setup with TOTP code
 *   POST   /verify-login        — verify TOTP during login (temp token)
 *   POST   /disable             — disable 2FA (requires password + TOTP/recovery)
 *   POST   /recovery/regenerate — regenerate recovery codes (requires password + TOTP)
 *   POST   /recovery/use        — use recovery code during login (temp token)
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const twoFactor = require('../services/twoFactorService');
const { authenticateToken } = require('../auth');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'please-change-this-secret';
const TWO_FACTOR_TEMP_SECRET = process.env.TWO_FACTOR_TEMP_TOKEN_SECRET || JWT_SECRET + '_2fa_temp';
const TWO_FACTOR_TEMP_EXPIRY = '5m';

// ─── Helpers ────────────────────────────────────────────────────────────────────

function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || '';
}

function getUA(req) {
  return (req.headers['user-agent'] || '').slice(0, 500);
}

/** Sign the short-lived temp token for 2FA login flow */
function signTempToken(user) {
  return jwt.sign(
    { sub: String(user._id), purpose: '2fa', role: user.role },
    TWO_FACTOR_TEMP_SECRET,
    { expiresIn: TWO_FACTOR_TEMP_EXPIRY }
  );
}

/** Verify the temp token — rejects if purpose !== '2fa' */
function verifyTempToken(token) {
  const payload = jwt.verify(token, TWO_FACTOR_TEMP_SECRET);
  if (payload.purpose !== '2fa') throw new Error('invalid token purpose');
  return payload;
}

/** Sign the full session JWT (same as auth.js signToken) */
function signFullToken(user) {
  return jwt.sign(
    { sub: user._id, username: user.username, role: user.role, agenteId: user.agenteId },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

/** Validate TOTP code format: exactly 6 digits */
function isValidTOTPCode(code) {
  return /^\d{6}$/.test(String(code || ''));
}

/** Validate recovery code format: XXXX-XXXX or XXXXXXXX (alphanumeric) */
function isValidRecoveryCode(code) {
  const normalized = String(code || '').replace(/-/g, '');
  return /^[A-Z0-9]{8}$/i.test(normalized);
}

// Simple in-memory rate limiter per IP for 2FA endpoints
const ipAttempts = new Map();
const IP_WINDOW_MS = 15 * 60 * 1000; // 15 min
const IP_MAX_ATTEMPTS = 20;

function checkIPRateLimit(ip) {
  const now = Date.now();
  const entry = ipAttempts.get(ip);
  if (!entry || now - entry.start > IP_WINDOW_MS) {
    ipAttempts.set(ip, { start: now, count: 1 });
    return true;
  }
  entry.count++;
  if (entry.count > IP_MAX_ATTEMPTS) return false;
  return true;
}

// Periodic cleanup of stale entries (every 5 min)
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of ipAttempts) {
    if (now - entry.start > IP_WINDOW_MS) ipAttempts.delete(ip);
  }
}, 5 * 60 * 1000);

// ─── GET /status ────────────────────────────────────────────────────────────────
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.sub).exec();
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(twoFactor.getStatus(user));
  } catch (err) {
    return res.status(500).json({ error: 'Internal error' });
  }
});

// ─── POST /setup/init ───────────────────────────────────────────────────────────
// Requires: authenticated session. Returns QR code + manual secret.
router.post('/setup/init', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.sub).exec();
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is already enabled. Disable it first to reconfigure.' });
    }

    const { qrDataURL, secret, otpauthURI } = await twoFactor.initSetup(user);

    await twoFactor.logSecurityEvent({
      userId: user._id,
      event: '2fa_setup_init',
      ip: getClientIP(req),
      userAgent: getUA(req),
    });

    return res.json({ qrDataURL, secret, otpauthURI });
  } catch (err) {
    console.error('[2FA setup/init]', err.message);
    return res.status(500).json({ error: 'Failed to initialize 2FA setup' });
  }
});

// ─── POST /setup/verify ─────────────────────────────────────────────────────────
// Requires: authenticated session + valid TOTP code. Activates 2FA + returns recovery codes.
router.post('/setup/verify', authenticateToken, async (req, res) => {
  try {
    const { code } = req.body || {};
    if (!isValidTOTPCode(code)) {
      return res.status(400).json({ error: 'Invalid code format. Must be 6 digits.' });
    }

    const user = await User.findById(req.user.sub).exec();
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.twoFactorEnabled) {
      return res.status(400).json({ error: '2FA is already enabled.' });
    }

    const result = await twoFactor.verifySetup(user, code);

    if (!result.success) {
      await twoFactor.logSecurityEvent({
        userId: user._id,
        event: '2fa_setup_failed',
        result: 'failure',
        ip: getClientIP(req),
        userAgent: getUA(req),
      });
      return res.status(400).json({ error: 'Invalid verification code. Please try again.' });
    }

    await twoFactor.logSecurityEvent({
      userId: user._id,
      event: '2fa_setup_verified',
      ip: getClientIP(req),
      userAgent: getUA(req),
    });

    return res.json({
      enabled: true,
      recoveryCodes: result.recoveryCodes,
      message: 'Two-factor authentication has been enabled. Save your recovery codes securely.',
    });
  } catch (err) {
    console.error('[2FA setup/verify]', err.message);
    return res.status(500).json({ error: 'Failed to verify 2FA setup' });
  }
});

// ─── POST /verify-login ─────────────────────────────────────────────────────────
// Requires: twoFactorToken (temp JWT) + TOTP code. Returns full session JWT.
router.post('/verify-login', async (req, res) => {
  const ip = getClientIP(req);
  if (!checkIPRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many attempts. Please wait and try again.' });
  }

  try {
    const { twoFactorToken, code } = req.body || {};

    if (!twoFactorToken) return res.status(400).json({ error: 'Missing authentication token' });
    if (!isValidTOTPCode(code)) return res.status(400).json({ error: 'Invalid code format' });

    let payload;
    try {
      payload = verifyTempToken(twoFactorToken);
    } catch {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }

    const user = await User.findById(payload.sub).exec();
    if (!user || !user.twoFactorEnabled) {
      return res.status(401).json({ error: 'Invalid authentication state' });
    }

    // Check user-level lockout
    const lockout = twoFactor.checkLockout(user);
    if (lockout.locked) {
      const mins = Math.ceil(lockout.remainingMs / 60000);
      return res.status(429).json({ error: `Account temporarily locked. Try again in ${mins} minute(s).` });
    }

    // Verify TOTP
    const valid = twoFactor.verifyLoginToken(user, code);

    if (!valid) {
      const locked = await twoFactor.recordFailedAttempt(user);
      await twoFactor.logSecurityEvent({
        userId: user._id,
        event: locked ? '2fa_locked' : '2fa_login_failed',
        result: 'failure',
        ip,
        userAgent: getUA(req),
        metadata: { attempts: user.twoFactorFailedAttempts },
      });
      return res.status(401).json({ error: 'Invalid verification code' });
    }

    // Success — reset counters, issue full JWT
    await twoFactor.resetFailedAttempts(user);
    user.lastTwoFactorVerifiedAt = new Date();
    await user.save();

    await twoFactor.logSecurityEvent({
      userId: user._id,
      event: '2fa_login_success',
      ip,
      userAgent: getUA(req),
    });

    const token = signFullToken(user);
    return res.json({ token });
  } catch (err) {
    console.error('[2FA verify-login]', err.message);
    return res.status(500).json({ error: 'Verification failed' });
  }
});

// ─── POST /recovery/use ─────────────────────────────────────────────────────────
// Use a recovery code during login. Requires temp token + recovery code.
router.post('/recovery/use', async (req, res) => {
  const ip = getClientIP(req);
  if (!checkIPRateLimit(ip)) {
    return res.status(429).json({ error: 'Too many attempts. Please wait and try again.' });
  }

  try {
    const { twoFactorToken, recoveryCode } = req.body || {};

    if (!twoFactorToken) return res.status(400).json({ error: 'Missing authentication token' });
    if (!isValidRecoveryCode(recoveryCode)) return res.status(400).json({ error: 'Invalid recovery code format' });

    let payload;
    try {
      payload = verifyTempToken(twoFactorToken);
    } catch {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }

    const user = await User.findById(payload.sub).exec();
    if (!user || !user.twoFactorEnabled) {
      return res.status(401).json({ error: 'Invalid authentication state' });
    }

    const lockout = twoFactor.checkLockout(user);
    if (lockout.locked) {
      const mins = Math.ceil(lockout.remainingMs / 60000);
      return res.status(429).json({ error: `Account temporarily locked. Try again in ${mins} minute(s).` });
    }

    const used = await twoFactor.useRecoveryCode(user, recoveryCode);
    if (!used) {
      const locked = await twoFactor.recordFailedAttempt(user);
      await twoFactor.logSecurityEvent({
        userId: user._id,
        event: '2fa_login_failed',
        result: 'failure',
        ip,
        userAgent: getUA(req),
        metadata: { method: 'recovery_code', attempts: user.twoFactorFailedAttempts },
      });
      return res.status(401).json({ error: 'Invalid recovery code' });
    }

    await twoFactor.resetFailedAttempts(user);
    user.lastTwoFactorVerifiedAt = new Date();
    await user.save();

    const remaining = (user.twoFactorRecoveryCodes || []).filter(c => !c.used).length;

    await twoFactor.logSecurityEvent({
      userId: user._id,
      event: '2fa_recovery_used',
      ip,
      userAgent: getUA(req),
      metadata: { remainingCodes: remaining },
    });

    const token = signFullToken(user);
    return res.json({ token, recoveryCodesRemaining: remaining });
  } catch (err) {
    console.error('[2FA recovery/use]', err.message);
    return res.status(500).json({ error: 'Recovery code verification failed' });
  }
});

// ─── POST /disable ──────────────────────────────────────────────────────────────
// Requires: full session + password + (TOTP code OR recovery code)
router.post('/disable', authenticateToken, async (req, res) => {
  try {
    const { password, code, recoveryCode } = req.body || {};

    if (!password) return res.status(400).json({ error: 'Password is required' });
    if (!code && !recoveryCode) return res.status(400).json({ error: 'TOTP code or recovery code is required' });

    const user = await User.findById(req.user.sub).exec();
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.twoFactorEnabled) return res.status(400).json({ error: '2FA is not enabled' });

    // Verify password
    if (!user.password_hash) return res.status(400).json({ error: 'Password verification not available for this account' });
    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) return res.status(401).json({ error: 'Invalid password' });

    // Verify TOTP or recovery code
    let verified = false;
    if (code) {
      if (!isValidTOTPCode(code)) return res.status(400).json({ error: 'Invalid code format' });
      verified = twoFactor.verifyLoginToken(user, code);
    } else if (recoveryCode) {
      if (!isValidRecoveryCode(recoveryCode)) return res.status(400).json({ error: 'Invalid recovery code format' });
      verified = await twoFactor.useRecoveryCode(user, recoveryCode);
    }

    if (!verified) {
      return res.status(401).json({ error: 'Invalid verification code' });
    }

    await twoFactor.disable(user);

    await twoFactor.logSecurityEvent({
      userId: user._id,
      event: '2fa_disabled',
      ip: getClientIP(req),
      userAgent: getUA(req),
    });

    return res.json({ enabled: false, message: 'Two-factor authentication has been disabled.' });
  } catch (err) {
    console.error('[2FA disable]', err.message);
    return res.status(500).json({ error: 'Failed to disable 2FA' });
  }
});

// ─── POST /recovery/regenerate ──────────────────────────────────────────────────
// Requires: full session + password + TOTP code
router.post('/recovery/regenerate', authenticateToken, async (req, res) => {
  try {
    const { password, code } = req.body || {};

    if (!password) return res.status(400).json({ error: 'Password is required' });
    if (!isValidTOTPCode(code)) return res.status(400).json({ error: 'Invalid TOTP code format' });

    const user = await User.findById(req.user.sub).exec();
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.twoFactorEnabled) return res.status(400).json({ error: '2FA is not enabled' });

    // Verify password
    if (!user.password_hash) return res.status(400).json({ error: 'Password verification not available for this account' });
    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) return res.status(401).json({ error: 'Invalid password' });

    // Verify TOTP
    const valid = twoFactor.verifyLoginToken(user, code);
    if (!valid) return res.status(401).json({ error: 'Invalid verification code' });

    const { recoveryCodes } = await twoFactor.regenerateRecoveryCodes(user);

    await twoFactor.logSecurityEvent({
      userId: user._id,
      event: '2fa_recovery_regenerated',
      ip: getClientIP(req),
      userAgent: getUA(req),
    });

    return res.json({
      recoveryCodes,
      message: 'Recovery codes regenerated. Previous codes are now invalid.',
    });
  } catch (err) {
    console.error('[2FA recovery/regenerate]', err.message);
    return res.status(500).json({ error: 'Failed to regenerate recovery codes' });
  }
});

module.exports = { router, signTempToken, verifyTempToken };
