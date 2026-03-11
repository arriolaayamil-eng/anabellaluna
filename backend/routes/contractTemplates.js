const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const streamifier = require('streamifier');
const cloudinary = require('../cloudinary');
const minio = require('../minio');
const ContractTemplate = require('../models/ContractTemplate');
const Cliente = require('../models/Cliente');
const Propiedad = require('../models/Propiedad');
const Agente = require('../models/Agente');
const Document = require('../models/Document');
const Version = require('../models/Version');
const Folder = require('../models/Folder');
const DocumentLink = require('../models/DocumentLink');
const { authenticateToken, agentScopeId, getUserId, requireCRMUser } = require('../auth');

const router = express.Router();

const {
  bucket: defaultMinioBucket,
  buckets: minioBuckets,
  isConfigured: isMinioConfigured,
  ensureBuckets,
  putObject,
} = minio;

function isAdmin(req) {
  return String(req && req.user && req.user.role ? req.user.role : '') === 'admin';
}

function sanitizeFilename(name) {
  return String(name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
}

function resolveMinioBucket(domain) {
  const d = String(domain || '').toLowerCase();
  if (d === 'crm') return minioBuckets.crm || defaultMinioBucket;
  if (d === 'web') return minioBuckets.web || defaultMinioBucket;
  if (d === 'erp') return minioBuckets.erp || defaultMinioBucket;
  return minioBuckets.erp || defaultMinioBucket;
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeRecord(record) {
  if (!record) return {};
  const plain = typeof record.toObject === 'function' ? record.toObject() : { ...record };
  if (plain._id && !plain.id) plain.id = String(plain._id);
  return plain;
}

function normalizeTags(value) {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.map((item) => String(item || '').trim()).filter(Boolean)));
  }
  if (typeof value === 'string') {
    return Array.from(new Set(value.split(',').map((item) => item.trim()).filter(Boolean)));
  }
  return [];
}

function stringifyValue(value) {
  if (value === undefined || value === null) return '';
  if (value instanceof Date) return value.toLocaleDateString('es-AR');
  if (Array.isArray(value)) return value.map((item) => stringifyValue(item)).filter(Boolean).join(', ');
  if (typeof value === 'object') return '';
  return String(value);
}

function getPathValue(source, path) {
  return String(path || '').split('.').reduce((acc, key) => {
    if (acc === undefined || acc === null) return undefined;
    return acc[key];
  }, source);
}

function renderTemplate(content, context) {
  return String(content || '').replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, token) => stringifyValue(getPathValue(context, token.trim())));
}

function serializeTemplate(template, req) {
  const plain = normalizeRecord(template);
  return {
    ...plain,
    canEdit: isAdmin(req),
    canDelete: isAdmin(req),
    canGenerate: isAdmin(req) || plain.status === 'active',
  };
}

function formatCurrency(value, currency = 'ARS') {
  const amount = Number(value || 0);
  try {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: currency || 'ARS', maximumFractionDigits: 0 }).format(amount);
  } catch (err) {
    return amount.toLocaleString('es-AR');
  }
}

function formatLongDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function buildContext({ template, client, property, agent, notes, currentUser }) {
  const now = new Date();
  const cliente = normalizeRecord(client);
  const propiedad = normalizeRecord(property);
  const agente = normalizeRecord(agent);
  cliente.nombreCompleto = cliente.nombre || '';
  propiedad.priceFormatted = formatCurrency(propiedad.price, propiedad.moneda || 'ARS');
  propiedad.estado = propiedad.status || '';
  agente.nombreCompleto = agente.nombre || currentUser?.nombre || currentUser?.username || '';
  return {
    cliente,
    propiedad,
    agente,
    contrato: {
      templateName: template.name,
      templateCategory: template.category || 'General',
      fechaActual: now.toISOString().slice(0, 10),
      fechaLarga: formatLongDate(now),
      anio: now.getFullYear(),
      notas: String(notes || ''),
      generadoPor: currentUser?.nombre || currentUser?.username || '',
    },
    sistema: {
      fechaCorta: now.toISOString().slice(0, 10),
      fechaLarga: formatLongDate(now),
      anioActual: now.getFullYear(),
    },
  };
}

