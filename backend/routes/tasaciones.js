const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const MarketStudy = require('../models/MarketStudy');
const Appraisal = require('../models/Appraisal');
const Document = require('../models/Document');
const Folder = require('../models/Folder');
const { authenticateToken, agentScopeId, requireCRMUser } = require('../auth');
const { generateMarketStudyPdf, generateAppraisalPdf } = require('../services/tasacionesPdf');
const minio = require('../minio');

// ── Helper: find or create Tasaciones folder ──
async function getTasacionesFolder(agenteId) {
  let folder = await Folder.findOne({ name: 'Tasaciones', parent: null, agenteId: agenteId || '' }).lean();
  if (!folder) {
    folder = await Folder.create({ name: 'Tasaciones', parent: null, agenteId: agenteId || '' });
    folder = folder.toObject();
  }
  return folder;
}

// ── Helper: save PDF buffer to MinIO + Document ──
async function savePdfToFiles(buffer, filename, metadata, agenteId, userName) {
  const bucket = process.env.MINIO_BUCKET || 'erp';
  const key = `tasaciones/${Date.now()}_${filename}`;

  // Ensure bucket exists
  const exists = await minio.bucketExists(bucket);
  if (!exists) await minio.makeBucket(bucket);

  await minio.putObject(bucket, key, buffer, buffer.length, { 'content-type': 'application/pdf' });

  const folder = await getTasacionesFolder(agenteId);

  const doc = await Document.create({
    nombre: filename,
    tipo: 'PDF',
    mimetype: 'application/pdf',
    categoria: 'Tasación',
    tamano: Math.round(buffer.length / 1024 / 1024 * 100) / 100,
    bucket,
    object_key: key,
    folder: folder._id,
    agenteId: agenteId || '',
    sourceModule: 'tasaciones',
    documentType: metadata.documentType || 'tasacion',
    uploadedBy: userName || '',
    tags: ['tasacion', metadata.documentType || 'tasacion'],
    metadata,
  });

  // Also create admin-visible copy if agent-scoped
  if (agenteId) {
    const adminFolder = await getTasacionesFolder('');
    await Document.create({
      nombre: filename,
      tipo: 'PDF',
      mimetype: 'application/pdf',
      categoria: 'Tasación',
      tamano: Math.round(buffer.length / 1024 / 1024 * 100) / 100,
      bucket,
      object_key: key,
      folder: adminFolder._id,
      agenteId: '',
      sourceModule: 'tasaciones',
      documentType: metadata.documentType || 'tasacion',
      uploadedBy: userName || '',
      tags: ['tasacion', metadata.documentType || 'tasacion'],
      metadata,
    });
  }

  return doc;
}

// ════════════════════════════════════════════════════════════════
//  MARKET STUDIES
// ════════════════════════════════════════════════════════════════

