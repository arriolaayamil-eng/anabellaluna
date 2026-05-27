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

  // ── CRM — Clientes ─────────────────────────────────────────────────────────
  search_clientes: {
    definition: {
      type: 'function',
      function: {
        name: 'search_clientes',
        description: 'Busca clientes por nombre, email, teléfono o dirección. Devuelve hasta 50 resultados ordenados por última actualización.',
        parameters: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'Texto libre a buscar (opcional).' },
            limit: { type: 'number', description: 'Máximo de resultados (1-50, default 20).' },
            includeMetadata: { type: 'boolean', description: 'Incluir metadata extendida (default false).' },
          },
        },
      },
    },
    requiredPermissions: ['crm:read'],
    requiresApproval: false, isReadOnly: true, rollbackable: false,
  },

  get_cliente_detail: {
    definition: {
      type: 'function',
      function: {
        name: 'get_cliente_detail',
        description: 'Devuelve la ficha completa de un cliente: datos + sus propiedades + operaciones + citas + actividades.',
        parameters: {
          type: 'object',
          properties: { clienteId: { type: 'string', description: 'Mongo ObjectId del cliente.' } },
          required: ['clienteId'],
        },
      },
    },
    requiredPermissions: ['crm:read'],
    requiresApproval: false, isReadOnly: true, rollbackable: false,
  },

  create_cliente: {
    definition: {
      type: 'function',
      function: {
        name: 'create_cliente',
        description: 'Crea un nuevo cliente en el CRM y lo asigna al agente actual.',
        parameters: {
          type: 'object',
          properties: {
            nombre:   { type: 'string', description: 'Nombre completo.' },
            email:    { type: 'string' },
            telefono: { type: 'string' },
            direccion:{ type: 'string' },
            notas:    { type: 'string' },
          },
          required: ['nombre'],
        },
      },
    },
    requiredPermissions: ['crm:write'],
    requiresApproval: true, isReadOnly: false, rollbackable: false,
  },

  update_cliente: {
    definition: {
      type: 'function',
      function: {
        name: 'update_cliente',
        description: 'Actualiza campos editables de un cliente (nombre, email, teléfono, dirección, notas).',
        parameters: {
          type: 'object',
          properties: {
            clienteId: { type: 'string' },
            updates: {
              type: 'object',
              properties: {
                nombre: { type: 'string' }, email: { type: 'string' },
                telefono: { type: 'string' }, direccion: { type: 'string' }, notas: { type: 'string' },
              },
            },
          },
          required: ['clienteId', 'updates'],
        },
      },
    },
    requiredPermissions: ['crm:write'],
    requiresApproval: true, isReadOnly: false, rollbackable: false,
  },

  // ── CRM — Propiedades ──────────────────────────────────────────────────────
  search_propiedades: {
    definition: {
      type: 'function',
      function: {
        name: 'search_propiedades',
        description: 'Busca propiedades con filtros: texto, estado, publicación, destacada, rango de precio.',
        parameters: {
          type: 'object',
          properties: {
            query:    { type: 'string' },
            status:   { type: 'string', enum: ['Disponible', 'Reservada', 'Vendida', 'Alquilada'] },
            published:{ type: 'boolean' },
            featured: { type: 'boolean' },
            minPrice: { type: 'number' },
            maxPrice: { type: 'number' },
            limit:    { type: 'number' },
          },
        },
      },
    },
    requiredPermissions: ['crm:read'],
    requiresApproval: false, isReadOnly: true, rollbackable: false,
  },

  get_propiedad_detail: {
    definition: {
      type: 'function',
      function: {
        name: 'get_propiedad_detail',
        description: 'Detalle completo de una propiedad: datos + dueño + operaciones + citas asociadas.',
        parameters: {
          type: 'object',
          properties: { propiedadId: { type: 'string' } },
          required: ['propiedadId'],
        },
      },
    },
    requiredPermissions: ['crm:read'],
    requiresApproval: false, isReadOnly: true, rollbackable: false,
  },

  update_propiedad: {
    definition: {
      type: 'function',
      function: {
        name: 'update_propiedad',
        description: 'Actualiza campos editables de una propiedad (título, descripción, precio, estado, publicación).',
        parameters: {
          type: 'object',
          properties: {
            propiedadId: { type: 'string' },
            updates: {
              type: 'object',
              properties: {
                title:       { type: 'string' }, description: { type: 'string' },
                address:     { type: 'string' }, price:       { type: 'number' },
                moneda:      { type: 'string' },
                status:      { type: 'string', enum: ['Disponible', 'Reservada', 'Vendida', 'Alquilada'] },
                published:   { type: 'boolean' }, featured: { type: 'boolean' },
              },
            },
          },
          required: ['propiedadId', 'updates'],
        },
      },
    },
    requiredPermissions: ['crm:write'],
    requiresApproval: true, isReadOnly: false, rollbackable: false,
  },

  // ── CRM — Agenda / Citas ───────────────────────────────────────────────────
  list_citas: {
    definition: {
      type: 'function',
      function: {
        name: 'list_citas',
        description: 'Lista citas/visitas/reuniones agendadas, con filtros por fecha, estado, cliente o propiedad. Soporta consultas tipo "qué tengo agendado hoy/esta semana".',
        parameters: {
          type: 'object',
          properties: {
            from:   { type: 'string', description: 'Fecha desde (ISO 8601).' },
            to:     { type: 'string', description: 'Fecha hasta (ISO 8601).' },
            estado: { type: 'string', enum: ['Programada', 'Completada', 'Cancelada'] },
            clienteId:   { type: 'string' },
            propiedadId: { type: 'string' },
            limit:  { type: 'number' },
          },
        },
      },
    },
    requiredPermissions: ['crm:read'],
    requiresApproval: false, isReadOnly: true, rollbackable: false,
  },

  create_cita: {
    definition: {
      type: 'function',
      function: {
        name: 'create_cita',
        description: 'Agenda una nueva cita (visita, llamada, reunión). Usar inmediatamente cuando el usuario pide agendar/crear una cita y dio fecha/hora suficiente; no requiere segunda confirmación. Si el agente tiene Google Calendar conectado, se sincroniza automáticamente.',
        parameters: {
          type: 'object',
          properties: {
            fecha:     { type: 'string', description: 'Fecha/hora de inicio (ISO 8601).' },
            fechaFin:  { type: 'string', description: 'Fecha/hora de fin (ISO 8601, opcional).' },
            titulo:    { type: 'string' },
            tipo:      { type: 'string', description: 'Visita, Llamada, Reunión, Firma, etc.' },
            ubicacion: { type: 'string' },
            clienteId:   { type: 'string' },
            propiedadId: { type: 'string' },
            notas:     { type: 'string' },
          },
          required: ['fecha'],
        },
      },
    },
    requiredPermissions: ['crm:write'],
    requiresApproval: true, isReadOnly: false, rollbackable: true,
  },

  update_cita: {
    definition: {
      type: 'function',
      function: {
        name: 'update_cita',
        description: 'Modifica una cita existente (cambiar fecha, ubicación, notas, estado).',
        parameters: {
          type: 'object',
          properties: {
            citaId: { type: 'string' },
            updates: {
              type: 'object',
              properties: {
                fecha: { type: 'string' }, fechaFin: { type: 'string' },
                titulo: { type: 'string' }, tipo: { type: 'string' },
                ubicacion: { type: 'string' }, notas: { type: 'string' },
                estado: { type: 'string', enum: ['Programada', 'Completada', 'Cancelada'] },
                clienteId: { type: 'string' }, propiedadId: { type: 'string' },
              },
            },
          },
          required: ['citaId', 'updates'],
        },
      },
    },
    requiredPermissions: ['crm:write'],
    requiresApproval: true, isReadOnly: false, rollbackable: true,
  },

  cancel_cita: {
    definition: {
      type: 'function',
      function: {
        name: 'cancel_cita',
        description: 'Cancela una cita (marca estado=Cancelada).',
        parameters: {
          type: 'object',
          properties: {
            citaId: { type: 'string' },
            reason: { type: 'string', description: 'Motivo de cancelación.' },
          },
          required: ['citaId'],
        },
      },
    },
    requiredPermissions: ['crm:write'],
    requiresApproval: true, isReadOnly: false, rollbackable: true,
  },

  // ── CRM — Operaciones ──────────────────────────────────────────────────────
  list_operaciones: {
    definition: {
      type: 'function',
      function: {
        name: 'list_operaciones',
        description: 'Lista operaciones (ventas, alquileres, reservas) con filtros opcionales.',
        parameters: {
          type: 'object',
          properties: {
            tipo:   { type: 'string', enum: ['Venta', 'Alquiler', 'Reserva'] },
            estado: { type: 'string' },
            from:   { type: 'string' }, to: { type: 'string' },
            clienteId:   { type: 'string' },
            propiedadId: { type: 'string' },
            limit:  { type: 'number' },
          },
        },
      },
    },
    requiredPermissions: ['crm:read'],
    requiresApproval: false, isReadOnly: true, rollbackable: false,
  },

  // ── CRM — Tareas ───────────────────────────────────────────────────────────
  list_tareas: {
    definition: {
      type: 'function',
      function: {
        name: 'list_tareas',
        description: 'Lista tareas pendientes del agente actual (o de cualquiera si es admin).',
        parameters: {
          type: 'object',
          properties: {
            status:   { type: 'string', enum: ['pendiente', 'en_progreso', 'en_revision', 'completada', 'cancelada'] },
            priority: { type: 'string', enum: ['urgente', 'alta', 'media', 'baja'] },
            assigneeId: { type: 'string' },
            limit:    { type: 'number' },
          },
        },
      },
    },
    requiredPermissions: ['crm:read'],
    requiresApproval: false, isReadOnly: true, rollbackable: false,
  },

  create_tarea: {
    definition: {
      type: 'function',
      function: {
        name: 'create_tarea',
        description: 'Crea una nueva tarea para el agente actual (o asignada a otro).',
        parameters: {
          type: 'object',
          properties: {
            title:       { type: 'string' }, description: { type: 'string' },
            dueDate:     { type: 'string', description: 'Fecha límite ISO 8601.' },
            priority:    { type: 'string', enum: ['urgente', 'alta', 'media', 'baja'] },
            assigneeId:  { type: 'string' },
            clienteId:   { type: 'string' },
            propiedadId: { type: 'string' },
          },
          required: ['title'],
        },
      },
    },
    requiredPermissions: ['crm:write'],
    requiresApproval: true, isReadOnly: false, rollbackable: false,
  },

  update_tarea_status: {
    definition: {
      type: 'function',
      function: {
        name: 'update_tarea_status',
        description: 'Actualiza el estado de una tarea (ej. marcarla como completada).',
        parameters: {
          type: 'object',
          properties: {
            tareaId: { type: 'string' },
            status:  { type: 'string', enum: ['pendiente', 'en_progreso', 'en_revision', 'completada', 'cancelada'] },
          },
          required: ['tareaId', 'status'],
        },
      },
    },
    requiredPermissions: ['crm:write'],
    requiresApproval: true, isReadOnly: false, rollbackable: false,
  },

  // ── CRM — Actividades / Notificaciones ─────────────────────────────────────
  log_activity: {
    definition: {
      type: 'function',
      function: {
        name: 'log_activity',
        description: 'Registra una actividad (llamada, email, nota, visita) en la línea de tiempo del cliente/propiedad.',
        parameters: {
          type: 'object',
          properties: {
            clientId:   { type: 'string' },
            propertyId: { type: 'string' },
            type:       { type: 'string', description: 'Ej: call, email, whatsapp, note, visit.' },
            notes:      { type: 'string' },
          },
        },
      },
    },
    requiredPermissions: ['crm:write'],
    requiresApproval: true, isReadOnly: false, rollbackable: false,
  },

  list_notifications: {
    definition: {
      type: 'function',
      function: {
        name: 'list_notifications',
        description: 'Lista las notificaciones del agente actual (recordatorios, alertas, automatizaciones).',
        parameters: {
          type: 'object',
          properties: {
            unreadOnly: { type: 'boolean' },
            limit: { type: 'number' },
          },
        },
      },
    },
    requiredPermissions: ['crm:read'],
    requiresApproval: false, isReadOnly: true, rollbackable: false,
  },

  // ── Métricas / Dashboard ───────────────────────────────────────────────────
  get_dashboard_metrics: {
    definition: {
      type: 'function',
      function: {
        name: 'get_dashboard_metrics',
        description: 'KPIs consolidados del CRM/ERP: clientes, propiedades, operaciones, agenda, tareas, montos y comisiones del período.',
        parameters: {
          type: 'object',
          properties: {
            period: {
              type: 'string',
              enum: ['today', 'last_7d', 'last_30d', 'last_90d', 'this_month'],
              description: 'Período de análisis (default last_30d).',
            },
          },
        },
      },
    },
    requiredPermissions: ['crm:read'],
    requiresApproval: false, isReadOnly: true, rollbackable: false,
  },

  // ── Agentes (admin) ────────────────────────────────────────────────────────
  list_agentes: {
    definition: {
      type: 'function',
      function: {
        name: 'list_agentes',
        description: 'Lista los agentes inmobiliarios. Solo disponible para administradores.',
        parameters: {
          type: 'object',
          properties: { limit: { type: 'number' } },
        },
      },
    },
    requiredPermissions: ['admin:all'],
    requiresApproval: false, isReadOnly: true, rollbackable: false,
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
