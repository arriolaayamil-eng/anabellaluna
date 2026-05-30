/**
 * MCP Tools — Clientes
 */

const { z } = require('zod');
const { getModel } = require('../db');

function registerClienteTools(server) {
  const Cliente = () => getModel('Cliente');
  const Activity = () => getModel('Activity');
  const Operacion = () => getModel('Operacion');
  const Cita = () => getModel('Cita');
  const Propiedad = () => getModel('Propiedad');

  const safeLimit = (limit, fallback = 20) => Math.min(Math.max(Number(limit) || fallback, 1), 50);
  const persistedResult = async (model, id, label) => {
    const persisted = await model.findById(id).lean();
    if (!persisted) {
      return { content: [{ type: 'text', text: `No se pudo confirmar la persistencia de ${label}` }], isError: true };
    }
    return { content: [{ type: 'text', text: JSON.stringify({ persisted: true, item: persisted }, null, 2) }] };
  };

  server.tool(
    'count_clientes',
    'Cuenta clientes del CRM de forma eficiente. Usar para preguntas como "cuántos clientes hay" o "cantidad de clientes actuales".',
    {
      agenteId: z.string().optional().describe('Filtrar por agente'),
      createdFrom: z.string().optional().describe('Fecha ISO opcional: contar clientes creados desde esta fecha'),
      createdTo: z.string().optional().describe('Fecha ISO opcional: contar clientes creados hasta esta fecha'),
      fidelizado: z.boolean().optional().describe('Filtrar por clientes fidelizados'),
    },
    async ({ agenteId, createdFrom, createdTo, fidelizado }) => {
      const filter = {};
      if (agenteId) filter.agenteId = agenteId;
      if (fidelizado !== undefined) filter.fidelizado = fidelizado;
      if (createdFrom || createdTo) {
        filter.createdAt = {};
        if (createdFrom) filter.createdAt.$gte = new Date(createdFrom);
        if (createdTo) filter.createdAt.$lte = new Date(createdTo);
      }

      const total = await Cliente().countDocuments(filter).maxTimeMS(5000);
      return { content: [{ type: 'text', text: JSON.stringify({ total, filter }, null, 2) }] };
    }
  );

  server.tool(
    'search_clientes',
    'Busca clientes por nombre, email, teléfono o dirección. Devuelve hasta 50 resultados.',
    {
      query: z.string().optional().describe('Texto libre a buscar'),
      agenteId: z.string().optional().describe('Filtrar por agente'),
      limit: z.number().optional().describe('Máximo resultados (1-50, default 20)'),
    },
    async ({ query, agenteId, limit }) => {
      const filter = {};
      if (agenteId) filter.agenteId = agenteId;
      if (query && query.trim()) {
        const rx = new RegExp(query.trim(), 'i');
        filter.$or = [{ nombre: rx }, { email: rx }, { telefono: rx }, { direccion: rx }];
      }
      const items = await Cliente().find(filter)
        .select('nombre email telefono direccion agenteId fidelizado createdAt updatedAt')
        .sort({ updatedAt: -1 })
        .limit(safeLimit(limit))
        .maxTimeMS(5000)
        .lean();
      return { content: [{ type: 'text', text: JSON.stringify({ count: items.length, items }, null, 2) }] };
    }
  );

  server.tool(
    'list_clientes_recientes',
    'Lista los clientes creados o actualizados recientemente. Útil para "últimos clientes cargados".',
    {
      agenteId: z.string().optional().describe('Filtrar por agente'),
      mode: z.string().optional().describe('created | updated (default updated)'),
      limit: z.number().optional().describe('Máximo resultados (1-50)'),
    },
    async ({ agenteId, mode, limit }) => {
      const filter = agenteId ? { agenteId } : {};
      const sortField = mode === 'created' ? 'createdAt' : 'updatedAt';
      const items = await Cliente().find(filter)
        .select('nombre email telefono direccion agenteId fidelizado createdAt updatedAt')
        .sort({ [sortField]: -1 })
        .limit(safeLimit(limit))
        .maxTimeMS(5000)
        .lean();
      return { content: [{ type: 'text', text: JSON.stringify({ count: items.length, items }, null, 2) }] };
    }
  );

  server.tool(
    'list_clientes_sin_seguimiento',
    'Lista clientes sin actividad registrada en los últimos N días, priorizando los más abandonados.',
    {
      agenteId: z.string().optional().describe('Filtrar por agente'),
      days: z.number().optional().describe('Días sin seguimiento (default 14)'),
      limit: z.number().optional().describe('Máximo resultados (1-50)'),
    },
    async ({ agenteId, days, limit }) => {
      const cutoff = new Date(Date.now() - (Number(days) || 14) * 86400000);
      const clientFilter = agenteId ? { agenteId } : {};
      const clients = await Cliente().find(clientFilter)
        .select('nombre email telefono agenteId createdAt updatedAt')
        .sort({ updatedAt: 1 })
        .limit(500)
        .lean();

      const ids = clients.map((c) => String(c._id));
      const recentActivities = await Activity().find({
        clientId: { $in: ids },
        createdAt: { $gte: cutoff },
      }).select('clientId createdAt').lean();
      const withRecent = new Set(recentActivities.map((a) => String(a.clientId)));

      const lastActivityAgg = await Activity().aggregate([
        { $match: { clientId: { $in: ids } } },
        { $group: { _id: '$clientId', lastActivityAt: { $max: '$createdAt' }, activityCount: { $sum: 1 } } },
      ]);
      const lastByClient = new Map(lastActivityAgg.map((a) => [String(a._id), a]));

      const items = clients
        .filter((c) => !withRecent.has(String(c._id)))
        .map((c) => {
          const last = lastByClient.get(String(c._id));
          return {
            ...c,
            lastActivityAt: last?.lastActivityAt || null,
            activityCount: last?.activityCount || 0,
            daysWithoutFollowup: Math.floor((Date.now() - new Date(last?.lastActivityAt || c.updatedAt || c.createdAt).getTime()) / 86400000),
          };
        })
        .sort((a, b) => b.daysWithoutFollowup - a.daysWithoutFollowup)
        .slice(0, safeLimit(limit));

      return { content: [{ type: 'text', text: JSON.stringify({ count: items.length, cutoff: cutoff.toISOString(), items }, null, 2) }] };
    }
  );

  server.tool(
    'detect_clientes_duplicados',
    'Detecta posibles clientes duplicados por email o teléfono.',
    {
      agenteId: z.string().optional().describe('Filtrar por agente'),
      limit: z.number().optional().describe('Máximo grupos duplicados (1-50)'),
    },
    async ({ agenteId, limit }) => {
      const match = agenteId ? { agenteId } : {};
      const duplicateGroups = await Cliente().aggregate([
        { $match: match },
        {
          $project: {
            nombre: 1,
            email: { $toLower: { $ifNull: ['$email', ''] } },
            telefono: { $ifNull: ['$telefono', ''] },
            agenteId: 1,
            createdAt: 1,
          },
        },
        {
          $facet: {
            byEmail: [
              { $match: { email: { $nin: ['', null] } } },
              { $group: { _id: '$email', count: { $sum: 1 }, clientes: { $push: '$$ROOT' } } },
              { $match: { count: { $gt: 1 } } },
            ],
            byTelefono: [
              { $match: { telefono: { $nin: ['', null] } } },
              { $group: { _id: '$telefono', count: { $sum: 1 }, clientes: { $push: '$$ROOT' } } },
              { $match: { count: { $gt: 1 } } },
            ],
          },
        },
      ]);

      const groups = [
        ...(duplicateGroups[0]?.byEmail || []).map((g) => ({ type: 'email', value: g._id, count: g.count, clientes: g.clientes })),
        ...(duplicateGroups[0]?.byTelefono || []).map((g) => ({ type: 'telefono', value: g._id, count: g.count, clientes: g.clientes })),
      ].slice(0, safeLimit(limit));

      return { content: [{ type: 'text', text: JSON.stringify({ count: groups.length, groups }, null, 2) }] };
    }
  );

  server.tool(
    'get_cliente_detail',
    'Ficha completa de un cliente: datos + propiedades + operaciones + citas + actividades recientes.',
    {
      clienteId: z.string().describe('MongoDB ObjectId del cliente'),
    },
    async ({ clienteId }) => {
      const cli = await Cliente().findById(clienteId).lean();
      if (!cli) return { content: [{ type: 'text', text: 'Cliente no encontrado' }], isError: true };

      const [propiedades, operaciones, citas, actividades] = await Promise.all([
        Propiedad().find({ ownerId: String(cli._id) }).select('title address price status published').lean(),
        Operacion().find({ clienteId: String(cli._id) }).sort({ createdAt: -1 }).limit(10).lean(),
        Cita().find({ clienteId: String(cli._id) }).sort({ fecha: -1 }).limit(10).lean(),
        Activity().find({ clientId: String(cli._id) }).sort({ createdAt: -1 }).limit(10).lean(),
      ]);

      return { content: [{ type: 'text', text: JSON.stringify({ cliente: cli, propiedades, operaciones, citas, actividades }, null, 2) }] };
    }
  );

  server.tool(
    'get_cliente_timeline',
    'Línea de tiempo consolidada de un cliente: actividades, citas y operaciones ordenadas por fecha.',
    {
      clienteId: z.string().describe('MongoDB ObjectId del cliente'),
      limit: z.number().optional().describe('Máximo eventos (1-50)'),
    },
    async ({ clienteId, limit }) => {
      const cli = await Cliente().findById(clienteId).select('nombre email telefono agenteId').lean();
      if (!cli) return { content: [{ type: 'text', text: 'Cliente no encontrado' }], isError: true };

      const max = safeLimit(limit);
      const [actividades, citas, operaciones] = await Promise.all([
        Activity().find({ clientId: String(clienteId) }).sort({ createdAt: -1 }).limit(max).lean(),
        Cita().find({ clienteId: String(clienteId) }).sort({ fecha: -1 }).limit(max).lean(),
        Operacion().find({ clienteId: String(clienteId) }).sort({ createdAt: -1 }).limit(max).lean(),
      ]);

      const events = [
        ...actividades.map((a) => ({ type: 'activity', date: a.createdAt, title: a.type || 'Actividad', data: a })),
        ...citas.map((c) => ({ type: 'cita', date: c.fecha || c.createdAt, title: c.titulo || c.tipo || 'Cita', data: c })),
        ...operaciones.map((o) => ({ type: 'operacion', date: o.createdAt, title: `${o.tipo || 'Operación'} ${o.estado || ''}`.trim(), data: o })),
      ]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, max);

      return { content: [{ type: 'text', text: JSON.stringify({ cliente: cli, count: events.length, events }, null, 2) }] };
    }
  );

  server.tool(
    'create_cliente',
    'Crea un nuevo cliente en el CRM.',
    {
      nombre: z.string().describe('Nombre completo (requerido)'),
      email: z.string().optional().describe('Email'),
      telefono: z.string().optional().describe('Teléfono'),
      direccion: z.string().optional().describe('Dirección'),
      notas: z.string().optional().describe('Notas'),
      agenteId: z.string().optional().describe('ID del agente asignado'),
    },
    async ({ nombre, email, telefono, direccion, notas, agenteId }) => {
      if (!nombre || !nombre.trim()) return { content: [{ type: 'text', text: 'nombre es requerido' }], isError: true };
      const doc = { nombre: nombre.trim(), email: email || '', telefono: telefono || '', direccion: direccion || '', notas: notas || '' };
      if (agenteId) doc.agenteId = agenteId;
      const created = await Cliente().create(doc);
      return persistedResult(Cliente(), created._id, 'cliente');
    }
  );

  server.tool(
    'update_cliente',
    'Actualiza campos de un cliente existente.',
    {
      clienteId: z.string().describe('ID del cliente'),
      nombre: z.string().optional().describe('Nuevo nombre'),
      email: z.string().optional().describe('Nuevo email'),
      telefono: z.string().optional().describe('Nuevo teléfono'),
      direccion: z.string().optional().describe('Nueva dirección'),
      notas: z.string().optional().describe('Nuevas notas'),
    },
    async ({ clienteId, nombre, email, telefono, direccion, notas }) => {
      const set = {};
      if (nombre !== undefined) set.nombre = nombre;
      if (email !== undefined) set.email = email;
      if (telefono !== undefined) set.telefono = telefono;
      if (direccion !== undefined) set.direccion = direccion;
      if (notas !== undefined) set.notas = notas;
      const updated = await Cliente().findByIdAndUpdate(clienteId, { $set: set }, { new: true, runValidators: true }).lean();
      if (!updated) return { content: [{ type: 'text', text: 'Cliente no encontrado' }], isError: true };
      return persistedResult(Cliente(), updated._id, 'cliente');
    }
  );

  server.tool(
    'update_cliente_fidelizado',
    'Marca o desmarca un cliente como fidelizado.',
    {
      clienteId: z.string().describe('ID del cliente'),
      fidelizado: z.boolean().describe('Estado de fidelización'),
    },
    async ({ clienteId, fidelizado }) => {
      const updated = await Cliente().findByIdAndUpdate(clienteId, { $set: { fidelizado } }, { new: true, runValidators: true }).lean();
      if (!updated) return { content: [{ type: 'text', text: 'Cliente no encontrado' }], isError: true };
      return persistedResult(Cliente(), updated._id, 'cliente');
    }
  );
}

module.exports = { registerClienteTools };
