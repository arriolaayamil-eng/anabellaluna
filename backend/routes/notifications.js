const express = require('express');
const Notification = require('../models/Notification');
const Tarea = require('../models/Tarea');
const Cita = require('../models/Cita');
const Activity = require('../models/Activity');
const Operacion = require('../models/Operacion');
const Cliente = require('../models/Cliente');
const Propiedad = require('../models/Propiedad');
const { authenticateToken, agentScopeId, requireCRMUser } = require('../auth');

const router = express.Router();

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
router.get('/', authenticateToken, requireCRMUser, async (req, res) => {
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
router.get('/unread-count', authenticateToken, requireCRMUser, async (req, res) => {
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
router.get('/:id', authenticateToken, requireCRMUser, async (req, res) => {
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
router.put('/:id/read', authenticateToken, requireCRMUser, async (req, res) => {
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
router.put('/mark-all-read', authenticateToken, requireCRMUser, async (req, res) => {
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
router.post('/', authenticateToken, requireCRMUser, async (req, res) => {
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
router.delete('/clear-read', authenticateToken, requireCRMUser, async (req, res) => {
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
router.delete('/:id', authenticateToken, requireCRMUser, async (req, res) => {
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
router.get('/historial/:clienteId', authenticateToken, requireCRMUser, async (req, res) => {
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
router.get('/reporte/efectividad', authenticateToken, requireCRMUser, async (req, res) => {
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
router.get('/calendario', authenticateToken, requireCRMUser, async (req, res) => {
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

// ============ POST /crm/notifications/generate ============
// Generates agent-specific notifications from real business events
router.post('/generate', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    if (!scopeId) return res.json({ ok: true, created: 0 });

    const created = [];
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);

    // Helper: avoid duplicates for today
    async function alreadyNotified(tipo, entidadId) {
      return Notification.exists({
        agenteId: scopeId,
        tipo,
        entidadId: entidadId ? String(entidadId) : undefined,
        createdAt: { $gte: todayStart },
      });
    }

    // 1. Today's appointments
    const todayAppts = await Cita.find({
      agenteId: scopeId,
      fecha: { $gte: todayStart, $lt: todayEnd },
      estado: { $ne: 'Cancelada' },
    }).lean();

    if (todayAppts.length > 0 && !(await alreadyNotified('cita', 'resumen_hoy'))) {
      const n = await Notification.create({
        agenteId: scopeId,
        tipo: 'cita',
        titulo: `${todayAppts.length} cita${todayAppts.length > 1 ? 's' : ''} hoy`,
        mensaje: todayAppts.map(c => `${c.titulo || c.tipo || 'Cita'} - ${new Date(c.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`).join(' | '),
        prioridad: 'alta',
        entidadTipo: 'cita',
        entidadId: 'resumen_hoy',
        accionUrl: '/citas',
      });
      created.push(n);
    }

    // 2. Overdue tasks
    const overdueTasks = await Tarea.find({
      agenteId: scopeId,
      dueDate: { $lt: todayStart },
      $or: [{ status: { $ne: 'Close' } }, { completed: { $ne: true } }],
    }).limit(5).lean();

    for (const t of overdueTasks) {
      if (await alreadyNotified('tarea', t._id)) continue;
      const n = await Notification.create({
        agenteId: scopeId,
        tipo: 'tarea',
        titulo: 'Tarea vencida',
        mensaje: `${t.title || 'Sin título'} - Venció el ${new Date(t.dueDate).toLocaleDateString('es-AR')}`,
        prioridad: 'alta',
        entidadTipo: 'tarea',
        entidadId: String(t._id),
        entidadNombre: t.title || '',
        accionUrl: '/tareas',
      });
      created.push(n);
    }

    // 3. Tasks due today
    const todayTasks = await Tarea.find({
      agenteId: scopeId,
      dueDate: { $gte: todayStart, $lt: todayEnd },
      $or: [{ status: { $ne: 'Close' } }, { completed: { $ne: true } }],
    }).lean();

    for (const t of todayTasks) {
      if (await alreadyNotified('tarea', t._id)) continue;
      const n = await Notification.create({
        agenteId: scopeId,
        tipo: 'tarea',
        titulo: 'Tarea para hoy',
        mensaje: t.title || 'Sin título',
        prioridad: 'media',
        entidadTipo: 'tarea',
        entidadId: String(t._id),
        entidadNombre: t.title || '',
        accionUrl: '/tareas',
      });
      created.push(n);
    }

    // 4. New web inquiries (last 48h, unread)
    const recentInquiries = await Activity.find({
      agenteId: scopeId,
      type: { $in: ['enquiry', 'visit_scheduled'] },
      'metadata.read': { $ne: true },
      createdAt: { $gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
    }).sort({ createdAt: -1 }).limit(10).lean();

    for (const inq of recentInquiries) {
      if (await alreadyNotified('consulta_web', inq._id)) continue;
      const n = await Notification.create({
        agenteId: scopeId,
        tipo: 'consulta_web',
        titulo: inq.type === 'visit_scheduled' ? 'Nueva solicitud de visita' : 'Nueva consulta web',
        mensaje: `${inq.metadata?.clientName || 'Visitante'} - ${inq.notes || inq.metadata?.propertyTitle || 'Sin detalle'}`,
        prioridad: 'alta',
        entidadTipo: 'cliente',
        entidadId: String(inq._id),
        entidadNombre: inq.metadata?.clientName || '',
        accionUrl: '/consultas',
      });
      created.push(n);
    }

    // 5. Properties with status changes (reserved/sold in last 24h)
    const recentProps = await Propiedad.find({
      agentId: scopeId,
      status: { $in: ['Reservada', 'Vendida', 'Alquilada'] },
      updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }).lean();

    for (const prop of recentProps) {
      if (await alreadyNotified('propiedad_estado', prop._id)) continue;
      const n = await Notification.create({
        agenteId: scopeId,
        tipo: 'propiedad_estado',
        titulo: `Propiedad ${prop.status}`,
        mensaje: `${prop.title || 'Propiedad'} - ${prop.address || ''}`,
        prioridad: 'media',
        entidadTipo: 'propiedad',
        entidadId: String(prop._id),
        entidadNombre: prop.title || '',
        accionUrl: '/propiedades',
      });
      created.push(n);
    }

    // 6. Clients with upcoming contract expiration (30 days)
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const clientesConVencimiento = await Cliente.find({
      agenteId: scopeId,
      'metadata.fechaVencimientoContrato': { $gte: now, $lte: in30Days },
    }).lean();

    for (const cli of clientesConVencimiento) {
      if (await alreadyNotified('contrato_vencimiento', cli._id)) continue;
      const fecha = new Date(cli.metadata.fechaVencimientoContrato);
      const dias = Math.ceil((fecha - now) / (1000 * 60 * 60 * 24));
      const n = await Notification.create({
        agenteId: scopeId,
        tipo: 'contrato_vencimiento',
        titulo: `Contrato por vencer en ${dias} días`,
        mensaje: `${cli.nombre || 'Cliente'} - Vence el ${fecha.toLocaleDateString('es-AR')}`,
        prioridad: dias <= 7 ? 'urgente' : dias <= 15 ? 'alta' : 'media',
        entidadTipo: 'cliente',
        entidadId: String(cli._id),
        entidadNombre: cli.nombre || '',
        accionUrl: '/clientes',
      });
      created.push(n);
    }

    // 7. New operations in the last 24h
    const recentOps = await Operacion.find({
      agenteId: scopeId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }).sort({ createdAt: -1 }).limit(5).lean();

    for (const op of recentOps) {
      if (await alreadyNotified('operacion_nueva', op._id)) continue;
      const n = await Notification.create({
        agenteId: scopeId,
        tipo: 'operacion_nueva',
        titulo: `Nueva operación: ${op.tipo || 'Operación'}`,
        mensaje: `${op.titulo || op.propiedad || 'Sin título'} - $${(op.monto || 0).toLocaleString()}`,
        prioridad: 'alta',
        entidadTipo: 'operacion',
        entidadId: String(op._id),
        entidadNombre: op.titulo || '',
        accionUrl: '/ventas',
      });
      created.push(n);
    }

    res.json({ ok: true, created: created.length });
  } catch (err) {
    console.error('CRM notification generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
