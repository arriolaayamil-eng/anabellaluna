/**
 * CRM Operations — Acceso completo a datos del CRM/ERP para el agente AI.
 *
 * Todas las funciones respetan scoping por agente:
 *   - Si ctx.agenteId está definido y NO es admin → filtra por agenteId
 *   - Si ctx.isAdmin === true → ve todo
 */

const mongoose  = require('mongoose');
const Cliente   = require('../../../models/Cliente');
const Propiedad = require('../../../models/Propiedad');
const Operacion = require('../../../models/Operacion');
const Cita      = require('../../../models/Cita');
const Tarea     = require('../../../models/Tarea');
const Activity  = require('../../../models/Activity');
const Notification = require('../../../models/Notification');
const Agente    = require('../../../models/Agente');

const MAX_LIMIT = 50;

function safeLimit(n, def = 20) {
  const v = Number(n) || def;
  return Math.min(Math.max(v, 1), MAX_LIMIT);
}

function applyAgentScope(filter, ctx, field = 'agenteId') {
  if (ctx && ctx.agenteId && !ctx.isAdmin) {
    filter[field] = ctx.agenteId;
  }
  return filter;
}

function isObjectId(v) {
  return mongoose.Types.ObjectId.isValid(String(v || ''));
}

// ── CLIENTES ──────────────────────────────────────────────────────────────────

async function searchClientes({ query = '', limit = 20, includeMetadata = false }, ctx = {}) {
  const filter = {};
  applyAgentScope(filter, ctx);

  if (query && String(query).trim()) {
    const rx = new RegExp(String(query).trim(), 'i');
    filter.$or = [
      { nombre: rx },
      { email: rx },
      { telefono: rx },
      { direccion: rx },
    ];
  }

  const projection = includeMetadata
    ? null
    : '-metadata';

  const items = await Cliente.find(filter, projection)
    .sort({ updatedAt: -1 })
    .limit(safeLimit(limit))
    .lean();

  return { count: items.length, items };
}

