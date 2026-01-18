const AutomationRule = require('../models/AutomationRule');
const Notification = require('../models/Notification');
const Cliente = require('../models/Cliente');
const Activity = require('../models/Activity');
const Agente = require('../models/Agente');
const FechaImportante = require('../models/FechaImportante');
const googleCalendar = require('./googleCalendar');

// Template variable replacement
function replaceTemplateVars(template, context) {
  if (!template) return '';
  let result = template;
  
  // Replace {{variable.field}} patterns
  const regex = /\{\{(\w+)\.(\w+)\}\}/g;
  result = result.replace(regex, (match, obj, field) => {
    if (context[obj] && context[obj][field] !== undefined) {
      return String(context[obj][field]);
    }
    return match;
  });
  
  // Replace {{variable}} patterns
  const simpleRegex = /\{\{(\w+)\}\}/g;
  result = result.replace(simpleRegex, (match, key) => {
    if (context[key] !== undefined) {
      return String(context[key]);
    }
    return match;
  });
  
  return result;
}

// Check if today is someone's birthday
function isBirthdayToday(fechaNacimiento) {
  if (!fechaNacimiento) return false;
  const today = new Date();
  const birthday = new Date(fechaNacimiento);
  return today.getMonth() === birthday.getMonth() && today.getDate() === birthday.getDate();
}

// Check if date is X days from now
function isDaysFromNow(targetDate, days) {
  if (!targetDate) return false;
  const target = new Date(targetDate);
  const now = new Date();
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  return diff === days;
}

// Check if client has been inactive for X days
function isInactiveForDays(lastActivity, days) {
  if (!lastActivity) return true;
  const last = new Date(lastActivity);
  const now = new Date();
  const diff = Math.ceil((now - last) / (1000 * 60 * 60 * 24));
  return diff >= days;
}

// Create notification from automation rule
async function createNotificationFromRule(rule, context = {}) {
  try {
    const titulo = replaceTemplateVars(rule.accion?.plantillaTitulo || rule.nombre, context);
    const mensaje = replaceTemplateVars(rule.accion?.plantillaMensaje || rule.descripcion, context);

    const notificationData = {
      agenteId: rule.agenteId,
      tipo: rule.tipo,
      titulo,
      mensaje,
      prioridad: rule.accion?.prioridad || 'media',
      entidadTipo: context.entidadTipo,
      entidadId: context.entidadId,
      entidadNombre: context.entidadNombre,
      automationRuleId: rule._id,
      accionUrl: context.accionUrl,
      metadata: { context },
    };

    if (context.fechaProgramada) {
      notificationData.fechaProgramada = context.fechaProgramada;
      notificationData.enviada = false;
    }

    const notification = await Notification.create(notificationData);

    // Sync to Google Calendar if configured
    if (rule.accion?.sincronizarCalendar) {
      try {
        const agent = await Agente.findById(rule.agenteId).lean();
        if (agent?.metadata?.googleCalendar?.refreshToken) {
          const eventDate = context.eventDate ? new Date(context.eventDate) : new Date();
          const horaEjecucion = String(rule.trigger?.horaEjecucion || '').trim();
          if (horaEjecucion) {
            const parts = horaEjecucion.split(':');
            const hh = Number(parts[0]);
            const mm = Number(parts[1]);
            if (Number.isFinite(hh) && Number.isFinite(mm) && hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) {
              eventDate.setHours(hh, mm, 0, 0);
            }
          }
          const eventEnd = new Date(eventDate.getTime() + 30 * 60 * 1000);

          const eventData = {
            refreshToken: agent.metadata.googleCalendar.refreshToken,
            calendarId: agent.metadata.googleCalendar.calendarId || 'primary',
            summary: titulo,
            description: mensaje,
            start: eventDate,
            end: eventEnd,
            agentMetadata: agent.metadata,
          };

          const event = await googleCalendar.createCalendarEvent(eventData);
          if (event?.id) {
            notification.googleEventId = event.id;
            notification.calendarSynced = true;
            await notification.save();
          }
        }
      } catch (calErr) {
        console.error('Failed to sync to calendar:', calErr.message);
      }
    }
    
    // Update rule statistics
    rule.estadisticas = rule.estadisticas || {};
    rule.estadisticas.vecesEjecutada = (rule.estadisticas.vecesEjecutada || 0) + 1;
    rule.estadisticas.ultimaEjecucion = new Date();
    rule.estadisticas.exitosas = (rule.estadisticas.exitosas || 0) + 1;
    await rule.save();
    
    return notification;
  } catch (err) {
    console.error('Error creating notification from rule:', err.message);
    
    // Update failed count
    if (rule) {
      rule.estadisticas = rule.estadisticas || {};
      rule.estadisticas.fallidas = (rule.estadisticas.fallidas || 0) + 1;
      await rule.save();
    }
    
    return null;
  }
}