async function ensureFolder(name, parent, agenteId) {
  const filter = { name: String(name || '').trim(), parent: parent || null, agenteId: agenteId || '' };
  let folder = await Folder.findOne(filter).exec();
  if (!folder) {
    folder = new Folder(filter);
    await folder.save();
  }
  return folder;
}

async function ensureContractFolderPath(ownerLabel, category, agenteId) {
  const root = await ensureFolder(`Contratos - ${String(ownerLabel || 'Administración').trim()}`, null, agenteId || '');
  return ensureFolder(String(category || 'General').trim(), root._id, agenteId || '');
}

async function uploadPdfBuffer(buffer, fileName, domain) {
  const storageProvider = String(process.env.STORAGE_PROVIDER || 'minio').toLowerCase();
  const useMinio = storageProvider === 'minio' && isMinioConfigured();
  if (storageProvider === 'minio' && !useMinio) {
    throw new Error('MinIO is not configured');
  }
  if (useMinio) {
    await ensureBuckets();
    const bucket = resolveMinioBucket(domain);
    const objectKey = `contracts/${Date.now()}-${crypto.randomBytes(8).toString('hex')}-${sanitizeFilename(fileName)}`;
    await putObject(bucket, objectKey, buffer, buffer.length, { 'Content-Type': 'application/pdf' });
    return { bucket, objectKey, url: '', cloudinaryId: '' };
  }
  const result = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream({ resource_type: 'raw', format: 'pdf' }, (error, data) => {
      if (error) return reject(error);
      return resolve(data);
    });
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
  return { bucket: '', objectKey: '', url: result.secure_url, cloudinaryId: result.public_id };
}

function buildPdfBuffer({ template, renderedContent, client, property, agent }) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // ── PAGE 1: CARÁTULA ──
    doc.moveDown(4);
    doc.font('Helvetica-Bold').fontSize(28).fillColor('#111827').text(template.name || 'Contrato', { align: 'center' });
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(11).fillColor('#6B7280').text(`Categoría: ${template.category || 'General'}`, { align: 'center' });
    doc.moveDown(0.2);
    doc.font('Helvetica').fontSize(11).fillColor('#6B7280').text(formatLongDate(new Date()), { align: 'center' });

    doc.moveDown(3);
    // Línea separadora
    doc.moveTo(48, doc.y).lineTo(547, doc.y).strokeColor('#D1D5DB').lineWidth(1).stroke();
    doc.moveDown(1.5);

    // Sección Cliente
    doc.font('Helvetica-Bold').fontSize(13).fillColor('#111827').text('Cliente');
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(11).fillColor('#1F2937');
    doc.text(`Nombre: ${client.nombre || '-'}`);
    if (client.email) doc.text(`Email: ${client.email}`);
    if (client.telefono) doc.text(`Teléfono: ${client.telefono}`);
    if (client.direccion) doc.text(`Dirección: ${client.direccion}`);

    doc.moveDown(1);

    // Sección Propiedad
    doc.font('Helvetica-Bold').fontSize(13).fillColor('#111827').text('Propiedad');
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(11).fillColor('#1F2937');
    doc.text(`Título: ${property.title || '-'}`);
    if (property.address) doc.text(`Dirección: ${property.address}`);
    if (property.price) doc.text(`Precio: ${formatCurrency(property.price, property.moneda || 'ARS')}`);
    if (property.status) doc.text(`Estado: ${property.status}`);

    doc.moveDown(1);

    // Sección Agente
    doc.font('Helvetica-Bold').fontSize(13).fillColor('#111827').text('Agente responsable');
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(11).fillColor('#1F2937');
    doc.text(`Nombre: ${agent.nombre || '-'}`);
    if (agent.email) doc.text(`Email: ${agent.email}`);
    if (agent.telefono) doc.text(`Teléfono: ${agent.telefono}`);

    // ── PAGE 2+: CONTENIDO CONTRACTUAL ──
    doc.addPage({ size: 'A4', margin: 48 });
    doc.font('Helvetica').fontSize(11).fillColor('#1F2937').text(renderedContent || '', {
      align: 'left',
      lineGap: 4,
      paragraphGap: 8,
    });

    doc.end();
  });
}

