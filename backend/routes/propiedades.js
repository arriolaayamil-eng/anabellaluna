const crypto = require('crypto');
const express = require('express');
const Propiedad = require('../models/Propiedad');
const DocumentLink = require('../models/DocumentLink');
const { authenticateToken, agentScopeId, requireCRMUser } = require('../auth');

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

    const result = items.map((p) => {
      const docs = byProp[String(p._id)] || [];
      const images = docs.filter(isImageDoc);
      const coverDoc = images[0] || null;
      return { ...p, coverUrl: coverDoc ? (coverDoc.url || '') : '', imageCount: images.length };
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
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const body = { ...(req.body || {}) };
    if (body.featured === undefined && body.metadata && body.metadata.featured !== undefined) {
      body.featured = !!body.metadata.featured;
    }
    if (scopeId) body.agentId = scopeId;
    const created = await Propiedad.create(body);
    res.status(201).json(created);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const filter = { _id: req.params.id };
    if (scopeId) filter.agentId = scopeId;
    const body = { ...(req.body || {}) };
    if (body.featured === undefined && body.metadata && body.metadata.featured !== undefined) {
      body.featured = !!body.metadata.featured;
    }
    if (scopeId) body.agentId = scopeId;
    const updated = await Propiedad.findOneAndUpdate(filter, body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) { res.status(400).json({ error: err.message }); }
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
    res.json({ published: prop.published });
  } catch (err) { res.status(500).json({ error: err.message }); }
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
  try {
    const scopeId = agentScopeId(req);
    const filter = { _id: req.params.id };
    if (scopeId) filter.agentId = scopeId;
    const deleted = await Propiedad.findOneAndDelete(filter);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
