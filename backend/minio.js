const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const Minio = require('minio');

function normalizeBool(value, defaultValue = false) {
  if (value === undefined || value === null || value === '') return defaultValue;
  return String(value).toLowerCase() === 'true';
}

function parseMinioEndpoint(rawEndpoint, rawPort, rawUseSsl) {
  const endpoint = String(rawEndpoint || '').trim();
  if (!endpoint) return { endPoint: '', port: 0, useSSL: false };

  if (endpoint.includes('://')) {
    const url = new URL(endpoint);
    const port = url.port ? parseInt(url.port, 10) : (url.protocol === 'https:' ? 443 : 80);
    return {
      endPoint: url.hostname,
      port,
      useSSL: url.protocol === 'https:',
    };
  }

  return {
    endPoint: endpoint,
    port: parseInt(String(rawPort || '9000'), 10),
    useSSL: normalizeBool(rawUseSsl, false),
  };
}

function getBucketsFromEnv() {
  const crm = (process.env.MINIO_BUCKET_CRM || '').trim();
  const erp = (process.env.MINIO_BUCKET_ERP || '').trim();
  const web = (process.env.MINIO_BUCKET_WEB || '').trim();
  const legacyDefault = (process.env.MINIO_BUCKET || '').trim();
  const fallbackDefault = legacyDefault || erp || crm || web;

  return {
    crm: crm || undefined,
    erp: erp || undefined,
    web: web || undefined,
    default: fallbackDefault || undefined,
  };
}

function getMinioConfig() {
  const accessKey = (process.env.MINIO_ACCESS_KEY || '').trim();
  const secretKey = (process.env.MINIO_SECRET_KEY || '').trim();
  const region = (process.env.MINIO_REGION || '').trim();

  const endpointParts = parseMinioEndpoint(
    process.env.MINIO_ENDPOINT,
    process.env.MINIO_PORT,
    process.env.MINIO_USE_SSL
  );

  const buckets = getBucketsFromEnv();
  const enabled = !!(endpointParts.endPoint && endpointParts.port && accessKey && secretKey && buckets.default);

  return {
    ...endpointParts,
    accessKey,
    secretKey,
    region: region || undefined,
    buckets,
    enabled,
  };
}

const minioConfig = getMinioConfig();

const client = minioConfig.enabled
  ? new Minio.Client({
    endPoint: minioConfig.endPoint,
    port: minioConfig.port,
    useSSL: minioConfig.useSSL,
    accessKey: minioConfig.accessKey,
    secretKey: minioConfig.secretKey,
  })
  : null;

function bucketExists(bucket) {
  return new Promise((resolve, reject) => {
    if (!client) return reject(new Error('MinIO is not configured'));
    client.bucketExists(bucket, (err, exists) => {
      if (err) return reject(err);
      return resolve(!!exists);
    });
  });
}

function makeBucket(bucket, region) {
  return new Promise((resolve, reject) => {
    if (!client) return reject(new Error('MinIO is not configured'));
    client.makeBucket(bucket, region, (err) => {
      if (err) return reject(err);
      return resolve(true);
    });
  });
}

function putObject(bucket, objectName, data, size, meta) {
  return new Promise((resolve, reject) => {
    if (!client) return reject(new Error('MinIO is not configured'));
    client.putObject(bucket, objectName, data, size, meta, (err, etag) => {
      if (err) return reject(err);
      return resolve(etag);
    });
  });
}

function getObject(bucket, objectName) {
  return new Promise((resolve, reject) => {
    if (!client) return reject(new Error('MinIO is not configured'));
    client.getObject(bucket, objectName, (err, dataStream) => {
      if (err) return reject(err);
      return resolve(dataStream);
    });
  });
}

function statObject(bucket, objectName) {
  return new Promise((resolve, reject) => {
    if (!client) return reject(new Error('MinIO is not configured'));
    client.statObject(bucket, objectName, (err, stat) => {
      if (err) return reject(err);
      return resolve(stat);
    });
  });
}

function removeObject(bucket, objectName) {
  return new Promise((resolve, reject) => {
    if (!client) return reject(new Error('MinIO is not configured'));
    client.removeObject(bucket, objectName, (err) => {
      if (err) return reject(err);
      return resolve(true);
    });
  });
}

async function removeObjectSafe(bucket, objectName) {
  try {
    return await removeObject(bucket, objectName);
  } catch (err) {
    const code = err && (err.code || err.Code);
    if (code === 'NoSuchKey' || code === 'NoSuchObject' || code === 'NotFound') return true;
    return false;
  }
}

function presignedGetObject(bucket, objectName, expirySeconds = 60) {
  return new Promise((resolve, reject) => {
    if (!client) return reject(new Error('MinIO is not configured'));
    client.presignedGetObject(bucket, objectName, expirySeconds, (err, url) => {
      if (err) return reject(err);
      // Replace localhost URL with public URL if configured
      const publicUrl = (process.env.MINIO_PUBLIC_URL || '').trim();
      if (publicUrl && url) {
        const minioBaseUrl = `http${minioConfig.useSSL ? 's' : ''}://${minioConfig.endPoint}:${minioConfig.port}`;
        const fixedUrl = url.replace(minioBaseUrl, publicUrl);
        return resolve(fixedUrl);
      }
      return resolve(url);
    });
  });
}

function presignedPutObject(bucket, objectName, expirySeconds = 60) {
  return new Promise((resolve, reject) => {
    if (!client) return reject(new Error('MinIO is not configured'));
    client.presignedPutObject(bucket, objectName, expirySeconds, (err, url) => {
      if (err) return reject(err);
      return resolve(url);
    });
  });
}

function isConfigured() {
  return !!client;
}

let ensureBucketsPromise = null;

async function ensureBucketByName(bucket) {
  if (!isConfigured()) return false;
  if (!bucket) return false;

  const exists = await bucketExists(bucket);
  if (exists) return true;
  await makeBucket(bucket, minioConfig.region);
  return true;
}

async function ensureBuckets() {
  if (!isConfigured()) return false;

  if (ensureBucketsPromise) return ensureBucketsPromise;

  ensureBucketsPromise = (async () => {
    const uniqueBuckets = Array.from(new Set(
      Object.values(minioConfig.buckets).filter(Boolean).map((b) => String(b))
    ));

    for (const bucket of uniqueBuckets) {
      // eslint-disable-next-line no-await-in-loop
      await ensureBucketByName(bucket);
    }

    return true;
  })();

  try {
    return await ensureBucketsPromise;
  } catch (err) {
    ensureBucketsPromise = null;
    throw err;
  }
}

async function ensureBucket() {
  return ensureBucketByName(minioConfig.buckets.default);
}

module.exports = {
  client,
  config: minioConfig,
  buckets: minioConfig.buckets,
  bucket: minioConfig.buckets.default,
  isConfigured,
  ensureBucket,
  ensureBuckets,
  putObject,
  getObject,
  statObject,
  removeObject,
  removeObjectSafe,
  presignedGetObject,
  presignedPutObject,
};
