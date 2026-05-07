/**
 * openGraph.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Renders the frontend index.html with dynamic Open Graph meta tags injected
 * so that WhatsApp / Facebook / Telegram / LinkedIn crawlers receive real
 * property images and titles instead of the generic favicon.
 *
 * The module exports a single Express middleware factory: buildPropertyOGRouter()
 * which returns an Express router that handles GET /buy/:slug and GET /rent/:slug.
 *
 * Strategy: the middleware fetches the property directly from MongoDB (same logic
 * as the existing /public/properties/:slug endpoint), builds the meta tags, reads
 * the Vite-built index.html from disk, injects the tags, and sends the modified
 * HTML.  If anything fails, it falls back to the original index.html so the SPA
 * keeps working normally.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');

const Propiedad = require('./models/Propiedad');
const Agente = require('./models/Agente');
const DocumentLink = require('./models/DocumentLink');
const Document = require('./models/Document');
const User = require('./models/User');

// ─── Config ──────────────────────────────────────────────────────────────────

const SITE_NAME = 'Anabella Luna';
const FALLBACK_OG_IMAGE = 'https://anabellaluna.com.ar/og-default.jpg';
const DESCRIPTION_MAX_LEN = 200;

// Cached build HTML (invalidated on first request, then cached until restart)
let _indexHtmlCache = null;
const INDEX_HTML_PATH = path.join(__dirname, '../frontend/dist/index.html');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function escapeHtmlAttr(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\r?\n/g, ' ')
    .trim();
}

function isObjectId(value) {
  return mongoose.Types.ObjectId.isValid(String(value || ''));
}

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function buildMediaUrlFromDoc(doc) {
  if (!doc) return '';
  if (doc.object_key) return `/public/media/${doc._id}`;
  const url = String(doc.url || '');
  if (url.startsWith('http')) return url;
  return '';
}

/** Returns the frontend/dist/index.html string (cached). */
function readIndexHtml() {
  if (_indexHtmlCache) return _indexHtmlCache;
  if (!fs.existsSync(INDEX_HTML_PATH)) return null;
  _indexHtmlCache = fs.readFileSync(INDEX_HTML_PATH, 'utf8');
  return _indexHtmlCache;
}

/** Invalidates the cached index.html (useful after deploys, but optional). */
function invalidateIndexCache() {
  _indexHtmlCache = null;
}

/** Map Spanish operation text → canonical 'buy' | 'rent'. */
function mapOperation(metaOperacion) {
  const op = String(metaOperacion || '').toLowerCase();
  if (op.includes('alquil') || op.includes('rent')) return 'rent';
  if (op.includes('venta') || op.includes('buy')) return 'buy';
  return 'buy';
}

/** Admin fallback cache (mirrors logic in public.js). */
let _adminAgentCache = null;
let _adminAgentCacheTs = 0;
const ADMIN_CACHE_TTL = 60_000;

async function getAdminFallbackAgent() {
  const now = Date.now();
  if (_adminAgentCache && now - _adminAgentCacheTs < ADMIN_CACHE_TTL) return _adminAgentCache;
  const adminUser = await User.findOne({ role: 'admin' }).lean();
  if (adminUser && adminUser.agenteId) {
    const agente = await Agente.findById(adminUser.agenteId).lean();
    if (agente) { _adminAgentCache = agente; _adminAgentCacheTs = now; return agente; }
  }
  const adminAgente = await Agente.findOne({ role: 'admin' }).lean();
  if (adminAgente) { _adminAgentCache = adminAgente; _adminAgentCacheTs = now; return adminAgente; }
  return null;
}

// ─── Open Graph data builders ─────────────────────────────────────────────────

/**
 * Builds a commercial title like "Departamento en venta en Palermo | Anabella Luna".
 */
function buildTitle(prop) {
  const meta = (prop && prop.metadata) ? prop.metadata : {};

  // Priority 1 – explicit property title
  if (prop.title && prop.title.trim()) {
    return `${prop.title.trim()} | ${SITE_NAME}`;
  }

  // Priority 2 – metadata.titulo
  if (meta.titulo && String(meta.titulo).trim()) {
    return `${String(meta.titulo).trim()} | ${SITE_NAME}`;
  }

  // Priority 3 – build commercial description from parts
  const parts = [];
  if (meta.tipo) parts.push(String(meta.tipo).trim());

  const operation = mapOperation(meta.operacion);
  if (operation === 'rent') parts.push('en alquiler');
  else parts.push('en venta');

  const place = meta.barrio || meta.ciudad || meta.provincia;
  if (place) parts.push(`en ${String(place).trim()}`);

  if (parts.length > 1) {
    return `${parts.join(' ')} | ${SITE_NAME}`;
  }

  return `Propiedad en ${SITE_NAME}`;
}

