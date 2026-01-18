const express = require('express');
const Notification = require('../models/Notification');
const { authenticateToken } = require('../auth');

const router = express.Router();

function agentScopeId(req) {
  if (req.user && req.user.role === 'admin') return null;
  return req.user && req.user.agenteId ? String(req.user.agenteId) : null;
}

function applyVisibilityFilter(filter, now = new Date()) {
  const visibility = [
    { fechaProgramada: null },
    { fechaProgramada: { $lte: now } },
  ];

  if (filter.$or) {
    filter.$and = filter.$and || [];
    filter.$and.push({ $or: filter.$or });
    filter.$and.push({ $or: visibility });
    delete filter.$or;
    return;
  }

  filter.$or = visibility;
}

// Get all notifications for agent (with pagination and filters)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const { leida, tipo, limite = 50, pagina = 1, prioridad } = req.query;
    
    const filter = {};
    if (scopeId) filter.agenteId = scopeId;
    if (leida !== undefined) filter.leida = leida === 'true';
    if (tipo) filter.tipo = tipo;
    if (prioridad) filter.prioridad = prioridad;

    applyVisibilityFilter(filter);
    
    const skip = (parseInt(pagina) - 1) * parseInt(limite);
    
    const [items, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limite))
        .lean(),
      Notification.countDocuments(filter),
    ]);
    
    res.json({ items, total, pagina: parseInt(pagina), limite: parseInt(limite) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get unread count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const filter = { leida: false };
    if (scopeId) filter.agenteId = scopeId;

    applyVisibilityFilter(filter);
    
    const count = await Notification.countDocuments(filter);
    const urgentes = await Notification.countDocuments({ ...filter, prioridad: 'urgente' });
    
    res.json({ count, urgentes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single notification
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const item = await Notification.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ error: 'Not found' });
    if (scopeId && String(item.agenteId || '') !== scopeId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const filter = { _id: req.params.id };
    if (scopeId) filter.agenteId = scopeId;
    
    const updated = await Notification.findOneAndUpdate(
      filter,
      { leida: true, fechaLectura: new Date() },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const filter = { leida: false };
    if (scopeId) filter.agenteId = scopeId;

    applyVisibilityFilter(filter);
    
    const result = await Notification.updateMany(
      filter,
      { leida: true, fechaLectura: new Date() }
    );
    res.json({ ok: true, modified: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create notification (internal/system use)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const body = { ...(req.body || {}) };
    if (scopeId) body.agenteId = scopeId;
    
    const created = await Notification.create(body);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete all read notifications
router.delete('/clear-read', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const filter = { leida: true };
    if (scopeId) filter.agenteId = scopeId;
    
    const result = await Notification.deleteMany(filter);
    res.json({ ok: true, deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const filter = { _id: req.params.id };
    if (scopeId) filter.agenteId = scopeId;
     
    const deleted = await Notification.findOneAndDelete(filter);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get notification history for a specific client
router.get('/historial/:clienteId', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const filter = { entidadId: req.params.clienteId, entidadTipo: 'cliente' };
    if (scopeId) filter.agenteId = scopeId;
    
    const historial = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    
    res.json(historial);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get automation effectiveness report
router.get('/reporte/efectividad', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const { desde, hasta } = req.query;
    
    const filter = {};
    if (scopeId) filter.agenteId = scopeId;
    
    if (desde || hasta) {
      filter.createdAt = {};
      if (desde) filter.createdAt.$gte = new Date(desde);
      if (hasta) filter.createdAt.$lte = new Date(hasta);
    }
    
    const [totalEnviadas, leidas, porTipo, porPrioridad] = await Promise.all([
      Notification.countDocuments(filter),
      Notification.countDocuments({ ...filter, leida: true }),
      Notification.aggregate([
        { $match: filter },
        { $group: { _id: '$tipo', count: { $sum: 1 }, leidas: { $sum: { $cond: ['$leida', 1, 0] } } } },
        { $sort: { count: -1 } },
      ]),
      Notification.aggregate([
        { $match: filter },
        { $group: { _id: '$prioridad', count: { $sum: 1 } } },
      ]),
    ]);
    
    const tasaLectura = totalEnviadas > 0 ? Math.round((leidas / totalEnviadas) * 100) : 0;
    
    res.json({
      totalEnviadas,
      leidas,
      noLeidas: totalEnviadas - leidas,
      tasaLectura,
      porTipo,
      porPrioridad,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get notifications by date range for calendar view
router.get('/calendario', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const { mes, año } = req.query;
    
    const year = parseInt(año) || new Date().getFullYear();
    const month = parseInt(mes) || new Date().getMonth() + 1;
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    const filter = {
      createdAt: { $gte: startDate, $lte: endDate },
    };
    if (scopeId) filter.agenteId = scopeId;
    
    const notifications = await Notification.find(filter)
      .sort({ createdAt: 1 })
      .lean();
    
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
