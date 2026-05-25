/**
 * MCP Tools — Operaciones (Ventas, Alquileres, Reservas)
 */

const { z } = require('zod');
const { getModel } = require('../db');

function registerOperacionTools(server) {
  const Operacion = () => getModel('Operacion');

  server.tool(
    'list_operaciones',
    'Lista operaciones inmobiliarias (ventas, alquileres, reservas) con filtros.',
    {
      tipo: z.string().optional().describe('Venta | Alquiler | Reserva'),
      estado: z.string().optional().describe('Estado de la operación'),
      from: z.string().optional().describe('Fecha desde (ISO 8601)'),
      to: z.string().optional().describe('Fecha hasta (ISO 8601)'),
      clienteId: z.string().optional(),
      propiedadId: z.string().optional(),
      agenteId: z.string().optional(),
      limit: z.number().optional().describe('Máximo resultados (1-50)'),
    },
    async ({ tipo, estado, from, to, clienteId, propiedadId, agenteId, limit }) => {
      const filter = {};
      if (agenteId) filter.agenteId = agenteId;
      if (tipo) filter.tipo = tipo;
      if (estado) filter.estado = estado;
      if (clienteId) filter.clienteId = clienteId;
      if (propiedadId) filter.propiedadId = propiedadId;
      if (from || to) {
        filter.createdAt = {};
        if (from) filter.createdAt.$gte = new Date(from);
        if (to) filter.createdAt.$lte = new Date(to);
      }
      const items = await Operacion().find(filter)
        .sort({ createdAt: -1 })
        .limit(Math.min(Math.max(Number(limit) || 20, 1), 50))
        .lean();
      return { content: [{ type: 'text', text: JSON.stringify({ count: items.length, items }, null, 2) }] };
    }
  );

  server.tool(
    'get_operacion_detail',
    'Detalle completo de una operación incluyendo metadata de comisiones.',
    {
      operacionId: z.string().describe('MongoDB ObjectId de la operación'),
    },
    async ({ operacionId }) => {
      const op = await Operacion().findById(operacionId).lean();
      if (!op) return { content: [{ type: 'text', text: 'Operación no encontrada' }], isError: true };
      return { content: [{ type: 'text', text: JSON.stringify(op, null, 2) }] };
    }
  );
}

module.exports = { registerOperacionTools };
