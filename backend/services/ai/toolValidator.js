/**
 * Tool Validator — Valida los inputs de cada tool antes de ejecutar.
 */

const VALIDATORS = {
  get_campaigns: (input) => {
    if (input.limit && (input.limit < 1 || input.limit > 50)) {
      return 'limit must be between 1 and 50';
    }
    return null;
  },

  get_campaign_metrics: (input) => {
    if (!input.campaignId || typeof input.campaignId !== 'string') {
      return 'campaignId is required and must be a string';
    }
    if (input.campaignId.trim().length === 0) {
      return 'campaignId cannot be empty';
    }
    return null;
  },

  update_campaign_budget: (input) => {
    if (!input.campaignId) {
      return 'campaignId is required';
    }
    if (input.newBudget === undefined && input.increasePercent === undefined) {
      return 'Either newBudget or increasePercent is required';
    }
    if (input.newBudget !== undefined && input.newBudget <= 0) {
      return 'newBudget must be greater than 0';
    }
    if (input.increasePercent !== undefined && (input.increasePercent < -90 || input.increasePercent > 500)) {
      return 'increasePercent must be between -90 and 500';
    }
    return null;
  },

  pause_campaign: (input) => {
    if (!input.campaignId) return 'campaignId is required';
    return null;
  },

  resume_campaign: (input) => {
    if (!input.campaignId) return 'campaignId is required';
    return null;
  },

  generate_recommendation: (input) => {
    if (!input.type)  return 'type is required';
    if (!input.title) return 'title is required';
    if (!input.body)  return 'body is required';
    if (input.title.length > 200) return 'title cannot exceed 200 characters';
    if (input.body.length > 2000) return 'body cannot exceed 2000 characters';
    return null;
  },

  get_crm_summary: (_input) => null,

  // ── CRM tools ──────────────────────────────────────────────────────────────
  search_clientes:      (i) => (i.limit && (i.limit < 1 || i.limit > 50)) ? 'limit 1-50' : null,
  get_cliente_detail:   (i) => !i.clienteId ? 'clienteId requerido' : null,
  create_cliente:       (i) => !i.nombre || !String(i.nombre).trim() ? 'nombre requerido' : null,
  update_cliente:       (i) => {
    if (!i.clienteId) return 'clienteId requerido';
    if (!i.updates || typeof i.updates !== 'object') return 'updates requerido';
    return null;
  },

  search_propiedades:   (i) => {
    if (i.limit && (i.limit < 1 || i.limit > 50)) return 'limit 1-50';
    if (i.minPrice && i.maxPrice && i.minPrice > i.maxPrice) return 'minPrice > maxPrice';
    return null;
  },
  get_propiedad_detail: (i) => !i.propiedadId ? 'propiedadId requerido' : null,
  update_propiedad:     (i) => {
    if (!i.propiedadId) return 'propiedadId requerido';
    if (!i.updates || typeof i.updates !== 'object') return 'updates requerido';
    return null;
  },

  list_citas:   (i) => (i.limit && (i.limit < 1 || i.limit > 50)) ? 'limit 1-50' : null,
  create_cita:  (i) => {
    if (!i.fecha) return 'fecha requerida';
    if (Number.isNaN(new Date(i.fecha).getTime())) return 'fecha inválida';
    return null;
  },
  update_cita:  (i) => {
    if (!i.citaId) return 'citaId requerido';
    if (!i.updates || typeof i.updates !== 'object') return 'updates requerido';
    return null;
  },
  cancel_cita:  (i) => !i.citaId ? 'citaId requerido' : null,

  list_operaciones: (i) => (i.limit && (i.limit < 1 || i.limit > 50)) ? 'limit 1-50' : null,

  list_tareas:         (i) => (i.limit && (i.limit < 1 || i.limit > 50)) ? 'limit 1-50' : null,
  create_tarea:        (i) => !i.title || !String(i.title).trim() ? 'title requerido' : null,
  update_tarea_status: (i) => {
    if (!i.tareaId) return 'tareaId requerido';
    if (!i.status)  return 'status requerido';
    return null;
  },

  log_activity:       (_i) => null,
  list_notifications: (i)  => (i.limit && (i.limit < 1 || i.limit > 50)) ? 'limit 1-50' : null,
  get_dashboard_metrics: (_i) => null,
  list_agentes:       (i)  => (i.limit && (i.limit < 1 || i.limit > 50)) ? 'limit 1-50' : null,
};

/**
 * Retorna un string con el error de validación, o null si es válido.
 */
function validateToolInput(toolName, toolInput) {
  const validator = VALIDATORS[toolName];
  if (!validator) return `No validator found for tool: ${toolName}`;
  try {
    return validator(toolInput || {});
  } catch (err) {
    return `Validation error: ${err.message}`;
  }
}

module.exports = { validateToolInput };