async function loadTemplateForRequest(req, templateId) {
  const template = await ContractTemplate.findById(templateId).exec();
  if (!template) {
    const err = new Error('Plantilla no encontrada');
    err.status = 404;
    throw err;
  }
  if (!isAdmin(req) && (template.visibility !== 'global' || template.status !== 'active')) {
    const err = new Error('forbidden');
    err.status = 403;
    throw err;
  }
  return template;
}

async function loadContractEntities(req, clientId, propertyId) {
  const scopeId = agentScopeId(req);
  const client = await Cliente.findById(clientId).lean();
  if (!client) {
    const err = new Error('Cliente no encontrado');
    err.status = 404;
    throw err;
  }
  if (scopeId && String(client.agenteId || '') !== scopeId) {
    const err = new Error('forbidden');
    err.status = 403;
    throw err;
  }
  const property = await Propiedad.findById(propertyId).lean();
  if (!property) {
    const err = new Error('Propiedad no encontrada');
    err.status = 404;
    throw err;
  }
  if (scopeId && String(property.agentId || '') !== scopeId) {
    const err = new Error('forbidden');
    err.status = 403;
    throw err;
  }
  const assignedAgentId = String(property.agentId || client.agenteId || req.user?.agenteId || '');
  const assignedAgent = assignedAgentId ? await Agente.findById(assignedAgentId).lean() : null;
  return { client, property, assignedAgent };
}

router.get('/placeholders', authenticateToken, requireCRMUser, async (req, res) => {
  res.json({
    sections: [
      { name: 'Cliente', tokens: ['{{cliente.nombre}}', '{{cliente.email}}', '{{cliente.telefono}}', '{{cliente.direccion}}', '{{cliente.notas}}', '{{cliente.metadata.cuil}}'] },
      { name: 'Propiedad', tokens: ['{{propiedad.title}}', '{{propiedad.address}}', '{{propiedad.price}}', '{{propiedad.priceFormatted}}', '{{propiedad.status}}', '{{propiedad.slug}}', '{{propiedad.metadata.bedrooms}}'] },
      { name: 'Agente', tokens: ['{{agente.nombre}}', '{{agente.email}}', '{{agente.telefono}}', '{{agente.cargo}}', '{{agente.direccion}}'] },
      { name: 'Contrato', tokens: ['{{contrato.templateName}}', '{{contrato.templateCategory}}', '{{contrato.fechaActual}}', '{{contrato.fechaLarga}}', '{{contrato.notas}}'] },
      { name: 'Sistema', tokens: ['{{sistema.fechaCorta}}', '{{sistema.fechaLarga}}', '{{sistema.anioActual}}'] },
    ],
  });
});

