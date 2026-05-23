const express = require('express');
const Operacion = require('../models/Operacion');
const Propiedad = require('../models/Propiedad');
const Cliente = require('../models/Cliente');
const Agente = require('../models/Agente');
const User = require('../models/User');
const { authenticateToken, agentScopeId, requireCRMUser } = require('../auth');

const router = express.Router();

// Helper: enrich metadata with real names from DB
async function getDefaultInmobiliaria(req) {
  const adminId = req.user?.role === 'admin'
    ? (req.user.sub || req.user._id || req.user.id)
    : '';

  const admin = adminId
    ? await User.findById(adminId).select('nombre username empresa').lean()
    : await User.findOne({ role: 'admin' }).select('nombre username empresa').sort({ createdAt: 1 }).lean();

  if (!admin) return { id: '', nombre: 'Inmobiliaria' };
  return {
    id: String(admin._id),
    nombre: admin.empresa || admin.nombre || admin.username || 'Inmobiliaria',
  };
}

async function enrichMetadata(body, req) {
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
  if (body.tipo === 'Venta') {
    const inmobiliaria = await getDefaultInmobiliaria(req);
    if (!meta.inmobiliariaId) meta.inmobiliariaId = inmobiliaria.id;
    if (!meta.inmobiliaria) meta.inmobiliaria = inmobiliaria.nombre;
    meta.comisionInmobiliariaPorcentaje = Number(meta.comisionInmobiliariaPorcentaje || 0);
    meta.comisionColegaPorcentaje = Number(meta.comisionColegaPorcentaje || 0);
    meta.comparteConInmobiliaria = Boolean(meta.comparteConInmobiliaria);
    if (meta.comparteConInmobiliaria && !meta.aporteInmobiliariaColega) {
      meta.aporteInmobiliariaColega = 'comprador';
    }
    const colegaAportaPropiedad = meta.comparteConInmobiliaria && meta.aporteInmobiliariaColega === 'propiedad';
    meta.origenPropiedad = colegaAportaPropiedad ? 'externa' : 'interna';
    meta.propiedadColegaPrecio = Number(meta.propiedadColegaPrecio || 0);
    if (colegaAportaPropiedad) {
      body.propiedadId = '';
      meta.propiedad = meta.propiedadColegaNombre || meta.propiedadColegaDireccion || 'Propiedad externa';
    } else {
      meta.propiedadColegaNombre = '';
      meta.propiedadColegaPrecio = 0;
      meta.propiedadColegaDireccion = '';
    }
    if (!meta.comparteConInmobiliaria) {
      meta.aporteInmobiliariaColega = '';
      meta.inmobiliariaColega = '';
      meta.colega = '';
      meta.comisionColegaPorcentaje = 0;
      meta.propiedadColegaNombre = '';
      meta.propiedadColegaPrecio = 0;
      meta.propiedadColegaDireccion = '';
    }
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
    body.metadata = await enrichMetadata(body, req);
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
    body.metadata = await enrichMetadata(body, req);
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