async function getClienteDetail({ clienteId }, ctx = {}) {
  if (!isObjectId(clienteId)) throw new Error('clienteId inválido');
  const cli = await Cliente.findById(clienteId).lean();
  if (!cli) throw new Error('Cliente no encontrado');
  if (ctx.agenteId && !ctx.isAdmin && String(cli.agenteId || '') !== String(ctx.agenteId)) {
    throw new Error('No tenés acceso a este cliente');
  }

  const [propiedades, operaciones, citas, actividades] = await Promise.all([
    Propiedad.find({ ownerId: String(cli._id) }).select('title address price status published').lean(),
    Operacion.find({ clienteId: String(cli._id) }).sort({ createdAt: -1 }).limit(10).lean(),
    Cita.find({ clienteId: String(cli._id) }).sort({ fecha: -1 }).limit(10).lean(),
    Activity.find({ clientId: String(cli._id) }).sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  return { cliente: cli, propiedades, operaciones, citas, actividades };
}

async function createCliente({ nombre, email, telefono, direccion, notas }, ctx = {}) {
  if (!nombre || !String(nombre).trim()) throw new Error('nombre es requerido');
  const doc = {
    nombre: String(nombre).trim(),
    email: email ? String(email).trim() : '',
    telefono: telefono ? String(telefono).trim() : '',
    direccion: direccion ? String(direccion).trim() : '',
    notas: notas ? String(notas) : '',
  };
  if (ctx.agenteId) doc.agenteId = ctx.agenteId;
  const created = await Cliente.create(doc);
  return created.toObject();
}

async function updateCliente({ clienteId, updates }, ctx = {}) {
  if (!isObjectId(clienteId)) throw new Error('clienteId inválido');
  const filter = { _id: clienteId };
  applyAgentScope(filter, ctx);

  const allowed = ['nombre', 'email', 'telefono', 'direccion', 'notas'];
  const set = {};
  for (const k of allowed) if (updates && updates[k] !== undefined) set[k] = updates[k];

  const updated = await Cliente.findOneAndUpdate(filter, { $set: set }, { new: true }).lean();
  if (!updated) throw new Error('Cliente no encontrado o sin acceso');
  return updated;
}

// ── PROPIEDADES ───────────────────────────────────────────────────────────────

async function searchPropiedades({ query = '', status, published, featured, minPrice, maxPrice, limit = 20 }, ctx = {}) {
  const filter = {};
  if (ctx.agenteId && !ctx.isAdmin) filter.agentId = ctx.agenteId;

  if (query && String(query).trim()) {
    const rx = new RegExp(String(query).trim(), 'i');
    filter.$or = [{ title: rx }, { description: rx }, { address: rx }];
  }
  if (status)    filter.status = status;
  if (published !== undefined) filter.published = !!published;
  if (featured !== undefined)  filter.featured = !!featured;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const items = await Propiedad.find(filter)
    .select('title address price moneda status published featured ownerId agentId slug')
    .sort({ updatedAt: -1 })
    .limit(safeLimit(limit))
    .lean();

  return { count: items.length, items };
}

async function getPropiedadDetail({ propiedadId }, ctx = {}) {
  if (!isObjectId(propiedadId)) throw new Error('propiedadId inválido');
  const prop = await Propiedad.findById(propiedadId).lean();
  if (!prop) throw new Error('Propiedad no encontrada');
  if (ctx.agenteId && !ctx.isAdmin && String(prop.agentId || '') !== String(ctx.agenteId)) {
    throw new Error('No tenés acceso a esta propiedad');
  }

  let owner = null;
  if (prop.ownerId && isObjectId(prop.ownerId)) {
    owner = await Cliente.findById(prop.ownerId).select('nombre email telefono').lean();
  }
  const operaciones = await Operacion.find({ propiedadId: String(prop._id) }).sort({ createdAt: -1 }).limit(10).lean();
  const citas       = await Cita.find({ propiedadId: String(prop._id) }).sort({ fecha: -1 }).limit(10).lean();

  return { propiedad: prop, owner, operaciones, citas };
}

async function updatePropiedad({ propiedadId, updates }, ctx = {}) {
  if (!isObjectId(propiedadId)) throw new Error('propiedadId inválido');
  const filter = { _id: propiedadId };
  if (ctx.agenteId && !ctx.isAdmin) filter.agentId = ctx.agenteId;

  const allowed = ['title', 'description', 'address', 'price', 'moneda', 'status', 'published', 'featured'];
  const set = {};
  for (const k of allowed) if (updates && updates[k] !== undefined) set[k] = updates[k];

  const updated = await Propiedad.findOneAndUpdate(filter, { $set: set }, { new: true }).lean();
  if (!updated) throw new Error('Propiedad no encontrada o sin acceso');
  return updated;
}

// ── CITAS / AGENDA ────────────────────────────────────────────────────────────

async function listCitas({ from, to, estado, clienteId, propiedadId, limit = 20 }, ctx = {}) {
  const filter = {};
  applyAgentScope(filter, ctx);

  if (from || to) {
    filter.fecha = {};
    if (from) filter.fecha.$gte = new Date(from);
    if (to)   filter.fecha.$lte = new Date(to);
  }
  if (estado) filter.estado = estado;
  if (clienteId) filter.clienteId = String(clienteId);
  if (propiedadId) filter.propiedadId = String(propiedadId);

  const items = await Cita.find(filter).sort({ fecha: 1 }).limit(safeLimit(limit)).lean();
  return { count: items.length, items };
}

async function createCita({ fecha, fechaFin, titulo, tipo, ubicacion, clienteId, propiedadId, notas }, ctx = {}) {
  if (!fecha) throw new Error('fecha es requerida');
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) throw new Error('fecha inválida');

  const doc = {
    fecha: d,
    titulo: titulo || 'Cita',
    tipo: tipo || 'Visita',
    ubicacion: ubicacion || '',
    notas: notas || '',
    estado: 'Programada',
  };
  if (fechaFin) doc.fechaFin = new Date(fechaFin);
  if (clienteId)   doc.clienteId = String(clienteId);
  if (propiedadId) doc.propiedadId = String(propiedadId);
  if (ctx.agenteId) doc.agenteId = ctx.agenteId;

  const created = await Cita.create(doc);
  return created.toObject();
}

async function updateCita({ citaId, updates }, ctx = {}) {
  if (!isObjectId(citaId)) throw new Error('citaId inválido');
  const filter = { _id: citaId };
  applyAgentScope(filter, ctx);

  const allowed = ['fecha', 'fechaFin', 'titulo', 'tipo', 'ubicacion', 'notas', 'estado', 'clienteId', 'propiedadId'];
  const set = {};
  for (const k of allowed) if (updates && updates[k] !== undefined) {
    if (k === 'fecha' || k === 'fechaFin') set[k] = new Date(updates[k]);
    else set[k] = updates[k];
  }

  const updated = await Cita.findOneAndUpdate(filter, { $set: set }, { new: true }).lean();
  if (!updated) throw new Error('Cita no encontrada o sin acceso');
  return updated;
}

async function cancelCita({ citaId, reason }, ctx = {}) {
  if (!isObjectId(citaId)) throw new Error('citaId inválido');
  const filter = { _id: citaId };
  applyAgentScope(filter, ctx);

  const updated = await Cita.findOneAndUpdate(
    filter,
    { $set: { estado: 'Cancelada', notas: reason || 'Cancelada por AI Copilot' } },
    { new: true }
  ).lean();
  if (!updated) throw new Error('Cita no encontrada o sin acceso');
  return updated;
}

// ── OPERACIONES ───────────────────────────────────────────────────────────────

async function listOperaciones({ tipo, estado, from, to, clienteId, propiedadId, limit = 20 }, ctx = {}) {
  const filter = {};
  applyAgentScope(filter, ctx);
  if (tipo) filter.tipo = tipo;
  if (estado) filter.estado = estado;
  if (clienteId) filter.clienteId = String(clienteId);
  if (propiedadId) filter.propiedadId = String(propiedadId);
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to)   filter.createdAt.$lte = new Date(to);
  }
  const items = await Operacion.find(filter).sort({ createdAt: -1 }).limit(safeLimit(limit)).lean();
  return { count: items.length, items };
}

