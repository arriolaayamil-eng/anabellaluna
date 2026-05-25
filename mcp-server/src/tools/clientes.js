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
        .sort({ updatedAt: -1 })
        .limit(Math.min(Math.max(Number(limit) || 20, 1), 50))
        .lean();
      return { content: [{ type: 'text', text: JSON.stringify({ count: items.length, items }, null, 2) }] };
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
      return { content: [{ type: 'text', text: JSON.stringify(created.toObject(), null, 2) }] };
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
      const updated = await Cliente().findByIdAndUpdate(clienteId, { $set: set }, { new: true }).lean();
      if (!updated) return { content: [{ type: 'text', text: 'Cliente no encontrado' }], isError: true };
      return { content: [{ type: 'text', text: JSON.stringify(updated, null, 2) }] };
    }
  );
}

module.exports = { registerClienteTools };
