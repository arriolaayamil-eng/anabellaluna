const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticateToken, agentScopeId } = require('../auth');
const Document = require('../models/Document');
const EditedImage = require('../models/EditedImage');
const Folder = require('../models/Folder');
const Agente = require('../models/Agente');
const editorStorage = require('../services/editorStorage');
const editorRender = require('../services/editorRender');
const minio = require('../minio');

// ── Helper: find or create a folder by name under a given parent, scoped to agenteId ──
async function findOrCreateFolder(name, parent, agenteId) {
  let folder = await Folder.findOne({ name, parent: parent || null, agenteId: agenteId || '' }).exec();
  if (!folder) {
    folder = await Folder.create({ name, parent: parent || null, agenteId: agenteId || '' });
  }
  return folder;
}

// ── Get agent name by ID (cached per request) ──
async function getAgenteName(agenteId) {
  if (!agenteId) return null;
  const agente = await Agente.findById(agenteId, 'nombre').lean();
  return agente ? agente.nombre : null;
}

// Helper: build a proxy URL so the browser fetches MinIO objects through the API
// (avoids mixed-content / CORS when MinIO is on localhost)
function buildProxyUrl(req, bucket, key) {
  const host = req.get('X-Forwarded-Host') || req.get('Host') || '';
  const isLocal = host.startsWith('localhost') || host.startsWith('127.0.0.1');
  const proto = req.get('X-Forwarded-Proto') || (isLocal ? 'http' : 'https');
  return `${proto}://${host}/editor/file?bucket=${encodeURIComponent(bucket)}&key=${encodeURIComponent(key)}`;
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: editorStorage.MAX_FILE_SIZE },
});

