/**
 * Provider Abstraction — OpenClaw (único provider activo).
 *
 * Config almacenada en GlobalConfig key: 'ai_provider_config'
 * OpenClaw expone una API OpenAI-compatible en /v1/chat/completions.
 */

const crypto = require('crypto');
const GlobalConfig = require('../../models/GlobalConfig');
const AIProvider   = require('../../models/AIProvider');
const AIUsageLog   = require('../../models/AIUsageLog');
const { eventBus } = require('../../utils/eventBus');

const CACHE_TTL_MS = 60 * 1000;
let _credCache    = null;
let _credCacheAt  = 0;

const VALID_PROVIDERS = new Set(['openclaw']);
const DEFAULT_MODEL   = { openclaw: 'openclaw' };

// ── Helpers ───────────────────────────────────────────────────────────────────

function _isValidOpenClawEnv() {
  return !!(process.env.OPENCLAW_BASE_URL && process.env.OPENCLAW_BASE_URL.startsWith('http'));
}

// ── Encryption (idéntico a mercadoLibre.js) ───────────────────────────────────

function _getEncKey() {
  const key = process.env.AI_ENCRYPTION_KEY;
  if (!key || key.length < 32) return null;
  return Buffer.from(key.padEnd(64, '0').substring(0, 64), 'hex');
}

function encrypt(text) {
  const key = _getEncKey();
  if (!key) throw new Error('AI_ENCRYPTION_KEY not configured');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let enc = cipher.update(text, 'utf8', 'hex');
  enc += cipher.final('hex');
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${enc}`;
}

function decrypt(text) {
  const key = _getEncKey();
  if (!key) throw new Error('AI_ENCRYPTION_KEY not configured');
  const [ivHex, tagHex, enc] = text.split(':');
  const iv  = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  let dec = decipher.update(enc, 'hex', 'utf8');
  dec += decipher.final('utf8');
  return dec;
}

// ── Config desde GlobalConfig ─────────────────────────────────────────────────

async function getProviderConfig() {
  const now = Date.now();
  if (_credCache && now - _credCacheAt < CACHE_TTL_MS) {
    return _credCache;
  }

  const config = await GlobalConfig.getValue('ai_provider_config', null);

  // Construir config de OpenClaw: DB + env vars (env siempre toma precedencia en baseUrl)
  const dbClaw = config && config.openclaw ? config.openclaw : {};
  let apiKey = '';
  if (dbClaw.apiKeyEncrypted) {
    try { apiKey = decrypt(dbClaw.apiKeyEncrypted); } catch { apiKey = ''; }
  }
  if (!apiKey) apiKey = process.env.OPENCLAW_TOKEN || '';

  const result = {
    defaultProvider: 'openclaw',
    openclaw: {
      enabled:     true,
      model:       process.env.OPENCLAW_MODEL || dbClaw.model || 'openrouter/openai/gpt-4o-mini',
      maxTokens:   dbClaw.maxTokens   || 4096,
      temperature: dbClaw.temperature ?? 0.3,
      baseUrl:     process.env.OPENCLAW_BASE_URL || dbClaw.baseUrl || 'http://127.0.0.1:18789',
      apiKey,
    },
  };

  _credCache   = result;
  _credCacheAt = now;
  return result;
}

function invalidateCache() {
  _credCache   = null;
  _credCacheAt = 0;
}

// ── Chat Completion ────────────────────────────────────────────────────────────

async function chatCompletion({
  messages,
  tools,
  stream = false,
  userId,
  agenteId,
  conversationId,
  maxTokens,
}) {
  const config = await getProviderConfig();
  const cfg    = { ...config.openclaw, maxTokens: maxTokens || config.openclaw.maxTokens };

  const startedAt = Date.now();
  try {
    const result    = await _callOpenClaw(cfg, { messages, tools, stream });
    const latencyMs = Date.now() - startedAt;

    _logUsage({ provider: 'openclaw', model: cfg.model, userId, agenteId,
      conversationId, tokens: result.usage, latencyMs, success: true }).catch(() => {});

    await AIProvider.findOneAndUpdate(
      { name: 'openclaw' },
      { $set: { consecutiveErrors: 0, lastHealthCheck: new Date(), healthStatus: 'healthy', isEnabled: true },
        $inc: { totalRequests: 1, totalTokensUsed: result.usage?.total_tokens || 0 } },
      { upsert: true }
    );

    return { ...result, provider: 'openclaw' };

  } catch (err) {
    const latencyMs = Date.now() - startedAt;
    console.error('[AI] OpenClaw failed:', err.message);

    await AIProvider.findOneAndUpdate(
      { name: 'openclaw' },
      { $inc: { consecutiveErrors: 1, totalErrors: 1 },
        $set: { lastHealthCheck: new Date(), healthStatus: 'degraded', lastError: err.message } },
      { upsert: true }
    );

    _logUsage({ provider: 'openclaw', model: cfg.model, userId, agenteId,
      conversationId, tokens: null, latencyMs, success: false, errorCode: err.message }).catch(() => {});

    eventBus.emit('ai.provider.failed', { provider: 'openclaw', error: err.message, userId });
    throw err;
  }
}

async function _callOpenClaw(cfg, { messages, tools, stream }) {
  const baseUrl = cfg.baseUrl || process.env.OPENCLAW_BASE_URL || 'http://localhost:18789';
  const token   = cfg.apiKey  || process.env.OPENCLAW_TOKEN   || '';
  const model   = cfg.model   || DEFAULT_MODEL.openclaw;

  const headers = {
    'Content-Type':  'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const body = JSON.stringify({
    model,
    messages,
    temperature: cfg.temperature ?? 0.3,
    max_tokens:  cfg.maxTokens  || 4096,
    ...(tools && tools.length > 0 ? { tools, tool_choice: 'auto' } : {}),
    ...(stream ? { stream: true } : {}),
  });

  const response = await fetch(`${baseUrl}/v1/chat/completions`, { method: 'POST', headers, body });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`OpenClaw API error ${response.status}: ${text}`);
  }

  const data = await response.json();

  if (!data.choices || !data.choices[0]) {
    throw new Error('OpenClaw returned an empty response');
  }

  return {
    choices: data.choices,
    usage: data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  };
}

// ── Usage logging ─────────────────────────────────────────────────────────────

async function _logUsage({ provider, model, userId, agenteId, conversationId, tokens, latencyMs, success, errorCode }) {
  try {
    await AIUsageLog.create({
      provider, model, userId, agenteId, conversationId,
      promptTokens:     tokens?.prompt_tokens     || 0,
      completionTokens: tokens?.completion_tokens || 0,
      totalTokens:      tokens?.total_tokens      || 0,
      costUSD: _estimateCost(provider, model, tokens),
      latencyMs, success, errorCode,
    });
  } catch (err) {
    console.error('[AI] Usage log failed:', err.message);
  }
}

function _estimateCost() {
  return 0; // OpenClaw es local, sin costo
}

module.exports = { chatCompletion, getProviderConfig, invalidateCache, encrypt, decrypt };
