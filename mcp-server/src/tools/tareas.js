/**
 * MCP Tools — Tareas
 */

const { z } = require('zod');
const { getModel } = require('../db');

function registerTareaTools(server) {
  const Tarea = () => getModel('Tarea');
  const Cliente = () => getModel('Cliente');
  const Propiedad = () => getModel('Propiedad');

  const safeLimit = (limit, fallback = 20) => Math.min(Math.max(Number(limit) || fallback, 1), 50);
  const openStatuses = ['pendiente', 'en_progreso', 'en_revision', 'Open', 'InProgress', 'Testing'];

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
        .limit(safeLimit(limit))
        .maxTimeMS(5000)
        .lean();
      return { content: [{ type: 'text', text: JSON.stringify({ count: items.length, items }, null, 2) }] };
    }
  );

  server.tool(
    'list_tareas_vencidas',
    'Lista tareas abiertas con fecha límite vencida.',
    {
      agenteId: z.string().optional().describe('ID del agente'),
      assigneeId: z.string().optional().describe('ID del asignado'),
      limit: z.number().optional(),
    },
    async ({ agenteId, assigneeId, limit }) => {
      const filter = {
        status: { $in: openStatuses },
        dueDate: { $lt: new Date() },
      };
      if (agenteId) filter.$or = [{ assigneeId: agenteId }, { agenteId }, { creatorId: agenteId }];
      if (assigneeId) filter.assigneeId = assigneeId;
      const items = await Tarea().find(filter)
        .sort({ dueDate: 1 })
        .limit(safeLimit(limit))
        .maxTimeMS(5000)
        .lean();
      return { content: [{ type: 'text', text: JSON.stringify({ count: items.length, items }, null, 2) }] };
    }
  );

  server.tool(
    'get_task_load_summary',
    'Resume carga de tareas abiertas por agente/asignado, incluyendo vencidas y urgentes.',
    {
      agenteId: z.string().optional().describe('Filtrar por agente/asignado'),
    },
    async ({ agenteId }) => {
      const match = { status: { $in: openStatuses } };
      if (agenteId) match.$or = [{ assigneeId: agenteId }, { agenteId }, { creatorId: agenteId }];
      const now = new Date();
      const summary = await Tarea().aggregate([
        { $match: match },
        {
          $group: {
            _id: '$assigneeId',
            totalAbiertas: { $sum: 1 },
            vencidas: { $sum: { $cond: [{ $lt: ['$dueDate', now] }, 1, 0] } },
            urgentes: { $sum: { $cond: [{ $in: ['$priority', ['urgente', 'alta', 'Alta']] }, 1, 0] } },
            proximoVencimiento: { $min: '$dueDate' },
          },
        },
        { $sort: { vencidas: -1, urgentes: -1, totalAbiertas: -1 } },
      ]);
      return { content: [{ type: 'text', text: JSON.stringify({ count: summary.length, summary }, null, 2) }] };
    }
  );

  server.tool(
    'list_tareas_por_cliente',
    'Lista tareas asociadas a un cliente.',
    {
      clienteId: z.string().describe('ID del cliente'),
      includeCompleted: z.boolean().optional(),
      limit: z.number().optional(),
    },
    async ({ clienteId, includeCompleted, limit }) => {
      const filter = { clienteId };
      if (!includeCompleted) filter.status = { $in: openStatuses };
      const [cliente, items] = await Promise.all([
        Cliente().findById(clienteId).select('nombre email telefono agenteId').lean(),
        Tarea().find(filter).sort({ dueDate: 1, createdAt: -1 }).limit(safeLimit(limit)).lean(),
      ]);
      return { content: [{ type: 'text', text: JSON.stringify({ cliente, count: items.length, items }, null, 2) }] };
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

  server.tool(
    'reschedule_tarea',
    'Reprograma la fecha límite de una tarea.',
    {
      tareaId: z.string().describe('ID de la tarea'),
      dueDate: z.string().describe('Nueva fecha límite ISO 8601'),
    },
    async ({ tareaId, dueDate }) => {
      if (!tareaId || !dueDate) return { content: [{ type: 'text', text: 'tareaId y dueDate requeridos' }], isError: true };
      const d = new Date(dueDate);
      if (Number.isNaN(d.getTime())) return { content: [{ type: 'text', text: 'dueDate inválida' }], isError: true };
      const updated = await Tarea().findByIdAndUpdate(tareaId, { $set: { dueDate: d } }, { new: true }).lean();
      if (!updated) return { content: [{ type: 'text', text: 'Tarea no encontrada' }], isError: true };
      return { content: [{ type: 'text', text: JSON.stringify(updated, null, 2) }] };
    }
  );

  server.tool(
    'assign_tarea',
    'Asigna o delega una tarea a otro usuario/agente.',
    {
      tareaId: z.string().describe('ID de la tarea'),
      assigneeId: z.string().describe('Nuevo asignado'),
      assigneeName: z.string().optional(),
      reason: z.string().optional(),
      fromUserId: z.string().optional(),
      fromUserName: z.string().optional(),
    },
    async ({ tareaId, assigneeId, assigneeName, reason, fromUserId, fromUserName }) => {
      const delegation = fromUserId ? {
        fromUserId,
        fromUserName: fromUserName || '',
        toUserId: assigneeId,
        toUserName: assigneeName || '',
        reason: reason || '',
        delegatedAt: new Date(),
      } : null;
      const update = {
        $set: { assigneeId, ...(assigneeName ? { assigneeName } : {}) },
        ...(delegation ? { $push: { delegations: delegation } } : {}),
      };
      const updated = await Tarea().findByIdAndUpdate(tareaId, update, { new: true }).lean();
      if (!updated) return { content: [{ type: 'text', text: 'Tarea no encontrada' }], isError: true };
      const propiedad = updated.propiedadId ? await Propiedad().findById(updated.propiedadId).select('title address').lean() : null;
      return { content: [{ type: 'text', text: JSON.stringify({ tarea: updated, propiedad }, null, 2) }] };
    }
  );
}

module.exports = { registerTareaTools };
