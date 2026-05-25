/**
 * MCP Tools — Métricas y Dashboard
 */

const { z } = require('zod');
const { getModel } = require('../db');

function registerMetricasTools(server) {
  const Cliente = () => getModel('Cliente');
  const Propiedad = () => getModel('Propiedad');
  const Operacion = () => getModel('Operacion');
  const Cita = () => getModel('Cita');
  const Tarea = () => getModel('Tarea');
  const Notification = () => getModel('Notification');
  const Activity = () => getModel('Activity');

  server.tool(
    'get_dashboard_metrics',
    'KPIs consolidados del CRM/ERP: clientes, propiedades, operaciones, agenda, tareas, montos y comisiones.',
    {
      period: z.string().optional().describe('today | last_7d | last_30d | last_90d | this_month (default last_30d)'),
      agenteId: z.string().optional().describe('Filtrar por agente (opcional, sin filtro = global)'),
    },
    async ({ period, agenteId }) => {
      const now = new Date();
      let start;
      if (period === 'today') start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      else if (period === 'last_7d') start = new Date(Date.now() - 7 * 86400000);
      else if (period === 'last_90d') start = new Date(Date.now() - 90 * 86400000);
      else if (period === 'this_month') start = new Date(now.getFullYear(), now.getMonth(), 1);
      else start = new Date(Date.now() - 30 * 86400000);

      const bf = agenteId ? { agenteId } : {};
      const pf = agenteId ? { agentId: agenteId } : {};

      const [
        clientesTotal, clientesNuevos,
        propiedadesTotal, propiedadesPublicadas, propiedadesVendidas, propiedadesAlquiladas,
        operacionesTotal, operacionesPeriodo,
        citasFuturas, citasPeriodo,
        tareasPendientes,
        operacionesAgg,
      ] = await Promise.all([
        Cliente().countDocuments(bf),
        Cliente().countDocuments({ ...bf, createdAt: { $gte: start } }),
        Propiedad().countDocuments(pf),
        Propiedad().countDocuments({ ...pf, published: true }),
        Propiedad().countDocuments({ ...pf, status: 'Vendida' }),
        Propiedad().countDocuments({ ...pf, status: 'Alquilada' }),
        Operacion().countDocuments(bf),
        Operacion().countDocuments({ ...bf, createdAt: { $gte: start } }),
        Cita().countDocuments({ ...bf, fecha: { $gte: new Date() } }),
        Cita().countDocuments({ ...bf, fecha: { $gte: start } }),
        Tarea().countDocuments({ ...(agenteId ? { assigneeId: agenteId } : {}), status: { $in: ['pendiente', 'en_progreso', 'en_revision'] } }),
        Operacion().aggregate([
          { $match: { ...bf, createdAt: { $gte: start } } },
          { $group: { _id: null, total: { $sum: '$monto' }, comisiones: { $sum: '$comisionMonto' }, count: { $sum: 1 } } },
        ]),
      ]);

      const result = {
        period: period || 'last_30d',
        rango: { desde: start.toISOString(), hasta: new Date().toISOString() },
        clientes: { total: clientesTotal, nuevosEnPeriodo: clientesNuevos },
        propiedades: { total: propiedadesTotal, publicadas: propiedadesPublicadas, vendidas: propiedadesVendidas, alquiladas: propiedadesAlquiladas },
        operaciones: { total: operacionesTotal, enPeriodo: operacionesPeriodo, montoTotalPeriodo: operacionesAgg[0]?.total || 0, comisionesPeriodo: operacionesAgg[0]?.comisiones || 0 },
        agenda: { citasFuturas, citasEnPeriodo: citasPeriodo },
        tareas: { pendientes: tareasPendientes },
      };
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    }
  );

  server.tool(
    'list_notifications',
    'Lista notificaciones del agente (recordatorios, alertas, automatizaciones).',
    {
      agenteId: z.string().optional().describe('ID del agente'),
      unreadOnly: z.boolean().optional().describe('Solo no leídas'),
      limit: z.number().optional(),
    },
    async ({ agenteId, unreadOnly, limit }) => {
      const filter = {};
      if (agenteId) filter.agenteId = agenteId;
      if (unreadOnly) filter.leida = false;
      const now = new Date();
      filter.$or = [{ fechaProgramada: null }, { fechaProgramada: { $exists: false } }, { fechaProgramada: { $lte: now } }];
      const items = await Notification().find(filter)
        .sort({ createdAt: -1 })
        .limit(Math.min(Math.max(Number(limit) || 20, 1), 50))
        .lean();
      return { content: [{ type: 'text', text: JSON.stringify({ count: items.length, items }, null, 2) }] };
    }
  );

  server.tool(
    'log_activity',
    'Registra una actividad (llamada, email, nota, visita) en la línea de tiempo.',
    {
      clientId: z.string().optional(),
      propertyId: z.string().optional(),
      agenteId: z.string().optional(),
      type: z.string().optional().describe('call | email | whatsapp | note | visit'),
      notes: z.string().optional(),
    },
    async ({ clientId, propertyId, agenteId, type, notes }) => {
      const doc = {
        agenteId: agenteId || '',
        clientId: clientId || '',
        propertyId: propertyId || '',
        type: type || 'note',
        notes: notes || '',
      };
      const created = await Activity().create(doc);
      return { content: [{ type: 'text', text: JSON.stringify(created.toObject(), null, 2) }] };
    }
  );

  server.tool(
    'list_agentes',
    'Lista los agentes inmobiliarios del sistema.',
    {
      limit: z.number().optional(),
    },
    async ({ limit }) => {
      const Agente = getModel('Agente');
      const items = await Agente.find({})
        .select('nombre email telefono activo')
        .limit(Math.min(Math.max(Number(limit) || 20, 1), 50))
        .lean();
      return { content: [{ type: 'text', text: JSON.stringify({ count: items.length, items }, null, 2) }] };
    }
  );
}

module.exports = { registerMetricasTools };
