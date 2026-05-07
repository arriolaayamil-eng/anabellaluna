const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');

const { authenticateToken } = require('../auth');
const Propiedad = require('../models/Propiedad');
const Agente = require('../models/Agente');
const PropertyView = require('../models/PropertyView');
const DocumentLink = require('../models/DocumentLink');
const Document = require('../models/Document');
const Cart = require('../models/Cart');
const WishlistItem = require('../models/WishlistItem');
const BookingRequest = require('../models/BookingRequest');
const Cliente = require('../models/Cliente');
const Activity = require('../models/Activity');
const BlogCategory = require('../models/BlogCategory');
const BlogPost = require('../models/BlogPost');
const minio = require('../minio');
const Cita = require('../models/Cita');
const googleCalendar = require('../services/googleCalendar');
const { sendNotification, sendToRole } = require('../services/pushService');
const Testimonial = require('../models/Testimonial');
const ContactMessage = require('../models/ContactMessage');
const User = require('../models/User');
const FAQ = require('../models/FAQ');
const GlobalConfig = require('../models/GlobalConfig');
const { triggerFollowUpAutomation } = require('../services/automationScheduler');
const { getOGImageBuffer } = require('../services/ogImage');

const router = express.Router();

function isObjectId(value) {
  return mongoose.Types.ObjectId.isValid(String(value || ''));
}

function toObjectId(value) {
  if (!isObjectId(value)) return null;
  return new mongoose.Types.ObjectId(String(value));
}

function mapOperation(metaOperacion) {
  const op = String(metaOperacion || '').toLowerCase();
  if (op.includes('alquil')) return 'rent';
  if (op.includes('rent')) return 'rent';
  if (op.includes('venta')) return 'buy';
  if (op.includes('buy')) return 'buy';
  return '';
}

function safeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function buildMediaUrlFromDoc(doc) {
  if (!doc) return '';
  if (doc.object_key) return `/public/media/${doc._id}`;
  const url = String(doc.url || '');
  if (url.startsWith('http')) return url;
  return '';
}

// When a property has no agentId (created from ERP/admin), build a virtual
// agent object from the admin user profile so the public site can display it.
let _adminAgentCache = null;
let _adminAgentCacheTs = 0;
const ADMIN_CACHE_TTL = 60_000; // 1 min

async function getAdminFallbackAgent() {
  const now = Date.now();
  if (_adminAgentCache && now - _adminAgentCacheTs < ADMIN_CACHE_TTL) return _adminAgentCache;

  // 1. Try admin user → linked Agente record
  const adminUser = await User.findOne({ role: 'admin' }).lean();
  if (adminUser && adminUser.agenteId) {
    const agente = await Agente.findById(adminUser.agenteId).lean();
    if (agente) { _adminAgentCache = agente; _adminAgentCacheTs = now; return agente; }
  }

  // 2. Try Agente with role 'admin'
  const adminAgente = await Agente.findOne({ role: 'admin' }).lean();
  if (adminAgente) { _adminAgentCache = adminAgente; _adminAgentCacheTs = now; return adminAgente; }

  // 3. Build virtual agent from admin user profile fields
  if (adminUser) {
    const virtual = {
      _id: adminUser._id,
      nombre: adminUser.nombre || adminUser.username || '',
      email: adminUser.email || '',
      telefono: adminUser.telefono || '',
      avatar: adminUser.avatar || '',
      cargo: adminUser.cargo || 'Director',
      bio: adminUser.bio || '',
      especialidad: '',
      redesSociales: {},
      metadata: {},
    };
    _adminAgentCache = virtual;
    _adminAgentCacheTs = now;
    return virtual;
  }

  return null;
}

function mapPropertyCard(prop, agent, coverUrl) {
  const meta = prop && prop.metadata ? prop.metadata : {};
  return {
    id: String(prop._id),
    slug: prop.slug || String(prop._id),
    title: prop.title || meta.titulo || '',
    type: meta.tipo || '',
    operation: mapOperation(meta.operacion),
    featured: !!(prop.featured != null ? prop.featured : meta.featured),
    category: meta.categoria || '',
    propertyCode: meta.idPropiedad || '',
    offerPrice: meta.precioOferta != null && String(meta.precioOferta) !== '' ? safeNumber(meta.precioOferta) : undefined,
    pricePerM2: meta.precioPorM2 != null && String(meta.precioPorM2) !== '' ? safeNumber(meta.precioPorM2) : undefined,
    structureType: meta.tipoEstructura || '',
    extraFeatures: {
      balcony: meta.balcon || '',
      floor: meta.piso || '',
      wardrobe: meta.armario || '',
      tv: meta.tv || '',
      waterPurifier: meta.purificadorAgua || '',
      microwave: meta.microondas || '',
      ac: meta.aireAcondicionado || '',
      fridge: meta.refrigerador || '',
      curtains: meta.cortinas || '',
      garageSize: meta.tamanoGaraje || '',
      availableFrom: meta.disponibleDesde || '',
      yearBuilt: meta.anioConstruccion || '',
      heating: meta.tipoCalefaccion || '',
      hotWater: meta.tipoAguaCaliente || '',
      stove: meta.tipoCocina || '',
    },
    price: {
      amount: typeof prop.price === 'number' ? prop.price : safeNumber(meta.precio),
      currency: prop.moneda || meta.moneda || 'ARS',
      unit: mapOperation(meta.operacion) === 'rent' ? (meta.unit || 'month') : undefined,
    },
    location: {
      addressLine: prop.address || meta.direccion || '',
      neighborhood: meta.barrio || '',
      city: meta.ciudad || '',
      province: meta.provincia || '',
      postalCode: meta.codigoPostal || '',
      country: meta.pais || meta.country || 'AR',
      lat: meta.lat != null ? Number(meta.lat) : null,
      lng: meta.lng != null ? Number(meta.lng) : null,
    },
    media: {
      coverUrl: coverUrl || meta.coverUrl || meta.cover_url || '',
    },
    features: {
      beds: safeNumber(meta.dormitorios),
      baths: safeNumber(meta.baños),
      areaSqFt: safeNumber(meta.m2Totales || meta.m2),
      coveredAreaSqFt: safeNumber(meta.m2Cubiertos),
      rooms: safeNumber(meta.ambientes),
      parking: safeNumber(meta.cocheras),
      parkingType: meta.tipoCochera || '',
    },
    agent: agent
      ? {
        id: String(agent._id),
        name: agent.nombre || '',
        avatarUrl: agent.avatar || (agent.metadata && (agent.metadata.avatarUrl || agent.metadata.avatar_url)) || '',
        email: agent.email || '',
        phone: agent.telefono || '',
        cargo: agent.cargo || '',
        bio: agent.bio || '',
        especialidad: agent.especialidad || '',
        redesSociales: agent.redesSociales || {},
      }
      : { id: '', name: '', avatarUrl: '' },
  };
}

