/**
 * MCP Tools — Reglas de Automatización y Fechas Importantes
 */

const { z } = require('zod');
const { getModel } = require('../db');

function registerAutomationTools(server) {
  const AutomationRule = () => getModel('AutomationRule');
  const FechaImportante = () => getModel('FechaImportante');

  server.tool(
    'list_automations',
    'Lista reglas de automatización configuradas (seguimiento, bienvenida, recordatorios).',
    {
      agenteId: z.string().optional(),
      activa: z.boolean().optional().describe('Solo reglas activas'),
      limit: z.number().optional(),
    },
    async ({ agenteId, activa, limit }) => {
      const filter = {};
      if (agenteId) filter.agenteId = agenteId;
      if (activa !== undefined) filter.activa = activa;
      const items = await AutomationRule().find(filter)
        .sort({ createdAt: -1 })
        .limit(Math.min(Math.max(Number(limit) || 20, 1), 50))
        .lean();
      return { content: [{ type: 'text', text: JSON.stringify({ count: items.length, items }, null, 2) }] };
    }
  );

  server.tool(
    'create_automation',
    'Crea una nueva regla de automatización.',
    {
      nombre: z.string().describe('Nombre de la regla'),
      descripcion: z.string().optional(),
      trigger: z.string().describe('JSON del trigger: {evento, diasDespues, horaEjecucion}'),
      accion: z.string().describe('JSON de la acción: {plantillaTitulo, plantillaMensaje, prioridad}'),
      agenteId: z.string().optional(),
    },
    async ({ nombre, descripcion, trigger, accion, agenteId }) => {
      if (!nombre) return { content: [{ type: 'text', text: 'nombre requerido' }], isError: true };
      let triggerObj, accionObj;
      try { triggerObj = JSON.parse(trigger); } catch { return { content: [{ type: 'text', text: 'trigger debe ser JSON válido' }], isError: true }; }
      try { accionObj = JSON.parse(accion); } catch { return { content: [{ type: 'text', text: 'accion debe ser JSON válido' }], isError: true }; }
      const doc = {
        nombre, descripcion: descripcion || '',
        trigger: triggerObj, accion: accionObj,
        activa: true,
      };
      if (agenteId) doc.agenteId = agenteId;
      const created = await AutomationRule().create(doc);
      return { content: [{ type: 'text', text: JSON.stringify(created.toObject(), null, 2) }] };
    }
  );

  server.tool(
    'toggle_automation',
    'Activa o desactiva una regla de automatización.',
    {
      automationId: z.string().describe('ID de la regla'),
      activa: z.boolean().describe('true = activar, false = desactivar'),
    },
    async ({ automationId, activa }) => {
      const updated = await AutomationRule().findByIdAndUpdate(automationId, { $set: { activa } }, { new: true }).lean();
      if (!updated) return { content: [{ type: 'text', text: 'Regla no encontrada' }], isError: true };
      return { content: [{ type: 'text', text: JSON.stringify(updated, null, 2) }] };
    }
  );

  server.tool(
    'list_fechas_importantes',
    'Lista las fechas importantes/feriados configurados para automatización.',
    {
      activa: z.boolean().optional(),
    },
    async ({ activa }) => {
      const filter = {};
      if (activa !== undefined) filter.activa = activa;
      const items = await FechaImportante().find(filter).sort({ fecha: 1 }).lean();
      return { content: [{ type: 'text', text: JSON.stringify({ count: items.length, items }, null, 2) }] };
    }
  );
}

module.exports = { registerAutomationTools };
