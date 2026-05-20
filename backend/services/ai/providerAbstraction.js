/**
 * Provider Abstraction — OpenAI / Anthropic con failover automático.
 *
 * Config almacenada en GlobalConfig key: 'ai_provider_config'
 * Mismo patrón de encriptación que googleCalendar.js y mercadoLibre.js.
 */

const crypto = require('crypto');
const GlobalConfig = require('../../models/GlobalConfig');
const AIProvider   = require('../../models/AIProvider');
const AIUsageLog   = require('../../models/AIUsageLog');
const { eventBus } = require('../../utils/eventBus');

const CACHE_TTL_MS = 60 * 1000;
let _credCache    = null;
let _credCacheAt  = 0;

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
  if (!config) return null;

  const result = JSON.parse(JSON.stringify(config)); // deep clone

  if (result.openai && result.openai.apiKeyEncrypted) {
    try {
      result.openai.apiKey = decrypt(result.openai.apiKeyEncrypted);
    } catch {
      result.openai.apiKey = null;
    }
  }
  if (result.anthropic && result.anthropic.apiKeyEncrypted) {
    try {
      result.anthropic.apiKey = decrypt(result.anthropic.apiKeyEncrypted);
    } catch {
      result.anthropic.apiKey = null;
    }
  }

  _credCache   = result;
  _credCacheAt = now;
  return result;
}

function invalidateCache() {
  _credCache   = null;
  _credCacheAt = 0;
}

// ── Chat Completion con failover ───────────────────────────────────────────────

async function chatCompletion({
  messages,
  tools,
  stream = false,
  userId,
  agenteId,
  conversationId,
  provider: forcedProvider,
  maxTokens,
}) {
  const config = await getProviderConfig();
  if (!config) {
    throw new Error('AI providers not configured. Go to ERP → Integraciones → AI Providers.');
  }

  const providerOrder = forcedProvider
    ? [forcedProvider]
    : [config.defaultProvider, config.fallbackProvider].filter(Boolean);

  let lastError;

  for (const providerName of providerOrder) {
    const pCfg = config[providerName];
    if (!pCfg || !pCfg.enabled || !pCfg.apiKey) continue;

    const startedAt = Date.now();
    try {
      const result = await _callProvider(providerName, { ...pCfg, maxTokens: maxTokens || pCfg.maxTokens }, { messages, tools, stream });
      const latencyMs = Date.now() - startedAt;

      _logUsage({ provider: providerName, model: pCfg.model, userId, agenteId,
        conversationId, tokens: result.usage, latencyMs, success: true }).catch(() => {});

      await AIProvider.findOneAndUpdate(
        { name: providerName },
        { $set: { consecutiveErrors: 0, lastHealthCheck: new Date(), healthStatus: 'healthy', isEnabled: true },
          $inc: { totalRequests: 1, totalTokensUsed: result.usage?.total_tokens || 0 } },
        { upsert: true }
      );

      return { ...result, provider: providerName };

    } catch (err) {
      const latencyMs = Date.now() - startedAt;
      lastError = err;

      console.error(`[AI] Provider ${providerName} failed:`, err.message);

      await AIProvider.findOneAndUpdate(
        { name: providerName },
        { $inc: { consecutiveErrors: 1, totalErrors: 1 },
          $set: { lastHealthCheck: new Date(), healthStatus: 'degraded', lastError: err.message } },
        { upsert: true }
      );

      _logUsage({ provider: providerName, model: pCfg?.model, userId, agenteId,
        conversationId, tokens: null, latencyMs, success: false, errorCode: err.message }).catch(() => {});

      eventBus.emit('ai.provider.failed', { provider: providerName, error: err.message, userId });
    }
  }

  throw lastError || new Error('All AI providers are unavailable or not configured.');
}

// ── Provider implementations ───────────────────────────────────────────────────

