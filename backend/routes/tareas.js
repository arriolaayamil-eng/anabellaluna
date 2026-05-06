const express = require('express');
const Tarea = require('../models/Tarea');
const TaskActivity = require('../models/TaskActivity');
const Team = require('../models/Team');
const Agente = require('../models/Agente');
const Cita = require('../models/Cita');
const Notification = require('../models/Notification');
const { authenticateToken, agentScopeId, requireCRMUser } = require('../auth');

const router = express.Router();

// ── helpers ──────────────────────────────────────────────────────────
function callerId(req) {
  if (req.user?.agenteId) return String(req.user.agenteId);
  return req.user?.sub ? String(req.user.sub) : '';
}
function callerName(req) { return req.user?.username || ''; }

async function logActivity(taskId, req, action, extra = {}) {
  try {
    await TaskActivity.create({
      taskId,
      userId: callerId(req),
      userName: callerName(req),
      action,
      ...extra,
    });
  } catch { /* non-blocking */ }
}

// Build visibility filter: admin sees all; agent sees own + team tasks
async function visibilityFilter(req) {
  const scopeId = agentScopeId(req);
  if (!scopeId) return {}; // admin
  // Agent can see tasks assigned to them, created by them, or in their teams
  const teams = await Team.find({ 'miembros.userId': scopeId, activo: true }).select('_id').lean();
  const teamIds = teams.map(t => String(t._id));
  return {
    $or: [
      { assigneeId: scopeId },
      { agenteId: scopeId },
      { creatorId: scopeId },
      ...(teamIds.length ? [{ teamId: { $in: teamIds } }] : []),
    ],
  };
}