async function getPropertyCoverMap(propertyIds) {
  const ids = (Array.isArray(propertyIds) ? propertyIds : []).map((id) => String(id));
  if (!ids.length) return new Map();

  const links = await DocumentLink.find({ entity_type: 'propiedad', entity_id: { $in: ids } })
    .sort({ order: 1, created_at: 1 })
    .populate('document', '_id url object_key bucket tipo categoria')
    .lean();

  const map = new Map();
  const firstImage = new Map();
  const firstPhoto = new Map();
  for (const link of links) {
    const entityId = String(link.entity_id || '');
    if (!entityId) continue;

    const doc = link.document;
    const isImage = doc && String(doc.tipo || '').toLowerCase() === 'imagen';
    if (!isImage) continue;

    const url = buildMediaUrlFromDoc(doc);
    if (!url) continue;

    if (!firstImage.has(entityId)) firstImage.set(entityId, url);

    const cat = String(doc.categoria || '');
    if (/propiedad\s*-\s*fotos/i.test(cat) && !firstPhoto.has(entityId)) {
      firstPhoto.set(entityId, url);
    }
  }

  for (const id of ids) {
    const entityId = String(id);
    const url = firstPhoto.get(entityId) || firstImage.get(entityId) || '';
    if (url) map.set(entityId, url);
  }
  return map;
}

async function findPropertyByIdOrSlug({ propertyId, propertySlug }) {
  if (propertyId && isObjectId(propertyId)) {
    return Propiedad.findById(propertyId).lean();
  }
  if (propertySlug) {
    const slug = String(propertySlug);
    const found = await Propiedad.findOne({ slug }).lean();
    if (found) return found;
    if (isObjectId(slug)) return Propiedad.findById(slug).lean();
    return null;
  }
  return null;
}

async function findOrCreateClienteForAgent(agentId, contact) {
  const fullName = contact && contact.fullName ? String(contact.fullName).trim() : '';
  const email = contact && contact.email ? String(contact.email).trim() : '';
  const phone = contact && contact.phone ? String(contact.phone).trim() : '';

  if (!agentId) return null;

  const base = {
    nombre: fullName || email || phone || 'Cliente',
    email,
    telefono: phone,
    direccion: '',
    agenteId: String(agentId),
    notas: '',
    metadata: {
      source: 'web',
    },
  };

  if (email) {
    const existing = await Cliente.findOne({ agenteId: String(agentId), email }).lean();
    if (existing) {
      if (phone && phone !== existing.telefono) {
        return Cliente.findByIdAndUpdate(existing._id, { $set: { telefono: phone } }, { new: true }).lean();
      }
      return existing;
    }
    const created = await Cliente.create(base);
    return created.toObject ? created.toObject() : created;
  }

  if (phone) {
    const existing = await Cliente.findOne({ agenteId: String(agentId), telefono: phone }).lean();
    if (existing) return existing;
    const created = await Cliente.create(base);
    return created.toObject ? created.toObject() : created;
  }

  const created = await Cliente.create(base);
  return created.toObject ? created.toObject() : created;
}

function ensureVisitorId(req) {
  const headerVid = req && req.headers ? (req.headers['x-visitor-id'] || req.headers['x-visitorid']) : undefined;
  const fromHeader = String(headerVid || '').trim();
  if (fromHeader) return fromHeader;

  const forwarded = req && req.headers ? String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() : '';
  const ip = forwarded || (req && (req.ip || req.connection?.remoteAddress)) || '';
  const ua = req && req.headers ? String(req.headers['user-agent'] || '') : '';
  const raw = `${ip}|${ua}`;
  return crypto.createHash('sha1').update(raw).digest('hex');
}

