const mongoose = require('mongoose');

const ComparableSchema = new mongoose.Schema({
  codigo: { type: String, default: '' },
  direccion: { type: String, default: '' },
  zona: { type: String, default: '' },
  tipoInmueble: { type: String, default: '' },
  subtipo: { type: String, default: '' },
  superficieTotal: { type: Number, default: 0 },
  superficieCubierta: { type: Number, default: 0 },
  ambientes: { type: Number, default: 0 },
  dormitorios: { type: Number, default: 0 },
  banos: { type: Number, default: 0 },
  cochera: { type: Boolean, default: false },
  estado: { type: String, default: '' },
  antiguedad: { type: Number, default: 0 },
  amenities: [{ type: String }],
  precioPublicado: { type: Number, default: 0 },
  precioEstimadoCierre: { type: Number, default: 0 },
  valorPorM2: { type: Number, default: 0 },
  distancia: { type: String, default: '' },
  observaciones: { type: String, default: '' },
  fuente: { type: String, default: '' },
  fechaRelevamiento: { type: Date },
  incluido: { type: Boolean, default: true },
  ponderacion: { type: Number, default: 1 },
  moneda: { type: String, default: 'USD' },
});

const AjusteSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  tipo: { type: String, enum: ['porcentaje', 'monto'], default: 'porcentaje' },
  valor: { type: Number, default: 0 },
  observacion: { type: String, default: '' },
});

const MarketStudySchema = new mongoose.Schema({
  // Vinculación
  propiedadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Propiedad', default: null },
  clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', default: null },
  agenteId: { type: String, default: '', index: true },
  agenteName: { type: String, default: '' },

  // Código y estado
  codigo: { type: String, default: '' },
  estado: { type: String, enum: ['borrador', 'completado', 'archivado'], default: 'borrador' },
  version: { type: Number, default: 1 },

  // Datos generales del inmueble
  inmueble: {
    direccion: { type: String, default: '' },
    localidad: { type: String, default: '' },
    barrio: { type: String, default: '' },
    provincia: { type: String, default: '' },
    pais: { type: String, default: 'Argentina' },
    tipoInmueble: { type: String, default: '' },
    subtipo: { type: String, default: '' },
    uso: { type: String, default: '' },
    superficieCubierta: { type: Number, default: 0 },
    superficieSemicubierta: { type: Number, default: 0 },
    superficieDescubierta: { type: Number, default: 0 },
    superficieTotal: { type: Number, default: 0 },
    ambientes: { type: Number, default: 0 },
    dormitorios: { type: Number, default: 0 },
    banos: { type: Number, default: 0 },
    cocheras: { type: Number, default: 0 },
    antiguedad: { type: Number, default: 0 },
    estadoGeneral: { type: String, default: '' },
    orientacion: { type: String, default: '' },
    disposicion: { type: String, default: '' },
    pisoNivel: { type: String, default: '' },
    frenteContrafrente: { type: String, default: '' },
    aptoCredito: { type: Boolean, default: false },
    aptoProfesional: { type: Boolean, default: false },
    amoblado: { type: Boolean, default: false },
    expensas: { type: Number, default: 0 },
    servicios: [{ type: String }],
  },

  // Variables geográficas
  localizacion: {
    latitud: { type: Number, default: null },
    longitud: { type: Number, default: null },
    zonaUso: { type: String, default: '' },
    cercaniaCentrosComerciales: { type: String, default: '' },
    cercaniaEscuelas: { type: String, default: '' },
    cercaniaHospitales: { type: String, default: '' },
    cercaniaTransporte: { type: String, default: '' },
    accesibilidad: { type: String, default: '' },
    calidadEntorno: { type: String, default: '' },
    consolidacionZona: { type: String, default: '' },
    seguridadPercibida: { type: String, default: '' },
    proyeccionDesarrollo: { type: String, default: '' },
  },

  // Variables del mercado
  mercado: {
    valorPromedioM2: { type: Number, default: 0 },
    rangoInferiorM2: { type: Number, default: 0 },
    rangoSuperiorM2: { type: Number, default: 0 },
    tendenciaPrecios: { type: String, default: '' },
    nivelDemanda: { type: String, default: '' },
    nivelOferta: { type: String, default: '' },
    tiempoPromedioVenta: { type: Number, default: 0 },
    liquidezEstimada: { type: String, default: '' },
    absorcionOferta: { type: String, default: '' },
    variacionHistorica: { type: String, default: '' },
    fuenteDatos: { type: String, default: '' },
    fechaRelevamiento: { type: Date },
    moneda: { type: String, default: 'USD' },
  },

  // Comparables
  comparables: [ComparableSchema],

  // Ajustes
  ajustes: [AjusteSchema],

  // Resultado
  resultado: {
    valorEstimadoM2: { type: Number, default: 0 },
    rangoConservador: { type: Number, default: 0 },
    rangoMedio: { type: Number, default: 0 },
    rangoPremium: { type: Number, default: 0 },
    precioSugeridoPublicacion: { type: Number, default: 0 },
    precioSugeridoMercado: { type: Number, default: 0 },
    moneda: { type: String, default: 'USD' },
    observacionesTecnicas: { type: String, default: '' },
    resumenEjecutivo: { type: String, default: '' },
  },

  // PDF tracking
  pdfDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', default: null },
  pdfGeneratedAt: { type: Date, default: null },

  // Audit
  createdBy: { type: String, default: '' },
  updatedBy: { type: String, default: '' },
}, { timestamps: true });

MarketStudySchema.index({ propiedadId: 1 });
MarketStudySchema.index({ clienteId: 1 });
MarketStudySchema.index({ estado: 1 });

module.exports = mongoose.model('MarketStudy', MarketStudySchema);
