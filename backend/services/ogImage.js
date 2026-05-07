/**
 * ogImage.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates a 1200×630 JPEG Open Graph image for a property by fetching its
 * cover photo from MinIO (or a public URL), processing it with Sharp, and
 * caching the result back in MinIO.
 *
 * Cache key:  og-images/<propertyId>.jpg  inside MINIO_BUCKET_WEB
 *
 * Algorithm:
 *   1. Check MinIO cache → hit: return buffer immediately.
 *   2. Resolve the property's cover Document record.
 *   3. Fetch raw image bytes from MinIO (or HTTP URL).
 *   4. Use Sharp to produce 1200×630 cover-fit JPEG, quality 82.
 *      - If the image is taller than wide (portrait): fill a 1200×630 canvas
 *        with a blurred+darkened version of the image as background, then
 *        overlay the sharp crop centred — no distortion.
 *      - If landscape or square: simple cover crop centred.
 *   5. Save result to MinIO cache.
 *   6. Return buffer.
 *
 * Exported:
 *   getOGImageBuffer(propertyId)  → Promise<Buffer>
 *   invalidateOGCache(propertyId) → Promise<void>
 */

'use strict';

const https = require('https');
const http = require('http');
const sharp = require('sharp');
const mongoose = require('mongoose');

const minio = require('../minio');
const Propiedad = require('../models/Propiedad');
const DocumentLink = require('../models/DocumentLink');
const Document = require('../models/Document');

// ─── Constants ────────────────────────────────────────────────────────────────

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const OG_QUALITY = 82;
const CACHE_BUCKET_KEY = () => minio.buckets && (minio.buckets.web || minio.buckets.erp || minio.bucket);
const cacheKey = (propertyId) => `og-images/${propertyId}.jpg`;

// ─── Utility: stream → Buffer ─────────────────────────────────────────────────

