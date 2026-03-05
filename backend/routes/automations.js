const express = require('express');
const AutomationRule = require('../models/AutomationRule');
const Notification = require('../models/Notification');
const Cliente = require('../models/Cliente');
const Agente = require('../models/Agente');
const { authenticateToken, agentScopeId, requireCRMUser } = require('../auth');
const googleCalendar = require('../services/googleCalendar');

const router = express.Router();

// Default automation templates
const defaultTemplates = {
  bienvenida: {
    nombre: 'Mensaje de Bienvenida',
    descripcion: 'Envía un mensaje personalizado al dar de alta un nuevo cliente',
    trigger: { evento: 'cliente_creado', diasDespues: 0 },
    accion: {
      plantillaTitulo: '¡Bienvenido/a {{cliente.nombre}}!',
      plantillaMensaje: 'Gracias por confiar en nosotros. Estamos aquí para ayudarte a encontrar tu propiedad ideal. ¿En qué podemos ayudarte?',
      prioridad: 'media',
    },
  },
  seguimiento_contacto: {
    nombre: 'Seguimiento Post-Contacto',
    descripcion: 'Recordatorio para contactar al cliente después de la primera interacción',
    trigger: { evento: 'primer_contacto', diasDespues: 2, horaEjecucion: '10:00' },
    accion: {
      plantillaTitulo: 'Seguimiento pendiente: {{cliente.nombre}}',
      plantillaMensaje: 'Han pasado 2 días desde el primer contacto con {{cliente.nombre}}. Es momento de hacer seguimiento.',
      prioridad: 'alta',
    },
  },
  cumpleanos: {
    nombre: 'Recordatorio de Cumpleaños',
    descripcion: 'Envía saludos automáticos de cumpleaños a los clientes',
    trigger: { evento: 'cumpleanos_cliente', diasAntes: 0, horaEjecucion: '09:00' },
    accion: {
      plantillaTitulo: '🎂 Cumpleaños de {{cliente.nombre}}',
      plantillaMensaje: '¡Hoy es el cumpleaños de {{cliente.nombre}}! No olvides enviarle un saludo.',
      prioridad: 'media',
      sincronizarCalendar: true,
    },
  },
  seguimiento_propuesta: {
    nombre: 'Seguimiento de Propuestas',
    descripcion: 'Recordatorio para revisar propuestas enviadas sin respuesta',
    trigger: { evento: 'propuesta_enviada', diasDespues: 3, horaEjecucion: '11:00' },
    accion: {
      plantillaTitulo: 'Seguimiento propuesta: {{cliente.nombre}}',
      plantillaMensaje: 'La propuesta enviada a {{cliente.nombre}} lleva 3 días sin respuesta. Considera hacer seguimiento.',
      prioridad: 'alta',
    },
  },
  renovacion: {
    nombre: 'Alerta de Renovación',
    descripcion: 'Recordatorio antes del vencimiento de contratos',
    trigger: { evento: 'contrato_vence', diasAntes: 30, horaEjecucion: '09:00' },
    accion: {
      plantillaTitulo: '⚠️ Renovación próxima: {{cliente.nombre}}',
      plantillaMensaje: 'El contrato de {{cliente.nombre}} vence en 30 días. Contacta para gestionar la renovación.',
      prioridad: 'urgente',
      sincronizarCalendar: true,
    },
  },
  evento_especial: {
    nombre: 'Eventos y Promociones',
    descripcion: 'Alertas sobre eventos, promociones o novedades',
    trigger: { evento: 'evento_programado', diasAntes: 1, horaEjecucion: '10:00' },
    accion: {
      plantillaTitulo: '🎉 Evento especial mañana',
      plantillaMensaje: 'Mañana hay un evento especial. Prepara la comunicación para tus clientes.',
      prioridad: 'media',
    },
  },
  feedback: {
    nombre: 'Solicitud de Feedback',
    descripcion: 'Pide retroalimentación después de un servicio',
    trigger: { evento: 'servicio_completado', diasDespues: 7, horaEjecucion: '14:00' },
    accion: {
      plantillaTitulo: 'Solicitar feedback: {{cliente.nombre}}',
      plantillaMensaje: 'Han pasado 7 días desde que completaste el servicio con {{cliente.nombre}}. Es buen momento para solicitar feedback.',
      prioridad: 'media',
    },
  },
  inactividad: {
    nombre: 'Alerta de Inactividad',
    descripcion: 'Recordatorio para contactar clientes inactivos',
    trigger: { diasInactividad: 30, horaEjecucion: '10:00' },
    accion: {
      plantillaTitulo: '⏰ Cliente inactivo: {{cliente.nombre}}',
      plantillaMensaje: '{{cliente.nombre}} no ha tenido interacción en los últimos 30 días. Considera reactivar el contacto.',
      prioridad: 'media',
    },
  },
  cumpleanos_contacto: {
    nombre: 'Cumpleaños de Contactos Clave',
    descripcion: 'Recordatorio de cumpleaños de contactos importantes',
    trigger: { evento: 'cumpleanos_contacto', diasAntes: 0, horaEjecucion: '09:00' },
    accion: {
      plantillaTitulo: '🎂 Cumpleaños de contacto: {{contacto.nombre}}',
      plantillaMensaje: 'Hoy cumple años {{contacto.nombre}}. Es una buena oportunidad para fortalecer la relación.',
      prioridad: 'media',
      sincronizarCalendar: true,
    },
  },
  objetivo: {
    nombre: 'Verificación de Objetivos',
    descripcion: 'Recordatorio para verificar cumplimiento de objetivos',
    trigger: { evento: 'fin_periodo', diasAntes: 3, horaEjecucion: '09:00' },
    accion: {
      plantillaTitulo: '🎯 Revisar objetivos del período',
      plantillaMensaje: 'Faltan 3 días para el cierre del período. Revisa el estado de tus objetivos.',
      prioridad: 'alta',
    },
  },
  vencimiento_documento: {
    nombre: 'Vencimiento de Documentos',
    descripcion: 'Alerta de documentos próximos a vencer',
    trigger: { evento: 'documento_vence', diasAntes: 15, horaEjecucion: '09:00' },
    accion: {
      plantillaTitulo: '📄 Documento por vencer: {{documento.nombre}}',
      plantillaMensaje: 'El documento "{{documento.nombre}}" de {{cliente.nombre}} vence en 15 días. Gestiona la renovación.',
      prioridad: 'alta',
      sincronizarCalendar: true,
    },
  },
  hito: {
    nombre: 'Hitos Importantes',
    descripcion: 'Conmemoración de momentos clave con el cliente',
    trigger: { evento: 'aniversario_cliente', diasAntes: 0, horaEjecucion: '10:00' },
    accion: {
      plantillaTitulo: '🏆 Aniversario con {{cliente.nombre}}',
      plantillaMensaje: '¡Hoy se cumple un año de relación con {{cliente.nombre}}! Considera enviar un mensaje de agradecimiento.',
      prioridad: 'media',
    },
  },
  fecha_importante: {
    nombre: 'Fechas Importantes de Argentina',
    descripcion: 'Notificaciones automáticas en fechas especiales argentinas',
    trigger: { evento: 'fecha_importante', diasAntes: 0, horaEjecucion: '09:00' },
    accion: {
      plantillaTitulo: '🇦🇷 {{fecha.nombre}}',
      plantillaMensaje: 'Hoy es {{fecha.nombre}}. Aprovecha para enviar un mensaje especial a tus clientes.',
      prioridad: 'media',
      sincronizarCalendar: true,
    },
  },
};

