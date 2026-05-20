/**
 * Audit Logger para acciones AI.
 * Reutiliza el modelo SecurityEvent existente extendiéndolo con el tipo 'ai_action'.
 */

const SecurityEvent = require('../../models/SecurityEvent');

// Extender el enum de SecurityEvent en runtime para soportar 'ai_action'
// sin romper el schema existente (los enums de Mongoose son validaciones,
// podemos bypasarlos con { strict: false } o agregando el valor al schema).
// Usamos una inserción directa con runValidators: false para compatibilidad.

async function logAIAction({
  type,
  toolName,
  toolInput,
  toolOutput,
  error,
  userId,
  agenteId,
  executionId,
  conversationId,
  rejectedBy,
  reason,
  rolledBackBy,
  ip,
  userAgent,
}) {
  try {
    // Usar insertOne directo para evitar validación del enum (compatibilidad)
    await SecurityEvent.collection.insertOne({
      userId: userId || 'system',
      event: 'ai_action',
      result: error ? 'failure' : 'success',
      ip: ip || '',
      userAgent: userAgent || '',
      metadata: {
        aiActionType: type,
        toolName: toolName || null,
        toolInput: toolInput ? JSON.stringify(toolInput).substring(0, 1000) : null,
        toolOutput: toolOutput ? JSON.stringify(toolOutput).substring(0, 500) : null,
        error: error || null,
        agenteId: agenteId || null,
        executionId: executionId ? executionId.toString() : null,
        conversationId: conversationId ? conversationId.toString() : null,
        rejectedBy: rejectedBy || null,
        reason: reason || null,
        rolledBackBy: rolledBackBy || null,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (err) {
    // Audit log NUNCA debe romper el flujo principal
    console.error('[AuditLogger] Failed to log AI action:', err.message);
  }
}

module.exports = { logAIAction };
