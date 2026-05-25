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

function getCRMOperations() {
  return require('./integrations/crmOperations');
}

// ── Dispatch map ──────────────────────────────────────────────────────────────

async function dispatch(toolName, toolInput, execution) {
  const meta = getMetaAds();
  const crm  = getCRMService();
  const recs = getRecommendationService();
  const ops  = getCRMOperations();

  const ctx = {
    agenteId:       execution.agenteId || '',
    userId:         execution.userId,
    isAdmin:        !!execution.isAdmin,
    inmobiliariaId: '',
    generatedBy:    execution.userId,
  };

  switch (toolName) {
    // ── Marketing / Meta ─────────────────────────────────────────────────────
    case 'get_campaigns':           return meta.getCampaigns(toolInput);
    case 'get_campaign_metrics':    return meta.getCampaignMetrics(toolInput);
    case 'update_campaign_budget':  return meta.updateCampaignBudget(toolInput);
    case 'pause_campaign':          return meta.pauseCampaign(toolInput);
    case 'resume_campaign':         return meta.resumeCampaign(toolInput);
    case 'generate_recommendation': return recs.createRecommendation({ ...toolInput, ...ctx });

    // ── CRM Context ──────────────────────────────────────────────────────────
    case 'get_crm_summary':         return crm.getSummary(toolInput);

    // ── CRM — Clientes ───────────────────────────────────────────────────────
    case 'search_clientes':         return ops.searchClientes(toolInput, ctx);
    case 'get_cliente_detail':      return ops.getClienteDetail(toolInput, ctx);
    case 'create_cliente':          return ops.createCliente(toolInput, ctx);
    case 'update_cliente':          return ops.updateCliente(toolInput, ctx);

    // ── CRM — Propiedades ────────────────────────────────────────────────────
    case 'search_propiedades':      return ops.searchPropiedades(toolInput, ctx);
    case 'get_propiedad_detail':    return ops.getPropiedadDetail(toolInput, ctx);
    case 'update_propiedad':        return ops.updatePropiedad(toolInput, ctx);

    // ── CRM — Agenda ─────────────────────────────────────────────────────────
    case 'list_citas':              return ops.listCitas(toolInput, ctx);
    case 'create_cita':             return ops.createCita(toolInput, ctx);
    case 'update_cita':             return ops.updateCita(toolInput, ctx);
    case 'cancel_cita':             return ops.cancelCita(toolInput, ctx);

    // ── CRM — Operaciones ────────────────────────────────────────────────────
    case 'list_operaciones':        return ops.listOperaciones(toolInput, ctx);

    // ── CRM — Tareas ─────────────────────────────────────────────────────────
    case 'list_tareas':             return ops.listTareas(toolInput, ctx);
    case 'create_tarea':            return ops.createTarea(toolInput, ctx);
    case 'update_tarea_status':     return ops.updateTareaStatus(toolInput, ctx);

    // ── CRM — Actividades / Notifs ───────────────────────────────────────────
    case 'log_activity':            return ops.logActivity(toolInput, ctx);
    case 'list_notifications':      return ops.listNotifications(toolInput, ctx);

    // ── Métricas / Agentes ───────────────────────────────────────────────────
    case 'get_dashboard_metrics':   return ops.getDashboardMetrics(toolInput, ctx);
    case 'list_agentes':            return ops.listAgentes(toolInput, ctx);

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

  // CRM cita rollback: capture current state before modification
  if (toolName === 'update_cita' || toolName === 'cancel_cita') {
    try {
      const Cita = require('../../models/Cita');
      const id = toolInput.citaId;
      const current = await Cita.findById(id).lean();
      if (current) return { type: 'cita', citaId: id, previousState: current };
    } catch { /* noop */ }
    return null;
  }

  // create_cita rollback: after creation we store the ID so we can delete it
  if (toolName === 'create_cita') {
    return { type: 'cita_create' };
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

  // CRM cita rollback
  if (rollbackData.type === 'cita' && rollbackData.previousState) {
    const Cita = require('../../models/Cita');
    const { _id, createdAt, updatedAt, __v, ...fields } = rollbackData.previousState;
    await Cita.findByIdAndUpdate(rollbackData.citaId, { $set: fields });
  }

  if (rollbackData.type === 'cita_create' && rollbackData.createdId) {
    const Cita = require('../../models/Cita');
    await Cita.findByIdAndDelete(rollbackData.createdId);
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

    // For create_cita rollback, store the created ID
    if (rollbackData && rollbackData.type === 'cita_create' && result && result._id) {
      rollbackData.createdId = String(result._id);
    }

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
