/**
 * MCP Tools — Mensajes internos entre agentes
 */

const { z } = require('zod');
const { getModel } = require('../db');

function registerMensajeTools(server) {
  const Message = () => getModel('Message');

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
        filter.$or = [{ from: agenteId }, { to: agenteId }];
      }
      if (unreadOnly) filter.read = false;
      const items = await Message().find(filter)
        .sort({ createdAt: -1 })
        .limit(Math.min(Math.max(Number(limit) || 20, 1), 50))
        .lean();
      return { content: [{ type: 'text', text: JSON.stringify({ count: items.length, items }, null, 2) }] };
    }
  );

  server.tool(
    'send_message',
    'Envía un mensaje interno a otro agente o al admin.',
    {
      from: z.string().describe('ID del remitente'),
      to: z.string().describe('ID del destinatario'),
      subject: z.string().optional(),
      body: z.string().describe('Contenido del mensaje'),
    },
    async ({ from, to, subject, body }) => {
      if (!from || !to || !body) return { content: [{ type: 'text', text: 'from, to y body requeridos' }], isError: true };
      const created = await Message().create({ from, to, subject: subject || '', body, read: false });
      return { content: [{ type: 'text', text: JSON.stringify(created.toObject(), null, 2) }] };
    }
  );
}

module.exports = { registerMensajeTools };
