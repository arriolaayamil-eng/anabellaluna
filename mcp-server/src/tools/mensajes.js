/**
 * MCP Tools — Mensajes internos entre agentes
 */

const { z } = require('zod');
const { getModel } = require('../db');

function registerMensajeTools(server) {
  const Message = () => getModel('Message');
  const safeLimit = (limit, fallback = 20) => Math.min(Math.max(Number(limit) || fallback, 1), 50);

  server.tool(
    'list_messages',
    'Lista mensajes internos del sistema (entre agentes o de admin).',
    {
      agenteId: z.string().optional().describe('Filtrar por participante'),
      unreadOnly: z.boolean().optional(),
      limit: z.number().optional(),
    },
    async ({ agenteId, unreadOnly, limit }) => {
      const filter = {};
      if (agenteId) {
        filter.$or = [{ senderId: agenteId }, { receiverId: agenteId }];
      }
      if (unreadOnly) filter.read = false;
      const items = await Message().find(filter)
        .sort({ createdAt: -1 })
        .limit(safeLimit(limit))
        .maxTimeMS(5000)
        .lean();
      return { content: [{ type: 'text', text: JSON.stringify({ count: items.length, items }, null, 2) }] };
    }
  );

  server.tool(
    'count_unread_messages',
    'Cuenta mensajes internos no leídos para un agente o ERP.',
    {
      agenteId: z.string().optional().describe('ID del agente destinatario'),
      receiverType: z.string().optional().describe('agent | erp'),
    },
    async ({ agenteId, receiverType }) => {
      const filter = { read: false };
      if (agenteId) filter.receiverId = agenteId;
      if (receiverType) filter.receiverType = receiverType;
      const total = await Message().countDocuments(filter).maxTimeMS(5000);
      return { content: [{ type: 'text', text: JSON.stringify({ total, filter }, null, 2) }] };
    }
  );

  server.tool(
    'send_message',
    'Envía un mensaje interno a otro agente o al admin.',
    {
      from: z.string().describe('ID del remitente'),
      to: z.string().optional().describe('ID del destinatario agente. Omitir si receiverType=erp'),
      subject: z.string().optional(),
      body: z.string().describe('Contenido del mensaje'),
      senderType: z.string().optional().describe('agent | erp'),
      receiverType: z.string().optional().describe('agent | erp'),
    },
    async ({ from, to, subject, body, senderType, receiverType }) => {
      if (!from || !body) return { content: [{ type: 'text', text: 'from y body requeridos' }], isError: true };
      if ((receiverType || 'agent') === 'agent' && !to) return { content: [{ type: 'text', text: 'to requerido para mensajes a agente' }], isError: true };
      const created = await Message().create({
        senderId: from,
        senderType: senderType || 'agent',
        receiverId: to || undefined,
        receiverType: receiverType || 'agent',
        content: subject ? `${subject}\n\n${body}` : body,
        contentType: 'text',
        read: false,
      });
      return { content: [{ type: 'text', text: JSON.stringify(created.toObject(), null, 2) }] };
    }
  );

  server.tool(
    'mark_message_read',
    'Marca un mensaje interno como leído.',
    {
      messageId: z.string().describe('ID del mensaje'),
    },
    async ({ messageId }) => {
      const updated = await Message().findByIdAndUpdate(messageId, { $set: { read: true, readAt: new Date() } }, { new: true }).lean();
      if (!updated) return { content: [{ type: 'text', text: 'Mensaje no encontrado' }], isError: true };
      return { content: [{ type: 'text', text: JSON.stringify(updated, null, 2) }] };
    }
  );
}

module.exports = { registerMensajeTools };
