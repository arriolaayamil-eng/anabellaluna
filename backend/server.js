const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const db = require('./db');
const cloudinary = require('./cloudinary');
const minio = require('./minio');
const {
  bucket: defaultMinioBucket,
  buckets: minioBuckets,
  isConfigured: isMinioConfigured,
  ensureBuckets,
  putObject,
  getObject,
  statObject,
  removeObjectSafe,
} = minio;
const streamifier = require('streamifier');
const Document = require('./models/Document');
const Version = require('./models/Version');
const User = require('./models/User');
const { router: authRouter, authenticateToken } = require('./auth');
const crmRoutes = require('./routes/crm');
const auditRoutes = require('./routes/audit');
const tareasRoutes = require('./routes/tareas');
const propiedadesRoutes = require('./routes/propiedades');
const clientesRoutes = require('./routes/clientes');
const agentesRoutes = require('./routes/agentes');
const operacionesRoutes = require('./routes/operaciones');
const citasRoutes = require('./routes/citas');
const activitiesRoutes = require('./routes/activities');
const publicRoutes = require('./routes/public');
const integrationsRoutes = require('./routes/integrations');
const rewardsRoutes = require('./routes/rewards');
const messagesRoutes = require('./routes/messages');
const reportsRoutes = require('./routes/reports');
const notificationsRoutes = require('./routes/notifications');
const automationsRoutes = require('./routes/automations');
const fechasImportantesRoutes = require('./routes/fechasImportantes');
const globalConfigRoutes = require('./routes/globalConfig');
const { initReportScheduler } = require('./services/reportScheduler');
const { initAutomationScheduler } = require('./services/automationScheduler');

// Sync admin credentials from .env on startup
async function syncAdminCredentials() {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  if (!adminUsername || !adminPassword) {
    console.log('[AdminSync] ADMIN_USERNAME or ADMIN_PASSWORD not set in .env, skipping sync');
    return;
  }
  
  try {
    const adminHash = await bcrypt.hash(adminPassword, 10);
    const admin = await User.findOneAndUpdate(
      { username: adminUsername },
      { $set: { password_hash: adminHash, role: 'admin' } },
      { upsert: true, new: true }
    ).exec();
    console.log(`[AdminSync] Admin credentials synced: ${admin.username}`);
  } catch (err) {
    console.error('[AdminSync] Failed to sync admin credentials:', err.message);
  }
}

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-domain', 'x-module', 'x-visitor-id'],
}));
app.use(express.json());

function agentScopeId(req) {
  if (req.user && req.user.role === 'admin') return null;
  return req.user && req.user.agenteId ? String(req.user.agenteId) : null;
}

// optional request logger (morgan) if installed
try {
  // eslint-disable-next-line global-require
  const morgan = require('morgan');
  app.use(morgan('dev'));
} catch (e) {
  // morgan not installed, ignore
}

// Auth routes
app.use('/auth', authRouter);
app.use('/public', publicRoutes);
app.use('/audit', auditRoutes);

// CRM entity routes (specific routes MUST come before generic /crm)
app.use('/crm/tareas', tareasRoutes);
app.use('/crm/propiedades', propiedadesRoutes);
app.use('/crm/clientes', clientesRoutes);
app.use('/crm/agentes', agentesRoutes);
app.use('/crm/operaciones', operacionesRoutes);
app.use('/crm/citas', citasRoutes);
app.use('/crm/activities', activitiesRoutes);
app.use('/crm/integrations', integrationsRoutes);
app.use('/crm/rewards', rewardsRoutes);
app.use('/crm/messages', messagesRoutes);
app.use('/crm/reports', reportsRoutes);
app.use('/crm/notifications', notificationsRoutes);
app.use('/crm/automations', automationsRoutes);
app.use('/crm/fechas-importantes', fechasImportantesRoutes);
app.use('/admin/config', globalConfigRoutes);

// Generic CRM routes (links) - MUST come after specific routes
app.use('/crm', crmRoutes);

// Multer memory storage for Cloudinary upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

