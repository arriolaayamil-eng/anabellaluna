const express = require('express');
const Cliente = require('../models/Cliente');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Agente = require('../models/Agente');
const { authenticateToken, agentScopeId, requireCRMUser } = require('../auth');
const { triggerWelcomeAutomation } = require('../services/automationScheduler');
const { sendNotification, sendToRole } = require('../services/pushService');

const router = express.Router();

// Helper: get assigner profile data (admin or agent)
async function getAssignerProfile(req) {
  const userId = req.user.sub || req.user._id || req.user.id;
  const role = req.user.role || '';
  // Try User first (admins), then Agente
  const user = await User.findById(userId).select('nombre username avatar role').lean();
  if (user) {
    return { userId: String(userId), nombre: user.nombre || user.username || '', avatar: user.avatar || '', role: user.role || role };
  }
  const agente = await Agente.findById(req.user.agenteId).select('nombre avatar').lean();
  return { userId: String(userId), nombre: agente?.nombre || req.user.username || '', avatar: agente?.avatar || '', role };
}

// Helper: notify agent when a client is assigned to them
async function notifyClientAssignment(agenteId, clienteName, clienteId, assignerName) {
  // Don't notify if no agent or if agent is the assigner themselves
  try {
    await Notification.create({
      agenteId: String(agenteId),
      tipo: 'asignacion_cliente',
      titulo: 'Nuevo cliente asignado',
      mensaje: `${assignerName} te asignó el cliente "${clienteName}".`,
      prioridad: 'alta',
      entidadTipo: 'cliente',
      entidadId: String(clienteId),
      entidadNombre: clienteName,
      accionUrl: `/clientes?id=${clienteId}`,
    });
  } catch (err) {
    console.error('Error creating assignment notification:', err.message);
  }
}

router.get('/', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const { q } = req.query;
    const scopeId = agentScopeId(req);
    const clauses = [];
    if (q) {
      const rx = { $regex: q, $options: 'i' };
      clauses.push({ $or: [{ nombre: rx }, { email: rx }, { telefono: rx }] });
    }
    if (scopeId) clauses.push({ agenteId: scopeId });
    const filter = clauses.length > 1 ? { $and: clauses } : (clauses[0] || {});
    const items = await Cliente.find(filter).sort({ updatedAt: -1 }).limit(1000).lean();
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const item = await Cliente.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ error: 'Not found' });
    if (scopeId && String(item.agenteId || '') !== scopeId) return res.status(403).json({ error: 'forbidden' });
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const body = { ...(req.body || {}) };
    if (scopeId) body.agenteId = scopeId;

    // Attach assigner profile when admin assigns a client
    if (req.user.role === 'admin' && body.agenteId) {
      body.assignedBy = await getAssignerProfile(req);
    }

    const created = await Cliente.create(body);
    
    // Trigger welcome automation for new client
    if (created.agenteId) {
      triggerWelcomeAutomation(created, created.agenteId).catch(console.error);
    }

    // Push notification to admin
    const clientName = created.nombre || 'Nuevo cliente';
    sendToRole('admin', {
      title: 'Nuevo lead',
      body: `Se registró ${clientName}`,
      url: '/clientes',
    }).catch(() => {});

    // Notify assigned agent (if admin assigned to someone else)
    if (created.agenteId && req.user.role === 'admin') {
      const assignerId = String(req.user.sub || req.user._id || '');
      // Only notify if assigned to a different user
      if (String(created.agenteId) !== assignerId) {
        const assigner = created.assignedBy?.nombre || req.user.username || 'Administrador';
        notifyClientAssignment(created.agenteId, clientName, created._id, assigner).catch(console.error);
      }
    }
    
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

    // Check if agent is being changed (for notification)
    const previousClient = req.user.role === 'admin' && body.agenteId
      ? await Cliente.findById(req.params.id).select('agenteId nombre').lean()
      : null;

    // Attach assigner profile when admin reassigns
    if (req.user.role === 'admin' && body.agenteId) {
      body.assignedBy = await getAssignerProfile(req);
    }

    const updated = await Cliente.findOneAndUpdate(filter, body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'Not found' });

    // Notify new agent if agenteId changed
    if (previousClient && body.agenteId && String(body.agenteId) !== String(previousClient.agenteId || '')) {
      const assignerId = String(req.user.sub || req.user._id || '');
      if (String(body.agenteId) !== assignerId) {
        const assigner = updated.assignedBy?.nombre || req.user.username || 'Administrador';
        const clientName = updated.nombre || 'Cliente';
        notifyClientAssignment(body.agenteId, clientName, updated._id, assigner).catch(console.error);
      }
    }

    res.json(updated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const filter = { _id: req.params.id };
    if (scopeId) filter.agenteId = scopeId;
    const deleted = await Cliente.findOneAndDelete(filter);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
