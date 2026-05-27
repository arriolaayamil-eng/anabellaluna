/**
 * MCP Tools — Admin/ERP exclusive functions
 * Configuration, rewards, teams, audit, booking requests
 */

const { z } = require('zod');
const { getModel } = require('../db');

function registerAdminTools(server) {
  const Agente = () => getModel('Agente');
  const Reward = () => getModel('Reward');
  const AuditLog = () => getModel('AuditLog');
  const BookingRequest = () => getModel('BookingRequest');
  const ContactMessage = () => getModel('ContactMessage');
  const Cliente = () => getModel('Cliente');
  const Activity = () => getModel('Activity');
  const Inmobiliaria = () => getModel('Inmobiliaria');
  const BlogPost = () => getModel('BlogPost');

  const safeLimit = (limit, fallback = 20) => Math.min(Math.max(Number(limit) || fallback, 1), 50);

  // ── Agentes Management ──────────────────────────────────────────────────────

  server.tool(
    'get_agente_detail',
    'Detalle completo de un agente: datos personales, métricas, configuración.',
    {
      agenteId: z.string().describe('ID del agente'),
    },
    async ({ agenteId }) => {
      const ag = await Agente().findById(agenteId).lean();
      if (!ag) return { content: [{ type: 'text', text: 'Agente no encontrado' }], isError: true };
      return { content: [{ type: 'text', text: JSON.stringify(ag, null, 2) }] };
    }
  );

  server.tool(
    'update_agente',
    'Actualiza datos de un agente (nombre, email, teléfono, activo, comisión).',
    {
      agenteId: z.string().describe('ID del agente'),
      nombre: z.string().optional(),
      email: z.string().optional(),
      telefono: z.string().optional(),
      activo: z.boolean().optional(),
      comision: z.number().optional().describe('Porcentaje de comisión'),
    },
    async ({ agenteId, nombre, email, telefono, activo, comision }) => {
      const set = {};
      if (nombre !== undefined) set.nombre = nombre;
      if (email !== undefined) set.email = email;
      if (telefono !== undefined) set.telefono = telefono;
      if (activo !== undefined) set.activo = activo;
      if (comision !== undefined) set.comision = comision;
      const updated = await Agente().findByIdAndUpdate(agenteId, { $set: set }, { new: true }).lean();
      if (!updated) return { content: [{ type: 'text', text: 'Agente no encontrado' }], isError: true };
      return { content: [{ type: 'text', text: JSON.stringify(updated, null, 2) }] };
    }
  );

  // ── Rewards / Gamification ──────────────────────────────────────────────────

  server.tool(
    'list_rewards',
    'Lista recompensas/logros del sistema de gamificación.',
    {
      agenteId: z.string().optional(),
      limit: z.number().optional(),
    },
    async ({ agenteId, limit }) => {
      const filter = agenteId ? { agenteId } : {};
      const items = await Reward().find(filter)
        .sort({ createdAt: -1 })
        .limit(safeLimit(limit))
        .lean();
      return { content: [{ type: 'text', text: JSON.stringify({ count: items.length, items }, null, 2) }] };
    }
  );

  // ── Audit Log ───────────────────────────────────────────────────────────────

  server.tool(
    'search_audit_log',
    'Busca en el log de auditoría del sistema (acciones de usuarios y AI).',
    {
      action: z.string().optional().describe('Filtrar por tipo de acción'),
      userId: z.string().optional(),
      from: z.string().optional().describe('Fecha desde ISO 8601'),
      to: z.string().optional().describe('Fecha hasta ISO 8601'),
      limit: z.number().optional(),
    },
    async ({ action, userId, from, to, limit }) => {
      const filter = {};
      if (action) filter.action = new RegExp(action, 'i');
      if (userId) filter.userId = userId;
      if (from || to) {
        filter.createdAt = {};
        if (from) filter.createdAt.$gte = new Date(from);
        if (to) filter.createdAt.$lte = new Date(to);
      }
      const items = await AuditLog().find(filter)
        .sort({ createdAt: -1 })
        .limit(safeLimit(limit))
        .lean();
      return { content: [{ type: 'text', text: JSON.stringify({ count: items.length, items }, null, 2) }] };
    }
  );

  // ── Booking Requests (from public site) ─────────────────────────────────────

  server.tool(
    'list_booking_requests',
    'Lista solicitudes de reserva del sitio público.',
    {
      status: z.string().optional().describe('pending | approved | rejected | cancelled'),
      agenteId: z.string().optional(),
      limit: z.number().optional(),
    },
    async ({ status, agenteId, limit }) => {
      const filter = {};
      if (status) filter.status = status;
      if (agenteId) filter.agenteId = agenteId;
      const items = await BookingRequest().find(filter)
        .sort({ createdAt: -1 })
        .limit(safeLimit(limit))
        .lean();
      return { content: [{ type: 'text', text: JSON.stringify({ count: items.length, items }, null, 2) }] };
    }
  );

  server.tool(
    'get_booking_request_detail',
    'Detalle completo de una solicitud de reserva del sitio público.',
    {
      bookingId: z.string().describe('ID de la solicitud de reserva'),
    },
    async ({ bookingId }) => {
      const booking = await BookingRequest().findById(bookingId).lean();
      if (!booking) return { content: [{ type: 'text', text: 'Reserva no encontrada' }], isError: true };
      return { content: [{ type: 'text', text: JSON.stringify(booking, null, 2) }] };
    }
  );

  server.tool(
    'update_booking_status',
    'Actualiza el estado de una solicitud de reserva.',
    {
      bookingId: z.string().describe('ID de la reserva'),
      status: z.string().describe('approved | rejected | cancelled'),
      notes: z.string().optional(),
    },
    async ({ bookingId, status, notes }) => {
      const set = { status };
      if (notes) set.adminNotes = notes;
      const updated = await BookingRequest().findByIdAndUpdate(bookingId, { $set: set }, { new: true }).lean();
      if (!updated) return { content: [{ type: 'text', text: 'Reserva no encontrada' }], isError: true };
      return { content: [{ type: 'text', text: JSON.stringify(updated, null, 2) }] };
    }
  );

  // ── Contact Messages ────────────────────────────────────────────────────────

  server.tool(
    'list_contact_messages',
    'Lista mensajes de contacto recibidos del sitio público.',
    {
      query: z.string().optional().describe('Buscar por nombre, email, teléfono, asunto o mensaje'),
      limit: z.number().optional(),
    },
    async ({ query, limit }) => {
      const filter = {};
      if (query && query.trim()) {
        const rx = new RegExp(query.trim(), 'i');
        filter.$or = [{ nombre: rx }, { email: rx }, { telefono: rx }, { asunto: rx }, { mensaje: rx }];
      }
      const items = await ContactMessage().find(filter)
        .sort({ createdAt: -1 })
        .limit(safeLimit(limit))
        .lean();
      return { content: [{ type: 'text', text: JSON.stringify({ count: items.length, items }, null, 2) }] };
    }
  );

  server.tool(
    'get_contact_message_detail',
    'Detalle de una consulta/mensaje recibido desde el sitio público.',
    {
      contactMessageId: z.string().describe('ID del mensaje de contacto'),
    },
    async ({ contactMessageId }) => {
      const msg = await ContactMessage().findById(contactMessageId).lean();
      if (!msg) return { content: [{ type: 'text', text: 'Mensaje de contacto no encontrado' }], isError: true };
      return { content: [{ type: 'text', text: JSON.stringify(msg, null, 2) }] };
    }
  );

  server.tool(
    'convert_contact_to_cliente',
    'Convierte una consulta del sitio público en cliente CRM y registra actividad de origen.',
    {
      contactMessageId: z.string().describe('ID del mensaje de contacto'),
      agenteId: z.string().optional().describe('Asignar el nuevo cliente a un agente'),
      notasExtra: z.string().optional(),
    },
    async ({ contactMessageId, agenteId, notasExtra }) => {
      const msg = await ContactMessage().findById(contactMessageId).lean();
      if (!msg) return { content: [{ type: 'text', text: 'Mensaje de contacto no encontrado' }], isError: true };

      const existing = await Cliente().findOne({
        $or: [
          ...(msg.email ? [{ email: msg.email }] : []),
          ...(msg.telefono ? [{ telefono: msg.telefono }] : []),
        ],
      }).lean();
      if (existing) {
        await Activity().create({
          agenteId: agenteId || existing.agenteId || '',
          clientId: String(existing._id),
          type: 'web_contact',
          notes: `${msg.asunto || 'Consulta web'}: ${msg.mensaje}${notasExtra ? `\n${notasExtra}` : ''}`,
          metadata: { contactMessageId: String(msg._id), convertedToExisting: true },
        });
        return { content: [{ type: 'text', text: JSON.stringify({ cliente: existing, reusedExisting: true }, null, 2) }] };
      }

      const cliente = await Cliente().create({
        nombre: msg.nombre,
        email: msg.email || '',
        telefono: msg.telefono || '',
        agenteId: agenteId || '',
        notas: `${msg.asunto || 'Consulta web'}: ${msg.mensaje}${notasExtra ? `\n${notasExtra}` : ''}`,
        metadata: { source: 'contact_message', contactMessageId: String(msg._id) },
      });
      await Activity().create({
        agenteId: agenteId || '',
        clientId: String(cliente._id),
        type: 'web_contact',
        notes: `${msg.asunto || 'Consulta web'}: ${msg.mensaje}`,
        metadata: { contactMessageId: String(msg._id), convertedToCliente: true },
      });

      return { content: [{ type: 'text', text: JSON.stringify({ cliente: cliente.toObject(), reusedExisting: false }, null, 2) }] };
    }
  );

  // ── Inmobiliaria config ─────────────────────────────────────────────────────

  server.tool(
    'get_inmobiliaria_config',
    'Obtiene la configuración de la inmobiliaria (datos del negocio).',
    {},
    async () => {
      const items = await Inmobiliaria().find({}).lean();
      const config = items[0] || null;
      if (!config) return { content: [{ type: 'text', text: 'No hay configuración de inmobiliaria' }], isError: true };
      return { content: [{ type: 'text', text: JSON.stringify(config, null, 2) }] };
    }
  );

  // ── Blog ────────────────────────────────────────────────────────────────────

  server.tool(
    'list_blog_posts',
    'Lista posts del blog CMS.',
    {
      status: z.string().optional().describe('draft | published'),
      limit: z.number().optional(),
    },
    async ({ status, limit }) => {
      const filter = {};
      if (status) filter.status = status;
      const items = await BlogPost().find(filter)
        .select('title slug status author createdAt publishedAt')
        .sort({ createdAt: -1 })
        .limit(safeLimit(limit))
        .lean();
      return { content: [{ type: 'text', text: JSON.stringify({ count: items.length, items }, null, 2) }] };
    }
  );
}

module.exports = { registerAdminTools };
