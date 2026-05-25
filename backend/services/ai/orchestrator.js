/**
 * AI Orchestrator — Procesa mensajes del usuario y coordina el ciclo LLM → Tool → Approval.
 */

const AIConversation  = require('../../models/AIConversation');
const AIMessage       = require('../../models/AIMessage');
const AIToolExecution = require('../../models/AIToolExecution');

const { chatCompletion }          = require('./providerAbstraction');
const { getAllToolDefinitions, getToolMeta } = require('./toolRegistry');
const { validateToolInput }       = require('./toolValidator');
const { buildSystemPrompt }       = require('./contextManager');
const { executeApprovedTool }     = require('./toolExecutor');
const { logAIAction }             = require('./auditLogger');
const { eventBus }                = require('../../utils/eventBus');

const HISTORY_LIMIT = 20;

async function processMessage({
  conversationId,
  userMessage,
  userId,
  agenteId,
  permissions,
  io,
  sessionId,
  ipAddress,
}) {
  // ── 1. Verificar conversación ─────────────────────────────────────────────
  const conversation = await AIConversation.findById(conversationId);
  if (!conversation) throw new Error('Conversation not found');

  // ── 2. Persistir mensaje del usuario ──────────────────────────────────────
  const userMsg = await AIMessage.create({
    conversationId: conversation._id,
    userId,
    agenteId,
    role:    'user',
    content: userMessage,
  });

  // ── 3. Cargar historial (últimos N mensajes) ───────────────────────────────
  const history = await AIMessage.find({
    conversationId: conversation._id,
    role: { $in: ['user', 'assistant'] },
    isComplete: true,
  })
    .sort({ createdAt: 1 })
    .limit(HISTORY_LIMIT)
    .lean();

  const messages = [
    {
      role:    'system',
      content: buildSystemPrompt({ conversation, agenteId, permissions }),
    },
    ...history.map((m) => ({ role: m.role, content: m.content || '' })),
  ];

  // ── 4. Obtener tools según permisos ───────────────────────────────────────
  const tools = getAllToolDefinitions(permissions);

  // ── 5. Llamar al LLM ──────────────────────────────────────────────────────
  let llmResponse;
  try {
    llmResponse = await chatCompletion({
      messages,
      tools,
      userId,
      agenteId,
      conversationId: conversation._id,
    });
  } catch (err) {
    eventBus.emitAsync('ai.provider.failed', { error: err.message, userId });
    // Persistir mensaje de error
    await AIMessage.create({
      conversationId: conversation._id,
      userId,
      agenteId,
      role:    'assistant',
      content: `Lo siento, el servicio de AI no está disponible en este momento. Error: ${err.message}`,
    });
    throw err;
  }

  const assistantMsg  = llmResponse.choices[0].message;
  const finishReason  = llmResponse.choices[0].finish_reason;
  const assistantText = assistantMsg.content || '';

  // ── 6. Persistir respuesta del assistant ──────────────────────────────────
  const savedAssistant = await AIMessage.create({
    conversationId: conversation._id,
    userId,
    agenteId,
    role:       'assistant',
    content:    assistantText,
    provider:   llmResponse.provider,
    tokensUsed: llmResponse.usage?.total_tokens || 0,
  });

  // ── 7. Procesar tool calls ────────────────────────────────────────────────
  const toolResults = [];

  if (finishReason === 'tool_calls' && assistantMsg.tool_calls?.length > 0) {
    for (const toolCall of assistantMsg.tool_calls) {
      const toolName = toolCall.function.name;
      let toolInput;
      try {
        toolInput = JSON.parse(toolCall.function.arguments || '{}');
      } catch {
        toolInput = {};
      }

      const toolMeta = getToolMeta(toolName);
      if (!toolMeta) {
        toolResults.push({ toolName, error: 'Tool not registered', status: 'failed' });
        continue;
      }

      // Validar input
      const validationError = validateToolInput(toolName, toolInput);
      if (validationError) {
        toolResults.push({ toolName, error: validationError, status: 'validation_failed' });
        continue;
      }

      // Crear registro de ejecución
      const execution = await AIToolExecution.create({
        conversationId:   conversation._id,
        messageId:        savedAssistant._id,
        userId,
        agenteId,
        isAdmin:          (permissions || []).includes('admin:all'),
        toolName,
        toolInput,
        requiresApproval: toolMeta.requiresApproval,
        approvalStatus:   toolMeta.requiresApproval ? 'pending' : 'auto_approved',
        status:           'pending',
        isRollbackable:   toolMeta.rollbackable || false,
        sessionId:        sessionId || '',
        ipAddress:        ipAddress || '',
      });

      // Audit log de solicitud
      await logAIAction({
        type:          'tool_requested',
        toolName,
        toolInput,
        userId,
        agenteId,
        executionId:   execution._id,
        conversationId: conversation._id,
      });

      if (toolMeta.requiresApproval) {
        // Notificar frontend para aprobación humana
        if (io) {
          io.to(`user:${userId}`).emit('ai:approval_required', {
            executionId:    execution._id.toString(),
            conversationId: conversation._id.toString(),
            toolName,
            toolInput,
            message: `El AI solicita ejecutar: ${toolName}`,
          });
        }
        toolResults.push({
          toolName,
          executionId: execution._id,
          status:      'awaiting_approval',
        });
      } else {
        // Auto-ejecutar (solo read-only tools)
        try {
          const result = await executeApprovedTool(execution._id.toString(), 'auto');
          toolResults.push({ toolName, result, status: 'executed' });
        } catch (err) {
          toolResults.push({ toolName, error: err.message, status: 'failed' });
        }
      }
    }
  }

  // ── 8. Actualizar conversación ────────────────────────────────────────────
  await AIConversation.findByIdAndUpdate(conversation._id, {
    $inc: {
      messageCount:    2,
      totalTokensUsed: llmResponse.usage?.total_tokens || 0,
    },
    $set: { lastMessageAt: new Date() },
  });

  eventBus.emitAsync('ai.message.completed', { conversationId: conversation._id, userId });

  return {
    conversationId:    conversation._id,
    userMessageId:     userMsg._id,
    assistantMessageId: savedAssistant._id,
    content:           assistantText,
    toolResults,
    usage:             llmResponse.usage,
    provider:          llmResponse.provider,
    finishReason,
  };
}

module.exports = { processMessage };
