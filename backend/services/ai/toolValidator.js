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
