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
  const Activity = () => getModel('Activity');

  const safeLimit = (limit, fallback = 20) => Math.min(Math.max(Number(limit) || fallback, 1), 50);

  server.tool(
    'count_propiedades',
    'Cuenta propiedades con filtros por estado, publicación, destacada, agente y rango de precio.',
    {
      status: z.string().optional().describe('Disponible | Reservada | Vendida | Alquilada'),
      published: z.boolean().optional(),
      featured: z.boolean().optional(),
      agentId: z.string().optional().describe('Filtrar por agente'),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
    },
    async ({ status, published, featured, agentId, minPrice, maxPrice }) => {
      const filter = {};
      if (agentId) filter.agentId = agentId;
      if (status) filter.status = status;
      if (published !== undefined) filter.published = !!published;
      if (featured !== undefined) filter.featured = !!featured;
      if (minPrice || maxPrice) {
        filter.price = {};
        if (minPrice) filter.price.$gte = Number(minPrice);
        if (maxPrice) filter.price.$lte = Number(maxPrice);
      }
      const total = await Propiedad().countDocuments(filter).maxTimeMS(5000);
      return { content: [{ type: 'text', text: JSON.stringify({ total, filter }, null, 2) }] };
    }
  );

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
        .select('title address price moneda status published featured agentId slug ownerId createdAt updatedAt metadata')
        .sort({ updatedAt: -1 })
        .limit(safeLimit(limit))
        .maxTimeMS(5000)
        .lean();
      return { content: [{ type: 'text', text: JSON.stringify({ count: items.length, items }, null, 2) }] };
    }
  );

  server.tool(
    'list_propiedades_por_estado',
    'Lista propiedades agrupables por estado. Útil para "disponibles", "vendidas", "reservadas" o "alquiladas".',
    {
      status: z.string().optional().describe('Disponible | Reservada | Vendida | Alquilada'),
      agentId: z.string().optional().describe('Filtrar por agente'),
      published: z.boolean().optional(),
      limit: z.number().optional(),
    },
    async ({ status, agentId, published, limit }) => {
      const filter = {};
      if (status) filter.status = status;
      if (agentId) filter.agentId = agentId;
      if (published !== undefined) filter.published = !!published;
      const items = await Propiedad().find(filter)
        .select('title address price moneda status published featured agentId slug ownerId createdAt updatedAt')
        .sort({ status: 1, updatedAt: -1 })
        .limit(safeLimit(limit))
        .maxTimeMS(5000)
        .lean();
      const totals = await Propiedad().aggregate([
        { $match: agentId ? { agentId } : {} },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]);
      return { content: [{ type: 'text', text: JSON.stringify({ count: items.length, totals, items }, null, 2) }] };
    }
  );

  server.tool(
    'list_propiedades_incompletas',
    'Detecta propiedades con datos comerciales incompletos: sin precio, dirección, descripción, dueño o fotos en metadata.',
    {
      agentId: z.string().optional().describe('Filtrar por agente'),
      limit: z.number().optional(),
    },
    async ({ agentId, limit }) => {
      const filter = {
        ...(agentId ? { agentId } : {}),
        $or: [
          { price: { $lte: 0 } },
          { address: { $in: ['', null] } },
          { description: { $in: ['', null] } },
          { ownerId: { $in: ['', null] } },
          {
            $and: [
              { 'metadata.images.0': { $exists: false } },
              { 'metadata.imageUrls.0': { $exists: false } },
            ],
          },
        ],
      };
      const items = await Propiedad().find(filter)
        .select('title address price moneda status published agentId ownerId metadata createdAt updatedAt')
        .sort({ updatedAt: -1 })
        .limit(safeLimit(limit))
        .maxTimeMS(5000)
        .lean();
      const annotated = items.map((p) => ({
        ...p,
        missing: [
          !p.price || p.price <= 0 ? 'price' : null,
          !p.address ? 'address' : null,
          !p.description ? 'description' : null,
          !p.ownerId ? 'ownerId' : null,
          !(Array.isArray(p.metadata?.images) && p.metadata.images.length) && !(Array.isArray(p.metadata?.imageUrls) && p.metadata.imageUrls.length) ? 'images' : null,
        ].filter(Boolean),
      }));
      return { content: [{ type: 'text', text: JSON.stringify({ count: annotated.length, items: annotated }, null, 2) }] };
    }
  );

  server.tool(
    'list_propiedades_estancadas',
    'Lista propiedades disponibles sin actividad, cita ni actualización reciente.',
    {
      agentId: z.string().optional(),
      days: z.number().optional().describe('Días sin movimiento (default 30)'),
      limit: z.number().optional(),
    },
    async ({ agentId, days, limit }) => {
      const cutoff = new Date(Date.now() - (Number(days) || 30) * 86400000);
      const filter = {
        status: 'Disponible',
        updatedAt: { $lt: cutoff },
        ...(agentId ? { agentId } : {}),
      };
      const props = await Propiedad().find(filter)
        .select('title address price moneda status published agentId ownerId updatedAt createdAt')
        .sort({ updatedAt: 1 })
        .limit(safeLimit(limit))
        .maxTimeMS(5000)
        .lean();
      const ids = props.map((p) => String(p._id));
      const [activityAgg, citaAgg] = await Promise.all([
        Activity().aggregate([
          { $match: { propertyId: { $in: ids } } },
          { $group: { _id: '$propertyId', lastActivityAt: { $max: '$createdAt' }, activityCount: { $sum: 1 } } },
        ]),
        Cita().aggregate([
          { $match: { propiedadId: { $in: ids } } },
          { $group: { _id: '$propiedadId', lastCitaAt: { $max: '$fecha' }, citaCount: { $sum: 1 } } },
        ]),
      ]);
      const activityByProp = new Map(activityAgg.map((a) => [String(a._id), a]));
      const citaByProp = new Map(citaAgg.map((c) => [String(c._id), c]));
      const items = props.map((p) => ({
        ...p,
        lastActivityAt: activityByProp.get(String(p._id))?.lastActivityAt || null,
        activityCount: activityByProp.get(String(p._id))?.activityCount || 0,
        lastCitaAt: citaByProp.get(String(p._id))?.lastCitaAt || null,
        citaCount: citaByProp.get(String(p._id))?.citaCount || 0,
        daysSinceUpdate: Math.floor((Date.now() - new Date(p.updatedAt || p.createdAt).getTime()) / 86400000),
      }));
      return { content: [{ type: 'text', text: JSON.stringify({ count: items.length, cutoff: cutoff.toISOString(), items }, null, 2) }] };
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

  server.tool(
    'publish_propiedad',
    'Publica o despublica una propiedad.',
    {
      propiedadId: z.string().describe('ID de la propiedad'),
      published: z.boolean().describe('true para publicar, false para despublicar'),
    },
    async ({ propiedadId, published }) => {
      const updated = await Propiedad().findByIdAndUpdate(propiedadId, { $set: { published } }, { new: true }).lean();
      if (!updated) return { content: [{ type: 'text', text: 'Propiedad no encontrada' }], isError: true };
      return { content: [{ type: 'text', text: JSON.stringify(updated, null, 2) }] };
    }
  );
}

module.exports = { registerPropiedadTools };
