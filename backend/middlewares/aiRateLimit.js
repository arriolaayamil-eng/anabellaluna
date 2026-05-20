/**
 * Rate limiting para endpoints AI.
 * Usa Redis si está disponible, fallback en memoria si no.
 */

const redis = require('../redis');

/**
 * Middleware de rate limit para requests AI.
 * Default: 20 requests por minuto por usuario.
 */
function aiRateLimit({ maxRequests = 20, windowSeconds = 60 } = {}) {
  return async (req, res, next) => {
    if (!req.user) return next();

    const userId = String(req.user.sub || req.user.id || req.user._id || 'anonymous');
    const key = `ai_rate:${userId}`;

    try {
      const allowed = await redis.checkRateLimit(key, maxRequests, windowSeconds);

      if (!allowed) {
        return res.status(429).json({
          error: 'Too many AI requests. Please wait a moment.',
          retryAfter: windowSeconds,
        });
      }

      next();
    } catch (err) {
      // Si el rate limiter falla, permitir el request
      console.error('[aiRateLimit] Error:', err.message);
      next();
    }
  };
}

module.exports = { aiRateLimit };
