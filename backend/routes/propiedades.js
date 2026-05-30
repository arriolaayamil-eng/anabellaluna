const crypto = require('crypto');
const express = require('express');
const Propiedad = require('../models/Propiedad');
const DocumentLink = require('../models/DocumentLink');
const Cliente = require('../models/Cliente');
const { authenticateToken, agentScopeId, requireCRMUser } = require('../auth');
const { sendNotification, sendToRole } = require('../services/pushService');
const { syncPropertyToML } = require('../services/mercadoLibre');
const {
  attachRequestId,
  confirmMissing,
  confirmPersisted,
  traceMutation,
  traceMutationError,
} = require('../utils/persistenceTrace');

const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'ico', 'heic']);
const isImageDoc = (doc) => {
  if (!doc) return false;
  if (doc.mimetype && doc.mimetype.startsWith('image/')) return true;
  const ext = String(doc.nombre || '').split('.').pop().toLowerCase();
  return IMAGE_EXTS.has(ext);
};

const router = express.Router();

router.get('/', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const { q } = req.query;
    const scopeId = agentScopeId(req);
    const filter = q ? { $or: [ { title: { $regex: q, $options: 'i' } }, { description: { $regex: q, $options: 'i' } } ] } : {};
    if (scopeId) filter.agentId = scopeId;
    const items = await Propiedad.find(filter).sort({ updatedAt: -1 }).limit(1000).lean();

    if (!items.length) return res.json([]);

    const propIds = items.map((p) => String(p._id));
    const links = await DocumentLink.find({
      entity_type: 'propiedad',
      entity_id: { $in: propIds },
    }).sort({ order: 1, created_at: 1 }).populate({ path: 'document', select: 'nombre mimetype url' }).lean();

    const byProp = {};
    for (const l of links) {
      const pid = l.entity_id;
      if (!byProp[pid]) byProp[pid] = [];
      if (l.document) byProp[pid].push(l.document);
    }

    // Populate owner (client) data
    const ownerIds = [...new Set(items.filter((p) => p.ownerId).map((p) => String(p.ownerId)))];
    const ownersById = {};
    if (ownerIds.length) {
      const owners = await Cliente.find({ _id: { $in: ownerIds } }).select('nombre email telefono metadata').lean();
      for (const o of owners) ownersById[String(o._id)] = o;
    }

    const result = items.map((p) => {
      const docs = byProp[String(p._id)] || [];
      const images = docs.filter(isImageDoc);
      const coverDoc = images[0] || null;
      const owner = p.ownerId ? (ownersById[String(p.ownerId)] || null) : null;
      return {
        ...p,
        coverUrl: coverDoc ? (coverDoc.url || '') : '',
        imageCount: images.length,
        ownerData: owner ? { _id: owner._id, nombre: owner.nombre || '', email: owner.email || '', telefono: owner.telefono || '' } : null,
      };
    });

    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const item = await Propiedad.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ error: 'Not found' });
    const scopeId = agentScopeId(req);
    if (scopeId && String(item.agentId || '') !== scopeId) return res.status(403).json({ error: 'forbidden' });
    // Populate owner data
    let ownerData = null;
    if (item.ownerId) {
      const owner = await Cliente.findById(item.ownerId).select('nombre email telefono metadata').lean();
      if (owner) ownerData = { _id: owner._id, nombre: owner.nombre || '', email: owner.email || '', telefono: owner.telefono || '' };
    }
    res.json({ ...item, ownerData });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, requireCRMUser, async (req, res) => {
  attachRequestId(req, res);
  try {
    const scopeId = agentScopeId(req);
    const body = { ...(req.body || {}) };
    traceMutation(req, 'propiedad.create.start', {
      title: body.title || '',
      ownerId: body.ownerId || '',
      requestedAgentId: body.agentId || '',
    });
    if (body.featured === undefined && body.metadata && body.metadata.featured !== undefined) {
      body.featured = !!body.metadata.featured;
    }
    if (scopeId) body.agentId = scopeId;
    const created = await Propiedad.create(body);
    const persisted = await confirmPersisted(Propiedad, created._id, 'propiedad');
    traceMutation(req, 'propiedad.create.persisted', {
      propiedadId: persisted._id,
      agentId: persisted.agentId || '',
      slug: persisted.slug || '',
    });
    res.status(201).json(persisted);
  } catch (err) {
    traceMutationError(req, 'propiedad.create.failed', err);
    res.status(err.statusCode || 400).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, requireCRMUser, async (req, res) => {
  attachRequestId(req, res);
  try {
    const scopeId = agentScopeId(req);
    const filter = { _id: req.params.id };
    if (scopeId) filter.agentId = scopeId;
    const body = { ...(req.body || {}) };
    traceMutation(req, 'propiedad.update.start', {
      propiedadId: req.params.id,
      fields: Object.keys(body),
    });
    if (body.featured === undefined && body.metadata && body.metadata.featured !== undefined) {
      body.featured = !!body.metadata.featured;
    }
    if (scopeId) body.agentId = scopeId;
    const updated = await Propiedad.findOneAndUpdate(filter, body, { new: true, runValidators: true }).lean();
    if (!updated) return res.status(404).json({ error: 'Not found' });
    const persisted = await Propiedad.findOne(filter).lean();
    if (!persisted) {
      const error = new Error('No se pudo confirmar la persistencia de la propiedad actualizada');
      error.statusCode = 500;
      throw error;
    }
    traceMutation(req, 'propiedad.update.persisted', {
      propiedadId: persisted._id,
      agentId: persisted.agentId || '',
    });
    res.json(persisted);
  } catch (err) {
    traceMutationError(req, 'propiedad.update.failed', err, { propiedadId: req.params.id });
    res.status(err.statusCode || 400).json({ error: err.message });
  }
});

// Toggle published status
router.patch('/:id/publish', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const filter = { _id: req.params.id };
    if (scopeId) filter.agentId = scopeId;
    const prop = await Propiedad.findOne(filter);
    if (!prop) return res.status(404).json({ error: 'Not found' });
    const published = req.body.published != null ? !!req.body.published : !prop.published;
    prop.published = published;
    await prop.save();

    // Push notification on status change
    const propTitle = prop.title || (prop.metadata && prop.metadata.titulo) || 'Propiedad';
    const statusMsg = published ? 'publicada' : 'despublicada';
    if (prop.agentId) {
      sendNotification(String(prop.agentId), {
        title: `Propiedad ${statusMsg}`,
        body: `${propTitle} fue ${statusMsg}`,
        url: '/crm/propiedades',
      }).catch(() => {});
    }

    // Fire-and-forget ML sync (non-blocking — does not affect response time)
    setImmediate(async () => {
      try {
        const syncResult = await syncPropertyToML(prop);
        if (syncResult.itemId || syncResult.action !== 'skipped') {
          const mlUpdate = {
            itemId: syncResult.itemId || (prop.ml && prop.ml.itemId) || null,
            status: syncResult.status || (published ? 'active' : 'paused'),
            permalink: syncResult.permalink || (prop.ml && prop.ml.permalink) || '',
            lastSyncAt: new Date().toISOString(),
            lastError: syncResult.ok ? null : (syncResult.error || null),
          };
          await Propiedad.findByIdAndUpdate(prop._id, { ml: mlUpdate });
          console.log(`[ML] Sync for prop ${prop._id}: action=${syncResult.action}`);
        }
      } catch (e) {
        console.error(`[ML] Sync error for prop ${prop._id}:`, e.message);
      }
    });

    res.json({ published: prop.published });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/visita', authenticateToken, requireCRMUser, async (req, res) => {
  attachRequestId(req, res);
  try {
    const scopeId = agentScopeId(req);
    const filter = { _id: req.params.id };
    if (scopeId) filter.agentId = scopeId;
    traceMutation(req, 'propiedad.visita.start', { propiedadId: req.params.id });

    const updated = await Propiedad.findOneAndUpdate(
      filter,
      { $inc: { 'metadata.visitas': 1 } },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ error: 'Not found' });
    const persisted = await Propiedad.findOne(filter).lean();
    if (!persisted) {
      const error = new Error('No se pudo confirmar el registro de visita');
      error.statusCode = 500;
      throw error;
    }
    traceMutation(req, 'propiedad.visita.persisted', {
      propiedadId: persisted._id,
      visitas: Number(persisted.metadata?.visitas || 0),
    });

    let ownerData = null;
    if (persisted.ownerId) {
      const owner = await Cliente.findById(persisted.ownerId).select('nombre email telefono metadata').lean();
      if (owner) {
        ownerData = {
          _id: owner._id,
          nombre: owner.nombre || '',
          email: owner.email || '',
          telefono: owner.telefono || '',
          metadata: owner.metadata || {},
        };
      }
    }

    res.json({ ...persisted, ownerData });
  } catch (err) {
    traceMutationError(req, 'propiedad.visita.failed', err, { propiedadId: req.params.id });
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// Generate a private share token
router.post('/:id/private-link', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const filter = { _id: req.params.id };
    if (scopeId) filter.agentId = scopeId;
    const prop = await Propiedad.findOne(filter);
    if (!prop) return res.status(404).json({ error: 'Not found' });
    prop.privateToken = crypto.randomBytes(32).toString('hex');
    await prop.save();
    res.json({ privateToken: prop.privateToken });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Revoke private share token
router.delete('/:id/private-link', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const filter = { _id: req.params.id };
    if (scopeId) filter.agentId = scopeId;
    const prop = await Propiedad.findOne(filter);
    if (!prop) return res.status(404).json({ error: 'Not found' });
    prop.privateToken = '';
    await prop.save();
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, requireCRMUser, async (req, res) => {
  attachRequestId(req, res);
  try {
    const scopeId = agentScopeId(req);
    const filter = { _id: req.params.id };
    if (scopeId) filter.agentId = scopeId;
    traceMutation(req, 'propiedad.delete.start', { propiedadId: req.params.id });
    const deleted = await Propiedad.findOneAndDelete(filter);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    await confirmMissing(Propiedad, deleted._id, 'propiedad');
    traceMutation(req, 'propiedad.delete.persisted', { propiedadId: deleted._id });
    res.json({ ok: true });
  } catch (err) {
    traceMutationError(req, 'propiedad.delete.failed', err, { propiedadId: req.params.id });
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

module.exports = router;
