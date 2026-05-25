/**
 * MCP Tools — Propiedades
 */

const { z } = require('zod');
const { getModel } = require('../db');

function registerPropiedadTools(server) {
  const Propiedad = () => getModel('Propiedad');
  const Cliente = () => getModel('Cliente');
  const Operacion = () => getModel('Operacion');
  const Cita = () => getModel('Cita');

  server.tool(
    'search_propiedades',
    'Busca propiedades con filtros: texto, estado, publicación, destacada, rango de precio.',
    {
      query: z.string().optional().describe('Texto libre (título, descripción, dirección)'),
      status: z.string().optional().describe('Disponible | Reservada | Vendida | Alquilada'),
      published: z.boolean().optional().describe('Solo publicadas'),
      featured: z.boolean().optional().describe('Solo destacadas'),
      minPrice: z.number().optional().describe('Precio mínimo'),
      maxPrice: z.number().optional().describe('Precio máximo'),
      agentId: z.string().optional().describe('Filtrar por agente'),
      limit: z.number().optional().describe('Máximo resultados (1-50)'),
    },
    async ({ query, status, published, featured, minPrice, maxPrice, agentId, limit }) => {
      const filter = {};
      if (agentId) filter.agentId = agentId;
      if (query && query.trim()) {
        const rx = new RegExp(query.trim(), 'i');
        filter.$or = [{ title: rx }, { description: rx }, { address: rx }];
      }
      if (status) filter.status = status;
      if (published !== undefined) filter.published = !!published;
      if (featured !== undefined) filter.featured = !!featured;
      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
      }
      const items = await Propiedad().find(filter)
        .select('title address price moneda status published featured agentId slug ownerId')
        .sort({ updatedAt: -1 })
        .limit(Math.min(Math.max(Number(limit) || 20, 1), 50))
        .lean();
      return { content: [{ type: 'text', text: JSON.stringify({ count: items.length, items }, null, 2) }] };
    }
  );

  server.tool(
    'get_propiedad_detail',
    'Detalle completo de una propiedad: datos + dueño + operaciones + citas asociadas.',
    {
      propiedadId: z.string().describe('MongoDB ObjectId de la propiedad'),
    },
    async ({ propiedadId }) => {
      const prop = await Propiedad().findById(propiedadId).lean();
      if (!prop) return { content: [{ type: 'text', text: 'Propiedad no encontrada' }], isError: true };

      let owner = null;
      if (prop.ownerId) {
        owner = await Cliente().findById(prop.ownerId).select('nombre email telefono').lean();
      }
      const [operaciones, citas] = await Promise.all([
        Operacion().find({ propiedadId: String(prop._id) }).sort({ createdAt: -1 }).limit(10).lean(),
        Cita().find({ propiedadId: String(prop._id) }).sort({ fecha: -1 }).limit(10).lean(),
      ]);

      return { content: [{ type: 'text', text: JSON.stringify({ propiedad: prop, owner, operaciones, citas }, null, 2) }] };
    }
  );

  server.tool(
    'update_propiedad',
    'Actualiza campos de una propiedad (título, descripción, precio, estado, publicación, destacada).',
    {
      propiedadId: z.string().describe('ID de la propiedad'),
      title: z.string().optional(),
      description: z.string().optional(),
      address: z.string().optional(),
      price: z.number().optional(),
      moneda: z.string().optional().describe('ARS o USD'),
      status: z.string().optional().describe('Disponible | Reservada | Vendida | Alquilada'),
      published: z.boolean().optional(),
      featured: z.boolean().optional(),
    },
    async ({ propiedadId, title, description, address, price, moneda, status, published, featured }) => {
      const set = {};
      if (title !== undefined) set.title = title;
      if (description !== undefined) set.description = description;
      if (address !== undefined) set.address = address;
      if (price !== undefined) set.price = price;
      if (moneda !== undefined) set.moneda = moneda;
      if (status !== undefined) set.status = status;
      if (published !== undefined) set.published = published;
      if (featured !== undefined) set.featured = featured;

      const updated = await Propiedad().findByIdAndUpdate(propiedadId, { $set: set }, { new: true }).lean();
      if (!updated) return { content: [{ type: 'text', text: 'Propiedad no encontrada' }], isError: true };
      return { content: [{ type: 'text', text: JSON.stringify(updated, null, 2) }] };
    }
  );
}

module.exports = { registerPropiedadTools };
