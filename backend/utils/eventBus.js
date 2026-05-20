/**
 * Event Bus ligero basado en Node.js EventEmitter.
 * Compatible con la arquitectura actual Express.js.
 *
 * Futuro: si se necesita distribución entre procesos PM2,
 * reemplazar con Redis pub/sub sin cambiar la interfaz de llamada.
 */

const EventEmitter = require('events');

class AIEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(100);
  }

  /**
   * Emite de forma asíncrona (no bloquea el request actual).
   */
  emitAsync(event, payload) {
    setImmediate(() => this.emit(event, payload));
  }
}

const eventBus = new AIEventBus();

// ── Listeners de observabilidad ───────────────────────────────────────────────

eventBus.on('ai.tool.executed', ({ executionId, toolName, userId, success, error }) => {
  if (success) {
    console.log(`[Event] ai.tool.executed | tool=${toolName} | user=${userId} | ok`);
  } else {
    console.error(`[Event] ai.tool.executed | tool=${toolName} | user=${userId} | FAILED: ${error}`);
  }
});

eventBus.on('ai.provider.failed', ({ provider, error, userId }) => {
  console.error(`[Event] ai.provider.failed | provider=${provider} | user=${userId} | ${error}`);
});

eventBus.on('ai.provider.recovered', ({ provider }) => {
  console.log(`[Event] ai.provider.recovered | provider=${provider}`);
});

eventBus.on('campaign.updated', ({ campaignId, field, userId, platform }) => {
  console.log(`[Event] campaign.updated | campaign=${campaignId} | field=${field} | platform=${platform} | user=${userId}`);
});

eventBus.on('recommendation.generated', ({ type, priority, agenteId }) => {
  console.log(`[Event] recommendation.generated | type=${type} | priority=${priority} | agent=${agenteId}`);
});

eventBus.on('metrics.synced', ({ platform, count }) => {
  console.log(`[Event] metrics.synced | platform=${platform} | records=${count}`);
});

eventBus.on('ai.message.completed', ({ conversationId, userId }) => {
  // Silencioso — alta frecuencia
});

module.exports = { eventBus };