/**
 * Builds a description up to DESCRIPTION_MAX_LEN characters.
 */
function buildDescription(prop) {
  const meta = (prop && prop.metadata) ? prop.metadata : {};

  // Priority 1 – explicit description
  const desc = prop.description || meta.descripcion || '';
  if (desc && String(desc).trim().length > 10) {
    return String(desc).replace(/\s+/g, ' ').trim().substring(0, DESCRIPTION_MAX_LEN);
  }

  // Priority 2 – auto-build from numeric features + location
  const parts = [];

  const precio = safeNumber(prop.price || meta.precio);
  const moneda = prop.moneda || meta.moneda || '';
  if (precio > 0) {
    parts.push(`${moneda ? moneda + ' ' : ''}${precio.toLocaleString('es-AR')}`);
  }

  const ambientes = safeNumber(meta.ambientes);
  if (ambientes > 0) parts.push(`${ambientes} amb.`);

  const dorms = safeNumber(meta.dormitorios);
  if (dorms > 0) parts.push(`${dorms} dorm.`);

  const banos = safeNumber(meta.baños);
  if (banos > 0) parts.push(`${banos} baños`);

  const m2 = safeNumber(meta.m2Totales || meta.m2);
  if (m2 > 0) parts.push(`${m2} m²`);

  const place = meta.barrio || meta.ciudad || meta.provincia;
  if (place) parts.push(String(place).trim());

  if (parts.length > 0) {
    return parts.join(' · ').substring(0, DESCRIPTION_MAX_LEN);
  }

  return `Propiedad en ${SITE_NAME}`;
}

/**
 * Converts a possibly-relative /public/media/... URL to an absolute HTTPS URL.
 * WhatsApp requires absolute URLs with HTTPS.
 */
function buildAbsoluteImageUrl(rawUrl, siteOrigin) {
  if (!rawUrl) return FALLBACK_OG_IMAGE;

  const url = String(rawUrl).trim();

  // Already absolute HTTPS → use directly
  if (url.startsWith('https://')) return url;

  // Absolute HTTP → upgrade to HTTPS (crawlers need HTTPS)
  if (url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }

  // Relative (e.g. /public/media/abc123)
  if (url.startsWith('/')) {
    // Use siteOrigin from env, falling back to anabellaluna.com.ar
    const origin = siteOrigin || 'https://anabellaluna.com.ar';
    return `${origin}${url}`;
  }

  return FALLBACK_OG_IMAGE;
}

/**
 * Fetches the cover image URL for a property by reading its linked documents.
 */
async function getPropertyCoverUrl(propId) {
  const links = await DocumentLink.find({ entity_type: 'propiedad', entity_id: String(propId) })
    .sort({ order: 1, created_at: 1 })
    .populate('document', '_id url object_key bucket tipo categoria')
    .lean();

  let firstPhoto = '';
  let firstImage = '';

  for (const l of links) {
    const doc = l.document;
    const isImage = doc && String(doc.tipo || '').toLowerCase() === 'imagen';
    if (!isImage) continue;
    const url = buildMediaUrlFromDoc(doc);
    if (!url) continue;

    if (!firstImage) firstImage = url;
    const cat = String(doc.categoria || '');
    if (/propiedad\s*-\s*fotos/i.test(cat) && !firstPhoto) {
      firstPhoto = url;
      break;
    }
  }

  return firstPhoto || firstImage || '';
}

/**
 * Builds the block of OG + Twitter meta tags to inject.
 */
function buildMetaTagsHtml({ ogTitle, ogDescription, ogImage, ogUrl }) {
  const t = escapeHtmlAttr(ogTitle);
  const d = escapeHtmlAttr(ogDescription);
  const img = escapeHtmlAttr(ogImage);
  const u = escapeHtmlAttr(ogUrl);
  const siteName = escapeHtmlAttr(SITE_NAME);

  return `
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${siteName}" />
    <meta property="og:title" content="${t}" />
    <meta property="og:description" content="${d}" />
    <meta property="og:image" content="${img}" />
    <meta property="og:image:secure_url" content="${img}" />
    <meta property="og:url" content="${u}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${t}" />
    <meta name="twitter:description" content="${d}" />
    <meta name="twitter:image" content="${img}" />`;
}

