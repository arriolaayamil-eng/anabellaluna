const express = require('express');
const Operacion = require('../models/Operacion');
const Propiedad = require('../models/Propiedad');
const Cliente = require('../models/Cliente');
const Agente = require('../models/Agente');
const { authenticateToken, agentScopeId, requireCRMUser } = require('../auth');

const router = express.Router();

// Helper: enrich metadata with real names from DB
async function enrichMetadata(body) {
  const meta = { ...(body.metadata || {}) };
  if (body.propiedadId && !meta.propiedad) {
    const p = await Propiedad.findById(body.propiedadId).select('title address metadata').lean();
    if (p) {
      meta.propiedad = p.title || p.address || '';
      if (!meta.tipoPropiedad && p.metadata) meta.tipoPropiedad = p.metadata.tipoPropiedad || p.metadata.tipo || '';
      if (!meta.barrio && p.metadata) meta.barrio = p.metadata.barrio || '';
    }
  }
  if (body.clienteId && !meta.cliente) {
    const c = await Cliente.findById(body.clienteId).select('nombre').lean();
    if (c) meta.cliente = c.nombre || '';
  }
  if (body.agenteId && !meta.agente) {
    const a = await Agente.findById(body.agenteId).select('nombre').lean();
    if (a) meta.agente = a.nombre || '';
  }
  return meta;
}

router.get('/', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const { q } = req.query;
    const scopeId = agentScopeId(req);
    const filter = q ? { notas: { $regex: q, $options: 'i' } } : {};
    if (scopeId) filter.agenteId = scopeId;
    const items = await Operacion.find(filter).sort({ updatedAt: -1 }).limit(1000).lean();
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const item = await Operacion.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ error: 'Not found' });
    const scopeId = agentScopeId(req);
    if (scopeId && String(item.agenteId || '') !== scopeId) return res.status(403).json({ error: 'forbidden' });
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const body = { ...(req.body || {}) };
    if (scopeId) body.agenteId = scopeId;
    body.metadata = await enrichMetadata(body);
    const created = await Operacion.create(body);
    res.status(201).json(created);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const filter = { _id: req.params.id };
    if (scopeId) filter.agenteId = scopeId;
    const body = { ...(req.body || {}) };
    if (scopeId) body.agenteId = scopeId;
    body.metadata = await enrichMetadata(body);
    const updated = await Operacion.findOneAndUpdate(filter, body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const filter = { _id: req.params.id };
    if (scopeId) filter.agenteId = scopeId;
    const deleted = await Operacion.findOneAndDelete(filter);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
