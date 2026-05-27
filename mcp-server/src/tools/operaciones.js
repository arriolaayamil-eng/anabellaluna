/**
 * MCP Tools — Operaciones (Ventas, Alquileres, Reservas)
 */

const { z } = require('zod');
const { getModel } = require('../db');

function registerOperacionTools(server) {
  const Operacion = () => getModel('Operacion');
  const Cliente = () => getModel('Cliente');
  const Propiedad = () => getModel('Propiedad');

  const safeLimit = (limit, fallback = 20) => Math.min(Math.max(Number(limit) || fallback, 1), 50);

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
        .limit(safeLimit(limit))
        .maxTimeMS(5000)
        .lean();
      return { content: [{ type: 'text', text: JSON.stringify({ count: items.length, items }, null, 2) }] };
    }
  );

  server.tool(
    'count_operaciones_periodo',
    'Cuenta operaciones por período, tipo, estado y agente.',
    {
      tipo: z.string().optional().describe('Venta | Alquiler | Reserva'),
      estado: z.string().optional(),
      from: z.string().optional().describe('Fecha desde ISO 8601'),
      to: z.string().optional().describe('Fecha hasta ISO 8601'),
      agenteId: z.string().optional(),
    },
    async ({ tipo, estado, from, to, agenteId }) => {
      const filter = {};
      if (tipo) filter.tipo = tipo;
      if (estado) filter.estado = estado;
      if (agenteId) filter.agenteId = agenteId;
      if (from || to) {
        filter.createdAt = {};
        if (from) filter.createdAt.$gte = new Date(from);
        if (to) filter.createdAt.$lte = new Date(to);
      }
      const total = await Operacion().countDocuments(filter).maxTimeMS(5000);
      return { content: [{ type: 'text', text: JSON.stringify({ total, filter }, null, 2) }] };
    }
  );

  server.tool(
    'get_monto_operaciones_periodo',
    'Calcula monto total, comisiones y promedio de operaciones por período, moneda, tipo, estado y agente.',
    {
      tipo: z.string().optional().describe('Venta | Alquiler | Reserva'),
      estado: z.string().optional(),
      moneda: z.string().optional().describe('ARS | USD'),
      from: z.string().optional(),
      to: z.string().optional(),
      agenteId: z.string().optional(),
    },
    async ({ tipo, estado, moneda, from, to, agenteId }) => {
      const match = {};
      if (tipo) match.tipo = tipo;
      if (estado) match.estado = estado;
      if (moneda) match.moneda = moneda;
      if (agenteId) match.agenteId = agenteId;
      if (from || to) {
        match.createdAt = {};
        if (from) match.createdAt.$gte = new Date(from);
        if (to) match.createdAt.$lte = new Date(to);
      }
      const totals = await Operacion().aggregate([
        { $match: match },
        {
          $group: {
            _id: '$moneda',
            count: { $sum: 1 },
            montoTotal: { $sum: '$monto' },
            montoPromedio: { $avg: '$monto' },
            comisiones: { $sum: '$comisionMonto' },
          },
        },
      ]);
      return { content: [{ type: 'text', text: JSON.stringify({ match, totals }, null, 2) }] };
    }
  );

  server.tool(
    'get_pipeline_ventas',
    'Resume el pipeline de operaciones por estado, tipo y moneda.',
    {
      agenteId: z.string().optional(),
      from: z.string().optional(),
      to: z.string().optional(),
    },
    async ({ agenteId, from, to }) => {
      const match = {};
      if (agenteId) match.agenteId = agenteId;
      if (from || to) {
        match.createdAt = {};
        if (from) match.createdAt.$gte = new Date(from);
        if (to) match.createdAt.$lte = new Date(to);
      }
      const pipeline = await Operacion().aggregate([
        { $match: match },
        {
          $group: {
            _id: { estado: '$estado', tipo: '$tipo', moneda: '$moneda' },
            count: { $sum: 1 },
            montoTotal: { $sum: '$monto' },
            comisiones: { $sum: '$comisionMonto' },
          },
        },
        { $sort: { '_id.estado': 1, '_id.tipo': 1 } },
      ]);
      return { content: [{ type: 'text', text: JSON.stringify({ match, pipeline }, null, 2) }] };
    }
  );

  server.tool(
    'list_operaciones_en_riesgo',
    'Lista operaciones en curso sin actualización reciente o con fecha de cierre vencida.',
    {
      agenteId: z.string().optional(),
      days: z.number().optional().describe('Días sin actualización (default 14)'),
      limit: z.number().optional(),
    },
    async ({ agenteId, days, limit }) => {
      const cutoff = new Date(Date.now() - (Number(days) || 14) * 86400000);
      const filter = {
        ...(agenteId ? { agenteId } : {}),
        estado: { $nin: ['Cerrada', 'Completada', 'Cancelada', 'Finalizada'] },
        $or: [
          { updatedAt: { $lt: cutoff } },
          { fechaCierre: { $lt: new Date() } },
        ],
      };
      const items = await Operacion().find(filter)
        .sort({ updatedAt: 1, fechaCierre: 1 })
        .limit(safeLimit(limit))
        .maxTimeMS(5000)
        .lean();
      return { content: [{ type: 'text', text: JSON.stringify({ count: items.length, cutoff: cutoff.toISOString(), items }, null, 2) }] };
    }
  );

  server.tool(
    'create_operacion',
    'Crea una operación inmobiliaria (venta, alquiler o reserva).',
    {
      propiedadId: z.string().optional(),
      clienteId: z.string().optional(),
      agenteId: z.string().optional(),
      tipo: z.string().optional().describe('Venta | Alquiler | Reserva'),
      monto: z.number().optional(),
      moneda: z.string().optional().describe('ARS | USD'),
      estado: z.string().optional(),
      notas: z.string().optional(),
      fechaCierre: z.string().optional(),
      formaPago: z.string().optional(),
      comisionPorcentaje: z.number().optional(),
    },
    async ({ propiedadId, clienteId, agenteId, tipo, monto, moneda, estado, notas, fechaCierre, formaPago, comisionPorcentaje }) => {
      const [cliente, propiedad] = await Promise.all([
        clienteId ? Cliente().findById(clienteId).select('nombre').lean() : null,
        propiedadId ? Propiedad().findById(propiedadId).select('title address price moneda').lean() : null,
      ]);
      const pct = Number(comisionPorcentaje) || 3.5;
      const amount = Number(monto) || propiedad?.price || 0;
      const created = await Operacion().create({
        propiedadId: propiedadId || '',
        clienteId: clienteId || '',
        agenteId: agenteId || '',
        tipo: tipo || 'Venta',
        monto: amount,
        moneda: moneda || propiedad?.moneda || 'USD',
        estado: estado || 'En Curso',
        notas: notas || '',
        fechaCierre: fechaCierre ? new Date(fechaCierre) : undefined,
        formaPago: formaPago || 'Contado',
        comisionPorcentaje: pct,
        comisionMonto: amount * (pct / 100),
        metadata: {
          propiedad: propiedad?.title || '',
          cliente: cliente?.nombre || '',
        },
      });
      return { content: [{ type: 'text', text: JSON.stringify(created.toObject(), null, 2) }] };
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

  server.tool(
    'update_operacion_estado',
    'Actualiza el estado de una operación y opcionalmente la fecha de cierre/notas.',
    {
      operacionId: z.string().describe('ID de la operación'),
      estado: z.string().describe('Nuevo estado'),
      fechaCierre: z.string().optional(),
      notas: z.string().optional(),
    },
    async ({ operacionId, estado, fechaCierre, notas }) => {
      const set = { estado };
      if (fechaCierre) set.fechaCierre = new Date(fechaCierre);
      if (notas !== undefined) set.notas = notas;
      const updated = await Operacion().findByIdAndUpdate(operacionId, { $set: set }, { new: true }).lean();
      if (!updated) return { content: [{ type: 'text', text: 'Operación no encontrada' }], isError: true };
      return { content: [{ type: 'text', text: JSON.stringify(updated, null, 2) }] };
    }
  );
}

module.exports = { registerOperacionTools };
