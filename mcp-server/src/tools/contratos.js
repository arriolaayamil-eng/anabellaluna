/**
 * MCP Tools — Plantillas de Contratos
 */

const { z } = require('zod');
const { getModel } = require('../db');

function registerContratoTools(server) {
  const ContractTemplate = () => getModel('ContractTemplate');

  server.tool(
    'list_contract_templates',
    'Lista plantillas de contratos disponibles.',
    {
      query: z.string().optional().describe('Buscar por nombre'),
      agenteId: z.string().optional(),
      limit: z.number().optional(),
    },
    async ({ query, agenteId, limit }) => {
      const filter = {};
      if (agenteId) filter.agenteId = agenteId;
      if (query) filter.nombre = new RegExp(query, 'i');
      const items = await ContractTemplate().find(filter)
        .select('nombre tipo descripcion activo createdAt')
        .sort({ createdAt: -1 })
        .limit(Math.min(Math.max(Number(limit) || 20, 1), 50))
        .lean();
      return { content: [{ type: 'text', text: JSON.stringify({ count: items.length, items }, null, 2) }] };
    }
  );

  server.tool(
    'get_contract_template',
    'Obtiene el contenido completo de una plantilla de contrato.',
    {
      templateId: z.string().describe('ID de la plantilla'),
    },
    async ({ templateId }) => {
      const tpl = await ContractTemplate().findById(templateId).lean();
      if (!tpl) return { content: [{ type: 'text', text: 'Plantilla no encontrada' }], isError: true };
      return { content: [{ type: 'text', text: JSON.stringify(tpl, null, 2) }] };
    }
  );
}

module.exports = { registerContratoTools };
