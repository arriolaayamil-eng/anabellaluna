/**
 * Tool Registry — Define todas las tools disponibles para el LLM.
 *
 * IMPORTANTE: El LLM solo puede SOLICITAR una tool.
 * La ejecución siempre pasa por toolExecutor con RBAC + aprobación humana.
 */

const TOOLS = {
  // ── Meta Ads — Read ────────────────────────────────────────────────────────
  get_campaigns: {
    definition: {
      type: 'function',
      function: {
        name: 'get_campaigns',
        description: 'Obtiene la lista de campañas de Meta Ads con su estado y métricas básicas.',
        parameters: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['ACTIVE', 'PAUSED', 'ALL'],
              description: 'Filtrar por estado. Default: ALL',
            },
            limit: {
              type: 'number',
              description: 'Máximo de campañas a retornar (default: 10, max: 50)',
            },
          },
        },
      },
    },
    requiredPermissions: ['marketing:read'],
    requiresApproval:    false,
    isReadOnly:          true,
    rollbackable:        false,
  },

  get_campaign_metrics: {
    definition: {
      type: 'function',
      function: {
        name: 'get_campaign_metrics',
        description: 'Obtiene métricas detalladas de una campaña: ROAS, CTR, CPC, CPL, CPM, impresiones, alcance, gasto.',
        parameters: {
          type: 'object',
          properties: {
            campaignId: {
              type: 'string',
              description: 'ID externo de la campaña en Meta Ads',
            },
            dateRange: {
              type: 'string',
              enum: ['today', 'last_7d', 'last_30d', 'last_90d', 'this_month'],
              description: 'Período de análisis (default: last_7d)',
            },
          },
          required: ['campaignId'],
        },
      },
    },
    requiredPermissions: ['marketing:read'],
    requiresApproval:    false,
    isReadOnly:          true,
    rollbackable:        false,
  },

  // ── Meta Ads — Write ───────────────────────────────────────────────────────
  update_campaign_budget: {
    definition: {
      type: 'function',
      function: {
        name: 'update_campaign_budget',
        description: 'Modifica el presupuesto de una campaña. Puede especificarse un monto fijo o un porcentaje de aumento/reducción.',
        parameters: {
          type: 'object',
          properties: {
            campaignId: {
              type: 'string',
              description: 'ID externo de la campaña en Meta Ads',
            },
            newBudget: {
              type: 'number',
              description: 'Nuevo presupuesto diario en ARS (usa este O increasePercent, no ambos)',
            },
            increasePercent: {
              type: 'number',
              description: 'Porcentaje de cambio respecto al presupuesto actual. Positivo = aumento, negativo = reducción. Ej: 20 = +20%, -10 = -10%',
            },
            reason: {
              type: 'string',
              description: 'Motivo del cambio de presupuesto (para auditoría)',
            },
          },
          required: ['campaignId'],
        },
      },
    },
    requiredPermissions: ['marketing:write'],
    requiresApproval:    true,
    isReadOnly:          false,
    rollbackable:        true,
  },

  pause_campaign: {
    definition: {
      type: 'function',
      function: {
        name: 'pause_campaign',
        description: 'Pausa una campaña activa en Meta Ads.',
        parameters: {
          type: 'object',
          properties: {
            campaignId: {
              type: 'string',
              description: 'ID externo de la campaña en Meta Ads',
            },
            reason: {
              type: 'string',
              description: 'Motivo de la pausa (para auditoría)',
            },
          },
          required: ['campaignId'],
        },
      },
    },
    requiredPermissions: ['marketing:write'],
    requiresApproval:    true,
    isReadOnly:          false,
    rollbackable:        true,
  },

  resume_campaign: {
    definition: {
      type: 'function',
      function: {
        name: 'resume_campaign',
        description: 'Reactiva una campaña pausada en Meta Ads.',
        parameters: {
          type: 'object',
          properties: {
            campaignId: {
              type: 'string',
              description: 'ID externo de la campaña en Meta Ads',
            },
          },
          required: ['campaignId'],
        },
      },
    },
    requiredPermissions: ['marketing:write'],
    requiresApproval:    true,
    isReadOnly:          false,
    rollbackable:        true,
  },

  // ── AI Recommendations ─────────────────────────────────────────────────────
  generate_recommendation: {
    definition: {
      type: 'function',
      function: {
        name: 'generate_recommendation',
        description: 'Genera y persiste una recomendación estratégica de marketing basada en el análisis de métricas.',
        parameters: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['budget_optimization', 'audience_targeting', 'creative_refresh', 'bid_strategy', 'general'],
              description: 'Tipo de recomendación',
            },
            priority: {
              type: 'string',
              enum: ['critical', 'high', 'medium', 'low'],
              description: 'Prioridad de la recomendación',
            },
            title:   { type: 'string', description: 'Título conciso de la recomendación' },
            body:    { type: 'string', description: 'Descripción detallada con contexto y justificación' },
            actions: {
              type: 'array',
              items: { type: 'string' },
              description: 'Lista de acciones concretas sugeridas',
            },
            campaignIds: {
              type: 'array',
              items: { type: 'string' },
              description: 'IDs externos de campañas relacionadas',
            },
          },
          required: ['type', 'title', 'body'],
        },
      },
    },
    requiredPermissions: ['marketing:read'],
    requiresApproval:    false,
    isReadOnly:          false,
    rollbackable:        false,
  },

  // ── CRM Context ────────────────────────────────────────────────────────────
  get_crm_summary: {
    definition: {
      type: 'function',
      function: {
        name: 'get_crm_summary',
        description: 'Obtiene un resumen del CRM: clientes activos, propiedades publicadas, operaciones recientes, citas próximas. Útil para contextualizar estrategias de marketing.',
        parameters: {
          type: 'object',
          properties: {
            period: {
              type: 'string',
              enum: ['today', 'last_7d', 'last_30d', 'this_month'],
              description: 'Período para las métricas del CRM',
            },
          },
        },
      },
    },
    requiredPermissions: ['crm:read'],
    requiresApproval:    false,
    isReadOnly:          true,
    rollbackable:        false,
  },
};

/**
 * Retorna las definiciones de tools filtradas por permisos del usuario.
 */
function getAllToolDefinitions(permissions = []) {
  return Object.values(TOOLS)
    .filter((tool) =>
      tool.requiredPermissions.every((p) => permissions.includes(p))
    )
    .map((tool) => tool.definition);
}

function getToolMeta(toolName) {
  return TOOLS[toolName] || null;
}

function listTools() {
  return Object.entries(TOOLS).map(([name, meta]) => ({
    name,
    isReadOnly:          meta.isReadOnly,
    requiresApproval:    meta.requiresApproval,
    rollbackable:        meta.rollbackable,
    requiredPermissions: meta.requiredPermissions,
  }));
}

module.exports = { getAllToolDefinitions, getToolMeta, listTools, TOOLS };
