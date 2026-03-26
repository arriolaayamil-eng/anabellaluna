const Tarea = require('../models/Tarea');
const Notification = require('../models/Notification');
const TaskActivity = require('../models/TaskActivity');

// Check for overdue tasks and create notifications
async function processOverdueTasks() {
  try {
    const now = new Date();
    const overdueTasks = await Tarea.find({
      dueDate: { $lt: now },
      status: { $nin: ['completada', 'Close', 'cancelada'] },
    }).lean();

    let created = 0;
    for (const task of overdueTasks) {
      const targetId = task.assigneeId || task.agenteId;
      if (!targetId) continue;

      // Check if we already sent an overdue notification today for this task
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const existing = await Notification.findOne({
        agenteId: targetId,
        tipo: 'tarea',
        entidadId: String(task._id),
        createdAt: { $gte: todayStart },
        'metadata.overdueAlert': true,
      }).lean();
      if (existing) continue;

      await Notification.create({
        agenteId: targetId,
        tipo: 'tarea',
        titulo: 'Tarea vencida',
        mensaje: `La tarea "${task.title}" venció el ${new Date(task.dueDate).toLocaleDateString('es-AR')}`,
        prioridad: task.priority === 'urgente' || task.priority === 'alta' ? 'alta' : 'media',
        entidadTipo: 'tarea',
        entidadId: String(task._id),
        entidadNombre: task.title,
        accionUrl: `/crm/tareas`,
        enviada: true,
        fechaEnvio: now,
        metadata: { overdueAlert: true, taskStatus: task.status, dueDate: task.dueDate },
      });
      created++;
    }

    if (created > 0) {
      console.log(`[TaskAutomation] Created ${created} overdue task notifications`);
    }
  } catch (err) {
    console.error('[TaskAutomation] Error processing overdue tasks:', err.message);
  }
}

// Check for inactive tasks (no update in X days)
async function processInactiveTasks(inactiveDays = 3) {
  try {
    const cutoff = new Date(Date.now() - inactiveDays * 86400000);
    const inactiveTasks = await Tarea.find({
      updatedAt: { $lt: cutoff },
      status: { $in: ['pendiente', 'en_progreso', 'Open', 'InProgress'] },
    }).lean();

    let created = 0;
    for (const task of inactiveTasks) {
      const targetId = task.assigneeId || task.agenteId;
      if (!targetId) continue;

      // Check if already notified this week
      const weekAgo = new Date(Date.now() - 7 * 86400000);
      const existing = await Notification.findOne({
        agenteId: targetId,
        tipo: 'tarea',
        entidadId: String(task._id),
        createdAt: { $gte: weekAgo },
        'metadata.inactiveAlert': true,
      }).lean();
      if (existing) continue;

      await Notification.create({
        agenteId: targetId,
        tipo: 'tarea',
        titulo: 'Tarea sin actividad',
        mensaje: `La tarea "${task.title}" no tiene actividad hace ${inactiveDays}+ días`,
        prioridad: 'baja',
        entidadTipo: 'tarea',
        entidadId: String(task._id),
        entidadNombre: task.title,
        accionUrl: `/crm/tareas`,
        enviada: true,
        fechaEnvio: new Date(),
        metadata: { inactiveAlert: true, lastUpdate: task.updatedAt },
      });
      created++;
    }

    if (created > 0) {
      console.log(`[TaskAutomation] Created ${created} inactive task notifications`);
    }
  } catch (err) {
    console.error('[TaskAutomation] Error processing inactive tasks:', err.message);
  }
}

// Run all task automations
async function runTaskAutomations() {
  await processOverdueTasks();
  await processInactiveTasks(3);
}

// Initialize scheduler (runs every hour)
let taskAutomationInterval = null;
function initTaskAutomationScheduler() {
  // Run once on startup after a delay
  setTimeout(() => {
    runTaskAutomations();
  }, 30000); // 30s after startup

  // Then every hour
  taskAutomationInterval = setInterval(() => {
    runTaskAutomations();
  }, 60 * 60 * 1000);

  console.log('[TaskAutomation] Scheduler initialized (runs every hour)');
}

module.exports = { initTaskAutomationScheduler, runTaskAutomations, processOverdueTasks, processInactiveTasks };
