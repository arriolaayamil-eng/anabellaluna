/* eslint-disable no-confusing-arrow, no-unused-vars, object-property-newline, brace-style, no-empty, max-len, no-plusplus, quotes, prefer-template */
import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FaPlus, FaSearch, FaEdit, FaTrash, FaCopy, FaFilePdf, FaSave, FaArrowLeft, FaBuilding, FaChartLine, FaBalanceScale, FaEye, FaTimes, FaChevronDown, FaChevronUp, FaCalculator, FaDollarSign, FaFileAlt } from 'react-icons/fa';
import { Header } from '../components';
import { useStateContext } from '../contexts/ContextProvider';
import { tasacionesService } from '../services/tasacionesService';
import { crmService } from '../services/crmService';
import API_CONFIG, { getAuthToken } from '../config/api';

// ── Helpers ──
const fmtCurrency = (val, mon = 'USD') => {
  if (!val && val !== 0) return '-';
  const sym = mon === 'USD' ? 'USD' : mon === 'ARS' ? 'ARS' : mon;
  return `${sym} ${Number(val).toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-AR') : '-';
const fmtNum = (v) => (v || v === 0) ? Number(v).toLocaleString('es-AR') : '-';

const ESTADO_COLORS = {
  borrador: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  completado: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  archivado: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  en_revision: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  validada: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  certificada: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
};

const ESTADO_LABELS = {
  borrador: 'Borrador', completado: 'Completado', archivado: 'Archivado',
  en_revision: 'En revisión', validada: 'Validada', certificada: 'Certificada',
};

const PROXIMITY_OPTS = ['', 'Excelente', 'Buena', 'Regular', 'Deficiente'];
const TREND_OPTS = ['', 'Alcista', 'Estable', 'Bajista'];
const DEMAND_OPTS = ['', 'Alta', 'Media', 'Baja'];
const QUALITY_OPTS = ['', 'economica', 'estandar', 'buena', 'muy_buena', 'premium'];
const CONSERVATION_OPTS = ['', 'malo', 'regular', 'bueno', 'muy_bueno', 'excelente'];
const LIGHT_OPTS = ['', 'escasa', 'regular', 'buena', 'muy_buena', 'excelente'];
const NOISE_OPTS = ['', 'bajo', 'medio', 'alto'];
const TIPO_INM = ['', 'Departamento', 'Casa', 'PH', 'Local', 'Oficina', 'Terreno', 'Galpón', 'Cochera', 'Fondo de comercio', 'Otro'];
const METODO_OPTS = [
  { id: 'comparativa_mercado', label: 'Comparativa de mercado' },
  { id: 'costo_reposicion', label: 'Costo de reposición depreciado' },
  { id: 'capitalizacion_renta', label: 'Capitalización de renta' },
  { id: 'metodo_mixto', label: 'Método mixto' },
  { id: 'ajuste_profesional', label: 'Ajuste profesional manual' },
];
const APPRAISAL_ESTADOS = ['borrador', 'en_revision', 'validada', 'certificada', 'archivada'];

// ── Default objects ──
const emptyComparable = () => ({
  codigo: '', direccion: '', zona: '', tipoInmueble: '', subtipo: '', superficieTotal: 0, superficieCubierta: 0,
  ambientes: 0, dormitorios: 0, banos: 0, cochera: false, estado: '', antiguedad: 0, amenities: [],
  precioPublicado: 0, precioEstimadoCierre: 0, valorPorM2: 0, distancia: '', observaciones: '', fuente: '',
  fechaRelevamiento: null, incluido: true, ponderacion: 1, moneda: 'USD',
});

const emptyAjuste = () => ({ nombre: '', tipo: 'porcentaje', valor: 0, observacion: '' });

const DEFAULT_AJUSTE_NAMES = [
  'Ubicación', 'Estado general', 'Antigüedad', 'Calidad constructiva', 'Amenities',
  'Orientación/disposición', 'Luminosidad', 'Vista', 'Cochera', 'Balcón/terraza/patio',
  'Seguridad', 'Expensas', 'Liquidez de mercado',
];

// ── Collapsible Section ──
const Section = ({ title, icon, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border dark:border-gray-700 rounded-xl overflow-hidden mb-4">
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors text-left">
        <span className="flex items-center gap-2 font-semibold text-sm dark:text-gray-100">{icon} {title}</span>
        {open ? <FaChevronUp className="text-gray-400" size={12} /> : <FaChevronDown className="text-gray-400" size={12} />}
      </button>
      {open && <div className="p-4 space-y-3">{children}</div>}
    </div>
  );
};

// ── Field components ──
const Field = ({ label, children, span = 1 }) => (
  <div className={`${span === 2 ? 'col-span-2' : span === 3 ? 'col-span-3' : ''}`}>
    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
    {children}
  </div>
);

const inputCls = 'w-full px-3 py-2 text-sm border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all';
const selectCls = inputCls;

const Tasaciones = () => {
  const { currentMode, currentColor } = useStateContext();
  const isDark = currentMode === 'Dark';

  // ── Tab state ──
  const [activeTab, setActiveTab] = useState('market'); // 'market' | 'appraisals'
  const [view, setView] = useState('list'); // 'list' | 'form'

  // ── Data ──
  const [studies, setStudies] = useState([]);
  const [appraisals, setAppraisals] = useState([]);
  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQ, setSearchQ] = useState('');

  // ── Form state ──
  const [editingItem, setEditingItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  // ── Load data ──
  const loadStudies = useCallback(async () => {
    setLoading(true);
    try { const data = await tasacionesService.marketStudies.getAll(); setStudies(Array.isArray(data) ? data : []); }
    catch { toast.error('Error cargando estudios'); }
    finally { setLoading(false); }
  }, []);

  const loadAppraisals = useCallback(async () => {
    setLoading(true);
    try { const data = await tasacionesService.appraisals.getAll(); setAppraisals(Array.isArray(data) ? data : []); }
    catch { toast.error('Error cargando tasaciones'); }
    finally { setLoading(false); }
  }, []);

  const loadProperties = useCallback(async () => {
    try { const data = await crmService.propiedades.getAll(); setProperties(Array.isArray(data) ? data : []); } catch {}
  }, []);

  const loadClients = useCallback(async () => {
    try { const data = await crmService.clientes.getAll(); setClients(Array.isArray(data) ? data : []); } catch {}
  }, []);

  useEffect(() => { loadProperties(); loadClients(); }, [loadProperties, loadClients]);
  useEffect(() => { if (activeTab === 'market') loadStudies(); else loadAppraisals(); }, [activeTab, loadStudies, loadAppraisals]);

  // ── Market Study form defaults ──
  const newMarketStudy = () => ({
    propiedadId: '', clienteId: '', estado: 'borrador',
    inmueble: { direccion: '', localidad: '', barrio: '', provincia: '', pais: 'Argentina', tipoInmueble: '', subtipo: '', uso: '', superficieCubierta: 0, superficieSemicubierta: 0, superficieDescubierta: 0, superficieTotal: 0, ambientes: 0, dormitorios: 0, banos: 0, cocheras: 0, antiguedad: 0, estadoGeneral: '', orientacion: '', disposicion: '', pisoNivel: '', frenteContrafrente: '', aptoCredito: false, aptoProfesional: false, amoblado: false, expensas: 0, servicios: [] },
    localizacion: { latitud: null, longitud: null, zonaUso: '', cercaniaCentrosComerciales: '', cercaniaEscuelas: '', cercaniaHospitales: '', cercaniaTransporte: '', accesibilidad: '', calidadEntorno: '', consolidacionZona: '', seguridadPercibida: '', proyeccionDesarrollo: '' },
    mercado: { valorPromedioM2: 0, rangoInferiorM2: 0, rangoSuperiorM2: 0, tendenciaPrecios: '', nivelDemanda: '', nivelOferta: '', tiempoPromedioVenta: 0, liquidezEstimada: '', absorcionOferta: '', variacionHistorica: '', fuenteDatos: '', fechaRelevamiento: null, moneda: 'USD' },
    comparables: [],
    ajustes: DEFAULT_AJUSTE_NAMES.map((n) => ({ nombre: n, tipo: 'porcentaje', valor: 0, observacion: '' })),
    resultado: { valorEstimadoM2: 0, rangoConservador: 0, rangoMedio: 0, rangoPremium: 0, precioSugeridoPublicacion: 0, precioSugeridoMercado: 0, moneda: 'USD', observacionesTecnicas: '', resumenEjecutivo: '' },
  });

  const newAppraisal = () => ({
    propiedadId: '', marketStudyId: '', clienteId: '', estado: 'borrador', fechaTasacion: new Date().toISOString().slice(0, 10),
    dominial: { tipoInmueble: '', destino: '', ocupacion: '', estadoPosesion: '', nomenclatura: '', datosCatastrales: '', superficieTitulo: 0, superficieRelevada: 0, observacionesDocumentales: '', ubicacionExacta: '' },
    tecnico: { tipologia: '', categoriaConstructiva: '', calidadMateriales: '', calidadEstructural: '', estadoConservacion: '', estadoMantenimiento: '', antiguedadReal: 0, reciclado: false, gradoActualizacion: '', calidadTerminaciones: '', carpinterias: '', pisos: '', revestimientos: '', cocina: '', banos: '', instalacionesElectricas: '', instalacionesSanitarias: '', instalacionesGas: '', climatizacion: '', iluminacionNatural: '', ventilacion: '', funcionalidadDistribucion: '', flexibilidadUso: '', accesibilidad: '', eficienciaDiseno: '', orientacion: '', ruido: '', vista: '', entorno: '', amenities: [], seguridadEdificio: '', espaciosExteriores: '', cochera: '', baulera: false, ascensor: false, amenitiesEdificio: [], estadoAreasComunes: '', expensas: 0 },
    terreno: { superficieLote: 0, frente: 0, fondo: 0, formaLote: '', topografia: '', orientacion: '', fot: 0, fos: 0, potencialConstructivo: '', restriccionesUrbanisticas: '', servicios: [], acceso: '', esquina: false, valorTerrenoEstimado: 0 },
    economico: { valorReferenciaM2: 0, incidenciaTerreno: 0, incidenciaMejoras: 0, depreciacion: 0, obsolescencia: 0, potencialRenta: '', rentaEstimadaMensual: 0, tasaCapitalizacion: 0, valorTecnico: 0, valorMercado: 0, valorRealizacionRapida: 0, valorPublicacionSugerido: 0, moneda: 'USD' },
    metodologia: { comparativaMercado: true, costoReposicion: false, capitalizacionRenta: false, metodoMixto: false, ajusteProfesional: false, principal: 'comparativa_mercado', descripcion: '' },
    resultado: { valorFinal: 0, rangoInferior: 0, rangoSuperior: 0, valorPublicacion: 0, valorCierreEsperado: 0, valorRealizacionRapida: 0, valorPorM2Final: 0, moneda: 'USD', justificacion: '', comentariosAgente: '', comentariosMatriculado: '' },
    certificacion: { matriculadoNombre: '', matricula: '', firmaTexto: '', observaciones: '', fechaCertificacion: null },
    disclaimerLegal: 'Esta tasación tiene carácter informativo y de referencia comercial. No reemplaza una tasación judicial ni un informe pericial. Los valores expresados pueden variar según las condiciones del mercado al momento de la operación.',
  });

  // ── Populate from property ──
  const populateFromProperty = (propId, form, setForm) => {
    const prop = properties.find((p) => String(p._id) === String(propId));
    if (!prop) return;
    const m = prop.metadata || {};
    if (activeTab === 'market') {
      setForm((prev) => ({
        ...prev, propiedadId: propId, clienteId: prop.ownerId || prev.clienteId,
        inmueble: {
          ...prev.inmueble, direccion: m.direccion || prop.address || '', localidad: m.ciudad || '', barrio: m.barrio || '', provincia: m.provincia || '',
          tipoInmueble: m.tipo || '', subtipo: m.categoria || '', superficieCubierta: Number(m.superficieCubierta || 0), superficieTotal: Number(m.superficieTotal || m.superficieCubierta || 0),
          ambientes: Number(m.ambientes || 0), dormitorios: Number(m.dormitorios || 0), banos: Number(m.banos || 0), cocheras: Number(m.cocheras || 0), antiguedad: Number(m.antiguedad || 0),
        },
      }));
    } else {
      setForm((prev) => ({
        ...prev, propiedadId: propId, clienteId: prop.ownerId || prev.clienteId,
        dominial: { ...prev.dominial, tipoInmueble: m.tipo || '', ubicacionExacta: m.direccion || prop.address || '', superficieRelevada: Number(m.superficieTotal || m.superficieCubierta || 0) },
      }));
    }
  };

  // ── Calculate market study results ──
  const calculateResults = (form) => {
    const included = (form.comparables || []).filter((c) => c.incluido !== false && c.valorPorM2 > 0);
    if (included.length === 0) return form.resultado;

    const weights = included.map((c) => c.ponderacion || 1);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    const weightedValues = included.map((c, i) => c.valorPorM2 * weights[i]);
    const promedioM2 = weightedValues.reduce((a, b) => a + b, 0) / totalWeight;
    const sortedM2 = included.map((c) => c.valorPorM2).sort((a, b) => a - b);
    const medianaM2 = sortedM2.length % 2 === 0 ? (sortedM2[sortedM2.length / 2 - 1] + sortedM2[sortedM2.length / 2]) / 2 : sortedM2[Math.floor(sortedM2.length / 2)];
    const minM2 = sortedM2[0];
    const maxM2 = sortedM2[sortedM2.length - 1];

    // Apply adjustments
    let ajustePct = 0;
    let ajusteMonto = 0;
    (form.ajustes || []).forEach((aj) => {
      if (aj.tipo === 'porcentaje') ajustePct += Number(aj.valor || 0);
      else ajusteMonto += Number(aj.valor || 0);
    });

    const baseM2 = (promedioM2 + medianaM2) / 2;
    const adjustedM2 = baseM2 * (1 + ajustePct / 100) + ajusteMonto;
    const supTotal = Number(form.inmueble?.superficieTotal || 0) || 1;

    return {
      ...form.resultado,
      valorEstimadoM2: Math.round(adjustedM2),
      rangoConservador: Math.round(minM2 * supTotal * 0.95),
      rangoMedio: Math.round(adjustedM2 * supTotal),
      rangoPremium: Math.round(maxM2 * supTotal * 1.05),
      precioSugeridoPublicacion: Math.round(adjustedM2 * supTotal * 1.05),
      precioSugeridoMercado: Math.round(adjustedM2 * supTotal),
    };
  };

  // ── Save ──
  const handleSave = async () => {
    setSaving(true);
    try {
      if (activeTab === 'market') {
        if (editingItem._id) {
          await tasacionesService.marketStudies.update(editingItem._id, editingItem);
        } else {
          const created = await tasacionesService.marketStudies.create(editingItem);
          setEditingItem(created);
        }
        toast.success('Estudio guardado');
        loadStudies();
      } else {
        if (!editingItem.propiedadId) { toast.error('Seleccione una propiedad'); setSaving(false); return; }
        if (editingItem._id) {
          await tasacionesService.appraisals.update(editingItem._id, editingItem);
        } else {
          const created = await tasacionesService.appraisals.create(editingItem);
          setEditingItem(created);
        }
        toast.success('Tasación guardada');
        loadAppraisals();
      }
    } catch (err) { toast.error(err.message || 'Error al guardar'); }
    finally { setSaving(false); }
  };

  // ── Generate PDF ──
  const handleGeneratePdf = async () => {
    if (!editingItem?._id) { toast.error('Guarde primero antes de generar PDF'); return; }
    setGeneratingPdf(true);
    try {
      if (activeTab === 'market') {
        await tasacionesService.marketStudies.generatePdf(editingItem._id);
      } else {
        await tasacionesService.appraisals.generatePdf(editingItem._id);
      }
      toast.success('PDF generado y archivado en carpeta Tasaciones');
    } catch (err) { toast.error(err.message || 'Error al generar PDF'); }
    finally { setGeneratingPdf(false); }
  };

  // ── Download PDF ──
  const handleDownloadPdf = async () => {
    if (!editingItem?._id) return;
    try {
      const baseUrl = API_CONFIG.BASE_URL || '';
      const path = activeTab === 'market'
        ? `/crm/tasaciones/market-studies/${editingItem._id}/pdf/download`
        : `/crm/tasaciones/appraisals/${editingItem._id}/pdf/download`;
      const token = getAuthToken();
      window.open(`${baseUrl}${path}?token=${token}`, '_blank');
    } catch { toast.error('Error al descargar'); }
  };

  // ── Delete ──
  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar este registro?')) return;
    try {
      if (activeTab === 'market') { await tasacionesService.marketStudies.delete(id); loadStudies(); }
      else { await tasacionesService.appraisals.delete(id); loadAppraisals(); }
      toast.success('Eliminado');
    } catch { toast.error('Error al eliminar'); }
  };

  // ── Duplicate ──
  const handleDuplicate = async (id) => {
    try {
      if (activeTab === 'market') { await tasacionesService.marketStudies.duplicate(id); loadStudies(); }
      else { await tasacionesService.appraisals.duplicate(id); loadAppraisals(); }
      toast.success('Duplicado creado');
    } catch { toast.error('Error al duplicar'); }
  };

  // ── Open form ──
  const openNew = () => {
    setEditingItem(activeTab === 'market' ? newMarketStudy() : newAppraisal());
    setView('form');
  };
  const openEdit = async (item) => {
    try {
      const full = activeTab === 'market'
        ? await tasacionesService.marketStudies.getById(item._id)
        : await tasacionesService.appraisals.getById(item._id);
      setEditingItem(full);
      setView('form');
    } catch { toast.error('Error al cargar'); }
  };

  // ── Nested updater helpers ──
  const setNested = (path, value) => {
    setEditingItem((prev) => {
      const parts = path.split('.');
      const copy = JSON.parse(JSON.stringify(prev));
      let obj = copy;
      for (let i = 0; i < parts.length - 1; i++) obj = obj[parts[i]];
      obj[parts[parts.length - 1]] = value;
      return copy;
    });
  };

  // Filtered lists
  const filteredStudies = studies.filter((s) => {
    if (!searchQ) return true;
    const q = searchQ.toLowerCase();
    return (s.codigo || '').toLowerCase().includes(q) || (s.inmueble?.direccion || '').toLowerCase().includes(q) || (s.agenteName || '').toLowerCase().includes(q);
  });
  const filteredAppraisals = appraisals.filter((a) => {
    if (!searchQ) return true;
    const q = searchQ.toLowerCase();
    return (a.codigo || '').toLowerCase().includes(q) || (a.dominial?.ubicacionExacta || '').toLowerCase().includes(q) || (a.agenteName || '').toLowerCase().includes(q);
  });

  const cardBase = `rounded-2xl p-6 border transition-shadow ${isDark ? 'bg-secondary-dark-bg border-gray-700/50' : 'bg-white border-gray-100 shadow-md'}`;
  const btnPrimary = `inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-all shadow-sm hover:shadow`;
  const btnSecondary = `inline-flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-lg transition-all ${isDark ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`;

  // ═══════════════════════════════════════════════════════════
  // RENDER LIST VIEW
  // ═══════════════════════════════════════════════════════════
  const renderList = () => {
    const items = activeTab === 'market' ? filteredStudies : filteredAppraisals;
    return (
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
            <input type="text" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Buscar por código, dirección, agente..." className={`${inputCls} pl-9`} />
          </div>
          <button type="button" onClick={openNew} className={btnPrimary} style={{ backgroundColor: currentColor }}>
            <FaPlus size={12} /> {activeTab === 'market' ? 'Nuevo Estudio' : 'Nueva Tasación'}
          </button>
        </div>

        {loading && <p className="text-center text-gray-400 py-8">Cargando...</p>}

        {!loading && items.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <FaBalanceScale size={48} className="mx-auto mb-4 opacity-30" />
            <p>No hay {activeTab === 'market' ? 'estudios de mercado' : 'tasaciones'} registrados.</p>
          </div>
        )}

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map((item) => {
            const isMS = activeTab === 'market';
            const titulo = isMS ? (item.inmueble?.direccion || 'Sin dirección') : (item.dominial?.ubicacionExacta || 'Sin ubicación');
            const estado = item.estado || 'borrador';
            const mon = isMS ? (item.resultado?.moneda || 'USD') : (item.resultado?.moneda || 'USD');
            const valorPrincipal = isMS ? item.resultado?.precioSugeridoMercado : item.resultado?.valorFinal;
            return (
              <div key={item._id} className={cardBase + ' cursor-pointer hover:shadow-lg'} onClick={() => openEdit(item)}>
                <div className="flex items-start justify-between mb-3">
                  <span className="text-xs font-mono text-gray-400">{item.codigo || '-'}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLORS[estado] || ''}`}>{ESTADO_LABELS[estado] || estado}</span>
                </div>
                <h3 className="font-semibold text-sm dark:text-gray-100 mb-1 truncate">{titulo}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{fmtDate(item.updatedAt)} · {item.agenteName || 'Sin agente'}</p>
                {valorPrincipal > 0 && (
                  <p className="text-lg font-bold dark:text-gray-100" style={{ color: currentColor }}>{fmtCurrency(valorPrincipal, mon)}</p>
                )}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t dark:border-gray-700">
                  <button type="button" onClick={(e) => { e.stopPropagation(); openEdit(item); }} className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"><FaEdit size={10} /> Editar</button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleDuplicate(item._id); }} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"><FaCopy size={10} /> Duplicar</button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); handleDelete(item._id); }} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 ml-auto"><FaTrash size={10} /></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER MARKET STUDY FORM
  // ═══════════════════════════════════════════════════════════
  const renderMarketStudyForm = () => {
    const f = editingItem;
    if (!f) return null;
    const inm = f.inmueble || {};
    const loc = f.localizacion || {};
    const mkt = f.mercado || {};
    const res = f.resultado || {};

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => { setView('list'); setEditingItem(null); }} className={btnSecondary}><FaArrowLeft size={12} /> Volver</button>
            <h2 className="text-lg font-bold dark:text-gray-100">{f._id ? `Estudio ${f.codigo}` : 'Nuevo Estudio de Mercado'}</h2>
            {f.estado && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLORS[f.estado]}`}>{ESTADO_LABELS[f.estado]}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleSave} disabled={saving} className={btnPrimary} style={{ backgroundColor: currentColor }}>
              <FaSave size={12} /> {saving ? 'Guardando...' : 'Guardar'}
            </button>
            {f._id && (
              <>
                <button type="button" onClick={handleGeneratePdf} disabled={generatingPdf} className={btnSecondary}>
                  <FaFilePdf size={12} /> {generatingPdf ? 'Generando...' : 'Generar PDF'}
                </button>
                <button type="button" onClick={handleDownloadPdf} className={btnSecondary}><FaEye size={12} /> Descargar PDF</button>
              </>
            )}
          </div>
        </div>

        {/* Resultado resumen */}
        <div className={`${cardBase} flex flex-wrap gap-6`}>
          <div><span className="text-xs text-gray-500 dark:text-gray-400">Valor est. m²</span><p className="text-lg font-bold dark:text-gray-100">{fmtCurrency(res.valorEstimadoM2, res.moneda)}</p></div>
          <div><span className="text-xs text-gray-500 dark:text-gray-400">Rango conservador</span><p className="font-semibold dark:text-gray-200">{fmtCurrency(res.rangoConservador, res.moneda)}</p></div>
          <div><span className="text-xs text-gray-500 dark:text-gray-400">Rango medio</span><p className="font-semibold dark:text-gray-200">{fmtCurrency(res.rangoMedio, res.moneda)}</p></div>
          <div><span className="text-xs text-gray-500 dark:text-gray-400">Rango premium</span><p className="font-semibold dark:text-gray-200">{fmtCurrency(res.rangoPremium, res.moneda)}</p></div>
          <div><span className="text-xs text-gray-500 dark:text-gray-400">Precio publicación</span><p className="text-lg font-bold" style={{ color: currentColor }}>{fmtCurrency(res.precioSugeridoPublicacion, res.moneda)}</p></div>
          <button type="button" className="ml-auto self-center text-sm flex items-center gap-1 text-blue-500 hover:text-blue-700" onClick={() => { const calc = calculateResults(f); setNested('resultado', { ...res, ...calc }); toast.success('Cálculos actualizados'); }}>
            <FaCalculator size={12} /> Recalcular
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {/* Vinculación */}
            <Section title="Vinculación" icon={<FaBuilding size={14} />}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Field label="Propiedad">
                  <select className={selectCls} value={f.propiedadId || ''} onChange={(e) => { setNested('propiedadId', e.target.value); populateFromProperty(e.target.value, f, setEditingItem); }}>
                    <option value="">Seleccionar...</option>
                    {properties.map((p) => <option key={p._id} value={p._id}>{p.title} — {p.metadata?.direccion || p.address || 'Sin dirección'}</option>)}
                  </select>
                </Field>
                <Field label="Cliente">
                  <select className={selectCls} value={f.clienteId || ''} onChange={(e) => setNested('clienteId', e.target.value)}>
                    <option value="">Seleccionar...</option>
                    {clients.map((c) => <option key={c._id} value={c._id}>{c.nombre} {c.apellido}</option>)}
                  </select>
                </Field>
                <Field label="Estado">
                  <select className={selectCls} value={f.estado} onChange={(e) => setNested('estado', e.target.value)}>
                    <option value="borrador">Borrador</option>
                    <option value="completado">Completado</option>
                    <option value="archivado">Archivado</option>
                  </select>
                </Field>
              </div>
            </Section>

            {/* Datos del inmueble */}
            <Section title="Datos del Inmueble" icon={<FaBuilding size={14} />}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Field label="Dirección" span={2}><input className={inputCls} value={inm.direccion} onChange={(e) => setNested('inmueble.direccion', e.target.value)} /></Field>
                <Field label="Localidad"><input className={inputCls} value={inm.localidad} onChange={(e) => setNested('inmueble.localidad', e.target.value)} /></Field>
                <Field label="Barrio"><input className={inputCls} value={inm.barrio} onChange={(e) => setNested('inmueble.barrio', e.target.value)} /></Field>
                <Field label="Provincia"><input className={inputCls} value={inm.provincia} onChange={(e) => setNested('inmueble.provincia', e.target.value)} /></Field>
                <Field label="Tipo">
                  <select className={selectCls} value={inm.tipoInmueble} onChange={(e) => setNested('inmueble.tipoInmueble', e.target.value)}>
                    {TIPO_INM.map((t) => <option key={t} value={t}>{t || 'Seleccionar...'}</option>)}
                  </select>
                </Field>
                <Field label="Uso"><input className={inputCls} value={inm.uso} onChange={(e) => setNested('inmueble.uso', e.target.value)} /></Field>
                <Field label="Estado general"><input className={inputCls} value={inm.estadoGeneral} onChange={(e) => setNested('inmueble.estadoGeneral', e.target.value)} /></Field>
                <Field label="Sup. cubierta (m²)"><input type="number" className={inputCls} value={inm.superficieCubierta || ''} onChange={(e) => setNested('inmueble.superficieCubierta', Number(e.target.value))} /></Field>
                <Field label="Sup. semicub. (m²)"><input type="number" className={inputCls} value={inm.superficieSemicubierta || ''} onChange={(e) => setNested('inmueble.superficieSemicubierta', Number(e.target.value))} /></Field>
                <Field label="Sup. descub. (m²)"><input type="number" className={inputCls} value={inm.superficieDescubierta || ''} onChange={(e) => setNested('inmueble.superficieDescubierta', Number(e.target.value))} /></Field>
                <Field label="Sup. total (m²)"><input type="number" className={inputCls} value={inm.superficieTotal || ''} onChange={(e) => setNested('inmueble.superficieTotal', Number(e.target.value))} /></Field>
                <Field label="Ambientes"><input type="number" className={inputCls} value={inm.ambientes || ''} onChange={(e) => setNested('inmueble.ambientes', Number(e.target.value))} /></Field>
                <Field label="Dormitorios"><input type="number" className={inputCls} value={inm.dormitorios || ''} onChange={(e) => setNested('inmueble.dormitorios', Number(e.target.value))} /></Field>
                <Field label="Baños"><input type="number" className={inputCls} value={inm.banos || ''} onChange={(e) => setNested('inmueble.banos', Number(e.target.value))} /></Field>
                <Field label="Cocheras"><input type="number" className={inputCls} value={inm.cocheras || ''} onChange={(e) => setNested('inmueble.cocheras', Number(e.target.value))} /></Field>
                <Field label="Antigüedad (años)"><input type="number" className={inputCls} value={inm.antiguedad || ''} onChange={(e) => setNested('inmueble.antiguedad', Number(e.target.value))} /></Field>
                <Field label="Orientación"><input className={inputCls} value={inm.orientacion} onChange={(e) => setNested('inmueble.orientacion', e.target.value)} /></Field>
                <Field label="Disposición"><input className={inputCls} value={inm.disposicion} onChange={(e) => setNested('inmueble.disposicion', e.target.value)} /></Field>
                <Field label="Piso / Nivel"><input className={inputCls} value={inm.pisoNivel} onChange={(e) => setNested('inmueble.pisoNivel', e.target.value)} /></Field>
              </div>
              <div className="flex flex-wrap gap-4 mt-3">
                <label className="flex items-center gap-2 text-sm dark:text-gray-300"><input type="checkbox" checked={inm.aptoCredito} onChange={(e) => setNested('inmueble.aptoCredito', e.target.checked)} /> Apto crédito</label>
                <label className="flex items-center gap-2 text-sm dark:text-gray-300"><input type="checkbox" checked={inm.aptoProfesional} onChange={(e) => setNested('inmueble.aptoProfesional', e.target.checked)} /> Apto profesional</label>
                <label className="flex items-center gap-2 text-sm dark:text-gray-300"><input type="checkbox" checked={inm.amoblado} onChange={(e) => setNested('inmueble.amoblado', e.target.checked)} /> Amoblado</label>
              </div>
              <Field label="Expensas (ARS)"><input type="number" className={inputCls + ' max-w-[200px]'} value={inm.expensas || ''} onChange={(e) => setNested('inmueble.expensas', Number(e.target.value))} /></Field>
            </Section>

            {/* Localización */}
            <Section title="Variables de Localización" icon={<FaChartLine size={14} />} defaultOpen={false}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Field label="Zona de uso"><select className={selectCls} value={loc.zonaUso} onChange={(e) => setNested('localizacion.zonaUso', e.target.value)}><option value="">Seleccionar...</option><option>Residencial</option><option>Comercial</option><option>Mixta</option><option>Industrial</option></select></Field>
                {['cercaniaCentrosComerciales', 'cercaniaEscuelas', 'cercaniaHospitales', 'cercaniaTransporte', 'accesibilidad', 'calidadEntorno', 'consolidacionZona', 'seguridadPercibida', 'proyeccionDesarrollo'].map((k) => (
                  <Field key={k} label={k.replace(/cercania/i, 'Cercanía ').replace(/([A-Z])/g, ' $1').trim()}>
                    <select className={selectCls} value={loc[k] || ''} onChange={(e) => setNested(`localizacion.${k}`, e.target.value)}>
                      {PROXIMITY_OPTS.map((o) => <option key={o} value={o}>{o || 'Seleccionar...'}</option>)}
                    </select>
                  </Field>
                ))}
              </div>
            </Section>

            {/* Variables del mercado */}
            <Section title="Variables del Mercado" icon={<FaChartLine size={14} />} defaultOpen={false}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Field label="Moneda"><select className={selectCls} value={mkt.moneda} onChange={(e) => setNested('mercado.moneda', e.target.value)}><option value="USD">USD</option><option value="ARS">ARS</option></select></Field>
                <Field label="Valor prom. m²"><input type="number" className={inputCls} value={mkt.valorPromedioM2 || ''} onChange={(e) => setNested('mercado.valorPromedioM2', Number(e.target.value))} /></Field>
                <Field label="Rango inf. m²"><input type="number" className={inputCls} value={mkt.rangoInferiorM2 || ''} onChange={(e) => setNested('mercado.rangoInferiorM2', Number(e.target.value))} /></Field>
                <Field label="Rango sup. m²"><input type="number" className={inputCls} value={mkt.rangoSuperiorM2 || ''} onChange={(e) => setNested('mercado.rangoSuperiorM2', Number(e.target.value))} /></Field>
                <Field label="Tendencia"><select className={selectCls} value={mkt.tendenciaPrecios} onChange={(e) => setNested('mercado.tendenciaPrecios', e.target.value)}>{TREND_OPTS.map((o) => <option key={o} value={o}>{o || 'Seleccionar...'}</option>)}</select></Field>
                <Field label="Nivel demanda"><select className={selectCls} value={mkt.nivelDemanda} onChange={(e) => setNested('mercado.nivelDemanda', e.target.value)}>{DEMAND_OPTS.map((o) => <option key={o} value={o}>{o || 'Seleccionar...'}</option>)}</select></Field>
                <Field label="Nivel oferta"><select className={selectCls} value={mkt.nivelOferta} onChange={(e) => setNested('mercado.nivelOferta', e.target.value)}>{DEMAND_OPTS.map((o) => <option key={o} value={o}>{o || 'Seleccionar...'}</option>)}</select></Field>
                <Field label="Tiempo prom. venta (días)"><input type="number" className={inputCls} value={mkt.tiempoPromedioVenta || ''} onChange={(e) => setNested('mercado.tiempoPromedioVenta', Number(e.target.value))} /></Field>
                <Field label="Fuente de datos"><input className={inputCls} value={mkt.fuenteDatos} onChange={(e) => setNested('mercado.fuenteDatos', e.target.value)} /></Field>
              </div>
            </Section>

            {/* Comparables */}
            <Section title={`Comparables (${(f.comparables || []).length})`} icon={<FaBalanceScale size={14} />}>
              <button type="button" onClick={() => setEditingItem((prev) => ({ ...prev, comparables: [...(prev.comparables || []), emptyComparable()] }))} className={btnSecondary + ' mb-3'}><FaPlus size={10} /> Agregar comparable</button>
              {(f.comparables || []).map((comp, idx) => (
                <div key={idx} className={`p-3 rounded-lg border mb-2 ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'} ${!comp.incluido ? 'opacity-50' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold dark:text-gray-300">#{idx + 1}</span>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1 text-xs dark:text-gray-400"><input type="checkbox" checked={comp.incluido} onChange={(e) => { const c = [...f.comparables]; c[idx] = { ...c[idx], incluido: e.target.checked }; setNested('comparables', c); }} /> Incluido</label>
                      <button type="button" onClick={() => { const c = [...f.comparables]; c.splice(idx, 1); setNested('comparables', c); }} className="text-red-500 hover:text-red-700"><FaTimes size={12} /></button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Field label="Dirección"><input className={inputCls} value={comp.direccion} onChange={(e) => { const c = [...f.comparables]; c[idx] = { ...c[idx], direccion: e.target.value }; setNested('comparables', c); }} /></Field>
                    <Field label="Tipo"><select className={selectCls} value={comp.tipoInmueble} onChange={(e) => { const c = [...f.comparables]; c[idx] = { ...c[idx], tipoInmueble: e.target.value }; setNested('comparables', c); }}>{TIPO_INM.map((t) => <option key={t} value={t}>{t || '-'}</option>)}</select></Field>
                    <Field label="Sup. total m²"><input type="number" className={inputCls} value={comp.superficieTotal || ''} onChange={(e) => { const c = [...f.comparables]; c[idx] = { ...c[idx], superficieTotal: Number(e.target.value) }; setNested('comparables', c); }} /></Field>
                    <Field label="Amb."><input type="number" className={inputCls} value={comp.ambientes || ''} onChange={(e) => { const c = [...f.comparables]; c[idx] = { ...c[idx], ambientes: Number(e.target.value) }; setNested('comparables', c); }} /></Field>
                    <Field label="Precio publicado"><input type="number" className={inputCls} value={comp.precioPublicado || ''} onChange={(e) => { const c = [...f.comparables]; c[idx] = { ...c[idx], precioPublicado: Number(e.target.value) }; setNested('comparables', c); }} /></Field>
                    <Field label="Valor/m²"><input type="number" className={inputCls} value={comp.valorPorM2 || ''} onChange={(e) => { const c = [...f.comparables]; c[idx] = { ...c[idx], valorPorM2: Number(e.target.value) }; setNested('comparables', c); }} /></Field>
                    <Field label="Fuente"><input className={inputCls} value={comp.fuente} onChange={(e) => { const c = [...f.comparables]; c[idx] = { ...c[idx], fuente: e.target.value }; setNested('comparables', c); }} /></Field>
                    <Field label="Ponderación"><input type="number" step="0.1" className={inputCls} value={comp.ponderacion} onChange={(e) => { const c = [...f.comparables]; c[idx] = { ...c[idx], ponderacion: Number(e.target.value) }; setNested('comparables', c); }} /></Field>
                  </div>
                  <Field label="Observaciones"><input className={inputCls} value={comp.observaciones} onChange={(e) => { const c = [...f.comparables]; c[idx] = { ...c[idx], observaciones: e.target.value }; setNested('comparables', c); }} /></Field>
                </div>
              ))}
            </Section>

            {/* Ajustes */}
            <Section title="Ajustes / Ponderaciones" icon={<FaChartLine size={14} />} defaultOpen={false}>
              <button type="button" onClick={() => setEditingItem((prev) => ({ ...prev, ajustes: [...(prev.ajustes || []), emptyAjuste()] }))} className={btnSecondary + ' mb-3'}><FaPlus size={10} /> Agregar ajuste</button>
              <div className="space-y-2">
                {(f.ajustes || []).map((aj, idx) => (
                  <div key={idx} className={`flex items-center gap-2 p-2 rounded-lg ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                    <input className={inputCls + ' flex-1'} placeholder="Nombre" value={aj.nombre} onChange={(e) => { const a = [...f.ajustes]; a[idx] = { ...a[idx], nombre: e.target.value }; setNested('ajustes', a); }} />
                    <select className={selectCls + ' w-28'} value={aj.tipo} onChange={(e) => { const a = [...f.ajustes]; a[idx] = { ...a[idx], tipo: e.target.value }; setNested('ajustes', a); }}>
                      <option value="porcentaje">%</option><option value="monto">$</option>
                    </select>
                    <input type="number" step="0.1" className={inputCls + ' w-24'} value={aj.valor || ''} onChange={(e) => { const a = [...f.ajustes]; a[idx] = { ...a[idx], valor: Number(e.target.value) }; setNested('ajustes', a); }} />
                    <input className={inputCls + ' flex-1'} placeholder="Observación" value={aj.observacion} onChange={(e) => { const a = [...f.ajustes]; a[idx] = { ...a[idx], observacion: e.target.value }; setNested('ajustes', a); }} />
                    <button type="button" onClick={() => { const a = [...f.ajustes]; a.splice(idx, 1); setNested('ajustes', a); }} className="text-red-500"><FaTimes size={12} /></button>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          {/* Right column: Resultado */}
          <div className="space-y-4">
            <Section title="Resultado" icon={<FaCalculator size={14} />}>
              <div className="space-y-3">
                <Field label="Moneda"><select className={selectCls} value={res.moneda} onChange={(e) => setNested('resultado.moneda', e.target.value)}><option value="USD">USD</option><option value="ARS">ARS</option></select></Field>
                <Field label="Valor est. m²"><input type="number" className={inputCls} value={res.valorEstimadoM2 || ''} onChange={(e) => setNested('resultado.valorEstimadoM2', Number(e.target.value))} /></Field>
                <Field label="Rango conservador"><input type="number" className={inputCls} value={res.rangoConservador || ''} onChange={(e) => setNested('resultado.rangoConservador', Number(e.target.value))} /></Field>
                <Field label="Rango medio"><input type="number" className={inputCls} value={res.rangoMedio || ''} onChange={(e) => setNested('resultado.rangoMedio', Number(e.target.value))} /></Field>
                <Field label="Rango premium"><input type="number" className={inputCls} value={res.rangoPremium || ''} onChange={(e) => setNested('resultado.rangoPremium', Number(e.target.value))} /></Field>
                <Field label="Precio sugerido publicación"><input type="number" className={inputCls} value={res.precioSugeridoPublicacion || ''} onChange={(e) => setNested('resultado.precioSugeridoPublicacion', Number(e.target.value))} /></Field>
                <Field label="Precio sugerido mercado"><input type="number" className={inputCls} value={res.precioSugeridoMercado || ''} onChange={(e) => setNested('resultado.precioSugeridoMercado', Number(e.target.value))} /></Field>
              </div>
            </Section>
            <Section title="Observaciones" icon={<FaEdit size={14} />}>
              <Field label="Resumen ejecutivo"><textarea rows={4} className={inputCls} value={res.resumenEjecutivo} onChange={(e) => setNested('resultado.resumenEjecutivo', e.target.value)} /></Field>
              <Field label="Observaciones técnicas"><textarea rows={3} className={inputCls} value={res.observacionesTecnicas} onChange={(e) => setNested('resultado.observacionesTecnicas', e.target.value)} /></Field>
            </Section>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // RENDER APPRAISAL FORM
  // ═══════════════════════════════════════════════════════════
  const renderAppraisalForm = () => {
    const f = editingItem;
    if (!f) return null;
    const dom = f.dominial || {};
    const tec = f.tecnico || {};
    const ter = f.terreno || {};
    const eco = f.economico || {};
    const met = f.metodologia || {};
    const res = f.resultado || {};
    const cert = f.certificacion || {};

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => { setView('list'); setEditingItem(null); }} className={btnSecondary}><FaArrowLeft size={12} /> Volver</button>
            <h2 className="text-lg font-bold dark:text-gray-100">{f._id ? `Tasación ${f.codigo}` : 'Nueva Tasación'}</h2>
            {f.estado && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLORS[f.estado]}`}>{ESTADO_LABELS[f.estado]}</span>}
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleSave} disabled={saving} className={btnPrimary} style={{ backgroundColor: currentColor }}>
              <FaSave size={12} /> {saving ? 'Guardando...' : 'Guardar'}
            </button>
            {f._id && (
              <>
                <button type="button" onClick={handleGeneratePdf} disabled={generatingPdf} className={btnSecondary}>
                  <FaFilePdf size={12} /> {generatingPdf ? 'Generando...' : 'Generar PDF'}
                </button>
                <button type="button" onClick={handleDownloadPdf} className={btnSecondary}><FaEye size={12} /> Descargar PDF</button>
              </>
            )}
          </div>
        </div>

        {/* Resultado resumen */}
        <div className={`${cardBase} flex flex-wrap gap-6`}>
          <div><span className="text-xs text-gray-500 dark:text-gray-400">Valor final</span><p className="text-lg font-bold" style={{ color: currentColor }}>{fmtCurrency(res.valorFinal, res.moneda)}</p></div>
          <div><span className="text-xs text-gray-500 dark:text-gray-400">Rango</span><p className="font-semibold dark:text-gray-200">{fmtCurrency(res.rangoInferior, res.moneda)} — {fmtCurrency(res.rangoSuperior, res.moneda)}</p></div>
          <div><span className="text-xs text-gray-500 dark:text-gray-400">Publicación</span><p className="font-semibold dark:text-gray-200">{fmtCurrency(res.valorPublicacion, res.moneda)}</p></div>
          <div><span className="text-xs text-gray-500 dark:text-gray-400">Cierre esperado</span><p className="font-semibold dark:text-gray-200">{fmtCurrency(res.valorCierreEsperado, res.moneda)}</p></div>
          <div><span className="text-xs text-gray-500 dark:text-gray-400">Valor/m²</span><p className="font-semibold dark:text-gray-200">{fmtCurrency(res.valorPorM2Final, res.moneda)}</p></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            {/* Vinculación */}
            <Section title="Vinculación" icon={<FaBuilding size={14} />}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Field label="Propiedad *">
                  <select className={selectCls} value={f.propiedadId || ''} onChange={(e) => { setNested('propiedadId', e.target.value); populateFromProperty(e.target.value, f, setEditingItem); }}>
                    <option value="">Seleccionar...</option>
                    {properties.map((p) => <option key={p._id} value={p._id}>{p.title} — {p.metadata?.direccion || p.address || ''}</option>)}
                  </select>
                </Field>
                <Field label="Estudio de mercado">
                  <select className={selectCls} value={f.marketStudyId || ''} onChange={(e) => setNested('marketStudyId', e.target.value)}>
                    <option value="">Sin vincular</option>
                    {studies.map((s) => <option key={s._id} value={s._id}>{s.codigo} — {s.inmueble?.direccion || '-'}</option>)}
                  </select>
                </Field>
                <Field label="Cliente">
                  <select className={selectCls} value={f.clienteId || ''} onChange={(e) => setNested('clienteId', e.target.value)}>
                    <option value="">Seleccionar...</option>
                    {clients.map((c) => <option key={c._id} value={c._id}>{c.nombre} {c.apellido}</option>)}
                  </select>
                </Field>
                <Field label="Fecha tasación"><input type="date" className={inputCls} value={f.fechaTasacion ? String(f.fechaTasacion).slice(0, 10) : ''} onChange={(e) => setNested('fechaTasacion', e.target.value)} /></Field>
                <Field label="Estado">
                  <select className={selectCls} value={f.estado} onChange={(e) => setNested('estado', e.target.value)}>
                    {APPRAISAL_ESTADOS.map((e) => <option key={e} value={e}>{ESTADO_LABELS[e]}</option>)}
                  </select>
                </Field>
              </div>
            </Section>

            {/* Datos dominiales */}
            <Section title="Datos Dominiales" icon={<FaBuilding size={14} />} defaultOpen={false}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Field label="Tipo inmueble"><select className={selectCls} value={dom.tipoInmueble} onChange={(e) => setNested('dominial.tipoInmueble', e.target.value)}>{TIPO_INM.map((t) => <option key={t} value={t}>{t || 'Seleccionar...'}</option>)}</select></Field>
                <Field label="Destino"><input className={inputCls} value={dom.destino} onChange={(e) => setNested('dominial.destino', e.target.value)} /></Field>
                <Field label="Ocupación"><input className={inputCls} value={dom.ocupacion} onChange={(e) => setNested('dominial.ocupacion', e.target.value)} /></Field>
                <Field label="Ubicación exacta" span={2}><input className={inputCls} value={dom.ubicacionExacta} onChange={(e) => setNested('dominial.ubicacionExacta', e.target.value)} /></Field>
                <Field label="Sup. título (m²)"><input type="number" className={inputCls} value={dom.superficieTitulo || ''} onChange={(e) => setNested('dominial.superficieTitulo', Number(e.target.value))} /></Field>
                <Field label="Sup. relevada (m²)"><input type="number" className={inputCls} value={dom.superficieRelevada || ''} onChange={(e) => setNested('dominial.superficieRelevada', Number(e.target.value))} /></Field>
                <Field label="Nomenclatura"><input className={inputCls} value={dom.nomenclatura} onChange={(e) => setNested('dominial.nomenclatura', e.target.value)} /></Field>
                <Field label="Datos catastrales"><input className={inputCls} value={dom.datosCatastrales} onChange={(e) => setNested('dominial.datosCatastrales', e.target.value)} /></Field>
              </div>
              <Field label="Observaciones documentales"><textarea rows={2} className={inputCls} value={dom.observacionesDocumentales} onChange={(e) => setNested('dominial.observacionesDocumentales', e.target.value)} /></Field>
            </Section>

            {/* Variables técnicas */}
            <Section title="Variables Técnicas" icon={<FaChartLine size={14} />} defaultOpen={false}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Field label="Tipología"><input className={inputCls} value={tec.tipologia} onChange={(e) => setNested('tecnico.tipologia', e.target.value)} /></Field>
                <Field label="Cat. constructiva"><input className={inputCls} value={tec.categoriaConstructiva} onChange={(e) => setNested('tecnico.categoriaConstructiva', e.target.value)} /></Field>
                <Field label="Calidad materiales"><select className={selectCls} value={tec.calidadMateriales} onChange={(e) => setNested('tecnico.calidadMateriales', e.target.value)}>{QUALITY_OPTS.map((o) => <option key={o} value={o}>{o || 'Seleccionar...'}</option>)}</select></Field>
                <Field label="Estado conservación"><select className={selectCls} value={tec.estadoConservacion} onChange={(e) => setNested('tecnico.estadoConservacion', e.target.value)}>{CONSERVATION_OPTS.map((o) => <option key={o} value={o}>{o || 'Seleccionar...'}</option>)}</select></Field>
                <Field label="Antigüedad real (años)"><input type="number" className={inputCls} value={tec.antiguedadReal || ''} onChange={(e) => setNested('tecnico.antiguedadReal', Number(e.target.value))} /></Field>
                <Field label="Terminaciones"><input className={inputCls} value={tec.calidadTerminaciones} onChange={(e) => setNested('tecnico.calidadTerminaciones', e.target.value)} /></Field>
                <Field label="Carpinterías"><input className={inputCls} value={tec.carpinterias} onChange={(e) => setNested('tecnico.carpinterias', e.target.value)} /></Field>
                <Field label="Pisos"><input className={inputCls} value={tec.pisos} onChange={(e) => setNested('tecnico.pisos', e.target.value)} /></Field>
                <Field label="Cocina"><input className={inputCls} value={tec.cocina} onChange={(e) => setNested('tecnico.cocina', e.target.value)} /></Field>
                <Field label="Baños"><input className={inputCls} value={tec.banos} onChange={(e) => setNested('tecnico.banos', e.target.value)} /></Field>
                <Field label="Climatización"><input className={inputCls} value={tec.climatizacion} onChange={(e) => setNested('tecnico.climatizacion', e.target.value)} /></Field>
                <Field label="Iluminación"><select className={selectCls} value={tec.iluminacionNatural} onChange={(e) => setNested('tecnico.iluminacionNatural', e.target.value)}>{LIGHT_OPTS.map((o) => <option key={o} value={o}>{o || 'Seleccionar...'}</option>)}</select></Field>
                <Field label="Orientación"><input className={inputCls} value={tec.orientacion} onChange={(e) => setNested('tecnico.orientacion', e.target.value)} /></Field>
                <Field label="Ruido"><select className={selectCls} value={tec.ruido} onChange={(e) => setNested('tecnico.ruido', e.target.value)}>{NOISE_OPTS.map((o) => <option key={o} value={o}>{o || 'Seleccionar...'}</option>)}</select></Field>
                <Field label="Vista"><input className={inputCls} value={tec.vista} onChange={(e) => setNested('tecnico.vista', e.target.value)} /></Field>
                <Field label="Cochera"><input className={inputCls} value={tec.cochera} onChange={(e) => setNested('tecnico.cochera', e.target.value)} /></Field>
              </div>
              <div className="flex flex-wrap gap-4 mt-2">
                <label className="flex items-center gap-2 text-sm dark:text-gray-300"><input type="checkbox" checked={tec.reciclado} onChange={(e) => setNested('tecnico.reciclado', e.target.checked)} /> Reciclado</label>
                <label className="flex items-center gap-2 text-sm dark:text-gray-300"><input type="checkbox" checked={tec.baulera} onChange={(e) => setNested('tecnico.baulera', e.target.checked)} /> Baulera</label>
                <label className="flex items-center gap-2 text-sm dark:text-gray-300"><input type="checkbox" checked={tec.ascensor} onChange={(e) => setNested('tecnico.ascensor', e.target.checked)} /> Ascensor</label>
              </div>
              <Field label="Expensas (ARS)"><input type="number" className={inputCls + ' max-w-[200px]'} value={tec.expensas || ''} onChange={(e) => setNested('tecnico.expensas', Number(e.target.value))} /></Field>
            </Section>

            {/* Terreno */}
            <Section title="Variables del Terreno" icon={<FaBuilding size={14} />} defaultOpen={false}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Field label="Sup. lote (m²)"><input type="number" className={inputCls} value={ter.superficieLote || ''} onChange={(e) => setNested('terreno.superficieLote', Number(e.target.value))} /></Field>
                <Field label="Frente (m)"><input type="number" className={inputCls} value={ter.frente || ''} onChange={(e) => setNested('terreno.frente', Number(e.target.value))} /></Field>
                <Field label="Fondo (m)"><input type="number" className={inputCls} value={ter.fondo || ''} onChange={(e) => setNested('terreno.fondo', Number(e.target.value))} /></Field>
                <Field label="Forma"><input className={inputCls} value={ter.formaLote} onChange={(e) => setNested('terreno.formaLote', e.target.value)} /></Field>
                <Field label="FOT"><input type="number" step="0.01" className={inputCls} value={ter.fot || ''} onChange={(e) => setNested('terreno.fot', Number(e.target.value))} /></Field>
                <Field label="FOS"><input type="number" step="0.01" className={inputCls} value={ter.fos || ''} onChange={(e) => setNested('terreno.fos', Number(e.target.value))} /></Field>
                <Field label="Valor terreno est."><input type="number" className={inputCls} value={ter.valorTerrenoEstimado || ''} onChange={(e) => setNested('terreno.valorTerrenoEstimado', Number(e.target.value))} /></Field>
              </div>
              <label className="flex items-center gap-2 text-sm dark:text-gray-300 mt-2"><input type="checkbox" checked={ter.esquina} onChange={(e) => setNested('terreno.esquina', e.target.checked)} /> Esquina</label>
            </Section>

            {/* Variables económicas */}
            <Section title="Variables Económicas" icon={<FaDollarSign size={14} />} defaultOpen={false}>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <Field label="Moneda"><select className={selectCls} value={eco.moneda} onChange={(e) => setNested('economico.moneda', e.target.value)}><option value="USD">USD</option><option value="ARS">ARS</option></select></Field>
                <Field label="Valor ref. m²"><input type="number" className={inputCls} value={eco.valorReferenciaM2 || ''} onChange={(e) => setNested('economico.valorReferenciaM2', Number(e.target.value))} /></Field>
                <Field label="Incidencia terreno (%)"><input type="number" className={inputCls} value={eco.incidenciaTerreno || ''} onChange={(e) => setNested('economico.incidenciaTerreno', Number(e.target.value))} /></Field>
                <Field label="Incidencia mejoras (%)"><input type="number" className={inputCls} value={eco.incidenciaMejoras || ''} onChange={(e) => setNested('economico.incidenciaMejoras', Number(e.target.value))} /></Field>
                <Field label="Depreciación (%)"><input type="number" className={inputCls} value={eco.depreciacion || ''} onChange={(e) => setNested('economico.depreciacion', Number(e.target.value))} /></Field>
                <Field label="Obsolescencia (%)"><input type="number" className={inputCls} value={eco.obsolescencia || ''} onChange={(e) => setNested('economico.obsolescencia', Number(e.target.value))} /></Field>
                <Field label="Renta est. mensual"><input type="number" className={inputCls} value={eco.rentaEstimadaMensual || ''} onChange={(e) => setNested('economico.rentaEstimadaMensual', Number(e.target.value))} /></Field>
                <Field label="Tasa cap. (%)"><input type="number" step="0.1" className={inputCls} value={eco.tasaCapitalizacion || ''} onChange={(e) => setNested('economico.tasaCapitalizacion', Number(e.target.value))} /></Field>
                <Field label="Valor técnico"><input type="number" className={inputCls} value={eco.valorTecnico || ''} onChange={(e) => setNested('economico.valorTecnico', Number(e.target.value))} /></Field>
                <Field label="Valor mercado"><input type="number" className={inputCls} value={eco.valorMercado || ''} onChange={(e) => setNested('economico.valorMercado', Number(e.target.value))} /></Field>
                <Field label="Realización rápida"><input type="number" className={inputCls} value={eco.valorRealizacionRapida || ''} onChange={(e) => setNested('economico.valorRealizacionRapida', Number(e.target.value))} /></Field>
                <Field label="Publicación sugerida"><input type="number" className={inputCls} value={eco.valorPublicacionSugerido || ''} onChange={(e) => setNested('economico.valorPublicacionSugerido', Number(e.target.value))} /></Field>
              </div>
            </Section>

            {/* Metodología */}
            <Section title="Metodología" icon={<FaBalanceScale size={14} />} defaultOpen={false}>
              <div className="space-y-2 mb-3">
                {METODO_OPTS.map((m) => {
                  const key = m.id === 'comparativa_mercado' ? 'comparativaMercado' : m.id === 'costo_reposicion' ? 'costoReposicion' : m.id === 'capitalizacion_renta' ? 'capitalizacionRenta' : m.id === 'metodo_mixto' ? 'metodoMixto' : 'ajusteProfesional';
                  return (
                    <label key={m.id} className="flex items-center gap-2 text-sm dark:text-gray-300">
                      <input type="checkbox" checked={met[key]} onChange={(e) => setNested(`metodologia.${key}`, e.target.checked)} />
                      {m.label}
                      {met.principal === m.id && <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Principal</span>}
                    </label>
                  );
                })}
              </div>
              <Field label="Método principal">
                <select className={selectCls} value={met.principal} onChange={(e) => setNested('metodologia.principal', e.target.value)}>
                  {METODO_OPTS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </Field>
              <Field label="Descripción metodología"><textarea rows={3} className={inputCls} value={met.descripcion} onChange={(e) => setNested('metodologia.descripcion', e.target.value)} /></Field>
            </Section>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Resultado */}
            <Section title="Resultado" icon={<FaCalculator size={14} />}>
              <div className="space-y-3">
                <Field label="Moneda"><select className={selectCls} value={res.moneda} onChange={(e) => setNested('resultado.moneda', e.target.value)}><option value="USD">USD</option><option value="ARS">ARS</option></select></Field>
                <Field label="Valor final"><input type="number" className={inputCls} value={res.valorFinal || ''} onChange={(e) => setNested('resultado.valorFinal', Number(e.target.value))} /></Field>
                <Field label="Rango inferior"><input type="number" className={inputCls} value={res.rangoInferior || ''} onChange={(e) => setNested('resultado.rangoInferior', Number(e.target.value))} /></Field>
                <Field label="Rango superior"><input type="number" className={inputCls} value={res.rangoSuperior || ''} onChange={(e) => setNested('resultado.rangoSuperior', Number(e.target.value))} /></Field>
                <Field label="Precio publicación"><input type="number" className={inputCls} value={res.valorPublicacion || ''} onChange={(e) => setNested('resultado.valorPublicacion', Number(e.target.value))} /></Field>
                <Field label="Cierre esperado"><input type="number" className={inputCls} value={res.valorCierreEsperado || ''} onChange={(e) => setNested('resultado.valorCierreEsperado', Number(e.target.value))} /></Field>
                <Field label="Realización rápida"><input type="number" className={inputCls} value={res.valorRealizacionRapida || ''} onChange={(e) => setNested('resultado.valorRealizacionRapida', Number(e.target.value))} /></Field>
                <Field label="Valor/m² final"><input type="number" className={inputCls} value={res.valorPorM2Final || ''} onChange={(e) => setNested('resultado.valorPorM2Final', Number(e.target.value))} /></Field>
              </div>
            </Section>

            {/* Comentarios */}
            <Section title="Comentarios" icon={<FaEdit size={14} />}>
              <Field label="Justificación"><textarea rows={3} className={inputCls} value={res.justificacion} onChange={(e) => setNested('resultado.justificacion', e.target.value)} /></Field>
              <Field label="Comentarios agente"><textarea rows={2} className={inputCls} value={res.comentariosAgente} onChange={(e) => setNested('resultado.comentariosAgente', e.target.value)} /></Field>
              <Field label="Comentarios matriculado"><textarea rows={2} className={inputCls} value={res.comentariosMatriculado} onChange={(e) => setNested('resultado.comentariosMatriculado', e.target.value)} /></Field>
            </Section>

            {/* Certificación */}
            <Section title="Certificación Profesional" icon={<FaBalanceScale size={14} />} defaultOpen={false}>
              <div className="space-y-3">
                <Field label="Matriculado"><input className={inputCls} value={cert.matriculadoNombre} onChange={(e) => setNested('certificacion.matriculadoNombre', e.target.value)} /></Field>
                <Field label="Matrícula"><input className={inputCls} value={cert.matricula} onChange={(e) => setNested('certificacion.matricula', e.target.value)} /></Field>
                <Field label="Firma (texto)"><input className={inputCls} value={cert.firmaTexto} onChange={(e) => setNested('certificacion.firmaTexto', e.target.value)} /></Field>
                <Field label="Fecha certificación"><input type="date" className={inputCls} value={cert.fechaCertificacion ? String(cert.fechaCertificacion).slice(0, 10) : ''} onChange={(e) => setNested('certificacion.fechaCertificacion', e.target.value)} /></Field>
                <Field label="Observaciones profesional"><textarea rows={2} className={inputCls} value={cert.observaciones} onChange={(e) => setNested('certificacion.observaciones', e.target.value)} /></Field>
              </div>
            </Section>

            {/* Disclaimer */}
            <Section title="Disclaimer Legal" icon={<FaFileAlt size={14} />} defaultOpen={false}>
              <Field label="Texto disclaimer"><textarea rows={3} className={inputCls} value={f.disclaimerLegal || ''} onChange={(e) => setNested('disclaimerLegal', e.target.value)} /></Field>
            </Section>
          </div>
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="m-2 md:m-10 mt-24 p-2 md:p-6">
      <Header category="CRM" title="Tasaciones" />

      {view === 'list' && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 mb-6 p-1 rounded-xl bg-gray-100 dark:bg-gray-800 w-fit">
            <button type="button" onClick={() => { setActiveTab('market'); setSearchQ(''); }} className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'market' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
              <FaChartLine className="inline mr-2" size={12} /> Estudio de Mercado
            </button>
            <button type="button" onClick={() => { setActiveTab('appraisals'); setSearchQ(''); loadStudies(); }} className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'appraisals' ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
              <FaBalanceScale className="inline mr-2" size={12} /> Tasaciones
            </button>
          </div>
          {renderList()}
        </>
      )}

      {view === 'form' && activeTab === 'market' && renderMarketStudyForm()}
      {view === 'form' && activeTab === 'appraisals' && renderAppraisalForm()}
    </div>
  );
};

export default Tasaciones;