// Public media: returns a redirect to a presigned MinIO URL (or original URL)
router.get('/media/:id', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: 'Not found' });

    if (doc.object_key) {
      if (!minio.isConfigured()) return res.status(503).json({ error: 'MinIO is not configured' });
      const bucket = doc.bucket || minio.bucket;
      try {
        const stat = await minio.statObject(bucket, doc.object_key);
        const ct = (stat.metaData && stat.metaData['content-type']) || doc.mimetype || 'application/octet-stream';
        res.set('Content-Type', ct);
        if (stat.size) res.set('Content-Length', String(stat.size));
        res.set('Cache-Control', 'public, max-age=3600');
        const stream = await minio.getObject(bucket, doc.object_key);
        return stream.pipe(res);
      } catch (streamErr) {
        return res.status(500).json({ error: streamErr.message });
      }
    }

    const url = String(doc.url || '');
    if (url.startsWith('http')) return res.redirect(url);

    return res.status(404).json({ error: 'Media not available' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Stats
router.get('/stats', async (req, res) => {
  try {
    const [propertyCount, agentCount] = await Promise.all([
      Propiedad.countDocuments({}),
      Agente.countDocuments({}),
    ]);

    // Count by operation
    const salesCount = await Propiedad.countDocuments({ 'metadata.operacion': { $regex: 'venta', $options: 'i' } });
    const rentalCount = await Propiedad.countDocuments({ 'metadata.operacion': { $regex: 'alquil', $options: 'i' } });

    return res.json({
      properties: propertyCount,
      agents: agentCount,
      sales: salesCount,
      rentals: rentalCount,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Property stats (cities and types aggregation)
router.get('/property-stats', async (req, res) => {
  try {
    const [citiesAgg, typesAgg] = await Promise.all([
      Propiedad.aggregate([
        { $match: { 'metadata.ciudad': { $exists: true, $ne: '' } } },
        { $group: { _id: '$metadata.ciudad', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
      Propiedad.aggregate([
        { $match: { 'metadata.tipo': { $exists: true, $ne: '' } } },
        { $group: { _id: '$metadata.tipo', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
    ]);

    return res.json({
      cities: citiesAgg.map((c) => ({ name: c._id, count: c.count })),
      types: typesAgg.map((t) => ({ name: t._id, count: t.count })),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Agents
router.get('/agents', async (req, res) => {
  try {
    const agents = await Agente.find({}).sort({ nombre: 1 }).lean();

    // Count properties per agent
    const agentIds = agents.map((a) => String(a._id));
    const propCounts = await Propiedad.aggregate([
      { $match: { agentId: { $in: agentIds } } },
      { $group: { _id: '$agentId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(propCounts.map((r) => [String(r._id), r.count]));

    const items = agents.map((a) => ({
      id: String(a._id),
      name: a.nombre || '',
      email: a.email || '',
      phone: a.telefono || '',
      cargo: a.cargo || '',
      bio: a.bio || '',
      especialidad: a.especialidad || '',
      avatarUrl: a.avatar || (a.metadata && (a.metadata.avatarUrl || a.metadata.avatar_url)) || '',
      redesSociales: a.redesSociales || {},
      propertyCount: countMap.get(String(a._id)) || 0,
    }));

    return res.json({ items });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/agents/:id', async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!id || !isObjectId(id)) return res.status(400).json({ error: 'invalid agent id' });

    const agent = await Agente.findById(id).lean();
    if (!agent) return res.status(404).json({ error: 'agent not found' });

    // Get agent's properties
    const props = await Propiedad.find({ agentId: String(agent._id), published: { $ne: false } }).sort({ updatedAt: -1 }).limit(50).lean();
    const coverMap = await getPropertyCoverMap(props.map((p) => p._id));

    const properties = props.map((p) => {
      const coverUrl = coverMap.get(String(p._id)) || '';
      return mapPropertyCard(p, agent, coverUrl);
    });

    return res.json({
      agent: {
        id: String(agent._id),
        name: agent.nombre || '',
        email: agent.email || '',
        phone: agent.telefono || '',
        cargo: agent.cargo || '',
        bio: agent.bio || '',
        especialidad: agent.especialidad || '',
        avatarUrl: agent.avatar || (agent.metadata && (agent.metadata.avatarUrl || agent.metadata.avatar_url)) || '',
        redesSociales: agent.redesSociales || {},
        propertyCount: properties.length,
      },
      properties,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Properties
router.get('/properties', async (req, res) => {
  try {
    const { operation, city, beds, baths, minPrice, maxPrice, type, search, sort, featured } = req.query;
    const op = String(operation || '').toLowerCase();

    const filter = {};
    if (op === 'rent') filter['metadata.operacion'] = { $regex: 'alquil', $options: 'i' };
    if (op === 'buy') filter['metadata.operacion'] = { $regex: 'venta', $options: 'i' };

    if (city) filter['metadata.ciudad'] = { $regex: String(city), $options: 'i' };
    if (beds) filter['metadata.dormitorios'] = { $gte: safeNumber(beds) };
    if (baths) filter['metadata.baños'] = { $gte: safeNumber(baths) };
    if (type) filter['metadata.tipo'] = { $regex: String(type), $options: 'i' };

    if (minPrice || maxPrice) {
      const priceFilter = {};
      if (minPrice) priceFilter.$gte = safeNumber(minPrice);
      if (maxPrice) priceFilter.$lte = safeNumber(maxPrice);
      filter.$or = [
        { price: priceFilter },
        { 'metadata.precio': priceFilter },
      ];
    }

    if (search) {
      const s = String(search);
      filter.$or = [
        ...(filter.$or || []),
        { title: { $regex: s, $options: 'i' } },
        { 'metadata.titulo': { $regex: s, $options: 'i' } },
        { address: { $regex: s, $options: 'i' } },
        { 'metadata.direccion': { $regex: s, $options: 'i' } },
        { 'metadata.ciudad': { $regex: s, $options: 'i' } },
        { 'metadata.barrio': { $regex: s, $options: 'i' } },
      ];
    }

    filter.published = { $ne: false };
    if (featured === 'true' || featured === '1') {
      filter['metadata.destacado'] = true;
    }
    let sortObj = { updatedAt: -1 };
    if (sort === 'price_asc') sortObj = { 'metadata.precio': 1, price: 1 };
    else if (sort === 'price_desc') sortObj = { 'metadata.precio': -1, price: -1 };
    const props = await Propiedad.find(filter).sort(sortObj).limit(200).lean();

    const agentIds = Array.from(new Set(props.map((p) => String(p.agentId || '')).filter(Boolean)));
    const agents = agentIds.length ? await Agente.find({ _id: { $in: agentIds } }).lean() : [];
    const agentsById = new Map(agents.map((a) => [String(a._id), a]));

    const coverMap = await getPropertyCoverMap(props.map((p) => p._id));

    // Fallback agent for ERP-created properties (no agentId)
    const adminFallback = agentIds.length < props.length ? await getAdminFallbackAgent() : null;

    const items = props.map((p) => {
      const agent = p.agentId ? agentsById.get(String(p.agentId)) || null : null;
      const coverUrl = coverMap.get(String(p._id)) || '';
      return mapPropertyCard(p, agent || adminFallback, coverUrl);
    });

    return res.json({ items });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/properties/:slug', async (req, res) => {
  try {
    const slug = String(req.params.slug || '').trim();
    if (!slug) return res.status(400).json({ error: 'slug required' });

    let prop = await Propiedad.findOne({ slug }).lean();
    if (!prop && isObjectId(slug)) {
      prop = await Propiedad.findById(slug).lean();
    }
    if (!prop) return res.status(404).json({ error: 'Not found' });

    // Enforce published gate: allow if published, or if valid private token provided
    if (prop.published === false) {
      const token = String(req.query.token || '').trim();
      if (!token || !prop.privateToken || token !== prop.privateToken) {
        return res.status(404).json({ error: 'Not found' });
      }
    }

     const visitorId = ensureVisitorId(req);
     const propertyId = String(prop._id);
     await PropertyView.updateOne(
       { propertyId, visitorId },
       { $setOnInsert: { propertyId, visitorId } },
       { upsert: true }
     );
     const visitCount = await PropertyView.countDocuments({ propertyId });
     const totalVisitors = (await PropertyView.distinct('visitorId')).length;
     const trending = totalVisitors > 0 ? (visitCount / totalVisitors) > 0.1 : false;

    let agent = prop.agentId ? await Agente.findById(prop.agentId).lean() : null;
    if (!agent) agent = await getAdminFallbackAgent();

    const links = await DocumentLink.find({ entity_type: 'propiedad', entity_id: String(prop._id) })
      .sort({ order: 1, created_at: 1 })
      .populate('document', '_id url object_key bucket tipo categoria')
      .lean();

    const photoUrls = [];
    const anyImageUrls = [];
    for (const l of links) {
      const doc = l.document;
      const isImage = doc && String(doc.tipo || '').toLowerCase() === 'imagen';
      if (!isImage) continue;
      const url = buildMediaUrlFromDoc(doc);
      if (!url) continue;
      anyImageUrls.push(url);
      const cat = String(doc.categoria || '');
      if (/propiedad\s*-\s*fotos/i.test(cat)) {
        photoUrls.push(url);
      }
    }

    const galleryUrls = photoUrls.length ? photoUrls : anyImageUrls;

    const floorPlanUrls = [];
    for (const l of links) {
      const doc = l.document;
      const cat = doc ? String(doc.categoria || '') : '';
      if (!/propiedad\s*-\s*planos/i.test(cat)) continue;
      const url = buildMediaUrlFromDoc(doc);
      if (url) floorPlanUrls.push(url);
    }

    let coverUrl = '';
    for (const l of links) {
      const doc = l.document;
      const isImage = doc && String(doc.tipo || '').toLowerCase() === 'imagen';
      if (!isImage) continue;
      const cat = String(doc.categoria || '');
      if (!/propiedad\s*-\s*fotos/i.test(cat)) continue;
      const url = buildMediaUrlFromDoc(doc);
      if (url) {
        coverUrl = url;
        break;
      }
    }
    if (!coverUrl) coverUrl = galleryUrls[0] || '';

    const item = {
      ...mapPropertyCard(prop, agent, coverUrl),
      description: prop.description || (prop.metadata && prop.metadata.descripcion) || '',
      amenities: (prop.metadata && Array.isArray(prop.metadata.amenities) ? prop.metadata.amenities : []),
      status: prop.status || (prop.metadata && prop.metadata.estado) || '',
      ageYears:
        prop.metadata && prop.metadata.antiguedad != null && String(prop.metadata.antiguedad) !== ''
          ? safeNumber(prop.metadata.antiguedad)
          : undefined,
      trending,
      visitCount,
      galleryUrls,
      floorPlanUrls,
      videoUrls: (() => {
        const meta = prop && prop.metadata ? prop.metadata : {};
        const urls = Array.isArray(meta.videoUrls)
          ? meta.videoUrls
          : meta.videoUrl
            ? [meta.videoUrl]
            : [];
        return urls.filter(Boolean);
      })(),
      funnelSettings: (prop.metadata && prop.metadata.funnelSettings) || null,
    };

    return res.json({ item });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/enquiries', async (req, res) => {
  try {
    const { propertyId, propertySlug, fullName, email, phone, message } = req.body || {};

    const prop = await findPropertyByIdOrSlug({ propertyId, propertySlug });
    if (!prop) return res.status(404).json({ error: 'Property not found' });

    let agentId = prop.agentId ? String(prop.agentId) : '';
    if (!agentId) {
      const fallback = await getAdminFallbackAgent();
      if (fallback) agentId = String(fallback._id);
    }
    if (!agentId) return res.status(400).json({ error: 'Property has no agent assigned' });
    const contact = {
      fullName: String(fullName || '').trim(),
      email: String(email || '').trim(),
      phone: String(phone || '').trim(),
    };

    if (!contact.fullName) return res.status(400).json({ error: 'fullName required' });
    if (!contact.email && !contact.phone) return res.status(400).json({ error: 'email or phone required' });

    const cliente = await findOrCreateClienteForAgent(agentId, contact);

    const clientId = cliente ? String(cliente._id) : '';
    const isFirstActivity =
      agentId && clientId ? !(await Activity.exists({ agenteId: agentId, clientId })) : false;

    const enquiry = await Activity.create({
      agenteId: agentId,
      clientId,
      propertyId: String(prop._id),
      type: 'enquiry',
      notes: String(message || ''),
      metadata: {
        kind: 'request_info',
        source: 'web',
        contact,
        property: {
          id: String(prop._id),
          slug: prop.slug || String(prop._id),
          title: prop.title || (prop.metadata && prop.metadata.titulo) || '',
        },
      },
    });

    if (agentId && clientId) {
      const ts = enquiry && enquiry.createdAt ? new Date(enquiry.createdAt) : new Date();
      await Cliente.updateOne(
        { _id: clientId, agenteId: agentId },
        { $set: { 'metadata.ultimaActividad': ts } },
        { runValidators: true }
      );

      if (isFirstActivity) {
        triggerFollowUpAutomation(cliente, agentId).catch(console.error);
      }
    }

    // Push notification to agent
    const propTitle = prop.title || (prop.metadata && prop.metadata.titulo) || 'una propiedad';
    sendNotification(agentId, {
      title: 'Nueva consulta',
      body: `${contact.fullName} consultó por ${propTitle}`,
      url: '/crm/clientes',
    }).catch(() => {});
    sendToRole('admin', {
      title: 'Nueva consulta web',
      body: `${contact.fullName} consultó por ${propTitle}`,
      url: '/clientes',
    }).catch(() => {});

    return res.status(201).json({ ok: true, enquiry });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/visits', async (req, res) => {
  try {
    const { propertyId, propertySlug, fullName, email, phone, message, start, end } = req.body || {};

    const prop = await findPropertyByIdOrSlug({ propertyId, propertySlug });
    if (!prop) return res.status(404).json({ error: 'Property not found' });

    let agentId = prop.agentId ? String(prop.agentId) : '';
    if (!agentId) {
      const fallback = await getAdminFallbackAgent();
      if (fallback) agentId = String(fallback._id);
    }
    if (!agentId) return res.status(400).json({ error: 'Property has no agent assigned' });
    const contact = {
      fullName: String(fullName || '').trim(),
      email: String(email || '').trim(),
      phone: String(phone || '').trim(),
    };

    if (!contact.fullName) return res.status(400).json({ error: 'fullName required' });
    if (!contact.email && !contact.phone) return res.status(400).json({ error: 'email or phone required' });
    if (!start) return res.status(400).json({ error: 'start required' });

    const startDate = new Date(start);
    if (Number.isNaN(startDate.getTime())) return res.status(400).json({ error: 'invalid start' });
    const endDate = end ? new Date(end) : new Date(startDate.getTime() + 60 * 60 * 1000);
    if (Number.isNaN(endDate.getTime())) return res.status(400).json({ error: 'invalid end' });

    const cliente = await findOrCreateClienteForAgent(agentId, contact);
    const clientId = cliente ? String(cliente._id) : '';
    const isFirstActivity =
      agentId && clientId ? !(await Activity.exists({ agenteId: agentId, clientId })) : false;
    const titulo = `Visita - ${prop.title || (prop.metadata && prop.metadata.titulo) || ''}`.trim() || 'Visita';

    const created = await Cita.create({
      fecha: startDate,
      fechaFin: endDate,
      titulo,
      tipo: 'Visita',
      ubicacion: prop.address || (prop.metadata && prop.metadata.direccion) || '',
      clienteId: clientId,
      agenteId: agentId,
      propiedadId: String(prop._id),
      notas: String(message || ''),
      estado: 'Programada',
      metadata: {
        source: 'web',
        contact,
      },
    });

    let cita = created.toObject ? created.toObject() : created;

    if (agentId) {
      const agent = await Agente.findById(agentId).lean();
      const gc = agent && agent.metadata ? (agent.metadata.googleCalendar || {}) : {};
      if (gc && gc.refreshToken) {
        try {
          const description = [
            `Cliente: ${contact.fullName}`,
            contact.email ? `Email: ${contact.email}` : '',
            contact.phone ? `Tel: ${contact.phone}` : '',
            '',
            `Propiedad: ${prop.title || (prop.metadata && prop.metadata.titulo) || ''}`,
            `Link: ${prop.slug ? `${req.protocol}://${req.get('host')}/public/properties/${encodeURIComponent(prop.slug)}` : ''}`,
            '',
            String(message || ''),
          ].filter(Boolean).join('\n');

          const ev = await googleCalendar.createCalendarEvent({
            refreshToken: gc.refreshToken,
            calendarId: gc.calendarId || 'primary',
            summary: titulo,
            description,
            start: startDate,
            end: endDate,
          });

          const nextMeta = { ...(cita.metadata || {}) };
          nextMeta.googleCalendar = {
            eventId: ev && ev.id ? String(ev.id) : '',
            htmlLink: ev && ev.htmlLink ? String(ev.htmlLink) : '',
          };
          cita = await Cita.findByIdAndUpdate(
            cita._id,
            { $set: { metadata: nextMeta } },
            { new: true }
          ).lean();
        } catch (e) {
        }
      }
    }

    const visitActivity = await Activity.create({
      agenteId: agentId,
      clientId,
      propertyId: String(prop._id),
      type: 'visit_scheduled',
      notes: String(message || ''),
      metadata: {
        source: 'web',
        citaId: cita && cita._id ? String(cita._id) : '',
        contact,
        property: {
          id: String(prop._id),
          slug: prop.slug || String(prop._id),
          title: prop.title || (prop.metadata && prop.metadata.titulo) || '',
        },
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
    });

    if (agentId && clientId) {
      const ts = visitActivity && visitActivity.createdAt ? new Date(visitActivity.createdAt) : new Date();
      await Cliente.updateOne(
        { _id: clientId, agenteId: agentId },
        { $set: { 'metadata.ultimaActividad': ts } },
        { runValidators: true }
      );

      if (isFirstActivity) {
        triggerFollowUpAutomation(cliente, agentId).catch(console.error);
      }
    }

    // Push notification to agent
    const visitPropTitle = prop.title || (prop.metadata && prop.metadata.titulo) || 'una propiedad';
    sendNotification(agentId, {
      title: 'Nueva visita agendada',
      body: `${contact.fullName} agendó visita a ${visitPropTitle}`,
      url: '/crm/citas',
    }).catch(() => {});
    sendToRole('admin', {
      title: 'Nueva visita web',
      body: `${contact.fullName} agendó visita a ${visitPropTitle}`,
      url: '/citas',
    }).catch(() => {});

    return res.status(201).json({ ok: true, cita, activity: visitActivity });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/wishlist', authenticateToken, async (req, res) => {
  try {
    const userId = toObjectId(req.user && req.user.sub);
    if (!userId) return res.status(401).json({ error: 'invalid token payload' });

    const items = await WishlistItem.find({ userId }).sort({ createdAt: -1 }).lean();
    return res.json({ items });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/wishlist', authenticateToken, async (req, res) => {
  try {
    const userId = toObjectId(req.user && req.user.sub);
    if (!userId) return res.status(401).json({ error: 'invalid token payload' });

    const { propertyId, propertySlug } = req.body || {};

    let prop = null;
    if (propertyId && isObjectId(propertyId)) {
      prop = await Propiedad.findById(propertyId).lean();
    } else if (propertySlug) {
      prop = await Propiedad.findOne({ slug: String(propertySlug) }).lean();
    }
    if (!prop) return res.status(404).json({ error: 'Property not found' });

    let agent = prop.agentId ? await Agente.findById(prop.agentId).lean() : null;
    if (!agent) agent = await getAdminFallbackAgent();
    const coverMap = await getPropertyCoverMap([prop._id]);
    const snapshot = mapPropertyCard(prop, agent, coverMap.get(String(prop._id)) || '');

    const created = await WishlistItem.findOneAndUpdate(
      { userId, propertyId: prop._id },
      { $setOnInsert: { userId, propertyId: prop._id, snapshot } },
      { new: true, upsert: true }
    ).lean();

    return res.status(201).json({ item: created });
  } catch (err) {
    const code = err && (err.code || err.Code);
    if (code === 11000) return res.status(409).json({ error: 'already exists' });
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/wishlist/:id', authenticateToken, async (req, res) => {
  try {
    const userId = toObjectId(req.user && req.user.sub);
    if (!userId) return res.status(401).json({ error: 'invalid token payload' });

    const deleted = await WishlistItem.findOneAndDelete({ _id: req.params.id, userId }).lean();
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/cart', authenticateToken, async (req, res) => {
  try {
    const userId = toObjectId(req.user && req.user.sub);
    if (!userId) return res.status(401).json({ error: 'invalid token payload' });

    const cart = await Cart.findOne({ userId }).lean();
    return res.json({ items: cart ? cart.items : [] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/cart/items', authenticateToken, async (req, res) => {
  try {
    const userId = toObjectId(req.user && req.user.sub);
    if (!userId) return res.status(401).json({ error: 'invalid token payload' });

    const { propertyId, propertySlug, checkIn, checkOut, guests, notes } = req.body || {};

    let prop = null;
    if (propertyId && isObjectId(propertyId)) {
      prop = await Propiedad.findById(propertyId).lean();
    } else if (propertySlug) {
      prop = await Propiedad.findOne({ slug: String(propertySlug) }).lean();
    }
    if (!prop) return res.status(404).json({ error: 'Property not found' });

    let agent = prop.agentId ? await Agente.findById(prop.agentId).lean() : null;
    if (!agent) agent = await getAdminFallbackAgent();
    const coverMap = await getPropertyCoverMap([prop._id]);
    const snapshot = mapPropertyCard(prop, agent, coverMap.get(String(prop._id)) || '');

    const item = {
      propertyId: prop._id,
      checkIn: checkIn ? new Date(checkIn) : undefined,
      checkOut: checkOut ? new Date(checkOut) : undefined,
      guests: guests !== undefined ? Number(guests) : undefined,
      notes: notes ? String(notes) : undefined,
      snapshot,
    };

    const updated = await Cart.findOneAndUpdate(
      { userId },
      { $push: { items: item } },
      { new: true, upsert: true }
    ).lean();

    const createdItem = updated.items[updated.items.length - 1];
    return res.status(201).json({ item: createdItem });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/cart/items/:id', authenticateToken, async (req, res) => {
  try {
    const userId = toObjectId(req.user && req.user.sub);
    if (!userId) return res.status(401).json({ error: 'invalid token payload' });

    const { checkIn, checkOut, guests, notes } = req.body || {};

    const update = {};
    if (checkIn !== undefined) update['items.$.checkIn'] = checkIn ? new Date(checkIn) : undefined;
    if (checkOut !== undefined) update['items.$.checkOut'] = checkOut ? new Date(checkOut) : undefined;
    if (guests !== undefined) update['items.$.guests'] = guests !== null ? Number(guests) : undefined;
    if (notes !== undefined) update['items.$.notes'] = notes ? String(notes) : undefined;

    const updated = await Cart.findOneAndUpdate(
      { userId, 'items._id': req.params.id },
      { $set: update },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ error: 'Not found' });

    const item = (updated.items || []).find((i) => String(i._id) === String(req.params.id));
    return res.json({ item });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/cart/items/:id', authenticateToken, async (req, res) => {
  try {
    const userId = toObjectId(req.user && req.user.sub);
    if (!userId) return res.status(401).json({ error: 'invalid token payload' });

    const updated = await Cart.findOneAndUpdate(
      { userId },
      { $pull: { items: { _id: req.params.id } } },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ error: 'Not found' });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/cart', authenticateToken, async (req, res) => {
  try {
    const userId = toObjectId(req.user && req.user.sub);
    if (!userId) return res.status(401).json({ error: 'invalid token payload' });

    await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } }, { new: true, upsert: true });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/bookings', authenticateToken, async (req, res) => {
  try {
    const userId = toObjectId(req.user && req.user.sub);
    if (!userId) return res.status(401).json({ error: 'invalid token payload' });

    const { contact } = req.body || {};

    const cart = await Cart.findOne({ userId }).lean();
    const items = cart && Array.isArray(cart.items) ? cart.items : [];
    if (!items.length) return res.status(400).json({ error: 'cart is empty' });

    const booking = await BookingRequest.create({
      userId,
      status: 'pending',
      items: items.map((i) => ({
        propertyId: i.propertyId,
        checkIn: i.checkIn,
        checkOut: i.checkOut,
        guests: i.guests,
        notes: i.notes,
        snapshot: i.snapshot || {},
      })),
      contact: {
        fullName: contact && contact.fullName ? String(contact.fullName) : '',
        email: contact && contact.email ? String(contact.email) : '',
        phone: contact && contact.phone ? String(contact.phone) : '',
        address: contact && contact.address ? String(contact.address) : '',
      },
    });

    await Cart.findOneAndUpdate({ userId }, { $set: { items: [] } }, { new: true, upsert: true });

    return res.status(201).json({ booking });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/bookings', authenticateToken, async (req, res) => {
  try {
    const userId = toObjectId(req.user && req.user.sub);
    if (!userId) return res.status(401).json({ error: 'invalid token payload' });

    const items = await BookingRequest.find({ userId }).sort({ createdAt: -1 }).lean();
    return res.json({ items });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/bookings/:id', authenticateToken, async (req, res) => {
  try {
    const userId = toObjectId(req.user && req.user.sub);
    if (!userId) return res.status(401).json({ error: 'invalid token payload' });

    const booking = await BookingRequest.findOne({ _id: req.params.id, userId }).lean();
    if (!booking) return res.status(404).json({ error: 'Not found' });
    return res.json({ booking });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/blog/categories', async (req, res) => {
  try {
    const items = await BlogCategory.find({}).sort({ name: 1 }).lean();
    return res.json({ items });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/blog/posts', async (req, res) => {
  try {
    const { category } = req.query;
    const filter = { status: 'published' };

    if (category) {
      const cat = await BlogCategory.findOne({ slug: String(category) }).lean();
      if (cat) filter.categoryId = cat._id;
      else filter.categoryId = null;
    }

    const posts = await BlogPost.find(filter)
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(100)
      .lean();

    const categoryIds = Array.from(new Set(posts.map((p) => String(p.categoryId || '')).filter(Boolean)));
    const categories = categoryIds.length ? await BlogCategory.find({ _id: { $in: categoryIds } }).lean() : [];
    const categoriesById = new Map(categories.map((c) => [String(c._id), c]));

    const agentIds = Array.from(new Set(posts.map((p) => String(p.authorAgentId || '')).filter(Boolean)));
    const agents = agentIds.length ? await Agente.find({ _id: { $in: agentIds } }).lean() : [];
    const agentsById = new Map(agents.map((a) => [String(a._id), a]));

    const items = posts.map((p) => {
      const cat = p.categoryId ? categoriesById.get(String(p.categoryId)) : null;
      const author = p.authorAgentId ? agentsById.get(String(p.authorAgentId)) : null;
      return {
        id: String(p._id),
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt,
        coverUrl: p.coverUrl,
        category: cat ? { id: String(cat._id), name: cat.name, slug: cat.slug } : null,
        authorAgent: author
          ? {
            id: String(author._id),
            name: author.nombre || '',
            avatarUrl: author.avatar || (author.metadata && (author.metadata.avatarUrl || author.metadata.avatar_url)) || '',
            cargo: author.cargo || '',
          }
          : null,
        publishedAt: p.publishedAt || null,
      };
    });

    return res.json({ items });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/blog/posts/:slug', async (req, res) => {
  try {
    const slug = String(req.params.slug || '').trim();
    if (!slug) return res.status(400).json({ error: 'slug required' });

    const post = await BlogPost.findOne({ slug, status: 'published' }).lean();
    if (!post) return res.status(404).json({ error: 'Not found' });

    const cat = post.categoryId ? await BlogCategory.findById(post.categoryId).lean() : null;
    const author = post.authorAgentId ? await Agente.findById(post.authorAgentId).lean() : null;

    const item = {
      id: String(post._id),
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      contentHtml: post.contentHtml,
      coverUrl: post.coverUrl,
      galleryUrls: post.galleryUrls || [],
      category: cat ? { id: String(cat._id), name: cat.name, slug: cat.slug } : null,
      authorAgent: author
        ? {
          id: String(author._id),
          name: author.nombre || '',
          avatarUrl: author.avatar || (author.metadata && (author.metadata.avatarUrl || author.metadata.avatar_url)) || '',
          cargo: author.cargo || '',
          bio: author.bio || '',
        }
        : null,
      publishedAt: post.publishedAt || null,
    };

    return res.json({ item });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Testimonials
router.get('/testimonials', async (req, res) => {
  try {
    const items = await Testimonial.find({ activo: true }).sort({ orden: 1, createdAt: -1 }).lean();
    return res.json({
      items: items.map((t) => ({
        id: String(t._id),
        name: t.nombre,
        avatar: t.avatar || '',
        text: t.texto,
        rating: t.rating || 5,
      })),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// FAQs
router.get('/faqs', async (req, res) => {
  try {
    const items = await FAQ.find({ activo: true }).sort({ orden: 1, createdAt: -1 }).lean();
    return res.json({
      items: items.map((f) => ({
        id: String(f._id),
        question: f.pregunta,
        answer: f.respuesta,
        category: f.categoria || '',
      })),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Contact form
router.post('/contact', async (req, res) => {
  try {
    const { nombre, email, telefono, asunto, mensaje } = req.body || {};
    if (!nombre || !mensaje) return res.status(400).json({ error: 'nombre and mensaje are required' });
    const msg = await ContactMessage.create({ nombre, email, telefono, asunto, mensaje });
    return res.json({ ok: true, id: String(msg._id) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Gallery (property cover images)
router.get('/gallery', async (req, res) => {
  try {
    const props = await Propiedad.find({}).sort({ updatedAt: -1 }).limit(30).lean();
    const coverMap = await getPropertyCoverMap(props.map((p) => p._id));
    const images = [];
    for (const p of props) {
      const url = coverMap.get(String(p._id));
      if (url) {
        images.push({
          id: String(p._id),
          url,
          title: p.title || (p.metadata && p.metadata.titulo) || '',
          slug: p.slug || String(p._id),
        });
      }
    }
    return res.json({ items: images });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Site config (public info about the real estate company)
router.get('/site-config', async (req, res) => {
  try {
    const cfg = await GlobalConfig.findOne({ key: 'site_config' }).lean();
    const data = (cfg && cfg.value) || {};
    return res.json({
      name: data.name || 'Anabella Luna Propiedades',
      phone: data.phone || '',
      email: data.email || '',
      address: data.address || '',
      whatsapp: data.whatsapp || '',
      socialMedia: data.socialMedia || {},
      logo: data.logo || '',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Open Graph image endpoint: serves a 1200x630 JPEG optimised for social sharing.
// The image is generated on first request and cached in MinIO for subsequent requests.
router.get('/og/:propertyId.jpg', async (req, res) => {
  const propertyId = String(req.params.propertyId || '').trim();

  if (!propertyId) return res.status(400).json({ error: 'propertyId required' });

  try {
    const buffer = await getOGImageBuffer(propertyId);

    res.set('Content-Type', 'image/jpeg');
    res.set('Content-Length', String(buffer.length));
    res.set('Cache-Control', 'public, max-age=86400');
    res.set('X-OG-Generated', 'true');
    return res.send(buffer);
  } catch (err) {
    // Fallback: redirect to the raw cover image so og:image still resolves
    console.error(`[OGImage] Failed to generate OG image for ${propertyId}:`, err && err.message);

    try {
      const links = await DocumentLink.find({ entity_type: 'propiedad', entity_id: propertyId })
        .sort({ order: 1, created_at: 1 })
        .populate('document', '_id url object_key bucket tipo categoria')
        .lean();

      for (const l of links) {
        const doc = l.document;
        if (!doc || String(doc.tipo || '').toLowerCase() !== 'imagen') continue;
        if (doc.object_key) {
          const bucket = doc.bucket || minio.bucket;
          const stream = await minio.getObject(bucket, doc.object_key);
          res.set('Content-Type', 'image/jpeg');
          res.set('Cache-Control', 'public, max-age=3600');
          return stream.pipe(res);
        }
        if (String(doc.url || '').startsWith('http')) {
          return res.redirect(doc.url);
        }
      }
    } catch (_) { /* swallow */ }

    return res.status(404).json({ error: 'OG image not available' });
  }
});

module.exports = router;