// Process birthday automations
async function processBirthdayAutomations() {
  try {
    const rules = await AutomationRule.find({ tipo: 'cumpleanos', activo: true }).lean();
    
    for (const rule of rules) {
      const clientes = await Cliente.find({ agenteId: rule.agenteId }).lean();
      
      for (const cliente of clientes) {
        const fechaNacimiento = cliente.metadata?.fechaNacimiento || cliente.fechaNacimiento;
        if (isBirthdayToday(fechaNacimiento)) {
          // Check if notification already sent today
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const existing = await Notification.findOne({
            automationRuleId: rule._id,
            entidadId: cliente._id.toString(),
            createdAt: { $gte: today },
          });
          
          if (!existing) {
            await createNotificationFromRule(rule, {
              cliente: { nombre: cliente.nombre, email: cliente.email },
              entidadTipo: 'cliente',
              entidadId: cliente._id.toString(),
              entidadNombre: cliente.nombre,
              accionUrl: `/crm/clientes/${cliente._id}`,
              eventDate: new Date(),
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('Error processing birthday automations:', err.message);
  }
}

// Process inactivity automations
async function processInactivityAutomations() {
  try {
    const rules = await AutomationRule.find({ tipo: 'inactividad', activo: true }).lean();
    
    for (const rule of rules) {
      const diasInactividad = rule.trigger?.diasInactividad || 30;
      const clientes = await Cliente.find({ agenteId: rule.agenteId }).lean();
      
      for (const cliente of clientes) {
        const lastActivity = cliente.metadata?.ultimaActividad || cliente.updatedAt;
        
        if (isInactiveForDays(lastActivity, diasInactividad)) {
          // Check if notification already sent in last 7 days
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          const existing = await Notification.findOne({
            automationRuleId: rule._id,
            entidadId: cliente._id.toString(),
            createdAt: { $gte: weekAgo },
          });
          
          if (!existing) {
            await createNotificationFromRule(rule, {
              cliente: { nombre: cliente.nombre },
              entidadTipo: 'cliente',
              entidadId: cliente._id.toString(),
              entidadNombre: cliente.nombre,
              accionUrl: `/crm/clientes/${cliente._id}`,
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('Error processing inactivity automations:', err.message);
  }
}

// Process renewal automations (contracts expiring soon)
async function processRenewalAutomations() {
  try {
    const rules = await AutomationRule.find({ tipo: 'renovacion', activo: true }).lean();
    
    for (const rule of rules) {
      const diasAntes = rule.trigger?.diasAntes || 30;
      const clientes = await Cliente.find({ agenteId: rule.agenteId }).lean();
      
      for (const cliente of clientes) {
        const fechaVencimiento = cliente.metadata?.fechaVencimientoContrato;
        
        if (fechaVencimiento && isDaysFromNow(fechaVencimiento, diasAntes)) {
          const existing = await Notification.findOne({
            automationRuleId: rule._id,
            entidadId: cliente._id.toString(),
            'metadata.fechaVencimiento': fechaVencimiento,
          });
          
          if (!existing) {
            await createNotificationFromRule(rule, {
              cliente: { nombre: cliente.nombre },
              entidadTipo: 'cliente',
              entidadId: cliente._id.toString(),
              entidadNombre: cliente.nombre,
              accionUrl: `/crm/clientes/${cliente._id}`,
              fechaVencimiento,
              eventDate: new Date(fechaVencimiento),
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('Error processing renewal automations:', err.message);
  }
}

// Trigger welcome automation when client is created
async function triggerWelcomeAutomation(cliente, agenteId) {
  try {
    const rule = await AutomationRule.findOne({
      agenteId,
      tipo: 'bienvenida',
      activo: true,
    });
    
    if (rule) {
      await createNotificationFromRule(rule, {
        cliente: { nombre: cliente.nombre, email: cliente.email },
        entidadTipo: 'cliente',
        entidadId: cliente._id.toString(),
        entidadNombre: cliente.nombre,
        accionUrl: `/crm/clientes/${cliente._id}`,
      });
    }
  } catch (err) {
    console.error('Error triggering welcome automation:', err.message);
  }
}

// Trigger follow-up automation after first contact
async function triggerFollowUpAutomation(cliente, agenteId, diasDespues = 2) {
  try {
    const clientId = cliente && cliente._id ? String(cliente._id) : '';
    if (!clientId) return;

    const hasAnyActivity = await Activity.exists({ agenteId, clientId });
    if (!hasAnyActivity) return;

    const rule = await AutomationRule.findOne({
      agenteId,
      tipo: 'seguimiento_contacto',
      activo: true,
    });
    
    if (rule) {
      const dias = rule.trigger?.diasDespues || diasDespues;
      const fechaProgramada = new Date();
      fechaProgramada.setDate(fechaProgramada.getDate() + dias);

      const horaEjecucion = String(rule.trigger?.horaEjecucion || '').trim();
      if (horaEjecucion) {
        const parts = horaEjecucion.split(':');
        const hh = Number(parts[0]);
        const mm = Number(parts[1]);
        if (Number.isFinite(hh) && Number.isFinite(mm) && hh >= 0 && hh <= 23 && mm >= 0 && mm <= 59) {
          fechaProgramada.setHours(hh, mm, 0, 0);
        }
      }

      const existing = await Notification.findOne({
        agenteId,
        tipo: 'seguimiento_contacto',
        entidadId: cliente._id.toString(),
      }).lean();

      if (existing) {
        return;
      }

      await createNotificationFromRule(rule, {
        cliente: { nombre: cliente.nombre, email: cliente.email },
        entidadTipo: 'cliente',
        entidadId: cliente._id.toString(),
        entidadNombre: cliente.nombre,
        accionUrl: `/crm/clientes/${cliente._id}`,
        fechaProgramada,
        eventDate: fechaProgramada,
      });
    }
  } catch (err) {
    console.error('Error triggering follow-up automation:', err.message);
  }
}

// Process scheduled notifications
async function processScheduledNotifications() {
  try {
    const now = new Date();
    const scheduled = await Notification.find({
      fechaProgramada: { $lte: now },
      enviada: false,
    });
    
    for (const notif of scheduled) {
      notif.enviada = true;
      notif.fechaEnvio = new Date();
      await notif.save();
    }
    
    return scheduled.length;
  } catch (err) {
    console.error('Error processing scheduled notifications:', err.message);
    return 0;
  }
}

// Check if today is client anniversary (same month/day as createdAt)
function isAnniversaryToday(createdAt) {
  if (!createdAt) return false;
  const today = new Date();
  const created = new Date(createdAt);
  if (today.getFullYear() === created.getFullYear()) return false;
  return today.getMonth() === created.getMonth() && today.getDate() === created.getDate();
}

// Process client anniversary automations (hito)
async function processClientAnniversaryAutomations() {
  try {
    const rules = await AutomationRule.find({ tipo: 'hito', activo: true }).lean();

    for (const rule of rules) {
      const clientes = await Cliente.find({ agenteId: rule.agenteId }).lean();

      for (const cliente of clientes) {
        if (isAnniversaryToday(cliente.createdAt)) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const existing = await Notification.findOne({
            automationRuleId: rule._id,
            entidadId: cliente._id.toString(),
            createdAt: { $gte: today },
          });

          if (!existing) {
            const yearsAsClient = new Date().getFullYear() - new Date(cliente.createdAt).getFullYear();
            await createNotificationFromRule(rule, {
              cliente: { nombre: cliente.nombre, email: cliente.email },
              entidadTipo: 'cliente',
              entidadId: cliente._id.toString(),
              entidadNombre: cliente.nombre,
              accionUrl: `/crm/clientes/${cliente._id}`,
              eventDate: new Date(),
              aniversario: yearsAsClient,
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('Error processing client anniversary automations:', err.message);
  }
}

// Process document expiration automations (vencimiento_documento)
async function processDocumentExpirationAutomations() {
  try {
    const rules = await AutomationRule.find({ tipo: 'vencimiento_documento', activo: true }).lean();

    for (const rule of rules) {
      const diasAntes = rule.trigger?.diasAntes || 30;
      const clientes = await Cliente.find({ agenteId: rule.agenteId }).lean();

      for (const cliente of clientes) {
        const fechaVencimiento = cliente.metadata?.fechaVencimientoDocumento;

        if (fechaVencimiento && isDaysFromNow(fechaVencimiento, diasAntes)) {
          const existing = await Notification.findOne({
            automationRuleId: rule._id,
            entidadId: cliente._id.toString(),
            'metadata.context.fechaVencimientoDocumento': fechaVencimiento,
          });

          if (!existing) {
            await createNotificationFromRule(rule, {
              cliente: { nombre: cliente.nombre },
              entidadTipo: 'cliente',
              entidadId: cliente._id.toString(),
              entidadNombre: cliente.nombre,
              accionUrl: `/crm/clientes/${cliente._id}`,
              fechaVencimientoDocumento: fechaVencimiento,
              eventDate: new Date(fechaVencimiento),
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('Error processing document expiration automations:', err.message);
  }
}

// Process special event automations (evento_especial)
async function processSpecialEventAutomations() {
  try {
    const rules = await AutomationRule.find({ tipo: 'evento_especial', activo: true }).lean();

    for (const rule of rules) {
      const diasAntes = rule.trigger?.diasAntes || 7;
      const clientes = await Cliente.find({ agenteId: rule.agenteId }).lean();

      for (const cliente of clientes) {
        const fechaEvento = cliente.metadata?.fechaEvento || cliente.metadata?.fechaEventoEspecial;

        if (fechaEvento && isDaysFromNow(fechaEvento, diasAntes)) {
          const existing = await Notification.findOne({
            automationRuleId: rule._id,
            entidadId: cliente._id.toString(),
            'metadata.context.fechaEvento': fechaEvento,
          });

          if (!existing) {
            await createNotificationFromRule(rule, {
              cliente: { nombre: cliente.nombre },
              entidadTipo: 'cliente',
              entidadId: cliente._id.toString(),
              entidadNombre: cliente.nombre,
              accionUrl: `/crm/clientes/${cliente._id}`,
              fechaEvento,
              eventDate: new Date(fechaEvento),
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('Error processing special event automations:', err.message);
  }
}

// Calculate variable date for important dates
function calcularFechaVariable(calculoEspecial, year) {
  switch (calculoEspecial) {
    case 'tercer_domingo_junio': {
      const firstDay = new Date(year, 5, 1);
      const firstSunday = new Date(year, 5, 1 + (7 - firstDay.getDay()) % 7);
      return new Date(year, 5, firstSunday.getDate() + 14);
    }
    case 'tercer_domingo_agosto': {
      const firstDay = new Date(year, 7, 1);
      const firstSunday = new Date(year, 7, 1 + (7 - firstDay.getDay()) % 7);
      return new Date(year, 7, firstSunday.getDate() + 14);
    }
    case 'tercer_domingo_octubre': {
      const firstDay = new Date(year, 9, 1);
      const firstSunday = new Date(year, 9, 1 + (7 - firstDay.getDay()) % 7);
      return new Date(year, 9, firstSunday.getDate() + 14);
    }
    case 'cuarto_viernes_noviembre': {
      const firstDay = new Date(year, 10, 1);
      const firstFriday = new Date(year, 10, 1 + (5 - firstDay.getDay() + 7) % 7);
      return new Date(year, 10, firstFriday.getDate() + 21);
    }
    case 'lunes_despues_black_friday': {
      const blackFriday = calcularFechaVariable('cuarto_viernes_noviembre', year);
      return new Date(blackFriday.getTime() + 3 * 24 * 60 * 60 * 1000);
    }
    default:
      return null;
  }
}

// Check if today matches an important date
function isFechaImportanteHoy(fecha) {
  const today = new Date();
  const year = today.getFullYear();
  
  if (fecha.calculoEspecial === 'cumpleanos_cliente' || fecha.calculoEspecial === 'aniversario_cliente') {
    return false;
  }
  
  let targetDate;
  if (fecha.esFechaFija) {
    targetDate = new Date(year, fecha.mes - 1, fecha.dia);
  } else {
    targetDate = calcularFechaVariable(fecha.calculoEspecial, year);
  }
  
  if (!targetDate) return false;
  return today.getMonth() === targetDate.getMonth() && today.getDate() === targetDate.getDate();
}

// Check if client matches segmentation criteria
function clienteCoincideSegmentacion(cliente, segmentacion, condiciones) {
  const md = cliente.metadata || {};
  
  // Check gender
  const generoRequerido = condiciones?.genero || segmentacion?.genero;
  if (generoRequerido && generoRequerido !== 'todos' && generoRequerido !== '') {
    if (md.genero !== generoRequerido) return false;
  }
  
  // Check parental status (padre/madre)
  if (segmentacion?.requierePadre && md.estadoParental !== 'padre') return false;
  if (segmentacion?.requiereMadre && md.estadoParental !== 'madre') return false;
  
  // Check if has children
  if (segmentacion?.requiereHijos && md.tieneHijos !== 'si') return false;
  const tieneHijosRequerido = condiciones?.tieneHijos;
  if (tieneHijosRequerido && tieneHijosRequerido !== 'todos' && tieneHijosRequerido !== '') {
    if (md.tieneHijos !== tieneHijosRequerido) return false;
  }
  
  // Check professions
  const profesionesRequeridas = condiciones?.profesiones || segmentacion?.profesiones;
  if (profesionesRequeridas && profesionesRequeridas.length > 0) {
    if (!md.profesion || !profesionesRequeridas.includes(md.profesion)) return false;
  }
  
  // Check parental status from conditions
  const estadoParentalRequerido = condiciones?.estadoParental;
  if (estadoParentalRequerido && estadoParentalRequerido.length > 0) {
    if (!md.estadoParental || !estadoParentalRequerido.includes(md.estadoParental)) return false;
  }
  
  return true;
}

// Process important dates automations (fecha_importante)
async function processImportantDatesAutomations() {
  try {
    const fechasActivas = await FechaImportante.find({ activo: true }).lean();
    const fechasHoy = fechasActivas.filter(f => isFechaImportanteHoy(f));
    
    if (fechasHoy.length === 0) return;
    
    console.log(`[AutomationScheduler] Processing ${fechasHoy.length} important dates for today`);
    
    for (const fecha of fechasHoy) {
      const rules = await AutomationRule.find({
        tipo: 'fecha_importante',
        fechaImportanteCodigo: fecha.codigo,
        activo: true,
      }).lean();
      
      for (const rule of rules) {
        const clientes = await Cliente.find({ agenteId: rule.agenteId }).lean();
        
        for (const cliente of clientes) {
          if (!clienteCoincideSegmentacion(cliente, fecha.segmentacion, rule.condiciones)) {
            continue;
          }
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const existing = await Notification.findOne({
            automationRuleId: rule._id,
            entidadId: cliente._id.toString(),
            'metadata.context.fechaCodigo': fecha.codigo,
            createdAt: { $gte: today },
          });
          
          if (!existing) {
            const agent = await Agente.findById(rule.agenteId).lean();
            await createNotificationFromRule(rule, {
              cliente: { nombre: cliente.nombre, email: cliente.email },
              empresa: { nombre: agent?.nombre || 'Nuestra empresa' },
              entidadTipo: 'cliente',
              entidadId: cliente._id.toString(),
              entidadNombre: cliente.nombre,
              accionUrl: `/crm/clientes/${cliente._id}`,
              eventDate: new Date(),
              fechaCodigo: fecha.codigo,
              fechaNombre: fecha.nombre,
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('Error processing important dates automations:', err.message);
  }
}

// Run all scheduled automations (call this periodically)
async function runScheduledAutomations() {
  console.log('[AutomationScheduler] Running scheduled automations...');
  
  await processBirthdayAutomations();
  await processInactivityAutomations();
  await processRenewalAutomations();
  await processClientAnniversaryAutomations();
  await processDocumentExpirationAutomations();
  await processSpecialEventAutomations();
  await processImportantDatesAutomations();
  const sent = await processScheduledNotifications();
  
  console.log(`[AutomationScheduler] Completed. Sent ${sent} scheduled notifications.`);
}

// Initialize scheduler (runs every hour)
let schedulerInterval = null;

function initAutomationScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
  }
  
  // Run immediately on startup
  setTimeout(() => {
    runScheduledAutomations().catch(console.error);
  }, 5000);
  
  // Then run every hour
  schedulerInterval = setInterval(() => {
    runScheduledAutomations().catch(console.error);
  }, 60 * 60 * 1000); // 1 hour
  
  console.log('[AutomationScheduler] Initialized - running every hour');
}

function stopAutomationScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[AutomationScheduler] Stopped');
  }
}

module.exports = {
  createNotificationFromRule,
  triggerWelcomeAutomation,
  triggerFollowUpAutomation,
  runScheduledAutomations,
  initAutomationScheduler,
  stopAutomationScheduler,
  replaceTemplateVars,
};
