const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  agenteId: { type: String, required: true, index: true },
  tipo: { 
    type: String, 
    enum: [
      'bienvenida',           // Welcome message for new client
      'seguimiento_contacto', // Follow-up after first contact
      'cumpleanos',           // Birthday reminder
      'seguimiento_propuesta',// Proposal follow-up
      'renovacion',           // Contract renewal alert
      'evento_especial',      // Special event notification
      'feedback',             // Feedback request
      'inactividad',          // Inactivity alert
      'cumpleanos_contacto',  // Important contact birthday
      'objetivo',             // Goal achievement reminder
      'vencimiento_documento',// Document expiration
      'hito',                 // Milestone commemoration
      'fecha_importante',     // Argentine important dates
      'sistema',              // System notification
      'tarea',                // Task reminder
      'cita',                 // Appointment reminder
      'operacion_nueva',      // New operation created
      'consulta_web',         // New web inquiry received
      'agente_rendimiento',   // Agent performance alert
      'contrato_vencimiento', // Contract expiring soon (admin view)
      'propiedad_estado',     // Property status change
      'meta_cumplida',        // Goal achieved
      'reporte_diario',       // Daily summary report
    ],
    required: true 
  },
  titulo: { type: String, required: true },
  mensaje: { type: String, required: true },
  prioridad: { type: String, enum: ['baja', 'media', 'alta', 'urgente'], default: 'media' },
  leida: { type: Boolean, default: false },
  fechaLectura: { type: Date },
  // Reference to related entity
  entidadTipo: { type: String, enum: ['cliente', 'propiedad', 'operacion', 'cita', 'tarea', 'documento', 'agente'] },
  entidadId: { type: String, index: true },
  entidadNombre: { type: String },
  // Google Calendar integration
  googleEventId: { type: String },
  calendarSynced: { type: Boolean, default: false },
  // Scheduling
  fechaProgramada: { type: Date, index: true },
  enviada: { type: Boolean, default: false },
  fechaEnvio: { type: Date },
  // Client communication tracking
  enviadaAlCliente: { type: Boolean, default: false },
  canalUtilizado: { type: String, enum: ['whatsapp', 'email', 'sms', 'notificacion', ''], default: '' },
  fechaEnvioCliente: { type: Date },
  // Automation reference
  automationRuleId: { type: mongoose.Schema.Types.ObjectId, ref: 'AutomationRule' },
  // Action URL for the notification
  accionUrl: { type: String },
  // Additional metadata
  metadata: { type: Object, default: {} },
}, { timestamps: true });

// Index for efficient queries
NotificationSchema.index({ agenteId: 1, leida: 1, createdAt: -1 });
NotificationSchema.index({ agenteId: 1, fechaProgramada: 1, enviada: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
