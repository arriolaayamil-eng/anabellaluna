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

const Operacion = require('./models/Operacion');

const Version = require('./models/Version');

const EditedImage = require('./models/EditedImage');

const User = require('./models/User');

const { router: authRouter, authenticateToken, agentScopeId } = require('./auth');

const { router: twoFactorRouter } = require('./routes/twoFactor');

const crmRoutes = require('./routes/crm');

const auditRoutes = require('./routes/audit');

const tareasRoutes = require('./routes/tareas');

const teamsRoutes = require('./routes/teams');

const propiedadesRoutes = require('./routes/propiedades');

const clientesRoutes = require('./routes/clientes');

const agentesRoutes = require('./routes/agentes');

const operacionesRoutes = require('./routes/operaciones');

const citasRoutes = require('./routes/citas');

const activitiesRoutes = require('./routes/activities');

const publicRoutes = require('./routes/public');

const integrationsRoutes = require('./routes/integrations');

const rewardsRoutes = require('./routes/rewards');

const rewardsV2Routes = require('./routes/rewardsV2');

const messagesRoutes = require('./routes/messages');

const reportsRoutes = require('./routes/reports');

const notificationsRoutes = require('./routes/notifications');

const automationsRoutes = require('./routes/automations');

const fechasImportantesRoutes = require('./routes/fechasImportantes');

const globalConfigRoutes = require('./routes/globalConfig');

const foldersRoutes = require('./routes/folders');

const contractTemplatesRoutes = require('./routes/contractTemplates');

const dashboardStatsRoutes = require('./routes/dashboardStats');

const adminDashboardStatsRoutes = require('./routes/adminDashboardStats');

const adminNotificationsRoutes = require('./routes/adminNotifications');

const editorRoutes = require('./routes/editor');

const tasacionesRoutes = require('./routes/tasaciones');

const inmobiliariasRoutes = require('./routes/inmobiliarias');

const pushRoutes = require('./routes/push');

const clientInteractionsRoutes = require('./routes/clientInteractions');
const mercadoLibreRoutes = require('./routes/mercadolibre');
const marketingAIRoutes = require('./routes/marketing-ai/index');
const aiChatRoutes = require('./routes/ai-chat');
const adminAIConfigRoutes = require('./routes/admin/ai-config');

const { buildPropertyOGRouter } = require('./openGraph');
const { initSocket } = require('./socket');
const redis = require('./redis');

const { initReportScheduler } = require('./services/reportScheduler');

const { initAutomationScheduler } = require('./services/automationScheduler');

const { initRewardsScheduler } = require('./services/rewardsScheduler');

const { initTaskAutomationScheduler } = require('./services/taskAutomationService');



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

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));



// optional request logger (morgan) if installed

try {

  // eslint-disable-next-line global-require

  const morgan = require('morgan');

  app.use(morgan('dev'));

} catch (e) {

  // morgan not installed, ignore

}



// ── Open Graph HTML renderer for property pages (must be first) ──────────────
// Serves /buy/:slug and /rent/:slug with dynamic OG meta tags for crawlers.
// Falls back to plain index.html if property not found or on any error.
app.use(buildPropertyOGRouter());

// Auth routes

app.use('/auth', authRouter);

app.use('/auth/2fa', twoFactorRouter);

app.use('/public', publicRoutes);

app.use('/audit', auditRoutes);



// CRM entity routes (specific routes MUST come before generic /crm)

app.use('/crm/tareas', tareasRoutes);

app.use('/crm/teams', teamsRoutes);

app.use('/crm/propiedades', propiedadesRoutes);

app.use('/crm/clientes', clientesRoutes);

app.use('/crm/agentes', agentesRoutes);

app.use('/crm/operaciones', operacionesRoutes);

app.use('/crm/citas', citasRoutes);

app.use('/crm/activities', activitiesRoutes);

app.use('/crm/integrations', integrationsRoutes);

app.use('/crm/rewards', rewardsRoutes);

app.use('/crm/rewards-v2', rewardsV2Routes);

app.use('/crm/messages', messagesRoutes);

app.use('/crm/reports', reportsRoutes);

app.use('/crm/notifications', notificationsRoutes);

app.use('/crm/automations', automationsRoutes);

app.use('/crm/fechas-importantes', fechasImportantesRoutes);