/**
 * Injects meta tags right after <meta charset="UTF-8" /> in the HTML string.
 * Also replaces the static <title> with the property title.
 */
function injectMetaTags(html, metaTagsHtml, ogTitle) {
  // Inject after the charset meta tag
  const charsetPattern = /(<meta\s+charset=["'][^"']*["']\s*\/>)/i;
  let modified = html.replace(charsetPattern, `$1${metaTagsHtml}`);

  // Update the <title> tag
  const escapedTitle = ogTitle.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  modified = modified.replace(/<title>[^<]*<\/title>/i, `<title>${escapedTitle}</title>`);

  return modified;
}

// ─── Core render function ─────────────────────────────────────────────────────

/**
 * Reads the property from MongoDB, builds OG meta tags, injects them into
 * the Vite-built index.html, and sends the modified HTML.
 *
 * Falls back gracefully to the original index.html on any error.
 *
 * @param {express.Request} req
 * @param {express.Response} res
 * @param {'buy'|'rent'} operation  – Used to build the canonical URL.
 */
async function renderPropertyHTML(req, res, operation) {
  const slug = String(req.params.slug || '').trim();
  const token = String(req.query.token || '').trim();
  const siteOrigin = process.env.SITE_ORIGIN || 'https://anabellaluna.com.ar';

  // ── Read index.html ────────────────────────────────────────────────────────
  const indexHtml = readIndexHtml();
  if (!indexHtml) {
    console.error('[OG] frontend/dist/index.html not found – serving 404');
    return res.status(404).send('Frontend not built. Run npm run build first.');
  }

  if (!slug) {
    return res.send(indexHtml);
  }

  try {
    // ── Fetch property ───────────────────────────────────────────────────────
    let prop = await Propiedad.findOne({ slug }).lean();
    if (!prop && isObjectId(slug)) {
      prop = await Propiedad.findById(slug).lean();
    }

    if (!prop) {
      console.warn(`[OG] Property not found: ${slug}`);
      return res.send(indexHtml);
    }

    // Enforce published gate (same as public.js)
    if (prop.published === false) {
      if (!token || !prop.privateToken || token !== prop.privateToken) {
        return res.send(indexHtml);
      }
    }

    // ── Cover image ──────────────────────────────────────────────────────────
    const rawCoverUrl = await getPropertyCoverUrl(prop._id);
    const absoluteImageUrl = buildAbsoluteImageUrl(rawCoverUrl, siteOrigin);

    // ── OG data ──────────────────────────────────────────────────────────────
    const ogTitle = buildTitle(prop);
    const ogDescription = buildDescription(prop);
    const ogImage = absoluteImageUrl;
    const canonicalSlug = prop.slug || slug;
    const ogUrl = `${siteOrigin}/${operation}/${canonicalSlug}${token ? `?token=${encodeURIComponent(token)}` : ''}`;

    // ── Inject ───────────────────────────────────────────────────────────────
    const metaTagsHtml = buildMetaTagsHtml({ ogTitle, ogDescription, ogImage, ogUrl });
    const finalHtml = injectMetaTags(indexHtml, metaTagsHtml, ogTitle);

    console.log(`[OG] Served ${operation}/${slug} → "${ogTitle}" img=${ogImage}`);

    res.set('Content-Type', 'text/html; charset=utf-8');
    // Short cache: lets crawlers re-fetch after property updates
    res.set('Cache-Control', 'public, max-age=300');
    return res.send(finalHtml);

  } catch (err) {
    console.error(`[OG] Error rendering ${operation}/${slug}:`, err && err.message ? err.message : err);
    // Fallback: serve original index.html so SPA still works
    res.set('Content-Type', 'text/html; charset=utf-8');
    return res.send(indexHtml);
  }
}

// ─── Router factory ───────────────────────────────────────────────────────────

/**
 * Returns an Express router with GET /buy/:slug and GET /rent/:slug
 * that serve property-specific Open Graph HTML.
 *
 * Mount BEFORE static-file serving in server.js:
 *   app.use(buildPropertyOGRouter());
 */
function buildPropertyOGRouter() {
  const router = express.Router();

  router.get('/buy/:slug', (req, res) => renderPropertyHTML(req, res, 'buy'));
  router.get('/rent/:slug', (req, res) => renderPropertyHTML(req, res, 'rent'));

  return router;
}

module.exports = {
  buildPropertyOGRouter,
  invalidateIndexCache,
};
