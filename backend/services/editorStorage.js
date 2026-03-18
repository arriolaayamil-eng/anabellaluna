const crypto = require('crypto');
const path = require('path');
const minio = require('../minio');

const WATERMARK_PREFIX = 'watermarks/';
const EDITED_PREFIX = 'edited-images/';

const ALLOWED_IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp'];
const ALLOWED_WATERMARK_EXT = ['.png', '.svg'];
const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_WATERMARK_MIME = ['image/png', 'image/svg+xml'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

function sanitize(name) {
  return String(name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
}

function validateExtension(filename, allowed) {
  const ext = path.extname(filename).toLowerCase();
  return allowed.includes(ext);
}

function validateMime(mimetype, allowed) {
  return allowed.includes(String(mimetype || '').toLowerCase());
}

function validateSize(size) {
  return size > 0 && size <= MAX_FILE_SIZE;
}

function resolveBucket(domain) {
  const d = String(domain || '').toLowerCase();
  if (d === 'crm') return minio.buckets.crm || minio.bucket;
  if (d === 'web') return minio.buckets.web || minio.bucket;
  return minio.buckets.erp || minio.bucket;
}

function generateKey(prefix, originalName) {
  const safe = sanitize(originalName);
  const ts = Date.now();
  const rand = crypto.randomBytes(6).toString('hex');
  return `${prefix}${ts}-${rand}-${safe}`;
}

async function uploadWatermark(buffer, originalName, mimetype, domain) {
  if (!minio.isConfigured()) throw new Error('MinIO is not configured');
  if (!validateExtension(originalName, ALLOWED_WATERMARK_EXT)) {
    throw new Error('Invalid watermark extension. Allowed: ' + ALLOWED_WATERMARK_EXT.join(', '));
  }
  if (!validateMime(mimetype, ALLOWED_WATERMARK_MIME)) {
    throw new Error('Invalid watermark MIME type');
  }
  if (!validateSize(buffer.length)) {
    throw new Error('File too large (max 50 MB)');
  }

  const bucket = resolveBucket(domain);
  const key = generateKey(WATERMARK_PREFIX, originalName);
  await minio.ensureBuckets();
  await minio.putObject(bucket, key, buffer, buffer.length, { 'Content-Type': mimetype });
  return { bucket, key };
}

async function listWatermarks(domain) {
  if (!minio.isConfigured()) return [];
  const bucket = resolveBucket(domain);
  return new Promise((resolve, reject) => {
    const items = [];
    const stream = minio.client.listObjectsV2(bucket, WATERMARK_PREFIX, true);
    stream.on('data', (obj) => {
      if (obj.name) {
        const filename = obj.name.split('/').pop();
        items.push({
          key: obj.name,
          filename,
          size: obj.size,
          lastModified: obj.lastModified,
          bucket,
        });
      }
    });
    stream.on('error', reject);
    stream.on('end', () => resolve(items));
  });
}

async function getWatermarkUrl(key, domain) {
  if (!minio.isConfigured()) throw new Error('MinIO is not configured');
  const bucket = resolveBucket(domain);
  return minio.presignedGetObject(bucket, key, 3600);
}

async function deleteWatermark(key, domain) {
  if (!minio.isConfigured()) throw new Error('MinIO is not configured');
  const bucket = resolveBucket(domain);
  await minio.removeObject(bucket, key);
}

async function getObjectBuffer(bucket, key) {
  if (!minio.isConfigured()) throw new Error('MinIO is not configured');
  const stream = await minio.getObject(bucket, key);
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(Buffer.concat(chunks)));
  });
}

const MIME_TO_EXT = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp' };

async function saveEditedImage(buffer, originalName, mimetype, domain) {
  if (!minio.isConfigured()) throw new Error('MinIO is not configured');
  const bucket = resolveBucket(domain);
  const origExt = path.extname(originalName).toLowerCase();
  const baseName = path.basename(originalName, origExt);
  const outputExt = MIME_TO_EXT[mimetype] || origExt || '.png';
  const outputName = `${baseName}_edited${outputExt}`;
  const key = generateKey(EDITED_PREFIX, outputName);
  await minio.ensureBuckets();
  await minio.putObject(bucket, key, buffer, buffer.length, { 'Content-Type': mimetype });
  return { bucket, key, filename: outputName };
}

async function listEditedImages(domain) {
  if (!minio.isConfigured()) return [];
  const bucket = resolveBucket(domain);
  return new Promise((resolve, reject) => {
    const items = [];
    const stream = minio.client.listObjectsV2(bucket, EDITED_PREFIX, true);
    stream.on('data', (obj) => {
      if (obj.name) {
        items.push({
          key: obj.name,
          filename: obj.name.split('/').pop(),
          size: obj.size,
          lastModified: obj.lastModified,
          bucket,
        });
      }
    });
    stream.on('error', reject);
    stream.on('end', () => resolve(items));
  });
}

async function getEditedImageUrl(key, domain) {
  if (!minio.isConfigured()) throw new Error('MinIO is not configured');
  const bucket = resolveBucket(domain);
  return minio.presignedGetObject(bucket, key, 3600);
}

async function getImageUrl(key, domain, explicitBucket) {
  if (!minio.isConfigured()) throw new Error('MinIO is not configured');
  const bucket = explicitBucket || resolveBucket(domain);
  return minio.presignedGetObject(bucket, key, 3600);
}

module.exports = {
  WATERMARK_PREFIX,
  EDITED_PREFIX,
  ALLOWED_IMAGE_EXT,
  ALLOWED_WATERMARK_EXT,
  ALLOWED_IMAGE_MIME,
  ALLOWED_WATERMARK_MIME,
  MAX_FILE_SIZE,
  sanitize,
  validateExtension,
  validateMime,
  validateSize,
  resolveBucket,
  generateKey,
  uploadWatermark,
  listWatermarks,
  getWatermarkUrl,
  deleteWatermark,
  getObjectBuffer,
  saveEditedImage,
  listEditedImages,
  getEditedImageUrl,
  getImageUrl,
};
