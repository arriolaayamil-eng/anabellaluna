/**
 * MCP Tools — Documentos y Carpetas (DMS)
 */

const { z } = require('zod');
const { getModel } = require('../db');

function registerDocumentoTools(server) {
  const Document = () => getModel('Document');
  const Folder = () => getModel('Folder');

  server.tool(
    'list_folders',
    'Lista carpetas del sistema de archivos del agente o admin.',
    {
      parent: z.string().optional().describe('ID carpeta padre (null = raíz)'),
      agenteId: z.string().optional().describe('Filtrar por agente'),
    },
    async ({ parent, agenteId }) => {
      const filter = {};
      if (agenteId) filter.agenteId = agenteId;
      if (parent) filter.parent = parent;
      else filter.parent = null;
      const items = await Folder().find(filter).sort({ name: 1 }).lean();
      return { content: [{ type: 'text', text: JSON.stringify({ count: items.length, items }, null, 2) }] };
    }
  );

  server.tool(
    'list_documents',
    'Lista documentos dentro de una carpeta o busca por nombre.',
    {
      folderId: z.string().optional().describe('ID de carpeta'),
      query: z.string().optional().describe('Buscar por nombre'),
      agenteId: z.string().optional(),
      limit: z.number().optional(),
    },
    async ({ folderId, query, agenteId, limit }) => {
      const filter = {};
      if (folderId) filter.folderId = folderId;
      if (agenteId) filter.agenteId = agenteId;
      if (query) filter.name = new RegExp(query, 'i');
      const items = await Document().find(filter)
        .select('name mimeType size folderId agenteId createdAt')
        .sort({ createdAt: -1 })
        .limit(Math.min(Math.max(Number(limit) || 20, 1), 50))
        .lean();
      return { content: [{ type: 'text', text: JSON.stringify({ count: items.length, items }, null, 2) }] };
    }
  );

  server.tool(
    'get_document_detail',
    'Detalle de un documento (metadata, versiones, enlaces compartidos).',
    {
      documentId: z.string().describe('ID del documento'),
    },
    async ({ documentId }) => {
      const doc = await Document().findById(documentId).lean();
      if (!doc) return { content: [{ type: 'text', text: 'Documento no encontrado' }], isError: true };
      return { content: [{ type: 'text', text: JSON.stringify(doc, null, 2) }] };
    }
  );
}

module.exports = { registerDocumentoTools };
