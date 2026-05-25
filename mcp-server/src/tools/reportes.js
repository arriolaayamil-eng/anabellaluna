/**
 * MCP Tools — Reportes y Analytics avanzados
 */

const { z } = require('zod');
const { getModel } = require('../db');

function registerReporteTools(server) {
  const Propiedad = () => getModel('Propiedad');
  const Cliente = () => getModel('Cliente');
  const Operacion = () => getModel('Operacion');
  const Cita = () => getModel('Cita');
  const Activity = () => getModel('Activity');
  const Agente = () => getModel('Agente');

  server.tool(
    'get_sales_report',
    'Reporte de ventas/alquileres: monto total, cantidad, promedio por período y agente.',
    {
      period: z.string().optional().describe('last_7d | last_30d | last_90d | this_year (default last_30d)'),
      tipo: z.string().optional().describe('Venta | Alquiler | Reserva'),
      agenteId: z.string().optional(),
    },
    async ({ period, tipo, agenteId }) => {
      const now = new Date();
      let start;
      if (period === 'last_7d') start = new Date(Date.now() - 7 * 86400000);
      else if (period === 'last_90d') start = new Date(Date.now() - 90 * 86400000);
      else if (period === 'this_year') start = new Date(now.getFullYear(), 0, 1);
      else start = new Date(Date.now() - 30 * 86400000);

      const match = { createdAt: { $gte: start } };
      if (tipo) match.tipo = tipo;
      if (agenteId) match.agenteId = agenteId;

      const agg = await Operacion().aggregate([
        { $match: match },
        {
          $group: {
            _id: { tipo: '$tipo', estado: '$estado' },
            total: { $sum: '$monto' },
            count: { $sum: 1 },
            avgMonto: { $avg: '$monto' },
            comisiones: { $sum: '$comisionMonto' },
          },
        },
        { $sort: { '_id.tipo': 1 } },
      ]);

      // Monthly breakdown
      const monthly = await Operacion().aggregate([
        { $match: match },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            total: { $sum: '$monto' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);

      return { content: [{ type: 'text', text: JSON.stringify({ period: period || 'last_30d', byTypeAndStatus: agg, monthly }, null, 2) }] };
    }
  );

  server.tool(
    'get_agent_performance',
    'Ranking y métricas de rendimiento por agente: operaciones, clientes, citas, actividad.',
    {
      period: z.string().optional().describe('last_30d | last_90d | this_year'),
    },
    async ({ period }) => {
      const now = new Date();
      let start;
      if (period === 'last_90d') start = new Date(Date.now() - 90 * 86400000);
      else if (period === 'this_year') start = new Date(now.getFullYear(), 0, 1);
      else start = new Date(Date.now() - 30 * 86400000);

      const agentes = await Agente().find({}).select('nombre email activo').lean();

      const results = [];
      for (const ag of agentes) {
        const id = String(ag._id);
        const [ops, clientes, citas, actividades] = await Promise.all([
          Operacion().countDocuments({ agenteId: id, createdAt: { $gte: start } }),
          Cliente().countDocuments({ agenteId: id, createdAt: { $gte: start } }),
          Cita().countDocuments({ agenteId: id, fecha: { $gte: start } }),
          Activity().countDocuments({ agenteId: id, createdAt: { $gte: start } }),
        ]);
        const montoTotal = await Operacion().aggregate([
          { $match: { agenteId: id, createdAt: { $gte: start } } },
          { $group: { _id: null, total: { $sum: '$monto' } } },
        ]);
        results.push({
          agente: ag.nombre, agenteId: id, activo: ag.activo,
          operaciones: ops, clientesNuevos: clientes, citas,
          actividades, montoTotal: montoTotal[0]?.total || 0,
        });
      }

      results.sort((a, b) => b.montoTotal - a.montoTotal);
      return { content: [{ type: 'text', text: JSON.stringify({ period: period || 'last_30d', ranking: results }, null, 2) }] };
    }
  );

  server.tool(
    'get_property_analytics',
    'Analytics de propiedades: distribución por estado, precio promedio, tiempo en mercado.',
    {
      agentId: z.string().optional(),
    },
    async ({ agentId }) => {
      const filter = agentId ? { agentId } : {};

      const byStatus = await Propiedad().aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 }, avgPrice: { $avg: '$price' } } },
      ]);

      const byType = await Propiedad().aggregate([
        { $match: filter },
        { $group: { _id: '$propertyType', count: { $sum: 1 }, avgPrice: { $avg: '$price' } } },
      ]);

      const total = await Propiedad().countDocuments(filter);
      const published = await Propiedad().countDocuments({ ...filter, published: true });

      return { content: [{ type: 'text', text: JSON.stringify({ total, published, byStatus, byType }, null, 2) }] };
    }
  );

  server.tool(
    'get_client_analytics',
    'Analytics de clientes: nuevos por mes, distribución por fuente/estado.',
    {
      period: z.string().optional(),
      agenteId: z.string().optional(),
    },
    async ({ period, agenteId }) => {
      let start;
      if (period === 'last_90d') start = new Date(Date.now() - 90 * 86400000);
      else if (period === 'this_year') start = new Date(new Date().getFullYear(), 0, 1);
      else start = new Date(Date.now() - 30 * 86400000);

      const filter = { createdAt: { $gte: start } };
      if (agenteId) filter.agenteId = agenteId;

      const monthly = await Cliente().aggregate([
        { $match: filter },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);

      const total = await Cliente().countDocuments(agenteId ? { agenteId } : {});
      const nuevos = await Cliente().countDocuments(filter);

      return { content: [{ type: 'text', text: JSON.stringify({ total, nuevosEnPeriodo: nuevos, monthly }, null, 2) }] };
    }
  );
}

module.exports = { registerReporteTools };
