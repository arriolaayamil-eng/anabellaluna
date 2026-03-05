const express = require('express');
const Notification = require('../models/Notification');
const Operacion = require('../models/Operacion');
const Propiedad = require('../models/Propiedad');
const Cliente = require('../models/Cliente');
const Cita = require('../models/Cita');
const Tarea = require('../models/Tarea');
const Agente = require('../models/Agente');
const Activity = require('../models/Activity');
const Message = require('../models/Message');
const User = require('../models/User');
const { authenticateToken, requireRole, getUserId } = require('../auth');

const router = express.Router();
const ADMIN_AGENT_ID = '__admin__';

function applyVisibilityFilter(filter, now = new Date()) {
  const visibility = [
    { fechaProgramada: null },
    { fechaProgramada: { $exists: false } },
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

// ============ GET /admin/notifications ============
router.get('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { leida, tipo, limite = 50, pagina = 1, prioridad } = req.query;
    const filter = { agenteId: ADMIN_AGENT_ID };
    if (leida !== undefined) filter.leida = leida === 'true';
    if (tipo) filter.tipo = tipo;
    if (prioridad) filter.prioridad = prioridad;
    applyVisibilityFilter(filter);

    const skip = (parseInt(pagina) - 1) * parseInt(limite);
    const [items, total] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limite)).lean(),
      Notification.countDocuments(filter),
    ]);
    res.json({ items, total, pagina: parseInt(pagina), limite: parseInt(limite) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ GET /admin/notifications/unread-count ============
router.get('/unread-count', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const filter = { agenteId: ADMIN_AGENT_ID, leida: false };
    applyVisibilityFilter(filter);
    const count = await Notification.countDocuments(filter);
    const urgentes = await Notification.countDocuments({ ...filter, prioridad: 'urgente' });
    res.json({ count, urgentes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ GET /admin/notifications/navbar-summary ============
// MUST be before /:id routes
router.get('/navbar-summary', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now); todayEnd.setHours(23, 59, 59, 999);

    // Get admin user ID for message count
    const adminUserId = getUserId(req);

    const [
      propiedadesTotal,
      propiedadesDisponibles,
      tareasPendientes,
      tareasHoy,
      citasPendientes,
      citasHoy,
      consultasNoLeidas,
      notifFilter,
      mensajesNoLeidos,
    ] = await Promise.all([
      Propiedad.countDocuments({}),
      Propiedad.countDocuments({ status: 'Disponible' }),
      Tarea.countDocuments({ $or: [{ kanbanColumn: { $ne: 'done' } }, { kanbanColumn: { $exists: false } }] }),
      Tarea.countDocuments({
        fechaVencimiento: { $gte: todayStart, $lt: todayEnd },
        $or: [{ kanbanColumn: { $ne: 'done' } }, { kanbanColumn: { $exists: false } }],
      }),
      Cita.countDocuments({ fecha: { $gte: now }, estado: { $ne: 'cancelada' } }),
      Cita.countDocuments({ fecha: { $gte: todayStart, $lt: todayEnd }, estado: { $ne: 'cancelada' } }),
      Activity.countDocuments({ type: { $in: ['enquiry', 'visit_scheduled'] }, 'metadata.read': { $ne: true } }),
      (async () => {
        const f = { agenteId: ADMIN_AGENT_ID, leida: false };
        applyVisibilityFilter(f);
        return Notification.countDocuments(f);
      })(),
      (async () => {
        if (!adminUserId) return 0;
        try {
          const mongoose = require('mongoose');
          return Message.countDocuments({ receiverId: new mongoose.Types.ObjectId(adminUserId), read: false });
        } catch { return 0; }
      })(),
    ]);

    res.json({
      propiedades: { total: propiedadesTotal, disponibles: propiedadesDisponibles },
      tareas: { pendientes: tareasPendientes, hoy: tareasHoy, citas: citasPendientes, citasHoy, total: tareasPendientes + citasPendientes },
      consultas: { noLeidas: consultasNoLeidas },
      mensajes: { internosNoLeidos: mensajesNoLeidos, total: consultasNoLeidas + mensajesNoLeidos },
      notificaciones: { noLeidas: notifFilter },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ POST /admin/notifications/generate ============
// Scans real data and creates admin notifications for actionable business events
router.post('/generate', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const created = [];
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);

    // Helper: avoid duplicates for today
    async function alreadyNotified(tipo, entidadId) {
      return Notification.exists({
        agenteId: ADMIN_AGENT_ID,
        tipo,
        entidadId: entidadId ? String(entidadId) : undefined,
        createdAt: { $gte: todayStart },
      });
    }

    // 1. New web inquiries not yet notified
    const recentInquiries = await Activity.find({
      type: { $in: ['enquiry', 'visit_scheduled'] },
      'metadata.read': { $ne: true },
      createdAt: { $gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
    }).sort({ createdAt: -1 }).limit(10).lean();

    for (const inq of recentInquiries) {
      if (await alreadyNotified('consulta_web', inq._id)) continue;
      const n = await Notification.create({
        agenteId: ADMIN_AGENT_ID,
        tipo: 'consulta_web',
        titulo: inq.type === 'visit_scheduled' ? 'Nueva solicitud de visita' : 'Nueva consulta web',
        mensaje: `${inq.metadata?.clientName || 'Visitante'} - ${inq.notes || inq.metadata?.propertyTitle || 'Sin detalle'}`,
        prioridad: 'alta',
        entidadTipo: 'cliente',
        entidadId: String(inq._id),
        entidadNombre: inq.metadata?.clientName || '',
        accionUrl: '/clientes',
      });
      created.push(n);
    }

    // 2. New operations created recently
    const recentOps = await Operacion.find({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }).sort({ createdAt: -1 }).limit(10).lean();

    for (const op of recentOps) {
      if (await alreadyNotified('operacion_nueva', op._id)) continue;
      const agente = op.agenteId ? await Agente.findById(op.agenteId).lean() : null;
      const n = await Notification.create({
        agenteId: ADMIN_AGENT_ID,
        tipo: 'operacion_nueva',
        titulo: `Nueva operación: ${op.tipo || 'Operación'}`,
        mensaje: `${op.titulo || op.propiedad || 'Sin título'} - ${agente?.nombre || 'Sin agente'} - $${(op.monto || 0).toLocaleString()}`,
        prioridad: 'alta',
        entidadTipo: 'operacion',
        entidadId: String(op._id),
        entidadNombre: op.titulo || op.propiedad || '',
        accionUrl: '/operaciones',
      });
      created.push(n);
    }

    // 3. Contracts expiring in next 30 days
    const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const clientesConVencimiento = await Cliente.find({
      'metadata.fechaVencimientoContrato': { $gte: now, $lte: in30Days },
    }).lean();

    for (const cli of clientesConVencimiento) {
      if (await alreadyNotified('contrato_vencimiento', cli._id)) continue;
      const fecha = new Date(cli.metadata.fechaVencimientoContrato);
      const dias = Math.ceil((fecha - now) / (1000 * 60 * 60 * 24));
      const n = await Notification.create({
        agenteId: ADMIN_AGENT_ID,
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

    // 4. Properties with status changes (reserved/sold recently)
    const recentProps = await Propiedad.find({
      status: { $in: ['Reservada', 'Vendida', 'Alquilada'] },
      updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }).lean();

    for (const prop of recentProps) {
      if (await alreadyNotified('propiedad_estado', prop._id)) continue;
      const n = await Notification.create({
        agenteId: ADMIN_AGENT_ID,
        tipo: 'propiedad_estado',
        titulo: `Propiedad ${prop.status}`,
        mensaje: `${prop.title || prop.titulo || 'Propiedad'} - ${prop.address || prop.direccion || ''}`,
        prioridad: 'media',
        entidadTipo: 'propiedad',
        entidadId: String(prop._id),
        entidadNombre: prop.title || prop.titulo || '',
        accionUrl: '/propiedades',
      });
      created.push(n);
    }

    // 5. Overdue tasks (past due and not done)
    const overdueTasks = await Tarea.find({
      fechaVencimiento: { $lt: todayStart },
      $or: [{ kanbanColumn: { $ne: 'done' } }, { kanbanColumn: { $exists: false } }],
    }).limit(5).lean();

    for (const t of overdueTasks) {
      if (await alreadyNotified('tarea', t._id)) continue;
      const n = await Notification.create({
        agenteId: ADMIN_AGENT_ID,
        tipo: 'tarea',
        titulo: 'Tarea vencida',
        mensaje: `${t.titulo || t.title || 'Sin título'} - Venció el ${new Date(t.fechaVencimiento).toLocaleDateString('es-AR')}`,
        prioridad: 'alta',
        entidadTipo: 'tarea',
        entidadId: String(t._id),
        entidadNombre: t.titulo || t.title || '',
        accionUrl: '/tareas',
      });
      created.push(n);
    }

    // 6. Today's appointments summary
    const todayAppts = await Cita.countDocuments({
      fecha: { $gte: todayStart, $lt: new Date(todayStart.getTime() + 24 * 60 * 60 * 1000) },
      estado: { $ne: 'cancelada' },
    });
    if (todayAppts > 0) {
      const exists = await alreadyNotified('cita', 'resumen_hoy');
      if (!exists) {
        const n = await Notification.create({
          agenteId: ADMIN_AGENT_ID,
          tipo: 'cita',
          titulo: `${todayAppts} cita${todayAppts > 1 ? 's' : ''} programada${todayAppts > 1 ? 's' : ''} hoy`,
          mensaje: `Hay ${todayAppts} cita${todayAppts > 1 ? 's' : ''} agendada${todayAppts > 1 ? 's' : ''} para hoy`,
          prioridad: 'media',
          entidadTipo: 'cita',
          entidadId: 'resumen_hoy',
          accionUrl: '/citas',
        });
        created.push(n);
      }
    }

    // 7. Daily summary report
    const dailyExists = await alreadyNotified('reporte_diario', 'daily');
    if (!dailyExists) {
      const [totalClientes, totalProps, totalOps, opsThisMonth] = await Promise.all([
        Cliente.countDocuments({}),
        Propiedad.countDocuments({}),
        Operacion.countDocuments({}),
        Operacion.countDocuments({
          createdAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) },
        }),
      ]);
      const n = await Notification.create({
        agenteId: ADMIN_AGENT_ID,
        tipo: 'reporte_diario',
        titulo: 'Resumen del día',
        mensaje: `Clientes: ${totalClientes} | Propiedades: ${totalProps} | Operaciones mes: ${opsThisMonth} | Total ops: ${totalOps}`,
        prioridad: 'baja',
        entidadId: 'daily',
        accionUrl: '/',
      });
      created.push(n);
    }

    res.json({ ok: true, created: created.length });
  } catch (err) {
    console.error('Admin notification generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============ PUT /admin/notifications/mark-all-read ============
// MUST be before /:id routes
router.put('/mark-all-read', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const filter = { agenteId: ADMIN_AGENT_ID, leida: false };
    applyVisibilityFilter(filter);
    const result = await Notification.updateMany(filter, { leida: true, fechaLectura: new Date() });
    res.json({ ok: true, modified: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ DELETE /admin/notifications/clear-read ============
// MUST be before /:id routes
router.delete('/clear-read', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const result = await Notification.deleteMany({ agenteId: ADMIN_AGENT_ID, leida: true });
    res.json({ ok: true, deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ PUT /admin/notifications/:id/read ============
router.put('/:id/read', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const updated = await Notification.findOneAndUpdate(
      { _id: req.params.id, agenteId: ADMIN_AGENT_ID },
      { leida: true, fechaLectura: new Date() },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ DELETE /admin/notifications/:id ============
router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const deleted = await Notification.findOneAndDelete({ _id: req.params.id, agenteId: ADMIN_AGENT_ID });
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
