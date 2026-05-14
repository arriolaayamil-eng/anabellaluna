const crypto = require('crypto');
const GlobalConfig = require('../models/GlobalConfig');

// ── Encryption helpers ────────────────────────────────────────────────────────
// AES-256-GCM. Key sourced from ML_ENCRYPTION_KEY env var (32-byte hex string).

const ALGORITHM = 'aes-256-gcm';

function getEncryptionKey() {
  const raw = process.env.ML_ENCRYPTION_KEY || '';
  if (!raw) throw new Error('ML_ENCRYPTION_KEY is not set in environment');
  // Accept raw hex (64 chars) or raw bytes
  const buf = Buffer.from(raw.length === 64 ? raw : raw.padEnd(64, '0'), 'hex');
  if (buf.length !== 32) throw new Error('ML_ENCRYPTION_KEY must be a 32-byte hex string (64 hex chars)');
  return buf;
}

function encrypt(plaintext) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: iv(24 hex) + tag(32 hex) + ciphertext(hex)
  return iv.toString('hex') + tag.toString('hex') + encrypted.toString('hex');
}

function decrypt(ciphertext) {
  if (!ciphertext) return '';
  const key = getEncryptionKey();
  const iv = Buffer.from(ciphertext.slice(0, 24), 'hex');
  const tag = Buffer.from(ciphertext.slice(24, 56), 'hex');
  const data = Buffer.from(ciphertext.slice(56), 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(data) + decipher.final('utf8');
}

// ── Config persistence (GlobalConfig key: 'mercadolibre_credentials') ─────────

const ML_CONFIG_KEY = 'mercadolibre_credentials';

async function saveMLCredentials({ clientId, clientSecret, redirectUri, webhookUrl }) {
  const value = {
    clientId: encrypt(clientId || ''),
    clientSecret: encrypt(clientSecret || ''),
    redirectUri: encrypt(redirectUri || ''),
    webhookUrl: encrypt(webhookUrl || ''),
  };
  await GlobalConfig.setValue(ML_CONFIG_KEY, value, 'Mercado Libre OAuth credentials');
}

async function loadMLCredentials() {
  const raw = await GlobalConfig.getValue(ML_CONFIG_KEY, null);
  if (!raw) return null;
  return {
    clientId: decrypt(raw.clientId),
    clientSecret: decrypt(raw.clientSecret),
    redirectUri: decrypt(raw.redirectUri),
    webhookUrl: decrypt(raw.webhookUrl),
  };
}

async function deleteMLCredentials() {
  await GlobalConfig.deleteOne({ key: ML_CONFIG_KEY });
}

// ── Access token management ───────────────────────────────────────────────────
// Tokens stored in GlobalConfig key: 'mercadolibre_token'

const ML_TOKEN_KEY = 'mercadolibre_token';
const ML_BASE_URL = 'https://api.mercadolibre.com';

async function saveToken(tokenData) {
  // tokenData: { access_token, refresh_token, expires_in, token_type, scope, user_id }
  const expiresAt = Date.now() + (tokenData.expires_in || 21600) * 1000 - 60000; // 1 min early
  const value = {
    accessToken: encrypt(tokenData.access_token || ''),
    refreshToken: encrypt(tokenData.refresh_token || ''),
    expiresAt,
    userId: tokenData.user_id || '',
    scope: tokenData.scope || '',
  };
  await GlobalConfig.setValue(ML_TOKEN_KEY, value, 'Mercado Libre OAuth token');
}

async function loadToken() {
  const raw = await GlobalConfig.getValue(ML_TOKEN_KEY, null);
  if (!raw) return null;
  return {
    accessToken: decrypt(raw.accessToken),
    refreshToken: decrypt(raw.refreshToken),
    expiresAt: raw.expiresAt || 0,
    userId: raw.userId || '',
    scope: raw.scope || '',
  };
}

async function refreshAccessToken() {
  const creds = await loadMLCredentials();
  if (!creds || !creds.clientId || !creds.clientSecret) {
    throw new Error('ML credentials not configured');
  }
  const token = await loadToken();
  if (!token || !token.refreshToken) {
    throw new Error('No refresh token available — re-authentication required');
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    refresh_token: token.refreshToken,
  });

  const res = await fetch(`${ML_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`ML token refresh failed: ${err.message || res.status}`);
  }

  const data = await res.json();
  await saveToken(data);
  return data.access_token;
}

async function getValidAccessToken() {
  const token = await loadToken();
  if (!token) throw new Error('Not authenticated with Mercado Libre');
  if (Date.now() < token.expiresAt) return token.accessToken;
  return refreshAccessToken();
}

// ── ML listing_type_id mapping ────────────────────────────────────────────────

const ESTRELLAS_TO_LISTING_TYPE = {
  0: 'gold_free',
  1: 'bronze',
  2: 'silver',
  3: 'gold',
  4: 'gold_special',
  5: 'gold_premium',
};

function listingTypeFromEstrellas(estrellas) {
  const n = Number(estrellas);
  return ESTRELLAS_TO_LISTING_TYPE[Number.isFinite(n) && n >= 0 && n <= 5 ? n : 0];
}

// ── Build ML item payload from Propiedad ─────────────────────────────────────
// Propiedad fields (from PASO 0 analysis):
//   title, description, address, price, moneda, agentId
//   metadata: { tipo, operacion, ambientes, dormitorios, banos, superficie,
//               lat, lng, ciudad, barrio, imagenes, ... }
//   mlEstrellas

function buildMLPayload(prop) {
  const m = prop.metadata || {};
  const listingTypeId = listingTypeFromEstrellas(prop.mlEstrellas);

  // Determine category: use saved ML category or fallback to generic real estate
  const categoryId = m.mlCategoryId || 'MLA1459'; // MLA1459 = Inmuebles Argentina (generic)

  // Determine operation type for title enrichment
  const operacion = String(m.operacion || '').toLowerCase();
  const operacionLabel = operacion.includes('alquiler') ? 'Alquiler' : 'Venta';

  const title = String(prop.title || '').slice(0, 60); // ML max 60 chars

  const currencyId = String(prop.moneda || 'USD').toUpperCase() === 'USD' ? 'USD' : 'ARS';

  const price = Number(prop.price) || 0;

  // Description: strip HTML tags, max 50,000 chars
  const rawDesc = String(prop.description || '');
  const cleanDesc = rawDesc.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 50000);

  // Pictures: metadata.imagenes is array of { url } objects or plain strings
  const rawImages = Array.isArray(m.imagenes) ? m.imagenes : [];
  const pictures = rawImages
    .map((img) => {
      const url = typeof img === 'string' ? img : (img.url || img.src || '');
      return url ? { source: url } : null;
    })
    .filter(Boolean)
    .slice(0, 12); // ML max 12 images

  // Attributes mapping
  const attributes = [];
  if (m.ambientes) attributes.push({ id: 'ROOMS', value_name: String(m.ambientes) });
  if (m.dormitorios) attributes.push({ id: 'BEDROOMS', value_name: String(m.dormitorios) });
  if (m.banos) attributes.push({ id: 'FULL_BATHROOMS', value_name: String(m.banos) });
  if (m.superficie) attributes.push({ id: 'TOTAL_AREA', value_name: String(m.superficie), value_struct: { number: m.superficie, unit: 'm²' } });

  // Location
  const location = {};
  if (m.ciudad) location.city = { name: String(m.ciudad) };
  if (m.barrio) location.neighborhood = { name: String(m.barrio) };
  if (m.lat && m.lng) {
    location.latitude = Number(m.lat);
    location.longitude = Number(m.lng);
  }
  if (prop.address) location.address_line = String(prop.address);

  const payload = {
    title,
    category_id: categoryId,
    price,
    currency_id: currencyId,
    available_quantity: 1,
    buying_mode: 'classified',
    listing_type_id: listingTypeId,
    condition: 'not_specified',
    description: { plain_text: cleanDesc },
    sale_terms: [{ id: 'OPERATION_TYPE', value_name: operacionLabel }],
  };

  if (pictures.length) payload.pictures = pictures;
  if (attributes.length) payload.attributes = attributes;
  if (Object.keys(location).length) payload.location = location;

  return payload;
}

// ── Core ML API operations ────────────────────────────────────────────────────

async function mlRequest(method, path, body) {
  const accessToken = await getValidAccessToken();
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${ML_BASE_URL}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data.message || data.error || `HTTP ${res.status}`;
    throw new Error(`ML API error (${method} ${path}): ${msg}`);
  }
  return data;
}

async function publishProperty(prop) {
  const payload = buildMLPayload(prop);
  console.log(`[ML] Publishing property ${prop._id} — listing_type: ${payload.listing_type_id}`);
  const result = await mlRequest('POST', '/items', payload);
  return result; // { id, permalink, status, ... }
}

async function updateProperty(itemId, prop) {
  const payload = buildMLPayload(prop);
  // ML update does not accept listing_type_id or description in the main body
  const { description, ...mainPayload } = payload;
  delete mainPayload.listing_type_id;
  console.log(`[ML] Updating property ${prop._id} → item ${itemId}`);
  await mlRequest('PUT', `/items/${itemId}`, mainPayload);
  if (description && description.plain_text) {
    await mlRequest('PUT', `/items/${itemId}/description`, description);
  }
  return { updated: true };
}

async function pauseProperty(itemId) {
  console.log(`[ML] Pausing item ${itemId}`);
  return mlRequest('PUT', `/items/${itemId}`, { status: 'paused' });
}

async function activateProperty(itemId) {
  console.log(`[ML] Activating item ${itemId}`);
  return mlRequest('PUT', `/items/${itemId}`, { status: 'active' });
}

// ── High-level sync triggered by propiedades.js ───────────────────────────────

async function syncPropertyToML(prop) {
  // Returns { ok, action, itemId, permalink, error }
  const creds = await loadMLCredentials();
  if (!creds || !creds.clientId) {
    return { ok: false, action: 'skipped', error: 'ML not configured' };
  }

  const token = await loadToken();
  if (!token || !token.accessToken) {
    return { ok: false, action: 'skipped', error: 'ML not authenticated' };
  }

  try {
    const existingItemId = prop.ml && prop.ml.itemId;

    if (prop.published) {
      if (existingItemId) {
        // Already published → update + activate
        await updateProperty(existingItemId, prop);
        const activated = await activateProperty(existingItemId);
        return { ok: true, action: 'updated', itemId: existingItemId, status: activated.status };
      } else {
        // New publication
        const result = await publishProperty(prop);
        return { ok: true, action: 'published', itemId: result.id, permalink: result.permalink, status: result.status };
      }
    } else {
      if (existingItemId) {
        const paused = await pauseProperty(existingItemId);
        return { ok: true, action: 'paused', itemId: existingItemId, status: paused.status };
      }
      return { ok: true, action: 'skipped', itemId: null };
    }
  } catch (err) {
    console.error(`[ML] syncPropertyToML error for prop ${prop._id}:`, err.message);
    return { ok: false, action: 'error', error: err.message };
  }
}

// ── OAuth flow helpers ────────────────────────────────────────────────────────

async function buildAuthUrl() {
  const creds = await loadMLCredentials();
  if (!creds || !creds.clientId) throw new Error('ML credentials not configured');
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: creds.clientId,
    redirect_uri: creds.redirectUri,
  });
  return `https://auth.mercadolibre.com.ar/authorization?${params.toString()}`;
}

async function exchangeCodeForToken(code) {
  const creds = await loadMLCredentials();
  if (!creds || !creds.clientId) throw new Error('ML credentials not configured');

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: creds.clientId,
    client_secret: creds.clientSecret,
    code,
    redirect_uri: creds.redirectUri,
  });

  const res = await fetch(`${ML_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: body.toString(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`ML token exchange failed: ${err.message || res.status}`);
  }

  const data = await res.json();
  await saveToken(data);
  return data;
}

async function getConnectionStatus() {
  const creds = await loadMLCredentials();
  const token = await loadToken();
  return {
    hasCredentials: !!(creds && creds.clientId && creds.clientSecret),
    isAuthenticated: !!(token && token.accessToken),
    userId: (token && token.userId) || null,
    expiresAt: (token && token.expiresAt) || null,
  };
}

module.exports = {
  saveMLCredentials,
  loadMLCredentials,
  deleteMLCredentials,
  saveToken,
  exchangeCodeForToken,
  buildAuthUrl,
  getValidAccessToken,
  mlRequest,
  syncPropertyToML,
  publishProperty,
  updateProperty,
  pauseProperty,
  activateProperty,
  getConnectionStatus,
  listingTypeFromEstrellas,
  encrypt,
  decrypt,
};
