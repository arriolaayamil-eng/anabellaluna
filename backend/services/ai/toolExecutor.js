/**
 * Tool Executor — Ejecuta tools aprobadas con rollback y audit log.
 *
 * FLUJO CRÍTICO:
 * 1. Verificar que la ejecución existe y está aprobada
 * 2. Capturar estado anterior (para rollback si aplica)
 * 3. Ejecutar con el service correcto
 * 4. Persistir resultado
 * 5. Emitir evento
 */

const AIToolExecution = require('../../models/AIToolExecution');
const { logAIAction } = require('./auditLogger');
const { eventBus }   = require('../../utils/eventBus');

// ── Lazy-load para evitar circular dependencies ───────────────────────────────

function getMetaAds() {
  return require('./integrations/metaAds');
}

function getCRMService() {
  return require('./integrations/crmContext');
}

function getRecommendationService() {
  return require('./recommendationService');
}

// ── Dispatch map ──────────────────────────────────────────────────────────────

async function dispatch(toolName, toolInput, execution) {
  const meta = getMetaAds();
  const crm  = getCRMService();
  const recs = getRecommendationService();

  const ctx = {
    agenteId:       execution.agenteId || '',
    inmobiliariaId: '',
    generatedBy:    execution.userId,
  };

  switch (toolName) {
    case 'get_campaigns':
      return meta.getCampaigns(toolInput);

    case 'get_campaign_metrics':
      return meta.getCampaignMetrics(toolInput);

    case 'update_campaign_budget':
      return meta.updateCampaignBudget(toolInput);

    case 'pause_campaign':
      return meta.pauseCampaign(toolInput);

    case 'resume_campaign':
      return meta.resumeCampaign(toolInput);

    case 'generate_recommendation':
      return recs.createRecommendation({ ...toolInput, ...ctx });

    case 'get_crm_summary':
      return crm.getSummary(toolInput);

    default:
      throw new Error(`No executor found for tool: ${toolName}`);
  }
}

// ── Rollback capture ──────────────────────────────────────────────────────────

async function captureRollbackData(toolName, toolInput) {
  const meta = getMetaAds();

  if (toolName === 'update_campaign_budget') {
    try {
      const current = await meta.getCampaignCurrentBudget(toolInput.campaignId);
      return { campaignId: toolInput.campaignId, previousBudget: current.budget, previousBudgetType: current.type };
    } catch {
      return null;
    }
  }

  if (toolName === 'pause_campaign' || toolName === 'resume_campaign') {
    try {
      const current = await meta.getCampaignStatus(toolInput.campaignId);
      return { campaignId: toolInput.campaignId, previousStatus: current.status };
    } catch {
      return null;
    }
  }

  return null;
}

async function performRollback(toolName, rollbackData) {
  if (!rollbackData) return;
  const meta = getMetaAds();

  if (toolName === 'update_campaign_budget' && rollbackData.previousBudget) {
    await meta.updateCampaignBudget({
      campaignId: rollbackData.campaignId,
      newBudget:  rollbackData.previousBudget,
      reason:     'Rollback automático',
    });
  }

  if (toolName === 'pause_campaign' && rollbackData.previousStatus === 'ACTIVE') {
    await meta.resumeCampaign({ campaignId: rollbackData.campaignId });
  }

  if (toolName === 'resume_campaign' && rollbackData.previousStatus === 'PAUSED') {
    await meta.pauseCampaign({ campaignId: rollbackData.campaignId, reason: 'Rollback automático' });
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

async function executeApprovedTool(executionId, approvedBy) {
  const execution = await AIToolExecution.findById(executionId);
  if (!execution) throw new Error('Execution not found');

  if (execution.status !== 'pending' && execution.status !== 'queued') {
    throw new Error(`Cannot execute: current status is '${execution.status}'`);
  }
  if (!['approved', 'auto_approved'].includes(execution.approvalStatus)) {
    throw new Error(`Execution not approved (status: ${execution.approvalStatus})`);
  }

  await AIToolExecution.findByIdAndUpdate(executionId, {
    $set: {
      status:     'executing',
      startedAt:  new Date(),
      approvedBy,
      approvedAt: new Date(),
    },
  });

  // Capturar estado anterior si es rollbackable
  let rollbackData = null;
  if (execution.isRollbackable) {
    rollbackData = await captureRollbackData(execution.toolName, execution.toolInput);
  }

  try {
    const result = await dispatch(execution.toolName, execution.toolInput, execution);

    await AIToolExecution.findByIdAndUpdate(executionId, {
      $set: {
        status:       'completed',
        toolOutput:   result,
        completedAt:  new Date(),
        rollbackData,
      },
    });

    await logAIAction({
      type:          'tool_executed',
      toolName:      execution.toolName,
      toolInput:     execution.toolInput,
      toolOutput:    result,
      userId:        execution.userId,
      agenteId:      execution.agenteId,
      executionId:   executionId,
      conversationId: execution.conversationId,
    });

    eventBus.emitAsync('ai.tool.executed', {
      executionId: executionId.toString(),
      toolName:    execution.toolName,
      userId:      execution.userId,
      success:     true,
    });

    return result;

  } catch (err) {
    await AIToolExecution.findByIdAndUpdate(executionId, {
      $set: {
        status:       'failed',
        errorMessage: err.message,
        completedAt:  new Date(),
      },
    });

    await logAIAction({
      type:        'tool_failed',
      toolName:    execution.toolName,
      toolInput:   execution.toolInput,
      error:       err.message,
      userId:      execution.userId,
      agenteId:    execution.agenteId,
      executionId: executionId,
    });

    eventBus.emitAsync('ai.tool.executed', {
      executionId: executionId.toString(),
      toolName:    execution.toolName,
      userId:      execution.userId,
      success:     false,
      error:       err.message,
    });

    throw err;
  }
}

async function rejectTool(executionId, rejectedBy, reason) {
  await AIToolExecution.findByIdAndUpdate(executionId, {
    $set: {
      approvalStatus:  'rejected',
      rejectionReason: reason || 'Rechazado por el usuario',
      status:          'pending',
    },
  });

  await logAIAction({
    type:        'tool_rejected',
    executionId,
    rejectedBy,
    reason,
  });
}

async function rollbackExecution(executionId, rolledBackBy) {
  const execution = await AIToolExecution.findById(executionId);
  if (!execution)                  throw new Error('Execution not found');
  if (!execution.isRollbackable)   throw new Error('Execution is not rollbackable');
  if (execution.status !== 'completed') throw new Error('Can only rollback completed executions');
  if (!execution.rollbackData)     throw new Error('No rollback data available');

  await performRollback(execution.toolName, execution.rollbackData);

  await AIToolExecution.findByIdAndUpdate(executionId, {
    $set: {
      status:        'rolled_back',
      rolledBackAt:  new Date(),
      rolledBackBy,
    },
  });

  await logAIAction({
    type:        'tool_rolled_back',
    toolName:    execution.toolName,
    executionId,
    rolledBackBy,
    userId:      execution.userId,
  });

  return { success: true, executionId };
}

module.exports = { executeApprovedTool, rejectTool, rollbackExecution };
