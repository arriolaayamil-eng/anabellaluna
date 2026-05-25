/**
 * MCP Tools — Tareas
 */

const { z } = require('zod');
const { getModel } = require('../db');

function registerTareaTools(server) {
  const Tarea = () => getModel('Tarea');

  server.tool(
    'list_tareas',
    'Lista tareas con filtros por estado, prioridad, asignado.',
    {
      status: z.string().optional().describe('pendiente | en_progreso | en_revision | completada | cancelada'),
      priority: z.string().optional().describe('urgente | alta | media | baja'),
      assigneeId: z.string().optional().describe('ID del asignado'),
      agenteId: z.string().optional().describe('ID del agente'),
      limit: z.number().optional(),
    },
    async ({ status, priority, assigneeId, agenteId, limit }) => {
      const filter = {};
      if (agenteId) {
        filter.$or = [{ assigneeId: agenteId }, { agenteId }, { creatorId: agenteId }];
      }
      if (status) filter.status = status;
      if (priority) filter.priority = priority;
      if (assigneeId) filter.assigneeId = assigneeId;

      const items = await Tarea().find(filter)
        .sort({ dueDate: 1, createdAt: -1 })
        .limit(Math.min(Math.max(Number(limit) || 20, 1), 50))
        .lean();
      return { content: [{ type: 'text', text: JSON.stringify({ count: items.length, items }, null, 2) }] };
    }
  );

  server.tool(
    'create_tarea',
    'Crea una nueva tarea.',
    {
      title: z.string().describe('Título (requerido)'),
      description: z.string().optional(),
      dueDate: z.string().optional().describe('Fecha límite ISO 8601'),
      priority: z.string().optional().describe('urgente | alta | media | baja'),
      assigneeId: z.string().optional().describe('ID del asignado'),
      agenteId: z.string().optional().describe('ID del agente creador'),
      clienteId: z.string().optional(),
      propiedadId: z.string().optional(),
    },
    async ({ title, description, dueDate, priority, assigneeId, agenteId, clienteId, propiedadId }) => {
      if (!title || !title.trim()) return { content: [{ type: 'text', text: 'title requerido' }], isError: true };
      const doc = {
        title: title.trim(),
        description: description || '',
        status: 'pendiente',
        priority: priority || 'media',
      };
      if (dueDate) doc.dueDate = new Date(dueDate);
      if (assigneeId) doc.assigneeId = assigneeId;
      if (agenteId) { doc.agenteId = agenteId; if (!assigneeId) doc.assigneeId = agenteId; }
      if (clienteId) doc.clienteId = clienteId;
      if (propiedadId) doc.propiedadId = propiedadId;

      const created = await Tarea().create(doc);
      return { content: [{ type: 'text', text: JSON.stringify(created.toObject(), null, 2) }] };
    }
  );

  server.tool(
    'update_tarea_status',
    'Actualiza el estado de una tarea.',
    {
      tareaId: z.string().describe('ID de la tarea'),
      status: z.string().describe('pendiente | en_progreso | en_revision | completada | cancelada'),
    },
    async ({ tareaId, status }) => {
      if (!tareaId || !status) return { content: [{ type: 'text', text: 'tareaId y status requeridos' }], isError: true };
      const set = { status };
      if (status === 'completada') { set.completed = true; set.completedAt = new Date(); }
      const updated = await Tarea().findByIdAndUpdate(tareaId, { $set: set }, { new: true }).lean();
      if (!updated) return { content: [{ type: 'text', text: 'Tarea no encontrada' }], isError: true };
      return { content: [{ type: 'text', text: JSON.stringify(updated, null, 2) }] };
    }
  );
}

module.exports = { registerTareaTools };
