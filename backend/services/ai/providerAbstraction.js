/**
 * Provider Abstraction — OpenAI / Anthropic / Gemini con failover automático.
 *
 * Config almacenada en GlobalConfig key: 'ai_provider_config'
 * Mismo patrón de encriptación que googleCalendar.js y mercadoLibre.js.
 *
 * Prioridad de providers: defaultProvider → fallbackProvider (sin hardcode de Gemini).
 * Si GEMINI_API_KEY está en env con formato válido (AIza...), se usa como bootstrap
 * cuando no hay NADA configurado en DB.
 */

const crypto = require('crypto');
const GlobalConfig = require('../../models/GlobalConfig');
const AIProvider   = require('../../models/AIProvider');
const AIUsageLog   = require('../../models/AIUsageLog');
const { eventBus } = require('../../utils/eventBus');

const CACHE_TTL_MS = 60 * 1000;
let _credCache    = null;
let _credCacheAt  = 0;

const VALID_PROVIDERS = new Set(['openai', 'anthropic', 'gemini', 'openclaw']);
const DEFAULT_MODEL   = { openai: 'gpt-4o', anthropic: 'claude-sonnet-4-20250514', gemini: 'gemini-2.0-flash', openclaw: 'openclaw' };

// ── Helpers ───────────────────────────────────────────────────────────────────

function _isValidGeminiEnvKey() {
  const k = process.env.GEMINI_API_KEY;
  return k && k.startsWith('AIza') && k.length > 20;
}

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

function _decryptProviderKey(providerCfg) {
  if (!providerCfg || !providerCfg.apiKeyEncrypted) return;
  try {
    providerCfg.apiKey = decrypt(providerCfg.apiKeyEncrypted);
  } catch {
    providerCfg.apiKey = null;
  }
}

