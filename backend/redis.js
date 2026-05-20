/**
 * Redis client — degradación elegante.
 * Si REDIS_URL no está configurado o Redis no está disponible,
 * el sistema continúa funcionando con fallbacks en memoria.
 */

let _client = null;
let _available = false;

async function connect() {
  if (!process.env.REDIS_URL) {
    console.log('[Redis] REDIS_URL not set — Redis disabled, using in-memory fallbacks.');
    return null;
  }

  try {
    const { createClient } = require('redis');
    _client = createClient({ url: process.env.REDIS_URL });

    _client.on('error', (err) => {
      if (_available) {
        console.error('[Redis] Connection error:', err.message);
      }
      _available = false;
    });

    _client.on('ready', () => {
      _available = true;
      console.log('[Redis] Connected and ready.');
    });

    _client.on('reconnecting', () => {
      console.log('[Redis] Reconnecting...');
    });

    await _client.connect();
    return _client;
  } catch (err) {
    console.warn(`[Redis] Failed to connect: ${err.message}. Continuing without Redis.`);
    _client = null;
    _available = false;
    return null;
  }
}

function isAvailable() {
  return _available && _client !== null;
}

function getClient() {
  return _client;
}

// ── Helpers con fallback graceful ─────────────────────────────────────────────

async function get(key) {
  if (!isAvailable()) return null;
  try {
    return await _client.get(key);
  } catch (err) {
    console.error('[Redis] get error:', err.message);
    return null;
  }
}

async function set(key, value, ttlSeconds) {
  if (!isAvailable()) return false;
  try {
    if (ttlSeconds) {
      await _client.set(key, value, { EX: ttlSeconds });
    } else {
      await _client.set(key, value);
    }
    return true;
  } catch (err) {
    console.error('[Redis] set error:', err.message);
    return false;
  }
}

async function del(key) {
  if (!isAvailable()) return false;
  try {
    await _client.del(key);
    return true;
  } catch (err) {
    console.error('[Redis] del error:', err.message);
    return false;
  }
}

async function getJSON(key) {
  const raw = await get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function setJSON(key, value, ttlSeconds) {
  return set(key, JSON.stringify(value), ttlSeconds);
}

// ── Rate limiting con fallback en memoria ─────────────────────────────────────

const _memRateLimits = new Map();

async function checkRateLimit(key, maxRequests, windowSeconds) {
  if (isAvailable()) {
    try {
      const multi = _client.multi();
      multi.incr(key);
      multi.expire(key, windowSeconds);
      const [count] = await multi.exec();
      return count <= maxRequests;
    } catch (err) {
      console.error('[Redis] rate limit error:', err.message);
    }
  }

  // Fallback en memoria
  const now = Date.now();
  const entry = _memRateLimits.get(key);
  if (!entry || now > entry.resetAt) {
    _memRateLimits.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return true;
  }
  entry.count++;
  return entry.count <= maxRequests;
}

// ── Duplicate para Socket.IO adapter ─────────────────────────────────────────

function createDuplicate() {
  if (!_client) throw new Error('Redis client not initialized');
  return _client.duplicate();
}

module.exports = {
  connect,
  isAvailable,
  getClient,
  get,
  set,
  del,
  getJSON,
  setJSON,
  checkRateLimit,
  createDuplicate,
};