// ── List images from the existing file system (Documents) ──
router.get('/images', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const folder = req.query.folder || null;
    const q = req.query.q || '';
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 50));
    const skip = (page - 1) * limit;

    const filter = {
      mimetype: { $regex: /^image\//i },
    };
    if (folder) filter.folder = folder;
    if (q) filter.nombre = new RegExp(q, 'i');
    if (scopeId) filter.agenteId = scopeId;

    const [docs, total] = await Promise.all([
      Document.find(filter).sort({ fecha: -1 }).skip(skip).limit(limit).lean(),
      Document.countDocuments(filter),
    ]);

    // Generate presigned URLs for thumbnails
    const items = await Promise.all(docs.map(async (doc) => {
      let thumbnailUrl = '';
      let fullUrl = '';
      try {
        if (doc.object_key && doc.bucket) {
          fullUrl = buildProxyUrl(req, doc.bucket, doc.object_key);
          thumbnailUrl = fullUrl; // Use same URL; frontend will constrain display size
        } else if (doc.url) {
          fullUrl = doc.url;
          thumbnailUrl = doc.url;
        }
      } catch (e) {
        // skip broken refs
      }
      return {
        _id: doc._id,
        nombre: doc.nombre,
        mimetype: doc.mimetype,
        tamano: doc.tamano,
        fecha: doc.fecha,
        folder: doc.folder,
        object_key: doc.object_key,
        bucket: doc.bucket,
        thumbnailUrl,
        fullUrl,
      };
    }));

    res.json({ items, total, page, limit });
  } catch (err) {
    console.error('[Editor] Error listing images:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Get presigned URL for a specific image ──
router.get('/images/:id/url', authenticateToken, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: 'Image not found' });
    const scopeId = agentScopeId(req);
    if (scopeId && String(doc.agenteId || '') !== scopeId) return res.status(403).json({ error: 'forbidden' });

    if (doc.object_key && doc.bucket) {
      const url = buildProxyUrl(req, doc.bucket, doc.object_key);
      return res.json({ url, object_key: doc.object_key, bucket: doc.bucket });
    }
    if (doc.url) return res.json({ url: doc.url });
    return res.status(404).json({ error: 'No file reference found' });
  } catch (err) {
    console.error('[Editor] Error getting image URL:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Watermark CRUD ──

// List watermarks
router.get('/watermarks', authenticateToken, async (req, res) => {
  try {
    const items = await editorStorage.listWatermarks('erp');
    // add presigned URLs
    const result = await Promise.all(items.map(async (item) => {
      item.url = buildProxyUrl(req, item.bucket, item.key);
      return item;
    }));
    res.json(result);
  } catch (err) {
    console.error('[Editor] Error listing watermarks:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Upload watermark
router.post('/watermarks', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { bucket, key } = await editorStorage.uploadWatermark(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'erp'
    );
    const url = buildProxyUrl(req, bucket, key);
    console.log(`[Editor] Watermark uploaded: ${key}`);
    res.status(201).json({ bucket, key, filename: req.file.originalname, url });
  } catch (err) {
    console.error('[Editor] Error uploading watermark:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// Delete watermark
router.delete('/watermarks/:key(*)', authenticateToken, async (req, res) => {
  try {
    await editorStorage.deleteWatermark(req.params.key, 'erp');
    console.log(`[Editor] Watermark deleted: ${req.params.key}`);
    res.json({ ok: true });
  } catch (err) {
    console.error('[Editor] Error deleting watermark:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Render watermarked image ──
router.post('/render', authenticateToken, async (req, res) => {
  try {
    const { imageId, imageObjectKey, imageBucket, watermarkKey, watermarkConfig, outputFormat, cropConfig } = req.body;

    if (!watermarkKey) return res.status(400).json({ error: 'watermarkKey is required' });
    if (!watermarkConfig) return res.status(400).json({ error: 'watermarkConfig is required' });

    // Resolve image source
    let imgBucket, imgKey, originalFilename;
    if (imageId) {
      const doc = await Document.findById(imageId).lean();
      if (!doc) return res.status(404).json({ error: 'Source image not found' });
      const scopeId = agentScopeId(req);
      if (scopeId && String(doc.agenteId || '') !== scopeId) return res.status(403).json({ error: 'forbidden' });
      imgBucket = doc.bucket;
      imgKey = doc.object_key;
      originalFilename = doc.nombre || 'image.png';
    } else if (imageObjectKey && imageBucket) {
      imgBucket = imageBucket;
      imgKey = imageObjectKey;
      originalFilename = imageObjectKey.split('/').pop();
    } else {
      return res.status(400).json({ error: 'imageId or imageObjectKey+imageBucket required' });
    }

    if (!imgKey || !imgBucket) return res.status(400).json({ error: 'Image has no MinIO reference' });

    console.log(`[Editor] Render started: image=${imgKey}, watermark=${watermarkKey}`);

    // Fetch buffers
    const [imageBuffer, watermarkBuffer] = await Promise.all([
      editorStorage.getObjectBuffer(imgBucket, imgKey),
      editorStorage.getObjectBuffer(editorStorage.resolveBucket('erp'), watermarkKey),
    ]);

    // Crop first if requested
    let finalImageBuffer = imageBuffer;
    if (cropConfig && cropConfig.left != null && cropConfig.top != null && cropConfig.width && cropConfig.height) {
      const sharp = require('sharp');
      const meta = await sharp(imageBuffer).metadata();
      const cl = Math.max(0, Math.min(cropConfig.left, meta.width - 1));
      const ct = Math.max(0, Math.min(cropConfig.top, meta.height - 1));
      const cw = Math.min(cropConfig.width, meta.width - cl);
      const ch = Math.min(cropConfig.height, meta.height - ct);
      if (cw > 0 && ch > 0) {
        finalImageBuffer = await sharp(imageBuffer).extract({ left: cl, top: ct, width: cw, height: ch }).toBuffer();
        console.log(`[Editor] Cropped to ${cw}x${ch} at (${cl},${ct})`);
      }
    }

    // Render
    const fmt = outputFormat || 'png';
    const result = await editorRender.renderWatermark(finalImageBuffer, watermarkBuffer, watermarkConfig, fmt);

    // Save to MinIO
    const mimeMap = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' };
    const saved = await editorStorage.saveEditedImage(
      result.buffer,
      originalFilename,
      mimeMap[result.format] || 'image/png',
      'erp'
    );

    // Save metadata
    const user = req.user || {};
    const scopeId = agentScopeId(req);
    const effectiveAgenteId = scopeId || '';

    const record = await EditedImage.create({
      originalDocumentId: imageId || null,
      originalObjectKey: imgKey,
      originalFilename,
      watermarkObjectKey: watermarkKey,
      watermarkFilename: watermarkKey.split('/').pop(),
      outputObjectKey: saved.key,
      outputFilename: saved.filename,
      outputBucket: saved.bucket,
      outputFormat: result.format,
      outputSize: result.buffer.length,
      outputWidth: result.width,
      outputHeight: result.height,
      watermarkConfig,
      userId: user.id || user._id || '',
      userName: user.nombre || user.username || '',
      agenteId: effectiveAgenteId,
    });

    // ── Auto-create folder structure & Document so edited images appear in file manager ──
    try {
      // Determine the agenteId that owns the edited image
      // For agents: use their own ID; for admin: use the original image's agenteId
      let ownerAgenteId = effectiveAgenteId;
      if (!ownerAgenteId && imageId) {
        const srcDoc = await Document.findById(imageId, 'agenteId').lean();
        if (srcDoc) ownerAgenteId = srcDoc.agenteId || '';
      }

      // 1) Root folder "Imágenes con marca de agua" (admin-level, no agenteId)
      const rootFolder = await findOrCreateFolder('Imágenes con marca de agua', null, '');

      // 2) Agent subfolder inside root (for admin organization by agent)
      let targetFolder = rootFolder;
      if (ownerAgenteId) {
        const agentName = await getAgenteName(ownerAgenteId) || `Agente ${ownerAgenteId}`;
        const agentSubfolder = await findOrCreateFolder(agentName, rootFolder._id, '');
        targetFolder = agentSubfolder;

        // 3) Also create a folder in the agent's own scope so they see it in their file manager
        const agentOwnFolder = await findOrCreateFolder('Imágenes con marca de agua', null, ownerAgenteId);
        // Create the Document scoped to the agent
        await Document.create({
          nombre: saved.filename,
          tipo: 'Imagen',
          mimetype: mimeMap[result.format] || 'image/png',
          categoria: 'Marca de agua',
          tamano: Math.round(result.buffer.length / 1024 / 1024 * 100) / 100,
          bucket: saved.bucket,
          object_key: saved.key,
          folder: agentOwnFolder._id,
          agenteId: ownerAgenteId,
          sourceModule: 'editor',
          documentType: 'edited-image',
          uploadedBy: user.nombre || user.username || '',
          tags: ['marca-de-agua', 'editada'],
          metadata: { editedImageId: record._id, originalFilename },
        });
      }

      // 4) Create the Document in admin-visible folder (no agenteId scope)
      await Document.create({
        nombre: saved.filename,
        tipo: 'Imagen',
        mimetype: mimeMap[result.format] || 'image/png',
        categoria: 'Marca de agua',
        tamano: Math.round(result.buffer.length / 1024 / 1024 * 100) / 100,
        bucket: saved.bucket,
        object_key: saved.key,
        folder: targetFolder._id,
        agenteId: '',
        sourceModule: 'editor',
        documentType: 'edited-image',
        uploadedBy: user.nombre || user.username || '',
        tags: ['marca-de-agua', 'editada'],
        metadata: { editedImageId: record._id, originalFilename },
      });

      console.log(`[Editor] Document created in folder "${targetFolder.name}" for ${saved.filename}`);
    } catch (folderErr) {
      // Non-fatal: image was rendered and saved, just folder creation failed
      console.error('[Editor] Warning: could not create Document in folder:', folderErr.message);
    }

    const outputUrl = buildProxyUrl(req, saved.bucket, saved.key);

    console.log(`[Editor] Render complete: ${saved.key} (${result.width}x${result.height}, ${result.buffer.length} bytes)`);

    res.json({
      _id: record._id,
      outputUrl,
      outputKey: saved.key,
      outputFilename: saved.filename,
      width: result.width,
      height: result.height,
      size: result.buffer.length,
      format: result.format,
    });
  } catch (err) {
    console.error('[Editor] Render error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── List edited images ──
router.get('/edited', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const filter = {};
    if (scopeId) filter.agenteId = scopeId;
    const records = await EditedImage.find(filter).sort({ createdAt: -1 }).limit(200).lean();

    const items = await Promise.all(records.map(async (r) => {
      r.outputUrl = buildProxyUrl(req, r.outputBucket, r.outputObjectKey);
      return r;
    }));

    res.json(items);
  } catch (err) {
    console.error('[Editor] Error listing edited images:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Migrate existing edited images into folder/document system ──
router.post('/migrate-to-folders', authenticateToken, async (req, res) => {
  try {
    // Only admin can run migration
    if (req.user && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin only' });
    }

    const allEdited = await EditedImage.find({}).lean();
    let created = 0, skipped = 0, errors = 0;

    for (const record of allEdited) {
      try {
        // Check if a Document already exists for this edited image
        const existing = await Document.findOne({
          object_key: record.outputObjectKey,
          documentType: 'edited-image',
        }).lean();
        if (existing) { skipped++; continue; }

        const ownerAgenteId = record.agenteId || '';
        const mimeMap = { png: 'image/png', jpeg: 'image/jpeg', webp: 'image/webp' };
        const mime = mimeMap[record.outputFormat] || 'image/png';

        // 1) Root admin folder
        const rootFolder = await findOrCreateFolder('Imágenes con marca de agua', null, '');

        // 2) Agent subfolder (admin-visible)
        let targetFolder = rootFolder;
        if (ownerAgenteId) {
          const agentName = await getAgenteName(ownerAgenteId) || `Agente ${ownerAgenteId}`;
          const agentSubfolder = await findOrCreateFolder(agentName, rootFolder._id, '');
          targetFolder = agentSubfolder;

          // 3) Agent's own scoped folder
          const agentOwnFolder = await findOrCreateFolder('Imágenes con marca de agua', null, ownerAgenteId);
          await Document.create({
            nombre: record.outputFilename,
            tipo: 'Imagen',
            mimetype: mime,
            categoria: 'Marca de agua',
            tamano: Math.round((record.outputSize || 0) / 1024 / 1024 * 100) / 100,
            bucket: record.outputBucket,
            object_key: record.outputObjectKey,
            folder: agentOwnFolder._id,
            agenteId: ownerAgenteId,
            sourceModule: 'editor',
            documentType: 'edited-image',
            uploadedBy: record.userName || '',
            tags: ['marca-de-agua', 'editada'],
            metadata: { editedImageId: record._id, originalFilename: record.originalFilename },
          });
        }

        // 4) Admin-visible document
        await Document.create({
          nombre: record.outputFilename,
          tipo: 'Imagen',
          mimetype: mime,
          categoria: 'Marca de agua',
          tamano: Math.round((record.outputSize || 0) / 1024 / 1024 * 100) / 100,
          bucket: record.outputBucket,
          object_key: record.outputObjectKey,
          folder: targetFolder._id,
          agenteId: '',
          sourceModule: 'editor',
          documentType: 'edited-image',
          uploadedBy: record.userName || '',
          tags: ['marca-de-agua', 'editada'],
          metadata: { editedImageId: record._id, originalFilename: record.originalFilename },
        });

        created++;
      } catch (e) {
        console.error(`[Editor] Migration error for ${record._id}:`, e.message);
        errors++;
      }
    }

    console.log(`[Editor] Migration complete: ${created} created, ${skipped} skipped, ${errors} errors`);
    res.json({ total: allEdited.length, created, skipped, errors });
  } catch (err) {
    console.error('[Editor] Migration error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Get folders (reuse existing folder browse for the file explorer) ──
router.get('/folders', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const parent = req.query.parent || null;
    const filter = { parent: parent || null };
    if (scopeId) filter.agenteId = scopeId;
    const folders = await Folder.find(filter).sort({ name: 1 }).lean();
    res.json(folders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Debug: check folder structure ──
router.get('/debug-folders', authenticateToken, async (req, res) => {
  try {
    const wmFolders = await Folder.find({ name: 'Imágenes con marca de agua' }).lean();
    const wmDocs = await Document.find({ documentType: 'edited-image' }).lean();
    const editedCount = await EditedImage.countDocuments({});
    res.json({ folders: wmFolders, documentsCount: wmDocs.length, editedImagesCount: editedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Proxy: serve MinIO objects through the API to avoid mixed-content / CORS ──
router.get('/file', async (req, res) => {
  try {
    const { bucket, key } = req.query;
    if (!bucket || !key) return res.status(400).json({ error: 'bucket and key required' });

    const stat = await minio.statObject(bucket, key);
    const ct = (stat.metaData && stat.metaData['content-type']) || 'application/octet-stream';
    res.set('Content-Type', ct);
    if (stat.size) res.set('Content-Length', String(stat.size));
    res.set('Cache-Control', 'public, max-age=3600');

    const stream = await minio.getObject(bucket, key);
    stream.pipe(res);
  } catch (err) {
    console.error('[Editor] Proxy error:', err.message);
    res.status(err.code === 'NoSuchKey' ? 404 : 500).json({ error: err.message });
  }
});

module.exports = router;