function sanitizeFilename(name) {
  return String(name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
}

function resolveMinioBucket(domain) {
  const d = String(domain || '').toLowerCase();
  if (d === 'crm') return minioBuckets.crm || defaultMinioBucket;
  if (d === 'web') return minioBuckets.web || defaultMinioBucket;
  if (d === 'erp') return minioBuckets.erp || defaultMinioBucket;
  return minioBuckets.erp || defaultMinioBucket;
}

function resolveDomain(req) {
  const fromQuery = req && req.query ? req.query.domain : undefined;
  const fromHeader = req && req.headers ? (req.headers['x-domain'] || req.headers['x-module']) : undefined;
  const domain = String(fromQuery || fromHeader || 'erp').toLowerCase();
  if (domain === 'crm' || domain === 'erp' || domain === 'web') return domain;
  return 'erp';
}

async function ensureBucketsOr503(res) {
  try {
    await ensureBuckets();
    return true;
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    res.status(503).json({ error: 'MinIO is unavailable', details: msg });
    return false;
  }
}

// Routes
// Root route - API info
app.get('/', (req, res) => {
  res.json({
    name: 'CRM Admin API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: 'GET /health',
      auth: {
        login: 'POST /auth/login',
        register: 'POST /auth/register'
      },
      crm: {
        propiedades: 'GET/POST/PUT/DELETE /crm/propiedades',
        clientes: 'GET/POST/PUT/DELETE /crm/clientes',
        agentes: 'GET/POST/PUT/DELETE /crm/agentes',
        operaciones: 'GET/POST/PUT/DELETE /crm/operaciones',
        citas: 'GET/POST/PUT/DELETE /crm/citas',
        tareas: 'GET/POST/PUT/DELETE /crm/tareas'
      },
      documents: {
        list: 'GET /documents',
        upload: 'POST /documents',
        download: 'GET /documents/:id/download',
        delete: 'DELETE /documents/:id'
      }
    }
  });
});