// ── TAREAS ────────────────────────────────────────────────────────────────────

async function listTareas({ status, priority, assigneeId, limit = 20 }, ctx = {}) {
  const filter = {};
  if (ctx.agenteId && !ctx.isAdmin) {
    filter.$or = [{ assigneeId: ctx.agenteId }, { agenteId: ctx.agenteId }, { creatorId: ctx.agenteId }];
  }
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (assigneeId) filter.assigneeId = String(assigneeId);
  const items = await Tarea.find(filter).sort({ dueDate: 1, createdAt: -1 }).limit(safeLimit(limit)).lean();
  return { count: items.length, items };
}

async function createTarea({ title, description, dueDate, priority, assigneeId, clienteId, propiedadId }, ctx = {}) {
  if (!title || !String(title).trim()) throw new Error('title es requerido');
  const doc = {
    title: String(title).trim(),
    description: description || '',
    status: 'pendiente',
    priority: priority || 'media',
  };
  if (dueDate) doc.dueDate = new Date(dueDate);
  if (assigneeId) doc.assigneeId = String(assigneeId);
  else if (ctx.agenteId) doc.assigneeId = ctx.agenteId;
  if (ctx.agenteId) doc.agenteId = ctx.agenteId;
  if (ctx.userId)   doc.creatorId = ctx.userId;
  if (clienteId)   doc.clienteId = String(clienteId);
  if (propiedadId) doc.propiedadId = String(propiedadId);
  const created = await Tarea.create(doc);
  return created.toObject();
}

async function updateTareaStatus({ tareaId, status }, ctx = {}) {
  if (!isObjectId(tareaId)) throw new Error('tareaId inválido');
  const filter = { _id: tareaId };
  if (ctx.agenteId && !ctx.isAdmin) {
    filter.$or = [{ assigneeId: ctx.agenteId }, { agenteId: ctx.agenteId }, { creatorId: ctx.agenteId }];
  }
  const set = { status };
  if (status === 'completada') { set.completed = true; set.completedAt = new Date(); }
  const updated = await Tarea.findOneAndUpdate(filter, { $set: set }, { new: true }).lean();
  if (!updated) throw new Error('Tarea no encontrada o sin acceso');
  return updated;
}

// ── ACTIVIDADES ───────────────────────────────────────────────────────────────

async function logActivity({ clientId, propertyId, type, notes }, ctx = {}) {
  const doc = {
    agenteId: ctx.agenteId || '',
    clientId: clientId ? String(clientId) : '',
    propertyId: propertyId ? String(propertyId) : '',
    type: type || 'note',
    notes: notes || '',
  };
  const created = await Activity.create(doc);
  return created.toObject();
}

// ── NOTIFICACIONES ────────────────────────────────────────────────────────────

async function listNotifications({ unreadOnly = false, limit = 20 }, ctx = {}) {
  const filter = {};
  if (ctx.agenteId) filter.agenteId = ctx.agenteId;
  if (unreadOnly) filter.leida = false;
  const now = new Date();
  filter.$or = [{ fechaProgramada: null }, { fechaProgramada: { $lte: now } }];
  const items = await Notification.find(filter).sort({ createdAt: -1 }).limit(safeLimit(limit)).lean();
  return { count: items.length, items };
}

