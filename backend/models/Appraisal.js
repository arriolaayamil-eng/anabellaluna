const mongoose = require('mongoose');

const AppraisalSchema = new mongoose.Schema({
  // Vinculación
  propiedadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Propiedad', default: null },
  marketStudyId: { type: mongoose.Schema.Types.ObjectId, ref: 'MarketStudy', default: null },
  clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', default: null },
  agenteId: { type: String, default: '', index: true },
  agenteName: { type: String, default: '' },

  // Código y estado
  codigo: { type: String, default: '' },
  fechaTasacion: { type: Date, default: Date.now },
  estado: { type: String, enum: ['borrador', 'en_revision', 'validada', 'certificada', 'archivada'], default: 'borrador' },
  version: { type: Number, default: 1 },

  // Datos dominiales y descriptivos
  dominial: {
    tipoInmueble: { type: String, default: '' },
    destino: { type: String, default: '' },
    ocupacion: { type: String, default: '' },
    estadoPosesion: { type: String, default: '' },
    nomenclatura: { type: String, default: '' },
    datosCatastrales: { type: String, default: '' },
    superficieTitulo: { type: Number, default: 0 },
    superficieRelevada: { type: Number, default: 0 },
    observacionesDocumentales: { type: String, default: '' },
    ubicacionExacta: { type: String, default: '' },
  },

  // Variables técnicas
  tecnico: {
    tipologia: { type: String, default: '' },
    categoriaConstructiva: { type: String, default: '' },
    calidadMateriales: { type: String, enum: ['', 'economica', 'estandar', 'buena', 'muy_buena', 'premium'], default: '' },
    calidadEstructural: { type: String, default: '' },
    estadoConservacion: { type: String, enum: ['', 'malo', 'regular', 'bueno', 'muy_bueno', 'excelente'], default: '' },
    estadoMantenimiento: { type: String, default: '' },
    antiguedadReal: { type: Number, default: 0 },
    reciclado: { type: Boolean, default: false },
    gradoActualizacion: { type: String, default: '' },
    calidadTerminaciones: { type: String, default: '' },
    carpinterias: { type: String, default: '' },
    pisos: { type: String, default: '' },
    revestimientos: { type: String, default: '' },
    cocina: { type: String, default: '' },
    banos: { type: String, default: '' },
    instalacionesElectricas: { type: String, default: '' },
    instalacionesSanitarias: { type: String, default: '' },
    instalacionesGas: { type: String, default: '' },
    climatizacion: { type: String, default: '' },
    iluminacionNatural: { type: String, enum: ['', 'escasa', 'regular', 'buena', 'muy_buena', 'excelente'], default: '' },
    ventilacion: { type: String, default: '' },
    funcionalidadDistribucion: { type: String, default: '' },
    flexibilidadUso: { type: String, default: '' },
    accesibilidad: { type: String, default: '' },
    eficienciaDiseno: { type: String, default: '' },
    orientacion: { type: String, default: '' },
    ruido: { type: String, enum: ['', 'bajo', 'medio', 'alto'], default: '' },
    vista: { type: String, default: '' },
    entorno: { type: String, default: '' },
    amenities: [{ type: String }],
    seguridadEdificio: { type: String, default: '' },
    espaciosExteriores: { type: String, default: '' },
    cochera: { type: String, default: '' },
    baulera: { type: Boolean, default: false },
    ascensor: { type: Boolean, default: false },
    amenitiesEdificio: [{ type: String }],
    estadoAreasComunes: { type: String, default: '' },
    expensas: { type: Number, default: 0 },
  },

  // Variables del terreno
  terreno: {
    superficieLote: { type: Number, default: 0 },
    frente: { type: Number, default: 0 },
    fondo: { type: Number, default: 0 },
    formaLote: { type: String, default: '' },
    topografia: { type: String, default: '' },
    orientacion: { type: String, default: '' },
    fot: { type: Number, default: 0 },
    fos: { type: Number, default: 0 },
    potencialConstructivo: { type: String, default: '' },
    restriccionesUrbanisticas: { type: String, default: '' },
    servicios: [{ type: String }],
    acceso: { type: String, default: '' },
    esquina: { type: Boolean, default: false },
    valorTerrenoEstimado: { type: Number, default: 0 },
  },

  // Variables económicas
  economico: {
    valorReferenciaM2: { type: Number, default: 0 },
    incidenciaTerreno: { type: Number, default: 0 },
    incidenciaMejoras: { type: Number, default: 0 },
    depreciacion: { type: Number, default: 0 },
    obsolescencia: { type: Number, default: 0 },
    potencialRenta: { type: String, default: '' },
    rentaEstimadaMensual: { type: Number, default: 0 },
    tasaCapitalizacion: { type: Number, default: 0 },
    valorTecnico: { type: Number, default: 0 },
    valorMercado: { type: Number, default: 0 },
    valorRealizacionRapida: { type: Number, default: 0 },
    valorPublicacionSugerido: { type: Number, default: 0 },
    moneda: { type: String, default: 'USD' },
  },

  // Metodología
  metodologia: {
    comparativaMercado: { type: Boolean, default: true },
    costoReposicion: { type: Boolean, default: false },
    capitalizacionRenta: { type: Boolean, default: false },
    metodoMixto: { type: Boolean, default: false },
    ajusteProfesional: { type: Boolean, default: false },
    principal: { type: String, default: 'comparativa_mercado' },
    descripcion: { type: String, default: '' },
  },

  // Resultado
  resultado: {
    valorFinal: { type: Number, default: 0 },
    rangoInferior: { type: Number, default: 0 },
    rangoSuperior: { type: Number, default: 0 },
    valorPublicacion: { type: Number, default: 0 },
    valorCierreEsperado: { type: Number, default: 0 },
    valorRealizacionRapida: { type: Number, default: 0 },
    valorPorM2Final: { type: Number, default: 0 },
    moneda: { type: String, default: 'USD' },
    justificacion: { type: String, default: '' },
    comentariosAgente: { type: String, default: '' },
    comentariosMatriculado: { type: String, default: '' },
  },

  // Certificación
  certificacion: {
    matriculadoNombre: { type: String, default: '' },
    matricula: { type: String, default: '' },
    firmaTexto: { type: String, default: '' },
    observaciones: { type: String, default: '' },
    fechaCertificacion: { type: Date, default: null },
    certificadoPor: { type: String, default: '' },
  },

  // Disclaimer
  disclaimerLegal: { type: String, default: 'Esta tasación tiene carácter informativo y de referencia comercial. No reemplaza una tasación judicial ni un informe pericial. Los valores expresados pueden variar según las condiciones del mercado al momento de la operación.' },

  // PDF tracking
  pdfDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', default: null },
  pdfGeneratedAt: { type: Date, default: null },

  // Audit
  createdBy: { type: String, default: '' },
  updatedBy: { type: String, default: '' },
}, { timestamps: true });

AppraisalSchema.index({ propiedadId: 1 });
AppraisalSchema.index({ marketStudyId: 1 });
AppraisalSchema.index({ clienteId: 1 });
AppraisalSchema.index({ estado: 1 });

module.exports = mongoose.model('Appraisal', AppraisalSchema);
