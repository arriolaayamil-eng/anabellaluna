const crypto = require('crypto');
const { google } = require('googleapis');

function getEnv(name, fallback) {
  const v = process.env[name];
  if (v === undefined || v === null || String(v).trim() === '') return fallback;
  return String(v);
}

// Check if global OAuth is configured (fallback)
function isGlobalConfigured() {
  return Boolean(
    getEnv('GOOGLE_OAUTH_CLIENT_ID') &&
    getEnv('GOOGLE_OAUTH_CLIENT_SECRET') &&
    getEnv('GOOGLE_OAUTH_REDIRECT_URI')
  );
}

// Check if agent has their own OAuth credentials configured
function isAgentConfigured(agentMetadata) {
  const oauth = agentMetadata?.googleOAuth || {};
  return Boolean(oauth.clientId && oauth.clientSecret);
}

// Combined check - either agent or global config
function isConfigured(agentMetadata) {
  return isAgentConfigured(agentMetadata) || isGlobalConfigured();
}

// Get redirect URI (always from env since it's server-specific)
function getRedirectUri() {
  return getEnv('GOOGLE_OAUTH_REDIRECT_URI', 'http://localhost:4000/crm/integrations/google-calendar/callback');
}

// Create OAuth client using agent credentials or fallback to global
function createOAuthClient(agentMetadata) {
  const oauth = agentMetadata?.googleOAuth || {};
  
  // Try agent credentials first, fallback to global
  const clientId = oauth.clientId || getEnv('GOOGLE_OAUTH_CLIENT_ID');
  const clientSecret = oauth.clientSecret || getEnv('GOOGLE_OAUTH_CLIENT_SECRET');
  const redirectUri = getRedirectUri();
  
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Google OAuth is not configured. Please configure your credentials in Integrations.');
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

function base64urlEncode(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function base64urlDecodeToString(input) {
  const b64 = String(input || '')
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  return Buffer.from(b64 + pad, 'base64').toString('utf8');
}

function signState(payloadB64) {
  const secret = getEnv('JWT_SECRET', 'please-change-this-secret');
  return crypto.createHmac('sha256', secret).update(payloadB64).digest('hex');
}

function buildState(agentId) {
  const now = Date.now();
  const payload = {
    agentId: String(agentId || ''),
    iat: now,
    exp: now + 10 * 60 * 1000,
    nonce: crypto.randomBytes(12).toString('hex'),
  };
  const payloadB64 = base64urlEncode(JSON.stringify(payload));
  const sig = signState(payloadB64);
  return `${payloadB64}.${sig}`;
}

function parseAndVerifyState(state) {
  const raw = String(state || '');
  const parts = raw.split('.');
  if (parts.length !== 2) throw new Error('invalid state');
  const payloadB64 = parts[0];
  const sig = parts[1];
  const expected = signState(payloadB64);
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    throw new Error('invalid state signature');
  }
  const payloadStr = base64urlDecodeToString(payloadB64);
  const payload = JSON.parse(payloadStr);
  if (!payload || !payload.agentId) throw new Error('invalid state payload');
  if (payload.exp && Date.now() > Number(payload.exp)) throw new Error('state expired');
  return payload;
}

function getAuthUrl(agentId, agentMetadata) {
  const oauth2Client = createOAuthClient(agentMetadata);
  const state = buildState(agentId);
  const scopes = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes,
    state,
  });

  return { url, state };
}

async function exchangeCodeForTokens(code, agentMetadata) {
  const oauth2Client = createOAuthClient(agentMetadata);
  const { tokens } = await oauth2Client.getToken(String(code || ''));
  oauth2Client.setCredentials(tokens);

  let email = '';
  try {
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const me = await oauth2.userinfo.get();
    email = (me && me.data && me.data.email) ? String(me.data.email) : '';
  } catch (e) {
    email = '';
  }

  return { tokens, email };
}

async function createCalendarEvent({ refreshToken, calendarId, summary, description, start, end, timeZone, agentMetadata }) {
  const oauth2Client = createOAuthClient(agentMetadata);
  oauth2Client.setCredentials({ refresh_token: String(refreshToken || '') });

  const cal = google.calendar({ version: 'v3', auth: oauth2Client });

  const tz = timeZone || getEnv('DEFAULT_TIMEZONE', 'America/Argentina/Buenos_Aires');
  const calId = calendarId || 'primary';

  const event = {
    summary: summary || 'Visita',
    description: description || '',
    start: { dateTime: new Date(start).toISOString(), timeZone: tz },
    end: { dateTime: new Date(end).toISOString(), timeZone: tz },
  };

  const created = await cal.events.insert({ calendarId: calId, requestBody: event });
  return created && created.data ? created.data : null;
}

async function updateCalendarEvent({ refreshToken, calendarId, eventId, summary, description, start, end, timeZone, agentMetadata }) {
  if (!eventId) throw new Error('eventId required');
  const oauth2Client = createOAuthClient(agentMetadata);
  oauth2Client.setCredentials({ refresh_token: String(refreshToken || '') });

  const cal = google.calendar({ version: 'v3', auth: oauth2Client });

  const tz = timeZone || getEnv('DEFAULT_TIMEZONE', 'America/Argentina/Buenos_Aires');
  const calId = calendarId || 'primary';

  const event = {
    summary: summary || 'Visita',
    description: description || '',
    start: { dateTime: new Date(start).toISOString(), timeZone: tz },
    end: { dateTime: new Date(end).toISOString(), timeZone: tz },
  };

  const updated = await cal.events.update({ calendarId: calId, eventId: String(eventId), requestBody: event });
  return updated && updated.data ? updated.data : null;
}

async function deleteCalendarEvent({ refreshToken, calendarId, eventId, agentMetadata }) {
  if (!eventId) return;
  const oauth2Client = createOAuthClient(agentMetadata);
  oauth2Client.setCredentials({ refresh_token: String(refreshToken || '') });

  const cal = google.calendar({ version: 'v3', auth: oauth2Client });
  const calId = calendarId || 'primary';
  await cal.events.delete({ calendarId: calId, eventId: String(eventId) });
}

module.exports = {
  isConfigured,
  isAgentConfigured,
  isGlobalConfigured,
  getRedirectUri,
  createOAuthClient,
  getAuthUrl,
  parseAndVerifyState,
  exchangeCodeForTokens,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
};