async function _callProvider(providerName, cfg, { messages, tools, stream }) {
  if (providerName === 'openai')    return _callOpenAI(cfg, { messages, tools, stream });
  if (providerName === 'anthropic') return _callAnthropic(cfg, { messages, tools, stream });
  throw new Error(`Unknown provider: ${providerName}`);
}

async function _callOpenAI(cfg, { messages, tools, stream }) {
  // Dynamic import para no fallar si no está instalado
  let OpenAI;
  try {
    ({ default: OpenAI } = await import('openai'));
  } catch {
    throw new Error('openai package not installed. Run: npm install openai');
  }

  const client = new OpenAI({ apiKey: cfg.apiKey });
  const params = {
    model: cfg.model || 'gpt-4o',
    messages,
    temperature: cfg.temperature ?? 0.3,
    max_tokens: cfg.maxTokens || 4096,
  };

  if (tools && tools.length > 0) {
    params.tools = tools;
    params.tool_choice = 'auto';
  }

  if (stream) {
    return client.chat.completions.create({ ...params, stream: true });
  }

  return client.chat.completions.create(params);
}

async function _callAnthropic(cfg, { messages, tools, stream }) {
  let Anthropic;
  try {
    ({ default: Anthropic } = await import('@anthropic-ai/sdk'));
  } catch {
    try {
      Anthropic = require('@anthropic-ai/sdk');
    } catch {
      throw new Error('@anthropic-ai/sdk package not installed. Run: npm install @anthropic-ai/sdk');
    }
  }

  const client = new Anthropic({ apiKey: cfg.apiKey });

  const systemMsg = messages.find((m) => m.role === 'system');
  const userMsgs  = messages.filter((m) => m.role !== 'system');

  const params = {
    model: cfg.model || 'claude-3-5-sonnet-20241022',
    max_tokens: cfg.maxTokens || 4096,
    messages: userMsgs,
    temperature: cfg.temperature ?? 0.3,
  };

  if (systemMsg) params.system = systemMsg.content;

  if (tools && tools.length > 0) {
    params.tools = tools.map((t) => ({
      name:         t.function.name,
      description:  t.function.description,
      input_schema: t.function.parameters,
    }));
  }

  if (stream) {
    return client.messages.stream(params);
  }

  const response = await client.messages.create(params);
  return _normalizeAnthropic(response);
}

function _normalizeAnthropic(response) {
  const textContent = response.content.find((c) => c.type === 'text');
  const toolUses    = response.content.filter((c) => c.type === 'tool_use');

  const message = {
    role: 'assistant',
    content: textContent ? textContent.text : '',
    tool_calls: toolUses.map((c) => ({
      id:   c.id,
      type: 'function',
      function: {
        name:      c.name,
        arguments: JSON.stringify(c.input),
      },
    })),
  };

  return {
    choices: [{
      message,
      finish_reason: response.stop_reason === 'tool_use' ? 'tool_calls' : 'stop',
    }],
    usage: {
      prompt_tokens:     response.usage.input_tokens,
      completion_tokens: response.usage.output_tokens,
      total_tokens:      response.usage.input_tokens + response.usage.output_tokens,
    },
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

function _estimateCost(provider, model, tokens) {
  if (!tokens) return 0;
  const pricing = {
    'gpt-4o':                     { input: 2.5,  output: 10 },
    'gpt-4o-mini':                { input: 0.15, output: 0.6 },
    'claude-3-5-sonnet-20241022': { input: 3,    output: 15 },
    'claude-3-5-haiku-20241022':  { input: 0.8,  output: 4 },
    'claude-3-haiku-20240307':    { input: 0.25, output: 1.25 },
  };
  const p = pricing[model] || { input: 5, output: 15 };
  const inp = ((tokens.prompt_tokens     || 0) / 1_000_000) * p.input;
  const out = ((tokens.completion_tokens || 0) / 1_000_000) * p.output;
  return +(inp + out).toFixed(6);
}

module.exports = { chatCompletion, getProviderConfig, invalidateCache, encrypt, decrypt };
