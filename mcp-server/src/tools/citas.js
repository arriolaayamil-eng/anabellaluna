/**
 * MCP Tools — Citas / Agenda
 */

const { z } = require('zod');
const { getModel } = require('../db');

function registerCitaTools(server) {
  const Cita = () => getModel('Cita');

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
        .limit(Math.min(Math.max(Number(limit) || 20, 1), 50))
        .lean();
      return { content: [{ type: 'text', text: JSON.stringify({ count: items.length, items }, null, 2) }] };
    }
  );

  server.tool(
    'create_cita',
    'Agenda una nueva cita (visita, llamada, reunión, firma). Si el agente tiene Google Calendar conectado, se sincroniza automáticamente.',
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
