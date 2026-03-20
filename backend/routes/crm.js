const express = require('express');
const DocumentLink = require('../models/DocumentLink');
const Document = require('../models/Document');
const Propiedad = require('../models/Propiedad');
const Tarea = require('../models/Tarea');
const Cita = require('../models/Cita');
const Activity = require('../models/Activity');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const {
  authenticateToken,
  agentScopeId,
  getUserId,
  requireCRMUser,
} = require('../auth');

const router = express.Router();

// ============ NAVBAR SUMMARY (counts for badges) ============
router.get('/navbar-summary', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const filter = scopeId ? { agenteId: scopeId } : {};
    const propFilter = scopeId ? { agentId: scopeId } : {};
    
    // Properties: count available
    const propiedadesTotal = await Propiedad.countDocuments(propFilter);
    const propiedadesDisponibles = await Propiedad.countDocuments({ ...propFilter, status: 'Disponible' });
    
    // Tasks: count pending (not completed)
    const tareasPendientes = await Tarea.countDocuments({ 
      ...filter, 
      $or: [
        { kanbanColumn: { $ne: 'done' } },
        { kanbanColumn: { $exists: false } }
      ]
    });
    const tareasHoy = await Tarea.countDocuments({
      ...filter,
      fechaVencimiento: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      },
      $or: [
        { kanbanColumn: { $ne: 'done' } },
        { kanbanColumn: { $exists: false } }
      ]
    });
    
    // Citas: upcoming appointments
    const citasPendientes = await Cita.countDocuments({
      ...filter,
      fecha: { $gte: new Date() },
      estado: { $ne: 'cancelada' }
    });
    const citasHoy = await Cita.countDocuments({
      ...filter,
      fecha: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999))
      },
      estado: { $ne: 'cancelada' }
    });
    
    // Activities: unread website inquiries
    const consultasNoLeidas = await Activity.countDocuments({
      ...filter,
      type: { $in: ['enquiry', 'visit_scheduled'] },
      'metadata.read': { $ne: true }
    });
    const consultasTotal = await Activity.countDocuments({
      ...filter,
      type: { $in: ['enquiry', 'visit_scheduled'] }
    });
    
    // Internal messages: unread count
    let mensajesNoLeidos = 0;
    const chatUserId = scopeId || getUserId(req);
    if (chatUserId) {
      mensajesNoLeidos = await Message.countDocuments({
        receiverId: chatUserId,
        read: false
      });
    }
    
    // Notifications: unread count with visibility filter
    const now = new Date();
    const notificacionesNoLeidas = await Notification.countDocuments({
      ...filter,
      leida: false,
      $or: [
        { fechaProgramada: { $exists: false } },
        { fechaProgramada: null },
        { fechaProgramada: { $lte: now } }
      ]
    });
    
    res.json({
      propiedades: {
        total: propiedadesTotal,
        disponibles: propiedadesDisponibles,
      },
      tareas: {
        pendientes: tareasPendientes,
        hoy: tareasHoy,
        citas: citasPendientes,
        citasHoy: citasHoy,
        total: tareasPendientes + citasPendientes,
      },
      mensajes: {
        consultasNoLeidas,
        consultasTotal,
        internosNoLeidos: mensajesNoLeidos,
        total: consultasNoLeidas + mensajesNoLeidos,
      },
      notificaciones: {
        noLeidas: notificacionesNoLeidas,
      },
    });
  } catch (err) {
    console.error('Navbar summary error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Link a CRM entity: { documentId, entityType, entityId }
router.post('/link', authenticateToken, requireCRMUser, async (req, res) => {
  const { documentId, entityType, entityId } = req.body;
  if (!documentId || !entityType || !entityId) return res.status(400).json({ error: 'missing fields' });
  try {
    const scopeId = agentScopeId(req);
    if (scopeId) {
      const doc = await Document.findById(documentId).lean();
      if (!doc) return res.status(404).json({ error: 'Not found' });
      if (String(doc.agenteId || '') !== scopeId) return res.status(403).json({ error: 'forbidden' });
    }
    const existing = await DocumentLink.findOne({ document: documentId, entity_type: entityType, entity_id: entityId }).exec();
    if (existing) return res.json({ ok: true, id: existing._id });
    const link = new DocumentLink({ document: documentId, entity_type: entityType, entity_id: entityId, agenteId: scopeId || '' });
    await link.save();
    return res.json({ ok: true, id: link._id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Unlink
router.post('/unlink', authenticateToken, requireCRMUser, async (req, res) => {
  const { documentId, entityType, entityId } = req.body;
  if (!documentId || !entityType || !entityId) return res.status(400).json({ error: 'missing fields' });
  try {
    const scopeId = agentScopeId(req);
    const filter = { document: documentId, entity_type: entityType, entity_id: entityId };
    if (scopeId) filter.agenteId = scopeId;
    const result = await DocumentLink.deleteOne(filter).exec();
    return res.json({ ok: true, deletedCount: result.deletedCount });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// List links for an entity: /crm/links?entityType=cliente&entityId=123
router.get('/links', authenticateToken, requireCRMUser, async (req, res) => {
  const { entityType, entityId } = req.query;
  if (!entityType || !entityId) return res.status(400).json({ error: 'entityType and entityId required' });
  try {
    const scopeId = agentScopeId(req);
    const filter = { entity_type: entityType, entity_id: entityId };
    if (scopeId) filter.agenteId = scopeId;
    const links = await DocumentLink.find(filter)
      .sort({ order: 1, created_at: 1 })
      .populate('document', 'nombre tipo agenteId url categoria tamano fecha mimetype')
      .exec();
    if (scopeId) {
      const safe = links.filter((l) => String(l.document && l.document.agenteId ? l.document.agenteId : '') === scopeId);
      return res.json(safe);
    }
    res.json(links);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reorder links: PATCH /crm/links/reorder { ids: [linkId, ...] } in desired order
router.patch('/links/reorder', authenticateToken, requireCRMUser, async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: 'ids array required' });
  try {
    const scopeId = agentScopeId(req);
    const ops = ids.map((id, idx) => ({
      updateOne: {
        filter: scopeId ? { _id: id, agenteId: scopeId } : { _id: id },
        update: { $set: { order: idx } },
      },
    }));
    await DocumentLink.bulkWrite(ops);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