app.get('/health', (req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

// List documents (simple query, supports search query param)
app.get('/documents', authenticateToken, async (req, res) => {
  try {
    const q = req.query.q || '';
    const scopeId = agentScopeId(req);
    const filter = q ? { nombre: new RegExp(q, 'i') } : {};
    if (scopeId) filter.agenteId = scopeId;
    const docs = await Document.find(filter).sort({ _id: -1 }).limit(500).exec();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/documents/:id', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const doc = await Document.findById(id).populate('versions').exec();
    if (!doc) return res.status(404).json({ error: 'Not found' });
    const scopeId = agentScopeId(req);
    if (scopeId && String(doc.agenteId || '') !== scopeId) return res.status(403).json({ error: 'forbidden' });
    return res.json(doc);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/documents/:id/versions', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const doc = await Document.findById(id).exec();
    if (!doc) return res.status(404).json({ error: 'Not found' });
    const scopeId = agentScopeId(req);
    if (scopeId && String(doc.agenteId || '') !== scopeId) return res.status(403).json({ error: 'forbidden' });
    const versions = await Version.find({ document: doc._id }).sort({ created_at: -1 }).exec();
    return res.json(versions);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/documents/:id/versions', authenticateToken, upload.array('files'), async (req, res) => {
  const files = req.files || [];
  if (files.length === 0) return res.status(400).json({ error: 'No files uploaded' });
  try {
    const id = req.params.id;
    const doc = await Document.findById(id).exec();
    if (!doc) return res.status(404).json({ error: 'Not found' });

    const scopeId = agentScopeId(req);
    if (scopeId && String(doc.agenteId || '') !== scopeId) return res.status(403).json({ error: 'forbidden' });

    const storageProvider = String(process.env.STORAGE_PROVIDER || 'minio').toLowerCase();
    const useMinio = storageProvider === 'minio' && isMinioConfigured();
    if (storageProvider === 'minio' && !useMinio) {
      return res.status(503).json({ error: 'MinIO is not configured' });
    }
    if (useMinio) {
      const ok = await ensureBucketsOr503(res);
      if (!ok) return;
    }

    const domain = resolveDomain(req);

    const created = [];
    for (const f of files) {
      let url;
      let cloudinaryId;
      let objectKey;

      if (useMinio) {
        const bucket = resolveMinioBucket(domain);
        const safeName = sanitizeFilename(f.originalname);
        objectKey = `documents/${doc._id}/versions/${Date.now()}-${crypto.randomBytes(8).toString('hex')}-${safeName}`;
        await putObject(bucket, objectKey, f.buffer, f.size, {
          'Content-Type': f.mimetype || 'application/octet-stream',
        });
      } else {
        const streamUpload = (buffer) => new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
            if (result) resolve(result); else reject(error);
          });
          streamifier.createReadStream(buffer).pipe(stream);
        });
        const result = await streamUpload(f.buffer);
        url = result.secure_url;
        cloudinaryId = result.public_id;
      }

      const version = new Version({
        document: doc._id,
        filename: f.originalname,
        url,
        cloudinary_id: cloudinaryId,
        bucket: useMinio ? resolveMinioBucket(domain) : undefined,
        object_key: objectKey,
      });
      await version.save();
      doc.versions.push(version._id);

      if (objectKey) {
        doc.bucket = resolveMinioBucket(domain);
        doc.object_key = objectKey;
        doc.cloudinary_id = undefined;
        doc.url = `/documents/${doc._id}/download`;
      } else {
        doc.url = url;
        doc.cloudinary_id = cloudinaryId;
        doc.object_key = undefined;
        doc.bucket = '';
      }

      await doc.save();
      created.push(version);
    }

    return res.status(201).json({ versions: created, document: doc });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/documents/:id/versions/:versionId/restore', authenticateToken, async (req, res) => {
  try {
    const { id, versionId } = req.params;
    const doc = await Document.findById(id).exec();
    if (!doc) return res.status(404).json({ error: 'Not found' });
    const version = await Version.findOne({ _id: versionId, document: doc._id }).exec();
    if (!version) return res.status(404).json({ error: 'Version not found' });

    if (version.object_key) {
      doc.bucket = version.bucket || doc.bucket || resolveMinioBucket('erp');
      doc.object_key = version.object_key;
      doc.cloudinary_id = undefined;
      doc.url = `/documents/${doc._id}/download`;
    } else {
      doc.url = version.url;
      doc.cloudinary_id = version.cloudinary_id;
      doc.object_key = undefined;
      doc.bucket = '';
    }

    await doc.save();
    return res.json({ ok: true, document: doc });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Upload documents
app.post('/documents', authenticateToken, upload.array('files'), async (req, res) => {
  const files = req.files || [];
  if (files.length === 0) return res.status(400).json({ error: 'No files uploaded' });
  try {
    const scopeId = agentScopeId(req);
    const categoria = req.body && req.body.categoria ? String(req.body.categoria) : undefined;
    const relacionado = req.body && req.body.relacionado ? String(req.body.relacionado) : undefined;
    const storageProvider = String(process.env.STORAGE_PROVIDER || 'minio').toLowerCase();
    const useMinio = storageProvider === 'minio' && isMinioConfigured();
    if (storageProvider === 'minio' && !useMinio) {
      return res.status(503).json({ error: 'MinIO is not configured' });
    }
    if (useMinio) {
      const ok = await ensureBucketsOr503(res);
      if (!ok) return;
    }

    const domain = resolveDomain(req);

    const uploaded = [];
    for (const f of files) {
      const ext = (f.originalname.split('.').pop() || '').toUpperCase();
      const tipo = ext === 'PDF' ? 'PDF' : (ext === 'DOCX' || ext === 'DOC') ? 'Word' : (ext === 'ZIP' ? 'ZIP' : 'Imagen');
      const tamano = +(f.size / (1024 * 1024)).toFixed(2);

      let url;
      let cloudinaryId;
      let objectKey;

      if (useMinio) {
        const bucket = resolveMinioBucket(domain);
        const safeName = sanitizeFilename(f.originalname);
        objectKey = `documents/${Date.now()}-${crypto.randomBytes(8).toString('hex')}-${safeName}`;
        await putObject(bucket, objectKey, f.buffer, f.size, {
          'Content-Type': f.mimetype || 'application/octet-stream',
        });
      } else {
        const streamUpload = (buffer) => new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
            if (result) resolve(result); else reject(error);
          });
          streamifier.createReadStream(buffer).pipe(stream);
        });
        const result = await streamUpload(f.buffer);
        url = result.secure_url;
        cloudinaryId = result.public_id;
      }

      const doc = new Document({
        nombre: f.originalname,
        tipo,
        categoria: categoria || undefined,
        tamano,
        url,
        relacionado: relacionado || undefined,
        cloudinary_id: cloudinaryId,
        bucket: useMinio ? resolveMinioBucket(domain) : '',
        object_key: objectKey,
        agenteId: scopeId || '',
      });
      await doc.save();
      if (!doc.url) {
        doc.url = `/documents/${doc._id}/download`;
        await doc.save();
      }
      const version = new Version({
        document: doc._id,
        filename: f.originalname,
        url: doc.url,
        cloudinary_id: cloudinaryId,
        bucket: useMinio ? resolveMinioBucket(domain) : undefined,
        object_key: objectKey,
      });
      await version.save();
      doc.versions.push(version._id);
      await doc.save();
      uploaded.push(doc);
    }
    res.status(201).json({ uploaded });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download document by id
app.get('/documents/:id/download', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const doc = await Document.findById(id).exec();
    if (!doc) return res.status(404).json({ error: 'Not found' });

    const scopeId = agentScopeId(req);
    if (scopeId && String(doc.agenteId || '') !== scopeId) return res.status(403).json({ error: 'forbidden' });

    // increase accesos
    doc.accesos = (doc.accesos || 0) + 1;
    await doc.save();

    if (doc.object_key) {
      const bucket = doc.bucket || resolveMinioBucket('erp');
      res.setHeader('Content-Disposition', `attachment; filename="${String(doc.nombre || 'file').replace(/"/g, '')}"`);
      try {
        const stat = await statObject(bucket, doc.object_key);
        const ct = (stat && stat.metaData && (stat.metaData['content-type'] || stat.metaData['Content-Type'])) || null;
        if (ct) res.setHeader('Content-Type', ct);
        if (stat && stat.size) res.setHeader('Content-Length', String(stat.size));
      } catch (e) {
        // ignore stat failures; we can still stream
      }

      const stream = await getObject(bucket, doc.object_key);
      stream.on('error', (e) => {
        res.status(500).json({ error: e && e.message ? e.message : String(e) });
      });
      stream.pipe(res);
      return;
    }

    return res.redirect(doc.url);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete document
app.delete('/documents/:id', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const doc = await Document.findById(id).exec();
    if (!doc) return res.status(404).json({ error: 'Not found' });

    const scopeId = agentScopeId(req);
    if (scopeId && String(doc.agenteId || '') !== scopeId) return res.status(403).json({ error: 'forbidden' });

    if (doc.object_key) {
      const bucket = doc.bucket || resolveMinioBucket('erp');
      const ok = await removeObjectSafe(bucket, doc.object_key);
      if (!ok) return res.status(500).json({ error: 'Failed to delete object from MinIO' });
    } else if (doc.cloudinary_id) {
      await cloudinary.uploader.destroy(doc.cloudinary_id, { resource_type: 'auto' });
    }

    await Version.deleteMany({ document: doc._id });
    await doc.remove();
    res.json({ deletedId: id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Webhook endpoint for CRM to notify document actions (example)
app.post('/webhook/crm', (req, res) => {
  // Ejemplo: { action: 'link_document', crmId: '123', documentId: 5 }
  const payload = req.body;
  console.log('CRM webhook received', payload);
  // Aquí se mapearía crmId -> relacionado u otra lógica
  // Para ejemplo, si nos envían documentId y crmId, actualizamos campo 'relacionado'
  if (payload.documentId && payload.crmId) {
    // Use Mongoose to update the Document.relacionado field
    const docId = payload.documentId;
    Document.findByIdAndUpdate(docId, { relacionado: payload.crmId }, { new: true }).then(updated => {
      if (!updated) return res.status(404).json({ error: 'Not found' });
      return res.json({ ok: true, updated: updated._id });
    }).catch(err => res.status(500).json({ error: err.message }));
    return;
  }
  res.json({ ok: true });
});

// Serve uploaded files (optional) - define uploadDir for backward compatibility with earlier prototype
const uploadDir = path.join(__dirname, 'uploads');
if (!require('fs').existsSync(uploadDir)) {
  // it's fine if uploads folder doesn't exist (we use Cloudinary), but create for compatibility
  try { require('fs').mkdirSync(uploadDir, { recursive: true }); } catch(e) { /* ignore */ }
}
app.use('/uploads', express.static(uploadDir));

if (require.main === module) {
  (async () => {
    const storageProvider = String(process.env.STORAGE_PROVIDER || 'minio').toLowerCase();
    const useMinio = storageProvider === 'minio' && isMinioConfigured();
    if (storageProvider === 'minio' && !useMinio) {
      console.warn('MinIO is not configured but STORAGE_PROVIDER=minio');
    }
    if (useMinio) {
      try {
        await ensureBuckets();
      } catch (err) {
        const msg = err && err.message ? err.message : String(err);
        console.warn(`MinIO is unavailable on startup: ${msg}`);
      }
    }

    // Sync admin credentials from .env before listening
    await syncAdminCredentials();

    app.listen(PORT, () => {
      console.log(`Document backend listening on http://localhost:${PORT}`);
      // Initialize report scheduler for automatic monthly reports
      initReportScheduler();
      // Initialize automation scheduler for CRM notifications
      initAutomationScheduler();
    });
  })().catch((err) => {
    console.error('Backend startup failed:', err && err.message ? err.message : err);
    process.exit(1);
  });
} else {
  // when required (for tests) export the app without listening
  module.exports = app;
}
