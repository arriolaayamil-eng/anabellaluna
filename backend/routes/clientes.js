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
  const user = await User.findById(userId).select('nombre username avatar role empresa').lean();
  if (user) {
    return {
      userId: String(userId),
      nombre: user.nombre || user.username || '',
      avatar: user.avatar || '',
      role: user.role || role,
      empresa: user.empresa || '',
    };
  }
  const agente = await Agente.findById(req.user.agenteId).select('nombre avatar').lean();
  return {
    userId: String(userId),
    nombre: agente?.nombre || req.user.username || '',
    avatar: agente?.avatar || '',
    role,
    empresa: '',
  };
}

async function resolveResponsableProfile(responsableId, fallback = null) {
  const id = String(responsableId || '').trim();
  if (!id) return fallback;

  const agente = await Agente.findById(id).select('nombre avatar').lean();
  if (agente) {
    return {
      id,
      nombre: agente.nombre || '',
      avatar: agente.avatar || '',
      role: 'agent',
      tipo: 'agente',
    };
  }

  const user = await User.findById(id).select('nombre username avatar role empresa').lean();
  if (user) {
    const isAdmin = String(user.role || '') === 'admin';
    return {
      id,
      nombre: isAdmin
        ? (user.empresa || user.nombre || user.username || 'Inmobiliaria')
        : (user.nombre || user.username || ''),
      avatar: user.avatar || '',
      role: user.role || '',
      tipo: isAdmin ? 'inmobiliaria' : 'agente',
    };
  }

  return fallback;
}

function applyResponsableToBody(body, responsable) {
  if (!body || !responsable?.id) return;

  body.agenteId = String(responsable.id);
  const metadata = body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata)
    ? body.metadata
    : {};

  body.metadata = {
    ...metadata,
    agente: responsable.nombre || metadata.agente || '',
    agenteId: String(responsable.id),
    responsableTipo: responsable.tipo || metadata.responsableTipo || 'agente',
  };
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
    const assignerProfile = await getAssignerProfile(req);

    if (scopeId) {
      const responsable = await resolveResponsableProfile(scopeId, {
        id: scopeId,
        nombre: assignerProfile.nombre || req.user.username || '',
        avatar: assignerProfile.avatar || '',
        role: 'agent',
        tipo: 'agente',
      });
      applyResponsableToBody(body, responsable);
    } else if (req.user.role === 'admin') {
      const requestedResponsableId = String(body.agenteId || '').trim();
      const defaultResponsableId = String(assignerProfile.userId || req.user.sub || req.user._id || req.user.id || '').trim();
      const responsable = await resolveResponsableProfile(requestedResponsableId || defaultResponsableId, {
        id: defaultResponsableId,
        nombre: assignerProfile.empresa || assignerProfile.nombre || 'Inmobiliaria',
        avatar: assignerProfile.avatar || '',
        role: 'admin',
        tipo: 'inmobiliaria',
      });
      applyResponsableToBody(body, responsable);
      body.assignedBy = assignerProfile;
    }

    const created = await Cliente.create(body);
    
    // Trigger welcome automation for new client
    if (created.agenteId && created.metadata?.responsableTipo === 'agente') {
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
    if (created.agenteId && req.user.role === 'admin' && created.metadata?.responsableTipo === 'agente') {
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
    const previousClient = req.user.role === 'admin'
      ? await Cliente.findById(req.params.id).select('agenteId nombre metadata').lean()
      : null;

    if (scopeId) {
      const assignerProfile = await getAssignerProfile(req);
      const responsable = await resolveResponsableProfile(scopeId, {
        id: scopeId,
        nombre: assignerProfile.nombre || req.user.username || '',
        avatar: assignerProfile.avatar || '',
        role: 'agent',
        tipo: 'agente',
      });
      applyResponsableToBody(body, responsable);
    } else if (req.user.role === 'admin') {
      const assignerProfile = await getAssignerProfile(req);
      const requestedResponsableId = String(body.agenteId || '').trim();
      const previousResponsableId = String(previousClient?.agenteId || '').trim();
      const defaultResponsableId = String(assignerProfile.userId || req.user.sub || req.user._id || req.user.id || '').trim();
      const responsable = await resolveResponsableProfile(
        requestedResponsableId || previousResponsableId || defaultResponsableId,
        {
          id: defaultResponsableId,
          nombre: assignerProfile.empresa || assignerProfile.nombre || 'Inmobiliaria',
          avatar: assignerProfile.avatar || '',
          role: 'admin',
          tipo: 'inmobiliaria',
        },
      );
      applyResponsableToBody(body, responsable);
      body.assignedBy = assignerProfile;
    }

    const updated = await Cliente.findOneAndUpdate(filter, body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'Not found' });

    // Notify new agent if agenteId changed
    if (
      previousClient
      && body.agenteId
      && body.metadata?.responsableTipo === 'agente'
      && String(body.agenteId) !== String(previousClient.agenteId || '')
    ) {
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
