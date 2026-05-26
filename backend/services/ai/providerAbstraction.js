/**
 * Provider Abstraction — OpenRouter (único provider activo).
 *
 * OpenRouter expone una API 100% compatible OpenAI en https://openrouter.ai/api/v1
 * Config: env OPENROUTER_API_KEY (requerido) + OPENROUTER_MODEL (opcional).
 * Override adicional desde GlobalConfig key: 'ai_provider_config'.
 */

const crypto = require('crypto');
const GlobalConfig = require('../../models/GlobalConfig');
const AIProvider   = require('../../models/AIProvider');
const AIUsageLog   = require('../../models/AIUsageLog');
const { eventBus } = require('../../utils/eventBus');

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_MODEL       = 'openai/gpt-4o-mini';

const CACHE_TTL_MS = 60 * 1000;
let _credCache   = null;
let _credCacheAt = 0;

// ── Encryption ────────────────────────────────────────────────────────────────

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

// ── Config ────────────────────────────────────────────────────────────────────

async function getProviderConfig() {
  const now = Date.now();
  if (_credCache && now - _credCacheAt < CACHE_TTL_MS) return _credCache;

  const config = await GlobalConfig.getValue('ai_provider_config', null);
  const dbOR   = config && config.openrouter ? config.openrouter : {};

  // API key: env > DB (encrypted)
  let apiKey = process.env.OPENROUTER_API_KEY || '';
  if (!apiKey && dbOR.apiKeyEncrypted) {
    try { apiKey = decrypt(dbOR.apiKeyEncrypted); } catch { apiKey = ''; }
  }

  const result = {
    defaultProvider: 'openrouter',
    openrouter: {
      enabled:     true,
      apiKey,
      model:       process.env.OPENROUTER_MODEL || dbOR.model || DEFAULT_MODEL,
      maxTokens:   dbOR.maxTokens   || 4096,
      temperature: dbOR.temperature ?? 0.3,
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

// ── Chat Completion ───────────────────────────────────────────────────────────

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
  const cfg    = { ...config.openrouter, maxTokens: maxTokens || config.openrouter.maxTokens };

  if (!cfg.apiKey) {
    throw new Error('OPENROUTER_API_KEY no configurada. Agregala al .env del servidor.');
  }

  const startedAt = Date.now();
  try {
    const result    = await _callOpenRouter(cfg, { messages, tools, stream });
    const latencyMs = Date.now() - startedAt;

    _logUsage({ provider: 'openrouter', model: cfg.model, userId, agenteId,
      conversationId, tokens: result.usage, latencyMs, success: true }).catch(() => {});

    await AIProvider.findOneAndUpdate(
      { name: 'openrouter' },
      { $set: { consecutiveErrors: 0, lastHealthCheck: new Date(), healthStatus: 'healthy', isEnabled: true },
        $inc: { totalRequests: 1, totalTokensUsed: result.usage?.total_tokens || 0 } },
      { upsert: true }
    );

    return { ...result, provider: 'openrouter' };

  } catch (err) {
    const latencyMs = Date.now() - startedAt;
    console.error('[AI] OpenRouter failed:', err.message);

    await AIProvider.findOneAndUpdate(
      { name: 'openrouter' },
      { $inc: { consecutiveErrors: 1, totalErrors: 1 },
        $set: { lastHealthCheck: new Date(), healthStatus: 'degraded', lastError: err.message } },
      { upsert: true }
    );

    _logUsage({ provider: 'openrouter', model: cfg.model, userId, agenteId,
      conversationId, tokens: null, latencyMs, success: false, errorCode: err.message }).catch(() => {});

    eventBus.emit('ai.provider.failed', { provider: 'openrouter', error: err.message, userId });
    throw err;
  }
}

async function _callOpenRouter(cfg, { messages, tools, stream }) {
  const apiKey = cfg.apiKey;
  const model  = cfg.model || DEFAULT_MODEL;

  const headers = {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'HTTP-Referer':  process.env.SITE_ORIGIN || 'https://anabellaluna.com.ar',
    'X-Title':       'Anabella Luna CRM',
  };

  const body = JSON.stringify({
    model,
    messages,
    temperature: cfg.temperature ?? 0.3,
    max_tokens:  cfg.maxTokens  || 4096,
    ...(tools && tools.length > 0 ? { tools, tool_choice: 'auto' } : {}),
    ...(stream ? { stream: true } : {}),
  });

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST', headers, body,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => response.statusText);
    throw new Error(`OpenRouter API error ${response.status}: ${text}`);
  }

  const data = await response.json();

  if (!data.choices || !data.choices[0]) {
    throw new Error(`OpenRouter returned empty response: ${JSON.stringify(data)}`);
  }

  return {
    choices: data.choices,
    usage:   data.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
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
      costUSD: _estimateCost(model, tokens),
      latencyMs, success, errorCode,
    });
  } catch (err) {
    console.error('[AI] Usage log failed:', err.message);
  }
}

function _estimateCost(model, tokens) {
  if (!tokens) return 0;
  // gpt-4o-mini via OpenRouter: ~$0.00015/1K input + $0.0006/1K output
  if (model && model.includes('gpt-4o-mini')) {
    return ((tokens.prompt_tokens || 0) * 0.00015 + (tokens.completion_tokens || 0) * 0.0006) / 1000;
  }
  return 0;
}

module.exports = { chatCompletion, getProviderConfig, invalidateCache, encrypt, decrypt };
