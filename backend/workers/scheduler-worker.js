/**
 * Scheduler Worker — proceso PM2 separado para todos los schedulers.
 *
 * IMPORTANTE: Una vez que este worker esté corriendo en PM2,
 * remover las 4 llamadas initXxxScheduler() del server.js
 * para evitar ejecución doble en caso de escala horizontal.
 *
 * PM2: name = 'scheduler-worker', instances = 1 (SIEMPRE 1)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Conectar a MongoDB
require('../db');

const { initReportScheduler }         = require('../services/reportScheduler');
const { initAutomationScheduler }     = require('../services/automationScheduler');
const { initRewardsScheduler }        = require('../services/rewardsScheduler');
const { initTaskAutomationScheduler } = require('../services/taskAutomationService');

console.log('[SchedulerWorker] Starting all schedulers...');

initReportScheduler();
console.log('[SchedulerWorker] reportScheduler initialized');

initAutomationScheduler();
console.log('[SchedulerWorker] automationScheduler initialized');

initRewardsScheduler();
console.log('[SchedulerWorker] rewardsScheduler initialized');

initTaskAutomationScheduler();
console.log('[SchedulerWorker] taskAutomationScheduler initialized');

console.log('[SchedulerWorker] All schedulers running.');

// Mantener proceso vivo
process.on('SIGTERM', () => {
  console.log('[SchedulerWorker] Received SIGTERM — graceful shutdown');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('[SchedulerWorker] Received SIGINT — graceful shutdown');
  process.exit(0);
});

process.on('uncaughtException', (err) => {
  console.error('[SchedulerWorker] Uncaught exception:', err.message, err.stack);
  // No hacer exit — PM2 reiniciará si es necesario
});

process.on('unhandledRejection', (reason) => {
  console.error('[SchedulerWorker] Unhandled rejection:', reason);
});