// ── METRICAS / DASHBOARD ──────────────────────────────────────────────────────

async function getDashboardMetrics({ period = 'last_30d' }, ctx = {}) {
  const now = new Date();
  let start;
  if (period === 'today')      start = new Date(now.setHours(0, 0, 0, 0));
  else if (period === 'last_7d')   start = new Date(Date.now() - 7 * 86400000);
  else if (period === 'last_30d')  start = new Date(Date.now() - 30 * 86400000);
  else if (period === 'last_90d')  start = new Date(Date.now() - 90 * 86400000);
  else if (period === 'this_month') start = new Date(now.getFullYear(), now.getMonth(), 1);
  else start = new Date(Date.now() - 30 * 86400000);

  const baseFilter = {};
  const baseFilterAgente = {};
  if (ctx.agenteId && !ctx.isAdmin) {
    baseFilter.agenteId = ctx.agenteId;
    baseFilterAgente.agentId = ctx.agenteId;
  }

  const [
    clientesTotal, clientesNuevos,
    propiedadesTotal, propiedadesPublicadas, propiedadesVendidas, propiedadesAlquiladas,
    operacionesTotal, operacionesPeriodo,
    citasFuturas, citasPeriodo, tareasPendientes,
    operacionesAgg,
  ] = await Promise.all([
    Cliente.countDocuments(baseFilter),
    Cliente.countDocuments({ ...baseFilter, createdAt: { $gte: start } }),
    Propiedad.countDocuments(baseFilterAgente),
    Propiedad.countDocuments({ ...baseFilterAgente, published: true }),
    Propiedad.countDocuments({ ...baseFilterAgente, status: 'Vendida' }),
    Propiedad.countDocuments({ ...baseFilterAgente, status: 'Alquilada' }),
    Operacion.countDocuments(baseFilter),
    Operacion.countDocuments({ ...baseFilter, createdAt: { $gte: start } }),
    Cita.countDocuments({ ...baseFilter, fecha: { $gte: new Date() } }),
    Cita.countDocuments({ ...baseFilter, fecha: { $gte: start } }),
    Tarea.countDocuments({
      ...(ctx.agenteId && !ctx.isAdmin ? { assigneeId: ctx.agenteId } : {}),
      status: { $in: ['pendiente', 'en_progreso', 'en_revision'] },
    }),
    Operacion.aggregate([
      { $match: { ...baseFilter, createdAt: { $gte: start } } },
      { $group: { _id: null, total: { $sum: '$monto' }, comisiones: { $sum: '$comisionMonto' }, count: { $sum: 1 } } },
    ]),
  ]);

  return {
    period,
    rango: { desde: start.toISOString(), hasta: new Date().toISOString() },
    clientes: { total: clientesTotal, nuevosEnPeriodo: clientesNuevos },
    propiedades: {
      total: propiedadesTotal,
      publicadas: propiedadesPublicadas,
      vendidas: propiedadesVendidas,
      alquiladas: propiedadesAlquiladas,
    },
    operaciones: {
      total: operacionesTotal,
      enPeriodo: operacionesPeriodo,
      montoTotalPeriodo:    operacionesAgg[0]?.total      || 0,
      comisionesPeriodo:    operacionesAgg[0]?.comisiones || 0,
    },
    agenda: { citasFuturas, citasEnPeriodo: citasPeriodo },
    tareas: { pendientes: tareasPendientes },
  };
}

// ── AGENTES (admin) ───────────────────────────────────────────────────────────

async function listAgentes({ limit = 20 } = {}, ctx = {}) {
  if (!ctx.isAdmin) throw new Error('Solo admin puede listar agentes');
  const items = await Agente.find({}).select('nombre email telefono activo metadata.role').limit(safeLimit(limit)).lean();
  return { count: items.length, items };
}

module.exports = {
  // clientes
  searchClientes, getClienteDetail, createCliente, updateCliente,
  // propiedades
  searchPropiedades, getPropiedadDetail, updatePropiedad,
  // citas
  listCitas, createCita, updateCita, cancelCita,
  // operaciones
  listOperaciones,
  // tareas
  listTareas, createTarea, updateTareaStatus,
  // actividades
  logActivity,
  // notifs
  listNotifications,
  // métricas
  getDashboardMetrics,
  // agentes
  listAgentes,
};