// ── STATS / DASHBOARD ────────────────────────────────────────────────
router.get('/stats', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const vis = await visibilityFilter(req);
    const now = new Date();
    const tareas = await Tarea.find(vis).lean();
    const total = tareas.length;
    const byStatus = {};
    const byPriority = {};
    const byAssignee = {};
    const byTeam = {};
    let overdue = 0;
    let completedLast7 = 0;
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

    tareas.forEach(t => {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
      const aName = t.assigneeName || t.agente || 'Sin asignar';
      if (!byAssignee[aName]) byAssignee[aName] = { total: 0, completadas: 0, pendientes: 0, enProgreso: 0, vencidas: 0 };
      byAssignee[aName].total += 1;
      if (['completada', 'Close'].includes(t.status)) byAssignee[aName].completadas += 1;
      else if (['pendiente', 'Open'].includes(t.status)) byAssignee[aName].pendientes += 1;
      else if (['en_progreso', 'InProgress'].includes(t.status)) byAssignee[aName].enProgreso += 1;
      if (t.dueDate && new Date(t.dueDate) < now && !['completada', 'Close', 'cancelada'].includes(t.status)) {
        overdue += 1;
        byAssignee[aName].vencidas += 1;
      }
      if (t.teamName) {
        if (!byTeam[t.teamName]) byTeam[t.teamName] = { total: 0, completadas: 0 };
        byTeam[t.teamName].total += 1;
        if (['completada', 'Close'].includes(t.status)) byTeam[t.teamName].completadas += 1;
      }
      if (['completada', 'Close'].includes(t.status) && t.completedAt && new Date(t.completedAt) >= sevenDaysAgo) {
        completedLast7 += 1;
      }
    });

    res.json({ total, overdue, completedLast7, byStatus, byPriority, byAssignee, byTeam });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── KANBAN ────────────────────────────────────────────────────────────
const DEFAULT_KANBAN_COLUMNS = [
  { id: 'pendiente', nombre: 'Pendiente', color: '#F59E0B' },
  { id: 'en_progreso', nombre: 'En Progreso', color: '#3B82F6' },
  { id: 'en_revision', nombre: 'En Revisión', color: '#8B5CF6' },
  { id: 'completada', nombre: 'Completada', color: '#10B981' },
  { id: 'cancelada', nombre: 'Cancelada', color: '#EF4444' },
];

router.get('/kanban/columns', authenticateToken, requireCRMUser, async (_req, res) => {
  res.json(DEFAULT_KANBAN_COLUMNS);
});

router.put('/kanban/move/:id', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const { kanbanColumn, position } = req.body;
    const tarea = await Tarea.findById(req.params.id);
    if (!tarea) return res.status(404).json({ error: 'Not found' });
    const prevStatus = tarea.status;
    tarea.status = kanbanColumn;
    tarea.kanbanColumn = kanbanColumn;
    tarea.position = position || 0;
    if (['completada', 'Close'].includes(kanbanColumn) && !tarea.completedAt) {
      tarea.completedAt = new Date();
      tarea.completed = true;
    }
    if (!['completada', 'Close', 'cancelada'].includes(kanbanColumn)) {
      tarea.completed = false;
      tarea.completedAt = undefined;
    }
    await tarea.save();
    if (prevStatus !== kanbanColumn) {
      logActivity(tarea._id, req, 'status_changed', { previousValue: prevStatus, newValue: kanbanColumn });
    }
    res.json(tarea);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get('/kanban', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const vis = await visibilityFilter(req);
    const tareas = await Tarea.find(vis).sort({ position: 1, updatedAt: -1 }).lean();
    const grouped = {};
    tareas.forEach(t => {
      const col = t.status || t.kanbanColumn || 'pendiente';
      if (!grouped[col]) grouped[col] = [];
      grouped[col].push(t);
    });
    res.json(grouped);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── LIST (advanced filters) ──────────────────────────────────────────
router.get('/', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const { status, priority, q, assigneeId, teamId, clienteId, propiedadId, creatorId, overdue, inactive } = req.query;
    const vis = await visibilityFilter(req);
    const filter = { ...vis };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assigneeId) filter.assigneeId = assigneeId;
    if (teamId) filter.teamId = teamId;
    if (clienteId) filter.clienteId = clienteId;
    if (propiedadId) filter.propiedadId = propiedadId;
    if (creatorId) filter.creatorId = creatorId;
    if (q) {
      const rx = { $regex: q, $options: 'i' };
      const searchOr = [{ title: rx }, { description: rx }, { summary: rx }];
      if (filter.$or) {
        filter.$and = [{ $or: filter.$or }, { $or: searchOr }];
        delete filter.$or;
      } else {
        filter.$or = searchOr;
      }
    }
    if (overdue === 'true') {
      filter.dueDate = { $lt: new Date() };
      filter.status = { $nin: ['completada', 'Close', 'cancelada'] };
    }
    if (inactive) {
      const days = parseInt(inactive, 10) || 3;
      filter.updatedAt = { $lt: new Date(Date.now() - days * 86400000) };
      filter.status = { $nin: ['completada', 'Close', 'cancelada'] };
    }
    const tareas = await Tarea.find(filter).sort({ position: 1, updatedAt: -1 }).limit(2000).lean();
    res.json(tareas);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET ONE ──────────────────────────────────────────────────────────
router.get('/:id', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const tarea = await Tarea.findById(req.params.id).lean();
    if (!tarea) return res.status(404).json({ error: 'Not found' });
    res.json(tarea);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── CREATE ───────────────────────────────────────────────────────────
router.post('/', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const body = { ...(req.body || {}) };
    const scopeId = agentScopeId(req);
    if (!body.creatorId) body.creatorId = callerId(req);
    if (!body.creatorName) body.creatorName = callerName(req);
    // For agents, default assignee to self if not specified
    if (scopeId && !body.assigneeId) {
      body.assigneeId = scopeId;
      body.agenteId = scopeId;
    }
    // Sync kanbanColumn with status
    if (!body.kanbanColumn) body.kanbanColumn = body.status || 'pendiente';
    const tarea = await Tarea.create(body);
    logActivity(tarea._id, req, 'created', { details: `Tarea "${tarea.title}" creada` });
    res.status(201).json(tarea);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ── UPDATE ───────────────────────────────────────────────────────────
router.put('/:id', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const prev = await Tarea.findById(req.params.id);
    if (!prev) return res.status(404).json({ error: 'Not found' });
    const body = { ...(req.body || {}) };
    // Sync kanbanColumn with status
    if (body.status && !body.kanbanColumn) body.kanbanColumn = body.status;
    if (body.status && ['completada', 'Close'].includes(body.status) && !prev.completedAt) {
      body.completedAt = new Date();
      body.completed = true;
    }
    const updated = await Tarea.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    // Log changes
    if (body.status && body.status !== prev.status) {
      logActivity(updated._id, req, 'status_changed', { previousValue: prev.status, newValue: body.status });
    }
    if (body.priority && body.priority !== prev.priority) {
      logActivity(updated._id, req, 'priority_changed', { previousValue: prev.priority, newValue: body.priority });
    }
    if (body.assigneeId && body.assigneeId !== prev.assigneeId) {
      logActivity(updated._id, req, 'assigned', { details: `Asignado a ${body.assigneeName || body.assigneeId}`, newValue: body.assigneeId });
    }
    if (body.dueDate && String(body.dueDate) !== String(prev.dueDate)) {
      logActivity(updated._id, req, 'due_date_changed', { newValue: body.dueDate });
    }
    res.json(updated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ── DELETE ────────────────────────────────────────────────────────────
router.delete('/:id', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const deleted = await Tarea.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    await TaskActivity.deleteMany({ taskId: req.params.id });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DELEGATE ─────────────────────────────────────────────────────────
router.post('/:id/delegate', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const { toUserId, toUserName, reason } = req.body || {};
    if (!toUserId) return res.status(400).json({ error: 'toUserId required' });
    const tarea = await Tarea.findById(req.params.id);
    if (!tarea) return res.status(404).json({ error: 'Not found' });
    const delegation = {
      fromUserId: callerId(req),
      fromUserName: callerName(req),
      toUserId,
      toUserName: toUserName || '',
      reason: reason || '',
    };
    tarea.delegations.push(delegation);
    tarea.assigneeId = toUserId;
    tarea.assigneeName = toUserName || '';
    tarea.agenteId = toUserId;
    await tarea.save();
    logActivity(tarea._id, req, 'delegated', { details: `Delegado a ${toUserName || toUserId}`, newValue: toUserId });
    res.json(tarea);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ── COMMENTS (via activity log) ──────────────────────────────────────
router.get('/:id/activity', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const items = await TaskActivity.find({ taskId: req.params.id }).sort({ createdAt: -1 }).limit(200).lean();
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/comment', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text) return res.status(400).json({ error: 'text required' });
    const tarea = await Tarea.findById(req.params.id);
    if (!tarea) return res.status(404).json({ error: 'Not found' });
    const activity = await TaskActivity.create({
      taskId: req.params.id,
      userId: callerId(req),
      userName: callerName(req),
      action: 'comment',
      details: text,
    });
    // Touch updatedAt
    tarea.updatedAt = new Date();
    await tarea.save();
    res.status(201).json(activity);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ── CHECKLIST toggle ─────────────────────────────────────────────────
router.patch('/:id/checklist/:itemId', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const tarea = await Tarea.findById(req.params.id);
    if (!tarea) return res.status(404).json({ error: 'Not found' });
    const item = tarea.checklist.id(req.params.itemId);
    if (!item) return res.status(404).json({ error: 'Checklist item not found' });
    item.done = !item.done;
    item.doneAt = item.done ? new Date() : undefined;
    item.doneBy = item.done ? callerId(req) : undefined;
    await tarea.save();
    logActivity(tarea._id, req, 'checklist_toggled', { details: `${item.done ? '✓' : '○'} ${item.text}` });
    res.json(tarea);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ── RECONTACTO (desde detalle de cliente) ───────────────────────────────
router.post('/recontacto', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const { clienteId, clienteNombre, canal, mensaje, periodoDias, crearCita, citaFecha, citaHora, propiedadId, propiedadTitulo } = req.body || {};
    if (!clienteId || !canal || !periodoDias) {
      return res.status(400).json({ error: 'clienteId, canal y periodoDias son requeridos' });
    }

    const scopeId = agentScopeId(req);
    const now = new Date();
    const dueDate = new Date(now.getTime() + parseInt(periodoDias, 10) * 86400000);

    // Crear tarea de recontacto
    const tarea = await Tarea.create({
      title: `Recontacto: ${clienteNombre || 'Cliente'}`,
      description: mensaje || `Recontacto por ${canal}`,
      status: 'pendiente',
      priority: 'media',
      assigneeId: scopeId || callerId(req),
      assigneeName: callerName(req),
      creatorId: callerId(req),
      creatorName: callerName(req),
      agenteId: scopeId || callerId(req),
      clienteId,
      clienteNombre,
      propiedadId: propiedadId || '',
      propiedadTitulo: propiedadTitulo || '',
      dueDate,
      isRecontacto: true,
      recontactoCanal: canal,
      recontactoMensaje: mensaje || '',
      recontactoPeriodoDias: parseInt(periodoDias, 10),
      recontactoFechaOriginal: now,
      kanbanColumn: 'pendiente',
    });
    logActivity(tarea._id, req, 'created', { details: 'Tarea de recontacto creada' });

    // Opcionalmente crear cita en agenda
    let cita = null;
    if (crearCita && citaFecha && citaHora) {
      const [hours, minutes] = citaHora.split(':');
      const fechaInicio = new Date(citaFecha);
      fechaInicio.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      const fechaFin = new Date(fechaInicio.getTime() + 60 * 60000); // 1 hora por defecto

      cita = await Cita.create({
        fecha: fechaInicio,
        fechaFin,
        titulo: `Recontacto: ${clienteNombre}`,
        tipo: 'Recontacto',
        ubicacion: canal === 'whatsapp' ? 'WhatsApp' : canal === 'email' ? 'Email' : 'Llamada',
        clienteId,
        agenteId: scopeId || callerId(req),
        propiedadId: propiedadId || '',
        notas: mensaje || '',
        estado: 'Programada',
        metadata: { tareaId: String(tarea._id) },
      });
    }

    // Crear notificación programada
    const notification = await Notification.create({
      agenteId: scopeId || callerId(req),
      tipo: 'tarea',
      titulo: `Recontacto pendiente: ${clienteNombre}`,
      mensaje: mensaje || `Recontacto programado por ${canal} en ${periodoDias} días`,
      prioridad: 'media',
      entidadTipo: 'cliente',
      entidadId: clienteId,
      entidadNombre: clienteNombre,
      fechaProgramada: dueDate,
      metadata: { tareaId: String(tarea._id), citaId: cita ? String(cita._id) : null },
    });

    res.status(201).json({ tarea, cita, notification });
  } catch (err) {
    console.error('Error al crear recontacto:', err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