router.get('/clients/search', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 50);
    const scopeId = agentScopeId(req);
    const clauses = [];
    if (scopeId) clauses.push({ agenteId: scopeId });
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      const or = [{ nombre: rx }, { email: rx }, { telefono: rx }, { direccion: rx }];
      if (mongoose.Types.ObjectId.isValid(q)) or.push({ _id: q });
      clauses.push({ $or: or });
    }
    const filter = clauses.length > 1 ? { $and: clauses } : (clauses[0] || {});
    const items = await Cliente.find(filter).sort({ updatedAt: -1 }).limit(limit).lean();
    res.json(items.map((item) => ({ _id: item._id, nombre: item.nombre, email: item.email, telefono: item.telefono, direccion: item.direccion, agenteId: item.agenteId })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/properties/search', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const clientId = String(req.query.clientId || '').trim();
    const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 50);
    const scopeId = agentScopeId(req);
    const clauses = [];
    if (scopeId) clauses.push({ agentId: scopeId });
    if (clientId) clauses.push({ ownerId: clientId });
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      const or = [{ title: rx }, { address: rx }, { description: rx }, { slug: rx }, { ownerId: rx }];
      if (mongoose.Types.ObjectId.isValid(q)) or.push({ _id: q });
      clauses.push({ $or: or });
    }
    const filter = clauses.length > 1 ? { $and: clauses } : (clauses[0] || {});
    const items = await Propiedad.find(filter).sort({ updatedAt: -1 }).limit(limit).lean();
    res.json(items.map((item) => ({ _id: item._id, title: item.title, address: item.address, price: item.price, moneda: item.moneda, status: item.status, ownerId: item.ownerId, agentId: item.agentId })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const category = String(req.query.category || '').trim();
    const status = String(req.query.status || '').trim();
    const clauses = [];
    if (!isAdmin(req)) {
      clauses.push({ visibility: 'global' });
      clauses.push({ status: 'active' });
    } else if (status) {
      clauses.push({ status });
    }
    if (category) clauses.push({ category });
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      clauses.push({ $or: [{ name: rx }, { description: rx }, { category: rx }, { tags: rx }] });
    }
    const filter = clauses.length > 1 ? { $and: clauses } : (clauses[0] || {});
    const items = await ContractTemplate.find(filter).sort({ updatedAt: -1 }).limit(200).lean();
    res.json(items.map((item) => serializeTemplate(item, req)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/preview', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const { templateId, content, name, category, clientId, propertyId, notes } = req.body || {};
    const baseTemplate = templateId ? await loadTemplateForRequest(req, templateId) : null;
    const template = {
      ...(baseTemplate ? normalizeRecord(baseTemplate) : {}),
      name: String(name || baseTemplate?.name || 'Vista previa').trim(),
      category: String(category || baseTemplate?.category || 'General').trim(),
      content: String(content !== undefined ? content : (baseTemplate?.content || '')),
    };
    if (!String(template.content || '').trim()) {
      return res.status(400).json({ error: 'La plantilla no tiene contenido para previsualizar' });
    }
    const { client, property, assignedAgent } = await loadContractEntities(req, clientId, propertyId);
    const currentUser = req.user || {};
    const context = buildContext({ template, client, property, agent: assignedAgent || currentUser, notes, currentUser });
    res.json({ content: renderTemplate(template.content, context), context });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/generate', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const { templateId, clientId, propertyId, notes, fileName } = req.body || {};
    if (!templateId || !clientId || !propertyId) return res.status(400).json({ error: 'templateId, clientId y propertyId son requeridos' });
    const template = await loadTemplateForRequest(req, templateId);
    if (!String(template.content || '').trim()) {
      return res.status(400).json({ error: 'La plantilla no tiene contenido para generar el contrato' });
    }
    const { client, property, assignedAgent } = await loadContractEntities(req, clientId, propertyId);
    const currentUser = req.user || {};
    const context = buildContext({ template, client, property, agent: assignedAgent || currentUser, notes, currentUser });
    const renderedContent = renderTemplate(template.content, context);
    if (!String(renderedContent || '').trim()) {
      return res.status(400).json({ error: 'El contenido renderizado del contrato está vacío' });
    }
    const pdfBuffer = await buildPdfBuffer({ template, renderedContent, client, property, agent: assignedAgent || currentUser });
    const creatorAgentId = agentScopeId(req) || '';
    const ownerLabel = creatorAgentId ? (assignedAgent?.nombre || currentUser?.nombre || currentUser?.username || 'Agente') : 'Administración';
    const folder = await ensureContractFolderPath(ownerLabel, template.category || 'General', creatorAgentId);
    const finalName = sanitizeFilename(fileName || `${template.name || 'contrato'}-${client.nombre || 'cliente'}.pdf`);
    const storageData = await uploadPdfBuffer(pdfBuffer, finalName, creatorAgentId ? 'crm' : 'erp');
    const tamano = +(pdfBuffer.length / (1024 * 1024)).toFixed(2);
    const doc = new Document({
      nombre: finalName,
      tipo: 'PDF',
      mimetype: 'application/pdf',
      categoria: `Contrato - ${template.category || 'General'}`,
      tamano,
      relacionado: `Cliente:${client._id}|Propiedad:${property._id}`,
      agenteId: creatorAgentId,
      url: storageData.url,
      bucket: storageData.bucket,
      object_key: storageData.objectKey,
      cloudinary_id: storageData.cloudinaryId,
      folder: folder ? folder._id : null,
      sourceModule: 'contract_templates',
      documentType: 'contract',
      ownerType: 'cliente',
      ownerId: String(client._id),
      ownerLabel: client.nombre || '',
      status: 'active',
      tags: normalizeTags([...(template.tags || []), 'contrato', template.category || 'general']),
      uploadedBy: currentUser.username || getUserId(req) || '',
      metadata: {
        templateId: String(template._id),
        templateName: template.name || '',
        clientId: String(client._id),
        clientName: client.nombre || '',
        propertyId: String(property._id),
        propertyTitle: property.title || '',
        assignedAgentId: assignedAgent?._id ? String(assignedAgent._id) : '',
        assignedAgentName: assignedAgent?.nombre || '',
        notes: String(notes || ''),
      },
    });
    await doc.save();
    if (!doc.url) {
      doc.url = `/documents/${doc._id}/download`;
      await doc.save();
    }
    const version = new Version({ document: doc._id, filename: finalName, url: doc.url, bucket: storageData.bucket || undefined, object_key: storageData.objectKey, cloudinary_id: storageData.cloudinaryId });
    await version.save();
    doc.versions.push(version._id);
    await doc.save();
    await DocumentLink.create({ document: doc._id, entity_type: 'cliente', entity_id: String(client._id), agenteId: creatorAgentId || '' });
    await DocumentLink.create({ document: doc._id, entity_type: 'propiedad', entity_id: String(property._id), agenteId: creatorAgentId || '' });
    res.status(201).json({ document: doc, renderedContent, folder });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.get('/:id', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const template = await loadTemplateForRequest(req, req.params.id);
    res.json(serializeTemplate(template, req));
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ error: 'forbidden' });
    const body = req.body || {};
    const created = await ContractTemplate.create({
      name: String(body.name || '').trim(),
      description: String(body.description || '').trim(),
      category: String(body.category || 'General').trim(),
      status: String(body.status || 'active').trim(),
      visibility: 'global',
      content: String(body.content || ''),
      tags: normalizeTags(body.tags),
      createdBy: getUserId(req) || '',
      createdByRole: 'admin',
      updatedBy: getUserId(req) || '',
    });
    res.status(201).json(serializeTemplate(created, req));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ error: 'forbidden' });
    const template = await ContractTemplate.findById(req.params.id).exec();
    if (!template) return res.status(404).json({ error: 'Plantilla no encontrada' });
    const body = req.body || {};
    template.name = String(body.name || template.name || '').trim();
    template.description = String(body.description || '').trim();
    template.category = String(body.category || template.category || 'General').trim();
    template.status = String(body.status || template.status || 'active').trim();
    template.content = String(body.content || '');
    template.tags = normalizeTags(body.tags);
    template.updatedBy = getUserId(req) || '';
    template.version = Number(template.version || 1) + 1;
    await template.save();
    res.json(serializeTemplate(template, req));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ error: 'forbidden' });
    const deleted = await ContractTemplate.findByIdAndDelete(req.params.id).lean();
    if (!deleted) return res.status(404).json({ error: 'Plantilla no encontrada' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