// Get all automation rules
router.get('/', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const { activo } = req.query;
    
    const filter = {};
    if (scopeId) filter.agenteId = scopeId;
    if (activo !== undefined) filter.activo = activo === 'true';
    
    const items = await AutomationRule.find(filter).sort({ createdAt: -1 }).lean();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get default templates for creating new rules
router.get('/templates', authenticateToken, requireCRMUser, (req, res) => {
  res.json(defaultTemplates);
});

// Get statistics
router.get('/stats', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const filter = {};
    if (scopeId) filter.agenteId = scopeId;
    
    const rules = await AutomationRule.find(filter).lean();
    
    const activas = rules.filter(r => r.activo).length;
    const totalEjecuciones = rules.reduce((sum, r) => sum + (r.estadisticas?.vecesEjecutada || 0), 0);
    const exitosas = rules.reduce((sum, r) => sum + (r.estadisticas?.exitosas || 0), 0);
    const tasaExito = totalEjecuciones > 0 ? Math.round((exitosas / totalEjecuciones) * 100) : 0;
    
    // Get notifications sent today
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const notifFilter = { createdAt: { $gte: hoy } };
    if (scopeId) notifFilter.agenteId = scopeId;
    const disparosHoy = await Notification.countDocuments(notifFilter);
    
    res.json({
      activas,
      totalEjecuciones,
      tasaExito,
      disparosHoy,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single rule
router.get('/:id', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const item = await AutomationRule.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ error: 'Not found' });
    if (scopeId && String(item.agenteId || '') !== scopeId) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create rule (optionally from template)
router.post('/', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const { template, ...body } = req.body || {};
    
    let ruleData = { ...body };
    
    // If creating from template
    if (template && defaultTemplates[template]) {
      const tpl = defaultTemplates[template];
      ruleData = {
        ...tpl,
        ...body,
        tipo: template,
      };
    }
    
    if (scopeId) ruleData.agenteId = scopeId;
    
    const created = await AutomationRule.create(ruleData);
    res.status(201).json(created);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update rule
router.put('/:id', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const filter = { _id: req.params.id };
    if (scopeId) filter.agenteId = scopeId;
    
    const updated = await AutomationRule.findOneAndUpdate(
      filter,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Toggle rule active status
router.put('/:id/toggle', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const filter = { _id: req.params.id };
    if (scopeId) filter.agenteId = scopeId;
    
    const rule = await AutomationRule.findOne(filter);
    if (!rule) return res.status(404).json({ error: 'Not found' });
    
    rule.activo = !rule.activo;
    await rule.save();
    res.json(rule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete rule
router.delete('/:id', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const filter = { _id: req.params.id };
    if (scopeId) filter.agenteId = scopeId;
    
    const deleted = await AutomationRule.findOneAndDelete(filter);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Execute automation manually (for testing)
router.post('/:id/execute', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const filter = { _id: req.params.id };
    if (scopeId) filter.agenteId = scopeId;
    
    const rule = await AutomationRule.findOne(filter);
    if (!rule) return res.status(404).json({ error: 'Not found' });
    
    // Create test notification
    const notification = await Notification.create({
      agenteId: rule.agenteId,
      tipo: rule.tipo,
      titulo: rule.accion?.plantillaTitulo || rule.nombre,
      mensaje: rule.accion?.plantillaMensaje || rule.descripcion,
      prioridad: rule.accion?.prioridad || 'media',
      automationRuleId: rule._id,
      metadata: { manualExecution: true },
    });
    
    // Update statistics
    rule.estadisticas = rule.estadisticas || {};
    rule.estadisticas.vecesEjecutada = (rule.estadisticas.vecesEjecutada || 0) + 1;
    rule.estadisticas.ultimaEjecucion = new Date();
    rule.estadisticas.exitosas = (rule.estadisticas.exitosas || 0) + 1;
    await rule.save();
    
    res.json({ ok: true, notification, rule });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Initialize default automations for an agent
router.post('/initialize-defaults', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    if (!scopeId) {
      return res.status(400).json({ error: 'Agent ID required' });
    }
    
    // Check if agent already has automations
    const existing = await AutomationRule.countDocuments({ agenteId: scopeId });
    if (existing > 0) {
      return res.json({ ok: true, message: 'Automations already exist', count: existing });
    }
    
    // Create default automations
    const created = [];
    for (const [tipo, template] of Object.entries(defaultTemplates)) {
      const rule = await AutomationRule.create({
        ...template,
        tipo,
        agenteId: scopeId,
        activo: false, // Start inactive so agent can configure
      });
      created.push(rule);
    }
    
    res.status(201).json({ ok: true, created: created.length, rules: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
