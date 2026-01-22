const mongoose = require('mongoose');

const ReportConfigSchema = new mongoose.Schema({
  agenteId: { type: String, required: true, index: true },
  // Reportes seleccionados para el reporte anual
  annualReportSelections: {
    propiedadesCartera: { type: Boolean, default: true },
    propiedadesVendidas: { type: Boolean, default: true },
    propiedadesDisponiblesTipo: { type: Boolean, default: true },
    clientesActivosAgente: { type: Boolean, default: true },
    tasaConversion: { type: Boolean, default: true },
    ingresosMensuales: { type: Boolean, default: true },
    ingresosComparativaAgente: { type: Boolean, default: true },
    tiempoPromedioVenta: { type: Boolean, default: true },
    distribucionGeografica: { type: Boolean, default: true },
    satisfaccionCliente: { type: Boolean, default: true },
    visitasPropiedades: { type: Boolean, default: true },
    rankingAgentes: { type: Boolean, default: true },
    inventarioRangoPrecio: { type: Boolean, default: true },
    gastosOperativos: { type: Boolean, default: true },
    rentabilidadTipoPropiedad: { type: Boolean, default: true },
    tendenciasMercado: { type: Boolean, default: true },
    alertasBajoRendimiento: { type: Boolean, default: true },
    resumenCitasReuniones: { type: Boolean, default: true },
    analisisCompetencia: { type: Boolean, default: true },
    estadoPagosFacturacion: { type: Boolean, default: true },
  },
  // Configuración de envío automático
  autoSendEnabled: { type: Boolean, default: true },
  autoSendDay: { type: Number, default: 1, min: 1, max: 28 }, // Día del mes para envío
  lastAutoSendDate: { type: Date },
  // Historial de reportes generados
  generatedReports: [{
    type: { type: String }, // 'monthly' | 'annual' | 'manual'
    generatedAt: { type: Date, default: Date.now },
    period: { type: String }, // e.g., '2024-01' or '2024'
    sentToERP: { type: Boolean, default: false },
    sentAt: { type: Date },
    fileUrl: { type: String },
  }],
}, { timestamps: true });

module.exports = mongoose.model('ReportConfig', ReportConfigSchema);