// List
router.get('/market-studies', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const filter = {};
    if (scopeId) filter.agenteId = scopeId;
    const items = await MarketStudy.find(filter).sort({ updatedAt: -1 }).limit(500).lean();
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get by ID
router.get('/market-studies/:id', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const item = await MarketStudy.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ error: 'Not found' });
    const scopeId = agentScopeId(req);
    if (scopeId && item.agenteId !== scopeId) return res.status(403).json({ error: 'forbidden' });
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create
router.post('/market-studies', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const user = req.user || {};
    const scopeId = agentScopeId(req);
    const data = { ...req.body };
    if (scopeId) data.agenteId = scopeId;
    data.createdBy = user.nombre || user.username || '';
    data.updatedBy = data.createdBy;
    if (!data.codigo) {
      data.codigo = `EM-${Date.now().toString(36).toUpperCase()}`;
    }
    const item = await MarketStudy.create(data);
    res.status(201).json(item);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Update
router.put('/market-studies/:id', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const item = await MarketStudy.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    const scopeId = agentScopeId(req);
    if (scopeId && item.agenteId !== scopeId) return res.status(403).json({ error: 'forbidden' });
    const user = req.user || {};
    req.body.updatedBy = user.nombre || user.username || '';
    Object.assign(item, req.body);
    await item.save();
    res.json(item);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Delete
router.delete('/market-studies/:id', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const item = await MarketStudy.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    const scopeId = agentScopeId(req);
    if (scopeId && item.agenteId !== scopeId) return res.status(403).json({ error: 'forbidden' });
    await MarketStudy.deleteOne({ _id: item._id });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Generate PDF
router.post('/market-studies/:id/pdf', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const item = await MarketStudy.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ error: 'Not found' });
    const scopeId = agentScopeId(req);
    if (scopeId && item.agenteId !== scopeId) return res.status(403).json({ error: 'forbidden' });

    const buffer = await generateMarketStudyPdf(item);
    const filename = `Estudio_Mercado_${item.codigo || item._id}.pdf`;
    const user = req.user || {};

    const docRecord = await savePdfToFiles(buffer, filename, {
      documentType: 'estudio_mercado',
      marketStudyId: item._id,
      propiedadId: item.propiedadId,
      codigo: item.codigo,
    }, item.agenteId, user.nombre || user.username || '');

    await MarketStudy.updateOne({ _id: item._id }, { pdfDocumentId: docRecord._id, pdfGeneratedAt: new Date() });

    res.json({ documentId: docRecord._id, filename });
  } catch (err) {
    console.error('[Tasaciones] PDF error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Download PDF (stream)
router.get('/market-studies/:id/pdf/download', authenticateToken, async (req, res) => {
  try {
    const item = await MarketStudy.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ error: 'Not found' });
    const buffer = await generateMarketStudyPdf(item);
    const filename = `Estudio_Mercado_${item.codigo || item._id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ════════════════════════════════════════════════════════════════
//  APPRAISALS
// ════════════════════════════════════════════════════════════════

// List
router.get('/appraisals', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const filter = {};
    if (scopeId) filter.agenteId = scopeId;
    const items = await Appraisal.find(filter).sort({ updatedAt: -1 }).limit(500).lean();
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get by ID
router.get('/appraisals/:id', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const item = await Appraisal.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ error: 'Not found' });
    const scopeId = agentScopeId(req);
    if (scopeId && item.agenteId !== scopeId) return res.status(403).json({ error: 'forbidden' });
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create
router.post('/appraisals', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const user = req.user || {};
    const scopeId = agentScopeId(req);
    const data = { ...req.body };
    if (scopeId) data.agenteId = scopeId;
    data.createdBy = user.nombre || user.username || '';
    data.updatedBy = data.createdBy;
    if (!data.codigo) {
      data.codigo = `TAS-${Date.now().toString(36).toUpperCase()}`;
    }
    if (!data.propiedadId) {
      return res.status(400).json({ error: 'propiedadId es obligatorio' });
    }
    const item = await Appraisal.create(data);
    res.status(201).json(item);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Update
router.put('/appraisals/:id', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const item = await Appraisal.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    const scopeId = agentScopeId(req);
    if (scopeId && item.agenteId !== scopeId) return res.status(403).json({ error: 'forbidden' });
    const user = req.user || {};
    req.body.updatedBy = user.nombre || user.username || '';
    // Prevent changing estado to certificada unless authorized
    if (req.body.estado === 'certificada' && item.estado !== 'certificada') {
      if (!req.body.certificacion?.matriculadoNombre || !req.body.certificacion?.matricula) {
        return res.status(400).json({ error: 'Para certificar se requiere matriculado y matrícula' });
      }
    }
    Object.assign(item, req.body);
    await item.save();
    res.json(item);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Delete
router.delete('/appraisals/:id', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const item = await Appraisal.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    const scopeId = agentScopeId(req);
    if (scopeId && item.agenteId !== scopeId) return res.status(403).json({ error: 'forbidden' });
    await Appraisal.deleteOne({ _id: item._id });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Generate PDF
router.post('/appraisals/:id/pdf', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const item = await Appraisal.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ error: 'Not found' });
    const scopeId = agentScopeId(req);
    if (scopeId && item.agenteId !== scopeId) return res.status(403).json({ error: 'forbidden' });

    let ms = null;
    if (item.marketStudyId) {
      ms = await MarketStudy.findById(item.marketStudyId).lean();
    }

    const buffer = await generateAppraisalPdf(item, ms);
    const filename = `Tasacion_${item.codigo || item._id}.pdf`;
    const user = req.user || {};

    const docRecord = await savePdfToFiles(buffer, filename, {
      documentType: 'tasacion',
      appraisalId: item._id,
      propiedadId: item.propiedadId,
      marketStudyId: item.marketStudyId,
      codigo: item.codigo,
    }, item.agenteId, user.nombre || user.username || '');

    await Appraisal.updateOne({ _id: item._id }, { pdfDocumentId: docRecord._id, pdfGeneratedAt: new Date() });

    res.json({ documentId: docRecord._id, filename });
  } catch (err) {
    console.error('[Tasaciones] Appraisal PDF error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Download PDF (stream)
router.get('/appraisals/:id/pdf/download', authenticateToken, async (req, res) => {
  try {
    const item = await Appraisal.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ error: 'Not found' });
    const buffer = await generateAppraisalPdf(item, null);
    const filename = `Tasacion_${item.codigo || item._id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Duplicate market study
router.post('/market-studies/:id/duplicate', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const item = await MarketStudy.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ error: 'Not found' });
    const user = req.user || {};
    delete item._id;
    delete item.__v;
    item.codigo = `EM-${Date.now().toString(36).toUpperCase()}`;
    item.estado = 'borrador';
    item.version = (item.version || 1) + 1;
    item.pdfDocumentId = null;
    item.pdfGeneratedAt = null;
    item.createdBy = user.nombre || user.username || '';
    item.updatedBy = item.createdBy;
    const dup = await MarketStudy.create(item);
    res.status(201).json(dup);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Duplicate appraisal
router.post('/appraisals/:id/duplicate', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const item = await Appraisal.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ error: 'Not found' });
    const user = req.user || {};
    delete item._id;
    delete item.__v;
    item.codigo = `TAS-${Date.now().toString(36).toUpperCase()}`;
    item.estado = 'borrador';
    item.version = (item.version || 1) + 1;
    item.pdfDocumentId = null;
    item.pdfGeneratedAt = null;
    item.certificacion = {};
    item.createdBy = user.nombre || user.username || '';
    item.updatedBy = item.createdBy;
    const dup = await Appraisal.create(item);
    res.status(201).json(dup);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;