async function getProviderConfig() {
  const now = Date.now();
  if (_credCache && now - _credCacheAt < CACHE_TTL_MS) {
    return _credCache;
  }

  const config = await GlobalConfig.getValue('ai_provider_config', null);
  if (!config) return null;

  const result = JSON.parse(JSON.stringify(config)); // deep clone

  // Desencriptar API keys de cada provider
  _decryptProviderKey(result.openai);
  _decryptProviderKey(result.anthropic);
  _decryptProviderKey(result.gemini);

  // Gemini env fallback: solo si NO hay key en DB y el env tiene una key con formato válido
  if ((!result.gemini || !result.gemini.apiKey) && _isValidGeminiEnvKey()) {
    result.gemini = {
      enabled:     true,
      model:       'gemini-2.0-flash',
      maxTokens:   4096,
      temperature: 0.3,
      ...(result.gemini || {}),
      apiKey:      process.env.GEMINI_API_KEY,
    };
  }

  // OpenClaw env fallback: si hay OPENCLAW_BASE_URL en env y no hay config en DB
  if ((!result.openclaw || !result.openclaw.baseUrl) && _isValidOpenClawEnv()) {
    result.openclaw = {
      enabled:     true,
      model:       'openclaw',
      maxTokens:   4096,
      temperature: 0.3,
      ...(result.openclaw || {}),
      baseUrl:     process.env.OPENCLAW_BASE_URL,
      apiKey:      process.env.OPENCLAW_TOKEN || '',
    };
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

  // Bootstrap: sin config en DB, intentar con env vars.
  if (!config) {
    if (_isValidOpenClawEnv()) {
      const bootstrapCfg = {
        defaultProvider: 'openclaw',
        openclaw: { enabled: true, baseUrl: process.env.OPENCLAW_BASE_URL, apiKey: process.env.OPENCLAW_TOKEN || '', model: 'openclaw', maxTokens: 4096, temperature: 0.3 },
      };
      return _runWithConfig(bootstrapCfg, { messages, tools, stream, userId, agenteId, conversationId, maxTokens, forcedProvider });
    }
    if (_isValidGeminiEnvKey()) {
      const bootstrapCfg = {
        defaultProvider: 'gemini',
        gemini: { enabled: true, apiKey: process.env.GEMINI_API_KEY, model: 'gemini-2.0-flash', maxTokens: 4096, temperature: 0.3 },
      };
      return _runWithConfig(bootstrapCfg, { messages, tools, stream, userId, agenteId, conversationId, maxTokens, forcedProvider });
    }
    throw new Error('AI providers not configured. Configurá un proveedor en ERP → AI Config.');
  }

  return _runWithConfig(config, { messages, tools, stream, userId, agenteId, conversationId, maxTokens, forcedProvider });
}

async function _runWithConfig(config, { messages, tools, stream, userId, agenteId, conversationId, maxTokens, forcedProvider }) {
  // Construir orden de providers SIN hardcodear Gemini al final.
  // Solo se intentan los providers que el admin configuró.
  const providerOrder = forcedProvider
    ? [forcedProvider]
    : [config.defaultProvider, config.fallbackProvider].filter(Boolean);

  // Deduplicar
  const seen = new Set();
  const uniqueOrder = providerOrder.filter((p) => {
    if (seen.has(p) || !VALID_PROVIDERS.has(p)) return false;
    seen.add(p);
    return true;
  });

  let lastError;

  for (const providerName of uniqueOrder) {
    const pCfg = config[providerName];
    const needsKey = providerName !== 'openclaw';
    if (!pCfg || !pCfg.enabled) continue;
    if (needsKey && !pCfg.apiKey) continue;
    if (providerName === 'openclaw' && !pCfg.baseUrl && !process.env.OPENCLAW_BASE_URL) continue;

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
  if (providerName === 'gemini')    return _callGemini(cfg, { messages, tools, stream });
  if (providerName === 'openclaw')  return _callOpenClaw(cfg, { messages, tools, stream });
  throw new Error(`Unknown provider: ${providerName}`);
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

async function _callGemini(cfg, { messages, tools }) {
  let GoogleGenAI;
  try {
    ({ GoogleGenerativeAI: GoogleGenAI } = require('@google/generative-ai'));
  } catch {
    throw new Error('@google/generative-ai package not installed. Run: npm install @google/generative-ai');
  }

  const client = new GoogleGenAI(cfg.apiKey);
  const model  = client.getGenerativeModel({
    model:             cfg.model || DEFAULT_MODEL.gemini,
    generationConfig:  { maxOutputTokens: cfg.maxTokens || 4096, temperature: cfg.temperature ?? 0.3 },
  });

  // Convert OpenAI-style messages → Gemini format
  const systemMsg = messages.find((m) => m.role === 'system');
  const history   = [];
  const chatMsgs  = messages.filter((m) => m.role !== 'system');

  for (let i = 0; i < chatMsgs.length - 1; i++) {
    const m = chatMsgs[i];
    history.push({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content || '' }] });
  }

  const lastMsg  = chatMsgs[chatMsgs.length - 1];
  const userText = lastMsg ? (lastMsg.content || '') : '';
  const prompt   = systemMsg ? `${systemMsg.content}\n\n${userText}` : userText;

  // Tool declarations (Gemini function calling)
  const toolConfig = tools && tools.length > 0
    ? [{ functionDeclarations: tools.map((t) => ({
        name:        t.function.name,
        description: t.function.description,
        parameters:  t.function.parameters,
      })) }]
    : [];

  const chat = model.startChat({
    history,
    ...(toolConfig.length > 0 ? { tools: toolConfig } : {}),
  });

  const result   = await chat.sendMessage(prompt);
  const response = result.response;

  return _normalizeGemini(response, cfg.model || DEFAULT_MODEL.gemini);
}

function _normalizeGemini(response, model) {
  const candidate  = response.candidates?.[0];
  const parts      = candidate?.content?.parts || [];
  const textPart   = parts.find((p) => p.text);
  const fnCalls    = parts.filter((p) => p.functionCall);

  const message = {
    role:       'assistant',
    content:    textPart ? textPart.text : '',
    tool_calls: fnCalls.map((p, i) => ({
      id:   `gemini-tc-${i}`,
      type: 'function',
      function: {
        name:      p.functionCall.name,
        arguments: JSON.stringify(p.functionCall.args || {}),
      },
    })),
  };

  const usage = response.usageMetadata || {};
  return {
    choices: [{
      message,
      finish_reason: fnCalls.length > 0 ? 'tool_calls' : 'stop',
    }],
    usage: {
      prompt_tokens:     usage.promptTokenCount     || 0,
      completion_tokens: usage.candidatesTokenCount || 0,
      total_tokens:      usage.totalTokenCount      || 0,
    },
  };
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
    model: cfg.model || DEFAULT_MODEL.openai,
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
    model: cfg.model || DEFAULT_MODEL.anthropic,
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
    'claude-sonnet-4-20250514':   { input: 3,    output: 15 },
    'claude-4-opus-20250514':     { input: 15,   output: 75 },
    'claude-3-7-sonnet-20250219': { input: 3,    output: 15 },
    'claude-3-5-haiku-20241022':  { input: 0.8,  output: 4 },
    'gemini-2.0-flash':           { input: 0,    output: 0 },  // free tier
    'gemini-2.0-flash-lite':      { input: 0,    output: 0 },  // free tier
    'gemini-1.5-flash-latest':    { input: 0,    output: 0 },  // free tier
    'gemini-1.5-pro-latest':      { input: 1.25, output: 5 },
    'gemini-2.5-flash-preview-05-20': { input: 0, output: 0 }, // free tier
    openclaw:                         { input: 0, output: 0 }, // local, no cost
  };
  const p = pricing[model] || { input: 5, output: 15 };
  const inp = ((tokens.prompt_tokens     || 0) / 1_000_000) * p.input;
  const out = ((tokens.completion_tokens || 0) / 1_000_000) * p.output;
  return +(inp + out).toFixed(6);
}

module.exports = { chatCompletion, getProviderConfig, invalidateCache, encrypt, decrypt };
