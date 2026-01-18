const mongoose = require('mongoose');

const AutomationRuleSchema = new mongoose.Schema({
  agenteId: { type: String, required: true, index: true },
  nombre: { type: String, required: true },
  descripcion: { type: String, default: '' },
  tipo: { 
    type: String, 
    enum: [
      'bienvenida',           // Auto-send welcome when new client
      'seguimiento_contacto', // Follow-up after first contact (X days)
      'cumpleanos',           // Birthday reminders
      'seguimiento_propuesta',// Proposal follow-up reminder
      'renovacion',           // Contract renewal alert (X days before)
      'evento_especial',      // Special events/promotions
      'feedback',             // Request feedback after service
      'inactividad',          // Alert for inactive clients
      'cumpleanos_contacto',  // Important contacts birthday
      'objetivo',             // Goal achievement check
      'vencimiento_documento',// Document expiration reminder
      'hito',                 // Milestone commemoration
      'fecha_importante',     // Argentine important dates (holidays, special days)
    ],
    required: true 
  },
  activo: { type: Boolean, default: true },
  fechaImportanteCodigo: { type: String, default: '' },
  // Trigger configuration
  trigger: {
    evento: { type: String }, // 'cliente_creado', 'cita_completada', 'operacion_cerrada', etc.
    diasAntes: { type: Number, default: 0 }, // Days before event (for reminders)
    diasDespues: { type: Number, default: 0 }, // Days after event (for follow-ups)
    diasInactividad: { type: Number, default: 30 }, // Days of inactivity threshold
    horaEjecucion: { type: String, default: '09:00' }, // Time to execute (HH:mm)
  },
  // Action configuration
  accion: {
    tipo: { type: String, enum: ['notificacion', 'email', 'sms', 'calendar'], default: 'notificacion' },
    plantillaTitulo: { type: String, default: '' },
    plantillaMensaje: { type: String, default: '' },
    prioridad: { type: String, enum: ['baja', 'media', 'alta', 'urgente'], default: 'media' },
    sincronizarCalendar: { type: Boolean, default: false },
    enviarAlCliente: { type: Boolean, default: false },
    canalCliente: { type: String, enum: ['whatsapp', 'email', 'sms', 'preferencia'], default: 'preferencia' },
  },
  // Statistics
  estadisticas: {
    vecesEjecutada: { type: Number, default: 0 },
    ultimaEjecucion: { type: Date },
    exitosas: { type: Number, default: 0 },
    fallidas: { type: Number, default: 0 },
  },
  // Conditions for execution
  condiciones: {
    soloClientesActivos: { type: Boolean, default: true },
    tiposCliente: [{ type: String }], // Filter by client types
    etapasCliente: [{ type: String }], // Filter by client stages
    genero: { type: String, enum: ['todos', 'masculino', 'femenino', ''], default: '' },
    estadoParental: [{ type: String }], // padre, madre, sin_hijos
    profesiones: [{ type: String }],
    tieneHijos: { type: String, enum: ['si', 'no', 'todos', ''], default: '' },
  },
  metadata: { type: Object, default: {} },
}, { timestamps: true });

AutomationRuleSchema.index({ agenteId: 1, activo: 1 });
AutomationRuleSchema.index({ tipo: 1, activo: 1 });
AutomationRuleSchema.index({ fechaImportanteCodigo: 1 });

module.exports = mongoose.model('AutomationRule', AutomationRuleSchema);
