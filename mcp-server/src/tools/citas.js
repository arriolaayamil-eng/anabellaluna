/**
 * MCP Tools — Citas / Agenda
 */

const { z } = require('zod');
const { getModel } = require('../db');

function registerCitaTools(server) {
  const Cita = () => getModel('Cita');
  const Cliente = () => getModel('Cliente');
  const Propiedad = () => getModel('Propiedad');

  const safeLimit = (limit, fallback = 20) => Math.min(Math.max(Number(limit) || fallback, 1), 50);

  server.tool(
    'list_citas',
    'Lista citas/visitas/reuniones con filtros por fecha, estado, cliente, propiedad o agente.',
    {
      from: z.string().optional().describe('Fecha desde (ISO 8601)'),
      to: z.string().optional().describe('Fecha hasta (ISO 8601)'),
      estado: z.string().optional().describe('Programada | Completada | Cancelada'),
      clienteId: z.string().optional().describe('Filtrar por cliente'),
      propiedadId: z.string().optional().describe('Filtrar por propiedad'),
      agenteId: z.string().optional().describe('Filtrar por agente'),
      limit: z.number().optional().describe('Máximo resultados (1-50)'),
    },
    async ({ from, to, estado, clienteId, propiedadId, agenteId, limit }) => {
      const filter = {};
      if (agenteId) filter.agenteId = agenteId;
      if (from || to) {
        filter.fecha = {};
        if (from) filter.fecha.$gte = new Date(from);
        if (to) filter.fecha.$lte = new Date(to);
      }
      if (estado) filter.estado = estado;
      if (clienteId) filter.clienteId = clienteId;
      if (propiedadId) filter.propiedadId = propiedadId;

      const items = await Cita().find(filter)
        .sort({ fecha: 1 })
        .limit(safeLimit(limit))
        .maxTimeMS(5000)
        .lean();
      return { content: [{ type: 'text', text: JSON.stringify({ count: items.length, items }, null, 2) }] };
    }
  );

  server.tool(
    'get_agenda_summary',
    'Resumen de agenda para un rango: citas próximas, vencidas sin completar, canceladas y conteos por tipo.',
    {
      agenteId: z.string().optional().describe('Filtrar por agente'),
      from: z.string().optional().describe('Fecha desde ISO 8601 (default inicio de hoy)'),
      to: z.string().optional().describe('Fecha hasta ISO 8601 (default fin de hoy)'),
      limit: z.number().optional(),
    },
    async ({ agenteId, from, to, limit }) => {
      const now = new Date();
      const start = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const end = to ? new Date(to) : new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const base = { ...(agenteId ? { agenteId } : {}) };
      const rangeFilter = { ...base, fecha: { $gte: start, $lt: end } };

      const [items, byStatus, byType, overdueCount] = await Promise.all([
        Cita().find(rangeFilter).sort({ fecha: 1 }).limit(safeLimit(limit)).lean(),
        Cita().aggregate([{ $match: rangeFilter }, { $group: { _id: '$estado', count: { $sum: 1 } } }]),
        Cita().aggregate([{ $match: rangeFilter }, { $group: { _id: '$tipo', count: { $sum: 1 } } }]),
        Cita().countDocuments({ ...base, estado: 'Programada', fecha: { $lt: now } }),
      ]);

      return { content: [{ type: 'text', text: JSON.stringify({
        range: { from: start.toISOString(), to: end.toISOString() },
        count: items.length,
        overdueProgramadas: overdueCount,
        byStatus,
        byType,
        items,
      }, null, 2) }] };
    }
  );

  server.tool(
    'list_citas_vencidas_sin_resultado',
    'Lista citas programadas cuya fecha ya pasó y todavía no fueron marcadas como completadas/canceladas.',
    {
      agenteId: z.string().optional(),
      limit: z.number().optional(),
    },
    async ({ agenteId, limit }) => {
      const filter = {
        ...(agenteId ? { agenteId } : {}),
        estado: 'Programada',
        fecha: { $lt: new Date() },
      };
      const items = await Cita().find(filter)
        .sort({ fecha: -1 })
        .limit(safeLimit(limit))
        .maxTimeMS(5000)
        .lean();
      return { content: [{ type: 'text', text: JSON.stringify({ count: items.length, items }, null, 2) }] };
    }
  );

  server.tool(
    'detect_agenda_conflicts',
    'Detecta solapamientos de citas programadas por agente en un rango.',
    {
      agenteId: z.string().optional().describe('Filtrar por agente'),
      from: z.string().optional().describe('Fecha desde ISO 8601'),
      to: z.string().optional().describe('Fecha hasta ISO 8601'),
    },
    async ({ agenteId, from, to }) => {
      const start = from ? new Date(from) : new Date();
      const end = to ? new Date(to) : new Date(Date.now() + 7 * 86400000);
      const filter = {
        ...(agenteId ? { agenteId } : {}),
        estado: 'Programada',
        fecha: { $gte: start, $lte: end },
      };
      const citas = await Cita().find(filter).sort({ agenteId: 1, fecha: 1 }).lean();
      const conflicts = [];
      for (let i = 0; i < citas.length; i += 1) {
        for (let j = i + 1; j < citas.length; j += 1) {
          if (String(citas[i].agenteId || '') !== String(citas[j].agenteId || '')) break;
          const aStart = new Date(citas[i].fecha).getTime();
          const aEnd = new Date(citas[i].fechaFin || new Date(aStart + 60 * 60000)).getTime();
          const bStart = new Date(citas[j].fecha).getTime();
          const bEnd = new Date(citas[j].fechaFin || new Date(bStart + 60 * 60000)).getTime();
          if (aStart < bEnd && bStart < aEnd) conflicts.push({ agenteId: citas[i].agenteId || '', citas: [citas[i], citas[j]] });
        }
      }
      return { content: [{ type: 'text', text: JSON.stringify({ count: conflicts.length, range: { from: start.toISOString(), to: end.toISOString() }, conflicts }, null, 2) }] };
    }
  );

  server.tool(
    'create_cita',
    'Agenda una nueva cita (visita, llamada, reunión, firma). Usar inmediatamente cuando el usuario pide agendar/crear una cita y dio fecha/hora suficiente; no requiere segunda confirmación. Si el agente tiene Google Calendar conectado, se sincroniza automáticamente.',
    {
      fecha: z.string().describe('Fecha/hora inicio (ISO 8601) — REQUERIDO'),
      fechaFin: z.string().optional().describe('Fecha/hora fin (ISO 8601)'),
      titulo: z.string().optional().describe('Título de la cita'),
      tipo: z.string().optional().describe('Visita | Llamada | Reunión | Firma'),
      ubicacion: z.string().optional().describe('Dirección o lugar'),
      clienteId: z.string().optional().describe('ID del cliente'),
      propiedadId: z.string().optional().describe('ID de la propiedad'),
      agenteId: z.string().optional().describe('ID del agente'),
      notas: z.string().optional().describe('Notas adicionales'),
    },
    async ({ fecha, fechaFin, titulo, tipo, ubicacion, clienteId, propiedadId, agenteId, notas }) => {
      if (!fecha) return { content: [{ type: 'text', text: 'fecha es requerida' }], isError: true };
      const d = new Date(fecha);
      if (isNaN(d.getTime())) return { content: [{ type: 'text', text: 'fecha inválida' }], isError: true };

      const doc = {
        fecha: d,
        titulo: titulo || 'Cita',
        tipo: tipo || 'Visita',
        ubicacion: ubicacion || '',
        notas: notas || '',
        estado: 'Programada',
      };
      if (fechaFin) doc.fechaFin = new Date(fechaFin);
      if (clienteId) doc.clienteId = clienteId;
      if (propiedadId) doc.propiedadId = propiedadId;
      if (agenteId) doc.agenteId = agenteId;

      const created = await Cita().create(doc);
      return { content: [{ type: 'text', text: JSON.stringify(created.toObject(), null, 2) }] };
    }
  );

  server.tool(
    'update_cita',
    'Modifica una cita existente (fecha, ubicación, notas, estado).',
    {
      citaId: z.string().describe('ID de la cita — REQUERIDO'),
      fecha: z.string().optional(),
      fechaFin: z.string().optional(),
      titulo: z.string().optional(),
      tipo: z.string().optional(),
      ubicacion: z.string().optional(),
      notas: z.string().optional(),
      estado: z.string().optional().describe('Programada | Completada | Cancelada'),
      clienteId: z.string().optional(),
      propiedadId: z.string().optional(),
    },
    async ({ citaId, fecha, fechaFin, titulo, tipo, ubicacion, notas, estado, clienteId, propiedadId }) => {
      if (!citaId) return { content: [{ type: 'text', text: 'citaId requerido' }], isError: true };
      const set = {};
      if (fecha !== undefined) set.fecha = new Date(fecha);
      if (fechaFin !== undefined) set.fechaFin = new Date(fechaFin);
      if (titulo !== undefined) set.titulo = titulo;
      if (tipo !== undefined) set.tipo = tipo;
      if (ubicacion !== undefined) set.ubicacion = ubicacion;
      if (notas !== undefined) set.notas = notas;
      if (estado !== undefined) set.estado = estado;
      if (clienteId !== undefined) set.clienteId = clienteId;
      if (propiedadId !== undefined) set.propiedadId = propiedadId;

      const updated = await Cita().findByIdAndUpdate(citaId, { $set: set }, { new: true }).lean();
      if (!updated) return { content: [{ type: 'text', text: 'Cita no encontrada' }], isError: true };
      return { content: [{ type: 'text', text: JSON.stringify(updated, null, 2) }] };
    }
  );

  server.tool(
    'add_cita_resultado',
    'Registra el resultado de una cita y opcionalmente la marca como completada.',
    {
      citaId: z.string().describe('ID de la cita'),
      resultado: z.string().describe('Resumen del resultado'),
      completed: z.boolean().optional().describe('Marcar como Completada (default true)'),
    },
    async ({ citaId, resultado, completed }) => {
      if (!citaId || !resultado) return { content: [{ type: 'text', text: 'citaId y resultado requeridos' }], isError: true };
      const set = {
        notas: resultado,
        ...(completed === false ? {} : { estado: 'Completada' }),
        'metadata.resultado': resultado,
        'metadata.resultadoAt': new Date(),
      };
      const updated = await Cita().findByIdAndUpdate(citaId, { $set: set }, { new: true }).lean();
      if (!updated) return { content: [{ type: 'text', text: 'Cita no encontrada' }], isError: true };

      const [cliente, propiedad] = await Promise.all([
        updated.clienteId ? Cliente().findById(updated.clienteId).select('nombre email telefono').lean() : null,
        updated.propiedadId ? Propiedad().findById(updated.propiedadId).select('title address price moneda').lean() : null,
      ]);

      return { content: [{ type: 'text', text: JSON.stringify({ cita: updated, cliente, propiedad }, null, 2) }] };
    }
  );

  server.tool(
    'cancel_cita',
    'Cancela una cita existente.',
    {
      citaId: z.string().describe('ID de la cita'),
      reason: z.string().optional().describe('Motivo de cancelación'),
    },
    async ({ citaId, reason }) => {
      if (!citaId) return { content: [{ type: 'text', text: 'citaId requerido' }], isError: true };
      const updated = await Cita().findByIdAndUpdate(
        citaId,
        { $set: { estado: 'Cancelada', notas: reason || 'Cancelada' } },
        { new: true }
      ).lean();
      if (!updated) return { content: [{ type: 'text', text: 'Cita no encontrada' }], isError: true };
      return { content: [{ type: 'text', text: JSON.stringify(updated, null, 2) }] };
    }
  );
}

module.exports = { registerCitaTools };