function streamToBuffer(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

// ─── Utility: fetch remote URL → Buffer ──────────────────────────────────────

function fetchUrlBuffer(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrlBuffer(res.headers.location));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} fetching ${url}`));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

// ─── Utility: isObjectId ─────────────────────────────────────────────────────

function isObjectId(value) {
  return mongoose.Types.ObjectId.isValid(String(value || ''));
}

// ─── MinIO cache helpers ──────────────────────────────────────────────────────

async function readCacheBuffer(propertyId) {
  if (!minio.isConfigured()) return null;
  const bucket = CACHE_BUCKET_KEY();
  if (!bucket) return null;
  try {
    const stream = await minio.getObject(bucket, cacheKey(propertyId));
    return await streamToBuffer(stream);
  } catch (err) {
    const code = err && (err.code || err.Code || err.message || '');
    if (String(code).includes('NoSuchKey') || String(code).includes('NotFound') || String(code).includes('does not exist')) {
      return null;
    }
    return null;
  }
}

async function writeCacheBuffer(propertyId, buffer) {
  if (!minio.isConfigured()) return;
  const bucket = CACHE_BUCKET_KEY();
  if (!bucket) return;
  try {
    await minio.putObject(bucket, cacheKey(propertyId), buffer, buffer.length, {
      'content-type': 'image/jpeg',
    });
  } catch (err) {
    console.warn(`[OGImage] Failed to cache OG image for ${propertyId}:`, err && err.message);
  }
}

// ─── Image fetch from document ───────────────────────────────────────────────

async function fetchDocumentBuffer(doc) {
  if (!doc) throw new Error('No document');

  if (doc.object_key) {
    if (!minio.isConfigured()) throw new Error('MinIO not configured');
    const bucket = doc.bucket || minio.bucket;
    const stream = await minio.getObject(bucket, doc.object_key);
    return streamToBuffer(stream);
  }

  const url = String(doc.url || '');
  if (url.startsWith('http')) {
    return fetchUrlBuffer(url);
  }

  throw new Error(`Cannot resolve image for document ${doc._id}`);
}

// ─── Cover document resolver ─────────────────────────────────────────────────

async function resolveCoverDocument(propertyId) {
  const links = await DocumentLink.find({ entity_type: 'propiedad', entity_id: String(propertyId) })
    .sort({ order: 1, created_at: 1 })
    .populate('document', '_id url object_key bucket tipo categoria mimetype')
    .lean();

  let firstPhoto = null;
  let firstImage = null;

  for (const l of links) {
    const doc = l.document;
    const isImage = doc && String(doc.tipo || '').toLowerCase() === 'imagen';
    if (!isImage) continue;

    if (!firstImage) firstImage = doc;

    const cat = String(doc.categoria || '');
    if (/propiedad\s*-\s*fotos/i.test(cat) && !firstPhoto) {
      firstPhoto = doc;
      break;
    }
  }

  return firstPhoto || firstImage || null;
}

// ─── Sharp processing ─────────────────────────────────────────────────────────

/**
 * Generates a 1200×630 JPEG buffer from rawBuffer.
 *
 * Strategy:
 * - Landscape (w >= h): cover-crop to 1200×630, centred.
 * - Portrait  (w < h):  composite — blurred+darker background (1200×630) +
 *                        sharp centred overlay (fitted to height 630).
 */
async function processToOGSize(rawBuffer) {
  const meta = await sharp(rawBuffer).metadata();
  const { width = 0, height = 0 } = meta;

  const isPortrait = height > width;

  if (!isPortrait) {
    return sharp(rawBuffer)
      .resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: OG_QUALITY, progressive: true })
      .toBuffer();
  }

  // Portrait: build blurred background + centred sharp overlay
  const bgBuffer = await sharp(rawBuffer)
    .resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover', position: 'centre' })
    .blur(24)
    .modulate({ brightness: 0.55 })
    .jpeg({ quality: 60 })
    .toBuffer();

  const overlayBuffer = await sharp(rawBuffer)
    .resize(null, OG_HEIGHT, { fit: 'inside', withoutEnlargement: false })
    .jpeg({ quality: 90 })
    .toBuffer();

  const overlayMeta = await sharp(overlayBuffer).metadata();
  const overlayW = overlayMeta.width || OG_HEIGHT;
  const left = Math.max(0, Math.round((OG_WIDTH - overlayW) / 2));

  return sharp(bgBuffer)
    .composite([{ input: overlayBuffer, gravity: 'centre', left, top: 0 }])
    .jpeg({ quality: OG_QUALITY, progressive: true })
    .toBuffer();
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns a 1200×630 JPEG Buffer for the property's Open Graph image.
 * Checks MinIO cache first; generates and stores if missing.
 *
 * @param {string} propertyId  – MongoDB _id of the Propiedad document.
 * @returns {Promise<Buffer>}
 * @throws if no image source found or Sharp processing fails.
 */
async function getOGImageBuffer(propertyId) {
  const id = String(propertyId || '');

  // 1. Cache hit
  const cached = await readCacheBuffer(id);
  if (cached) {
    console.log(`[OGImage] Cache hit for ${id}`);
    return cached;
  }

  // 2. Resolve cover document
  const coverDoc = await resolveCoverDocument(id);
  if (!coverDoc) throw new Error(`No cover image found for property ${id}`);

  // 3. Fetch raw bytes
  const rawBuffer = await fetchDocumentBuffer(coverDoc);

  // 4. Process with Sharp
  const ogBuffer = await processToOGSize(rawBuffer);

  // 5. Store in cache (fire-and-forget, never blocks response)
  writeCacheBuffer(id, ogBuffer).catch(() => {});

  console.log(`[OGImage] Generated OG image for ${id} (${ogBuffer.length} bytes)`);
  return ogBuffer;
}

/**
 * Deletes the cached OG image from MinIO so the next request regenerates it.
 * Call this when a property's cover photo changes.
 *
 * @param {string} propertyId
 */
async function invalidateOGCache(propertyId) {
  if (!minio.isConfigured()) return;
  const bucket = CACHE_BUCKET_KEY();
  if (!bucket) return;
  try {
    await minio.removeObjectSafe(bucket, cacheKey(propertyId));
    console.log(`[OGImage] Cache invalidated for ${propertyId}`);
  } catch (err) {
    console.warn(`[OGImage] Failed to invalidate cache for ${propertyId}:`, err && err.message);
  }
}

module.exports = { getOGImageBuffer, invalidateOGCache };