app.use('/crm/client-interactions', clientInteractionsRoutes);

app.use('/crm/stats', dashboardStatsRoutes);

app.use('/admin/stats', adminDashboardStatsRoutes);

app.use('/admin/notifications', adminNotificationsRoutes);

app.use('/admin/config', globalConfigRoutes);

app.use('/admin/ml', mercadoLibreRoutes);
app.use('/admin/config/ai', adminAIConfigRoutes);

// Admin KPI: reservadas count (operaciones tipo Reserva + contratos de reserva generados)
app.get('/admin/propiedades/reservadas-count', authenticateToken, async (req, res) => {
  try {
    // 1. Unique property IDs from Operacion with tipo='Reserva'
    const opReservas = await Operacion.find({ tipo: 'Reserva' }).select('propiedadId').lean();
    const idsFromOp = new Set(opReservas.map(o => String(o.propiedadId || '')).filter(Boolean));

    // 2. Unique property IDs from Documents generated from a reservation template
    //    categoria starts with 'Contrato - ' and contains 'Reserva' (case-insensitive)
    const contractDocs = await Document.find({
      sourceModule: 'contract_templates',
      categoria: { $regex: /reserva/i },
    }).select('metadata').lean();
    const idsFromContracts = new Set(
      contractDocs.map(d => String((d.metadata && d.metadata.propertyId) || '')).filter(Boolean)
    );

    // Union of both sets
    const allIds = new Set([...idsFromOp, ...idsFromContracts]);

    res.json({ count: allIds.size, propertyIds: [...allIds] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.use('/files', foldersRoutes);

app.use('/editor', editorRoutes);

app.use('/crm/tasaciones', tasacionesRoutes);

app.use('/crm/inmobiliarias', inmobiliariasRoutes);

app.use('/contract-templates', contractTemplatesRoutes);

app.use('/api/push', pushRoutes);

// Marketing AI routes
app.use('/marketing-ai', marketingAIRoutes);
app.use('/ai', aiChatRoutes);

// Generic CRM routes (links) - MUST come after specific routes

app.use('/crm', crmRoutes);



// Multer memory storage for Cloudinary upload

const storage = multer.memoryStorage();

const upload = multer({ storage, limits: { fileSize: 200 * 1024 * 1024 } });



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

    const folderId = req.body && req.body.folder ? String(req.body.folder) : null;

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

        mimetype: f.mimetype || '',

        categoria: categoria || undefined,

        tamano,

        url,

        relacionado: relacionado || undefined,

        cloudinary_id: cloudinaryId,

        bucket: useMinio ? resolveMinioBucket(domain) : '',

        object_key: objectKey,

        agenteId: scopeId || '',

        folder: folderId || null,

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



    // Any authenticated user can download a document by ID.
    // Scope (agenteId) restriction applies to listing/upload/delete, not download.



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

    // Cascade: remove EditedImage records that reference this document
    if (doc.object_key) {
      await EditedImage.deleteMany({
        $or: [
          { originalDocumentId: doc._id },
          { originalObjectKey: doc.object_key },
          { outputObjectKey: doc.object_key },
        ],
      });
    }

    await Document.deleteOne({ _id: doc._id });

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



    // Connect Redis (optional — system works without it)
    await redis.connect();

    const http = require('http');
    const server = http.createServer(app);

    // Initialize Socket.IO
    await initSocket(server);

    // Store io reference for use in route handlers
    const { getIO } = require('./socket');
    app.set('io', getIO());

    server.listen(PORT, () => {

      console.log(`Document backend listening on http://localhost:${PORT}`);

      // Initialize report scheduler for automatic monthly reports
      // NOTE: When scheduler-worker PM2 process is active, remove these 4 calls
      initReportScheduler();

      // Initialize automation scheduler for CRM notifications
      initAutomationScheduler();

      // Initialize rewards V2 scheduler (weekly badge, quarterly awards, annual tiers)
      initRewardsScheduler();

      // Initialize task automation scheduler (overdue alerts, inactive task reminders)
      initTaskAutomationScheduler();

    });

  })().catch((err) => {

    console.error('Backend startup failed:', err && err.message ? err.message : err);

    process.exit(1);

  });

} else {

  // when required (for tests) export the app without listening

  module.exports = app;

}

