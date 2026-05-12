import React, { useEffect, useState, useRef, useCallback } from 'react';
import FunnelDesignEditor from '../components/FunnelDesignEditor';
import PropiedadesMapView from './PropiedadesMapView';
import PropiedadInforme from '../components/PropiedadInforme';
import { toast } from 'react-toastify';
import { confirmToast } from '../utils/confirmToast';
import { FaPlus, FaUpload, FaSearch, FaFilter, FaHome, FaEye, FaDollarSign, FaUser, FaCamera, FaMapMarkerAlt, FaBuilding, FaTimes, FaSave, FaArrowLeft, FaList, FaThLarge, FaBed, FaBath, FaCar, FaRulerCombined, FaCalendar, FaEdit, FaTrash, FaChevronRight, FaChevronLeft, FaFileAlt, FaChartLine, FaDownload, FaLink, FaCopy, FaGlobe, FaLock, FaGripVertical } from 'react-icons/fa';
import { useStateContext } from '../contexts/ContextProvider';
import { crmService } from '../services/crmService';
import { documentService } from '../services/documentService';
import API_CONFIG, { getAuthToken } from '../config/api';
import Chart from 'react-apexcharts';

const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'ico', 'heic'];
const isImageDoc = (doc) => {
  if (!doc) return false;
  if (doc.mimetype && doc.mimetype.startsWith('image/')) return true;
  const ext = (doc.nombre || '').split('.').pop()?.toLowerCase() || '';
  return IMAGE_EXTS.includes(ext);
};

const Propiedades = () => {
  const { currentMode, currentColor } = useStateContext();
  
  // Estado para el modal
  const [showModal, setShowModal] = useState(false);
  
  // KPI Reservadas: real count from operaciones + contratos de reserva
  const [reservadasCount, setReservadasCount] = useState(null);
  const [reservadasPropertyIds, setReservadasPropertyIds] = useState([]);
  const [showModalReservadas, setShowModalReservadas] = useState(false);

  // Estados para modales de estadísticas
  const [showModalTotalPropiedades, setShowModalTotalPropiedades] = useState(false);
  const [showModalValorPortfolio, setShowModalValorPortfolio] = useState(false);
  const [showModalVisitasTotales, setShowModalVisitasTotales] = useState(false);
  const [showModalFotosSubidas, setShowModalFotosSubidas] = useState(false);
  
  // Estados para las vistas
  const [vistaActual, setVistaActual] = useState('dashboard'); // 'dashboard', 'lista', 'detalle'
  const [propiedadSeleccionada, setPropiedadSeleccionada] = useState(null);
  const [showInforme, setShowInforme] = useState(false);

  const [propiedades, setPropiedades] = useState([]);
  const [agentes, setAgentes] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filtroOperacion, setFiltroOperacion] = useState('todas');
  const [filtros, setFiltros] = useState({
    tipo: '',
    estado: '',
    precioMin: '',
    precioMax: '',
    dormitoriosMin: '',
    dormitoriosMax: '',
    m2Min: '',
    m2Max: '',
    barrio: '',
    moneda: '',
  });
  const [ordenarPor, setOrdenarPor] = useState('recientes');

  useEffect(() => {
    const fetchReservadasCount = async () => {
      try {
        const token = getAuthToken();
        const res = await fetch(`${API_CONFIG.baseURL}/admin/propiedades/reservadas-count`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setReservadasCount(data.count ?? 0);
          setReservadasPropertyIds(data.propertyIds || []);
        }
      } catch { /* silently ignore */ }
    };
    fetchReservadasCount();
  }, []);
  const [formStep, setFormStep] = useState(1);
  const [funnelEditorOpen, setFunnelEditorOpen] = useState(false);

  const createEmptyClienteForm = () => ({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    telefonoAlternativo: '',
    tipoCliente: 'Comprador',
    estado: 'Lead',
    presupuesto: '',
    moneda: 'USD',
    zonaInteres: '',
    tipoPropiedad: 'Departamento',
    ambientes: '',
    dormitorios: '',
    ba\u00f1os: '',
    caracteristicas: [],
    origen: 'Web',
    agente: '',
    scoring: 50,
    notas: '',
    direccion: '',
    ciudad: 'Buenos Aires',
    provincia: 'Buenos Aires',
    ocupacion: '',
    empresa: '',
  });

  const [nuevoCliente, setNuevoCliente] = useState(createEmptyClienteForm);
  const [incluirCliente, setIncluirCliente] = useState(false);

  // Client/owner autocomplete for property form
  const [clientesBusqueda, setClientesBusqueda] = useState([]);
  const [clienteQuery, setClienteQuery] = useState('');
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const clienteSearchRef = React.useRef(null);

  const [editingPropiedadId, setEditingPropiedadId] = useState(null);
  const [adjuntos, setAdjuntos] = useState([]);
  const [adjuntosLoading, setAdjuntosLoading] = useState(false);
  const [adjuntosError, setAdjuntosError] = useState('');
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [docBlobUrls, setDocBlobUrls] = useState({});
  const [coverBlobUrls, setCoverBlobUrls] = useState({});
  const [lightboxDoc, setLightboxDoc] = useState(null);

  const [filesFotos, setFilesFotos] = useState([]);
  const [filesDocumentos, setFilesDocumentos] = useState([]);
  const [filesPlanos, setFilesPlanos] = useState([]);

  const [videoUrlDraft, setVideoUrlDraft] = useState('');

  // Drag-and-drop refs for file reordering (upload form)
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  // Drag-and-drop refs for adjuntos reordering (detail view)
  const adjDragItem = useRef(null);
  const adjDragOverItem = useRef(null);
  // Google Maps refs
  const addressInputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const mapViewRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const mapMarkersRef = useRef([]);

  const reorderFiles = useCallback((setter) => {
    setter((prev) => {
      if (dragItem.current === null || dragOverItem.current === null) return prev;
      if (dragItem.current === dragOverItem.current) return prev;
      const items = [...prev];
      const [dragged] = items.splice(dragItem.current, 1);
      items.splice(dragOverItem.current, 0, dragged);
      return items;
    });
    dragItem.current = null;
    dragOverItem.current = null;
  }, []);

  const removeFile = useCallback((setter, index) => {
    setter((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const renderFileGrid = useCallback((files, setter) => {
    if (!files.length) return null;
    return (
      <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
        {files.map((file, idx) => {
          const isImage = file.type?.startsWith('image/');
          return (
            <div
              key={`${file.name}-${file.size}-${idx}`}
              draggable
              onDragStart={() => { dragItem.current = idx; }}
              onDragEnter={() => { dragOverItem.current = idx; }}
              onDragEnd={() => reorderFiles(setter)}
              onDragOver={(e) => e.preventDefault()}
              className="relative group aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 overflow-hidden cursor-grab active:cursor-grabbing hover:border-blue-400 dark:hover:border-blue-500 transition-all bg-gray-50 dark:bg-gray-800"
            >
              {isImage ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-full h-full object-cover"
                  onLoad={(e) => { URL.revokeObjectURL(e.target.src); }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 p-1">
                  <FaFileAlt className="text-2xl mb-1" />
                  <span className="text-[10px] text-center leading-tight truncate w-full">{file.name}</span>
                </div>
              )}
              <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                {idx + 1}
              </div>
              <button
                type="button"
                onClick={() => removeFile(setter, idx)}
                className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow"
              >
                ×
              </button>
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 to-transparent h-6 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-0.5">
                <span className="text-[9px] text-white/80">arrastra para ordenar</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }, [reorderFiles, removeFile]);

  // Estado para el formulario de nueva propiedad
  const [nuevaPropiedad, setNuevaPropiedad] = useState({
    titulo: '',
    tipo: 'Departamento',
    categoria: '',
    operacion: 'Venta',
    featured: false,
    precio: '',
    precioOferta: '',
    precioPorM2: '',
    tipoEstructura: '',
    idPropiedad: '',
    moneda: 'USD',
    unidadPrecio: 'month',
    direccion: '',
    barrio: '',
    ciudad: 'Buenos Aires',
    provincia: 'Buenos Aires',
    pais: 'AR',
    codigoPostal: '',
    lat: '',
    lng: '',
    m2Totales: '',
    m2Cubiertos: '',
    ambientes: '',
    dormitorios: '',
    baños: '',
    cocheras: '',
    tipoCochera: '',
    balcon: '',
    piso: '',
    armario: '',
    tv: '',
    purificadorAgua: '',
    microondas: '',
    aireAcondicionado: '',
    refrigerador: '',
    tamanoGaraje: '',
    disponibleDesde: '',
    anioConstruccion: '',
    cortinas: '',
    antiguedad: '',
    tipoCalefaccion: '',
    tipoAguaCaliente: '',
    tipoCocina: '',
    nomenclaturaCatastral: '',
    partidaInmobiliaria: '',
    estado: 'Disponible',
    descripcion: '',
    comentariosInternos: '',
    amenities: [],
    videoUrls: [],
    agente: '',
    comision: '3',
    funnelSettings: {},
  });

  const openCreateModal = () => {
    setEditingPropiedadId(null);
    setFilesFotos([]);
    setFilesDocumentos([]);
    setFilesPlanos([]);
    setVideoUrlDraft('');
    setFormStep(1);
    setIncluirCliente(false);
    setNuevoCliente(createEmptyClienteForm());
    setSelectedCliente(null);
    setClienteQuery('');
    setNuevaPropiedad({
      titulo: '',
      tipo: 'Departamento',
      categoria: '',
      operacion: 'Venta',
      featured: false,
      precio: '',
      precioOferta: '',
      precioPorM2: '',
      tipoEstructura: '',
      idPropiedad: '',
      moneda: 'USD',
      unidadPrecio: 'month',
      direccion: '',
      barrio: '',
      ciudad: 'Buenos Aires',
      provincia: 'Buenos Aires',
      pais: 'AR',
      codigoPostal: '',
      lat: '',
      lng: '',
      m2Totales: '',
      m2Cubiertos: '',
      ambientes: '',
      dormitorios: '',
      baños: '',
      cocheras: '',
      tipoCochera: '',
      balcon: '',
      piso: '',
      armario: '',
      tv: '',
      purificadorAgua: '',
      microondas: '',
      aireAcondicionado: '',
      refrigerador: '',
      tamanoGaraje: '',
      disponibleDesde: '',
      anioConstruccion: '',
      cortinas: '',
      antiguedad: '',
      tipoCalefaccion: '',
      tipoAguaCaliente: '',
      tipoCocina: '',
      nomenclaturaCatastral: '',
      partidaInmobiliaria: '',
      estado: 'Disponible',
      descripcion: '',
      comentariosInternos: '',
      amenities: [],
      videoUrls: [],
      agente: '',
      comision: '3',
      funnelSettings: {},
    });
    setShowModal(true);
  };

  const handleEditPropiedad = (prop) => {
    if (!prop) return;
    setEditingPropiedadId(prop.id || null);
    setFilesFotos([]);
    setFilesDocumentos([]);
    setFilesPlanos([]);
    setVideoUrlDraft('');
    setNuevaPropiedad({
      titulo: prop.titulo || '',
      tipo: prop.tipo || 'Departamento',
      categoria: prop.categoria || '',
      operacion: prop.operacion || 'Venta',
      featured: !!prop.featured,
      precio: prop.precio || '',
      precioOferta: prop.precioOferta || '',
      precioPorM2: prop.precioPorM2 || '',
      tipoEstructura: prop.tipoEstructura || '',
      idPropiedad: prop.idPropiedad || '',
      moneda: prop.moneda || 'USD',
      unidadPrecio: prop.unidadPrecio || 'month',
      direccion: prop.direccion || '',
      barrio: prop.barrio || '',
      ciudad: prop.ciudad || 'Buenos Aires',
      provincia: prop.provincia || 'Buenos Aires',
      pais: prop.pais || 'AR',
      codigoPostal: prop.codigoPostal || '',
      lat: prop.lat != null ? String(prop.lat) : '',
      lng: prop.lng != null ? String(prop.lng) : '',
      m2Totales: prop.m2 || '',
      m2Cubiertos: prop.m2Cubiertos || '',
      ambientes: prop.ambientes || '',
      dormitorios: prop.dormitorios || '',
      baños: prop.baños || '',
      cocheras: prop.cocheras || '',
      tipoCochera: prop.tipoCochera || '',
      balcon: prop.balcon || '',
      piso: prop.piso || '',
      armario: prop.armario || '',
      tv: prop.tv || '',
      purificadorAgua: prop.purificadorAgua || '',
      microondas: prop.microondas || '',
      aireAcondicionado: prop.aireAcondicionado || '',
      refrigerador: prop.refrigerador || '',
      tamanoGaraje: prop.tamanoGaraje || '',
      disponibleDesde: prop.disponibleDesde || '',
      anioConstruccion: prop.anioConstruccion || '',
      cortinas: prop.cortinas || '',
      antiguedad: prop.antiguedad || '',
      tipoCalefaccion: prop.tipoCalefaccion || '',
      tipoAguaCaliente: prop.tipoAguaCaliente || '',
      tipoCocina: prop.tipoCocina || '',
      nomenclaturaCatastral: prop.nomenclaturaCatastral || '',
      partidaInmobiliaria: prop.partidaInmobiliaria || '',
      estado: prop.estado || 'Disponible',
      descripcion: prop.descripcion || '',
      comentariosInternos: prop.comentariosInternos || '',
      amenities: Array.isArray(prop.amenities) ? prop.amenities : [],
      videoUrls: Array.isArray(prop.videoUrls) ? prop.videoUrls : [],
      agente: prop.adminId && !prop.agenteId ? `admin:${prop.adminId}` : (prop.agenteId || ''),
      comision: String(prop.comision ?? '3'),
      funnelSettings: prop.funnelSettings || {},
    });
    setFormStep(1);
    setIncluirCliente(false);
    setNuevoCliente(createEmptyClienteForm());
    setSelectedCliente(prop.ownerData || null);
    setClienteQuery('');
    setShowModal(true);
  };

  const downloadOrOpenDoc = async (doc, mode) => {
    if (!doc || !doc.url) return;
    const absolute = String(doc.url).startsWith('http') ? String(doc.url) : `${API_CONFIG.baseURL}${doc.url}`;

    if (String(doc.url).startsWith('http')) {
      if (mode === 'view') {
        window.open(absolute, '_blank', 'noopener,noreferrer');
        return;
      }
      const a = document.createElement('a');
      a.href = absolute;
      a.download = doc.nombre || 'archivo';
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    }

    const token = getAuthToken();
    const res = await fetch(absolute, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Error al descargar archivo');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const filename = doc.nombre || 'archivo';

    if (mode === 'view') {
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      return;
    }

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const saveAdjuntosOrder = async (ordered) => {
    setIsSavingOrder(true);
    try {
      await crmService.links.reorder(ordered.map((l) => String(l._id)));
    } catch { /* silent — order re-syncs on next load */ }
    finally { setIsSavingOrder(false); }
  };

  const reorderAdjuntos = (from, to) => {
    if (from === null || to === null || from === to) return;
    const items = [...adjuntos];
    const [dragged] = items.splice(from, 1);
    items.splice(to, 0, dragged);
    setAdjuntos(items);
    saveAdjuntosOrder(items);
  };

  const loadAdjuntos = async (propId) => {
    if (!propId) {
      setAdjuntos([]);
      return;
    }
    setAdjuntosLoading(true);
    setAdjuntosError('');
    try {
      const links = await crmService.links.getByEntity('propiedad', propId);
      setAdjuntos(Array.isArray(links) ? links : []);
    } catch (e) {
      setAdjuntos([]);
      setAdjuntosError(e?.message || 'Error al cargar archivos');
    } finally {
      setAdjuntosLoading(false);
    }
  };

  useEffect(() => {
    const id = propiedadSeleccionada && propiedadSeleccionada.id ? propiedadSeleccionada.id : null;
    if (vistaActual !== 'detalle' || !id) {
      setAdjuntos([]);
      setAdjuntosError('');
      return;
    }
    loadAdjuntos(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vistaActual, propiedadSeleccionada && propiedadSeleccionada.id]);

  // Load blob URLs for image documents that require auth
  useEffect(() => {
    const docs = (adjuntos || [])
      .map((l) => l?.document)
      .filter((d) => d && d._id && d.url && isImageDoc(d));
    if (!docs.length) { setDocBlobUrls({}); return undefined; }
    let cancelled = false;
    const created = [];
    (async () => {
      const token = getAuthToken();
      const result = {};
      await Promise.allSettled(docs.map(async (d) => {
        if (cancelled) return;
        const raw = String(d.url);
        if (raw.startsWith('http')) { result[d._id] = raw; return; }
        try {
          const res = await fetch(`${API_CONFIG.baseURL}${raw}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (cancelled || !res.ok) return;
          const blob = await res.blob();
          if (cancelled) return;
          const blobUrl = URL.createObjectURL(blob);
          created.push(blobUrl);
          result[d._id] = blobUrl;
        } catch { /* skip */ }
      }));
      if (!cancelled) setDocBlobUrls(result);
    })();
    return () => { cancelled = true; created.forEach((u) => URL.revokeObjectURL(u)); };
  }, [adjuntos]);

  // Reset carousel when switching properties
  useEffect(() => { setCarouselIdx(0); }, [propiedadSeleccionada?.id]);

  // Load Google Maps script once
  useEffect(() => {
    const key = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    if (!key || (window.google && window.google.maps)) return;
    if (document.getElementById('gmaps-erp-script')) return;
    const script = document.createElement('script');
    script.id = 'gmaps-erp-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&loading=async`;
    script.async = true;
    document.head.appendChild(script);
  }, []);

  // Places Autocomplete on direccion input when modal is open
  useEffect(() => {
    if (!showModal) { autocompleteRef.current = null; return; }
    const timer = setTimeout(() => {
      if (!addressInputRef.current || !window.google || !window.google.maps || !window.google.maps.places) return;
      if (autocompleteRef.current) return;
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        addressInputRef.current,
        { fields: ['formatted_address', 'geometry', 'address_components'] },
      );
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        if (!place || !place.geometry) return;
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const comps = {};
        (place.address_components || []).forEach((c) => c.types.forEach((t) => { comps[t] = c.long_name; }));
        setNuevaPropiedad((prev) => ({
          ...prev,
          direccion: place.formatted_address || prev.direccion,
          barrio: comps.neighborhood || comps.sublocality_level_1 || comps.sublocality || prev.barrio,
          ciudad: comps.locality || prev.ciudad,
          provincia: comps.administrative_area_level_1 || prev.provincia,
          pais: comps.country || prev.pais,
          codigoPostal: comps.postal_code || prev.codigoPostal,
          lat: String(lat),
          lng: String(lng),
        }));
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [showModal]);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const [agentesData, propiedadesData, adminsData] = await Promise.all([
          crmService.agentes.getAll(),
          crmService.propiedades.getAll(),
          crmService.agentes.getAdmins().catch(() => []),
        ]);

        if (!mounted) return;
        setAgentes(Array.isArray(agentesData) ? agentesData : []);
        setAdmins(Array.isArray(adminsData) ? adminsData : []);

        const agentesById = new Map((Array.isArray(agentesData) ? agentesData : []).map((a) => [String(a._id), a]));
        const mapped = (Array.isArray(propiedadesData) ? propiedadesData : []).map((p) => {
          const meta = p.metadata || {};
          const agenteDoc = p.agentId ? agentesById.get(String(p.agentId)) : null;
          const agenteNombre = meta.agenteNombre || (agenteDoc ? agenteDoc.nombre : '');

          return {
            id: p._id,
            titulo: p.title || meta.titulo || '',
            tipo: meta.tipo || 'Departamento',
            categoria: meta.categoria || '',
            featured: !!(p.featured != null ? p.featured : meta.featured),
            published: p.published !== false,
            privateToken: p.privateToken || '',
            operacion: meta.operacion || 'Venta',
            unidadPrecio: meta.unit || 'month',
            precio: typeof p.price === 'number' ? p.price : Number(meta.precio || 0),
            moneda: p.moneda || meta.moneda || 'ARS',
            precioOferta: meta.precioOferta != null ? Number(meta.precioOferta || 0) : '',
            precioPorM2: meta.precioPorM2 != null ? Number(meta.precioPorM2 || 0) : '',
            tipoEstructura: meta.tipoEstructura || '',
            idPropiedad: meta.idPropiedad || '',
            direccion: p.address || meta.direccion || '',
            barrio: meta.barrio || '',
            ciudad: meta.ciudad || '',
            provincia: meta.provincia || '',
            pais: meta.pais || meta.country || 'AR',
            codigoPostal: meta.codigoPostal || '',
            lat: meta.lat != null ? Number(meta.lat) : null,
            lng: meta.lng != null ? Number(meta.lng) : null,
            descripcion: p.description || meta.descripcion || '',
            comentariosInternos: meta.comentariosInternos || '',
            amenities: Array.isArray(meta.amenities) ? meta.amenities : [],
            videoUrls: Array.isArray(meta.videoUrls)
              ? meta.videoUrls
              : meta.videoUrl
                ? [meta.videoUrl]
                : [],
            agente: agenteNombre,
            agenteId: meta.agenteId || p.agentId || '',
            visitas: Number(meta.visitas || 0),
            coverUrl: p.coverUrl || '',
            fotos: p.imageCount != null ? p.imageCount : Number(meta.fotos || 0),
            fechaPublicacion: meta.fechaPublicacion || '',
            comision: Number(meta.comision || 0),
            m2: Number(meta.m2Totales || meta.m2 || 0),
            m2Cubiertos: Number(meta.m2Cubiertos || 0),
            ambientes: Number(meta.ambientes || 0),
            dormitorios: Number(meta.dormitorios || 0),
            baños: Number(meta.baños || 0),
            cocheras: Number(meta.cocheras || 0),
            balcon: meta.balcon || '',
            piso: meta.piso || '',
            armario: meta.armario || '',
            tv: meta.tv || '',
            purificadorAgua: meta.purificadorAgua || '',
            microondas: meta.microondas || '',
            aireAcondicionado: meta.aireAcondicionado || '',
            refrigerador: meta.refrigerador || '',
            tamanoGaraje: meta.tamanoGaraje || '',
            disponibleDesde: meta.disponibleDesde || '',
            anioConstruccion: meta.anioConstruccion || '',
            cortinas: meta.cortinas || '',
            antiguedad: Number(meta.antiguedad || 0),
            nomenclaturaCatastral: meta.nomenclaturaCatastral || '',
            partidaInmobiliaria: meta.partidaInmobiliaria || '',
            adminId: meta.adminId || '',
            adminNombre: meta.adminNombre || '',
            estado: p.status || meta.estado || 'Disponible',
            ownerId: p.ownerId || '',
            ownerData: p.ownerData || null,
            funnelSettings: meta.funnelSettings || null,
          };
        });

        setPropiedades(mapped);
      } catch (e) {
        if (!mounted) return;
        setError(e?.message || 'Error al cargar propiedades');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Load authenticated cover images for property cards
  useEffect(() => {
    const propsWithCover = propiedades.filter((p) => p.coverUrl);
    if (!propsWithCover.length) { setCoverBlobUrls({}); return undefined; }
    let cancelled = false;
    const created = [];
    (async () => {
      const token = getAuthToken();
      const result = {};
      await Promise.allSettled(propsWithCover.map(async (p) => {
        if (cancelled) return;
        const raw = String(p.coverUrl);
        if (raw.startsWith('http')) { result[p.id] = raw; return; }
        try {
          const res = await fetch(`${API_CONFIG.baseURL}${raw}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (cancelled || !res.ok) return;
          const blob = await res.blob();
          if (cancelled) return;
          const blobUrl = URL.createObjectURL(blob);
          created.push(blobUrl);
          result[p.id] = blobUrl;
        } catch { /* skip */ }
      }));
      if (!cancelled) setCoverBlobUrls(result);
    })();
    return () => { cancelled = true; created.forEach((u) => URL.revokeObjectURL(u)); };
  }, [propiedades]);

  // KPIs de Propiedades
  const totalValorPortfolio = propiedades.reduce((sum, p) => sum + (Number(p.precio || 0) || 0), 0);
  const totalVisitas = propiedades.reduce((sum, p) => sum + (Number(p.visitas || 0) || 0), 0);
  const totalFotos = propiedades.reduce((sum, p) => sum + (Number(p.fotos || 0) || 0), 0);
  const maxFotos = propiedades.reduce((max, p) => Math.max(max, Number(p.fotos || 0) || 0), 0);
  const maxVisitas = propiedades.reduce((max, p) => Math.max(max, Number(p.visitas || 0) || 0), 0);
  const disponibles = propiedades.filter(p => p.estado === 'Disponible').length;
  const reservadas = propiedades.filter(p => p.estado === 'Reservada').length;

  const kpisPropiedades = [
    { title: 'Total Propiedades', value: propiedades.length, desc: `${disponibles} disponibles`, icon: <FaHome />, color: 'from-blue-500 to-blue-600', trend: '+8%' },
    { title: 'Valor Portfolio', value: `$${(totalValorPortfolio / 1000000).toFixed(1)}M`, desc: 'Inventario activo', icon: <FaDollarSign />, color: 'from-emerald-500 to-emerald-600', trend: '+12%' },
    { title: 'Visitas Totales', value: totalVisitas.toLocaleString(), desc: 'Últimos 30 días', icon: <FaEye />, color: 'from-violet-500 to-violet-600', trend: '+15%' },
    { title: 'Reservadas', value: reservadasCount !== null ? reservadasCount : reservadas, desc: 'Con contrato de reserva', icon: <FaBuilding />, color: 'from-amber-500 to-amber-600', trend: '+5%' },
  ];

  // ApexCharts configurations
  const estadosDonutOptions = {
    chart: { type: 'donut', height: 280, background: 'transparent' },
    labels: ['Disponible', 'Reservada', 'Vendida', 'Alquilada'],
    colors: ['#10B981', '#F59E0B', '#6B7280', '#3B82F6'],
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: { show: true, fontSize: '12px', fontWeight: 600, color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' },
            value: { show: true, fontSize: '20px', fontWeight: 700, color: currentMode === 'Dark' ? '#F3F4F6' : '#1F2937' },
            total: { show: true, label: 'Total', fontSize: '11px', color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', formatter: () => propiedades.length },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    legend: { show: true, position: 'bottom', fontSize: '11px', labels: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' } },
    stroke: { show: false },
    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light' },
  };
  const estadosDonutSeries = [
    propiedades.filter(p => p.estado === 'Disponible').length,
    propiedades.filter(p => p.estado === 'Reservada').length,
    propiedades.filter(p => p.estado === 'Vendida').length,
    propiedades.filter(p => p.estado === 'Alquilada').length,
  ];

  const tiposBarOptions = {
    chart: { type: 'bar', height: 280, background: 'transparent', toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 8, horizontal: false, columnWidth: '60%', distributed: true } },
    colors: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'],
    dataLabels: { enabled: true, style: { colors: ['#fff'], fontSize: '11px', fontWeight: 600 } },
    xaxis: {
      categories: ['Depto', 'Casa', 'Oficina', 'PH', 'Local'],
      labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '11px' } },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '10px' } } },
    grid: { borderColor: currentMode === 'Dark' ? '#374151' : '#E5E7EB', strokeDashArray: 4 },
    legend: { show: false },
    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light' },
  };
  const tiposBarSeries = [{
    name: 'Propiedades',
    data: [
      propiedades.filter(p => p.tipo === 'Departamento').length,
      propiedades.filter(p => p.tipo === 'Casa').length,
      propiedades.filter(p => p.tipo === 'Oficina').length,
      propiedades.filter(p => p.tipo === 'PH').length,
      propiedades.filter(p => p.tipo === 'Local').length,
    ],
  }];

  const valorPorTipoOptions = {
    chart: { type: 'area', height: 260, background: 'transparent', toolbar: { show: false }, zoom: { enabled: false } },
    colors: ['#8B5CF6'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2.5 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] } },
    xaxis: {
      categories: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
      labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '10px' } },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '10px' }, formatter: (val) => `$${val}M` } },
    grid: { borderColor: currentMode === 'Dark' ? '#374151' : '#E5E7EB', strokeDashArray: 4 },
    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light', y: { formatter: (val) => `$${val}M` } },
  };
  const valorPorTipoSeries = [{ name: 'Valor Portfolio', data: [2.1, 2.4, 2.2, 2.8, 3.1, totalValorPortfolio / 1000000] }];

  const ocupacionRadialOptions = {
    chart: { type: 'radialBar', height: 220, background: 'transparent' },
    plotOptions: {
      radialBar: {
        startAngle: -135, endAngle: 135,
        hollow: { size: '65%', background: 'transparent' },
        track: { background: currentMode === 'Dark' ? '#374151' : '#E5E7EB', strokeWidth: '100%' },
        dataLabels: {
          name: { show: true, fontSize: '12px', fontWeight: 600, color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', offsetY: -8 },
          value: { show: true, fontSize: '28px', fontWeight: 700, color: currentMode === 'Dark' ? '#F3F4F6' : '#1F2937', offsetY: 4, formatter: (val) => `${val}%` },
        },
      },
    },
    fill: { type: 'gradient', gradient: { shade: 'dark', type: 'horizontal', colorStops: [{ offset: 0, color: '#10B981', opacity: 1 }, { offset: 100, color: '#059669', opacity: 1 }] } },
    stroke: { lineCap: 'round' },
    labels: ['Ocupación'],
  };
  const ocupacionPct = propiedades.length > 0 ? Math.round(((propiedades.filter(p => p.estado === 'Alquilada' || p.estado === 'Vendida').length) / propiedades.length) * 100) : 0;
  const ocupacionRadialSeries = [ocupacionPct];

  const isDark = currentMode === 'Dark';
  const cardBase = `rounded-2xl p-6 border transition-shadow ${isDark ? 'bg-secondary-dark-bg border-gray-700/50 hover:border-indigo-500/30' : 'bg-white border-gray-100 shadow-md hover:shadow-lg'}`;

  // Derived: image adjuntos for carousel
  const fotoAdjuntos = (adjuntos || []).filter((l) => l?.document && isImageDoc(l.document));
  const safeCarouselIdx = fotoAdjuntos.length > 0 ? Math.min(carouselIdx, fotoAdjuntos.length - 1) : 0;
  const carouselDoc = fotoAdjuntos[safeCarouselIdx]?.document || null;
  const carouselSrc = carouselDoc ? (docBlobUrls[carouselDoc._id] || null) : null;
  const getDocImgUrl = (doc) => { if (!doc || !doc._id) return null; return docBlobUrls[doc._id] || null; };

  // Función para manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNuevaPropiedad(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleClienteInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNuevoCliente((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Client autocomplete search for property owner
  const searchClientes = React.useCallback(async (query) => {
    if (!query || query.length < 2) { setClientesBusqueda([]); setShowClienteDropdown(false); return; }
    try {
      const results = await crmService.clientes.getAll(query);
      setClientesBusqueda(Array.isArray(results) ? results : []);
      setShowClienteDropdown(true);
    } catch { setClientesBusqueda([]); }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => searchClientes(clienteQuery), 300);
    return () => clearTimeout(timer);
  }, [clienteQuery, searchClientes]);

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (clienteSearchRef.current && !clienteSearchRef.current.contains(e.target)) {
        setShowClienteDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Función para manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      const isAdminAssign = String(nuevaPropiedad.agente).startsWith('admin:');
      const rawAgentId = isAdminAssign ? '' : (nuevaPropiedad.agente || '');
      const rawAdminId = isAdminAssign ? String(nuevaPropiedad.agente).replace('admin:', '') : '';
      const agenteDoc = rawAgentId ? agentes.find((a) => String(a._id) === rawAgentId) : null;
      const agenteNombre = agenteDoc ? agenteDoc.nombre : '';
      const adminDoc = rawAdminId ? admins.find((a) => String(a._id) === rawAdminId) : null;
      const adminNombre = adminDoc ? adminDoc.nombre : '';

      // Resolve ownerId: from autocomplete selection, or create new inline client
      let resolvedOwnerId = selectedCliente ? String(selectedCliente._id) : '';
      if (!resolvedOwnerId && incluirCliente && nuevoCliente.nombre) {
        try {
          const clientePayload = { ...nuevoCliente, agenteId: rawAgentId || rawAdminId || '' };
          const createdCliente = await crmService.clientes.create(clientePayload);
          resolvedOwnerId = String(createdCliente._id);
          setSelectedCliente(createdCliente);
        } catch (ce) {
          console.error('Error creating inline client:', ce);
        }
      }

      const payload = {
        title: nuevaPropiedad.titulo,
        description: nuevaPropiedad.descripcion,
        address: nuevaPropiedad.direccion,
        price: Number(nuevaPropiedad.precio || 0),
        moneda: nuevaPropiedad.moneda,
        featured: !!nuevaPropiedad.featured,
        status: nuevaPropiedad.estado,
        agentId: rawAgentId || rawAdminId || undefined,
        ownerId: resolvedOwnerId || undefined,
        metadata: {
          titulo: nuevaPropiedad.titulo,
          tipo: nuevaPropiedad.tipo,
          categoria: nuevaPropiedad.categoria,
          operacion: nuevaPropiedad.operacion,
          unit: nuevaPropiedad.unidadPrecio,
          precio: Number(nuevaPropiedad.precio || 0),
          moneda: nuevaPropiedad.moneda,
          precioOferta: Number(nuevaPropiedad.precioOferta || 0),
          precioPorM2: Number(nuevaPropiedad.precioPorM2 || 0),
          tipoEstructura: nuevaPropiedad.tipoEstructura,
          idPropiedad: nuevaPropiedad.idPropiedad,
          direccion: nuevaPropiedad.direccion,
          barrio: nuevaPropiedad.barrio,
          ciudad: nuevaPropiedad.ciudad,
          provincia: nuevaPropiedad.provincia,
          pais: nuevaPropiedad.pais,
          codigoPostal: nuevaPropiedad.codigoPostal,
          lat: nuevaPropiedad.lat ? Number(nuevaPropiedad.lat) : undefined,
          lng: nuevaPropiedad.lng ? Number(nuevaPropiedad.lng) : undefined,
          m2Totales: Number(nuevaPropiedad.m2Totales || 0),
          m2Cubiertos: Number(nuevaPropiedad.m2Cubiertos || 0),
          ambientes: Number(nuevaPropiedad.ambientes || 0),
          dormitorios: Number(nuevaPropiedad.dormitorios || 0),
          baños: Number(nuevaPropiedad.baños || 0),
          cocheras: Number(nuevaPropiedad.cocheras || 0),
          tipoCochera: nuevaPropiedad.tipoCochera,
          balcon: nuevaPropiedad.balcon,
          piso: nuevaPropiedad.piso,
          armario: nuevaPropiedad.armario,
          tv: nuevaPropiedad.tv,
          purificadorAgua: nuevaPropiedad.purificadorAgua,
          microondas: nuevaPropiedad.microondas,
          aireAcondicionado: nuevaPropiedad.aireAcondicionado,
          refrigerador: nuevaPropiedad.refrigerador,
          tamanoGaraje: nuevaPropiedad.tamanoGaraje,
          disponibleDesde: nuevaPropiedad.disponibleDesde,
          anioConstruccion: nuevaPropiedad.anioConstruccion,
          cortinas: nuevaPropiedad.cortinas,
          antiguedad: Number(nuevaPropiedad.antiguedad || 0),
          tipoCalefaccion: nuevaPropiedad.tipoCalefaccion,
          tipoAguaCaliente: nuevaPropiedad.tipoAguaCaliente,
          tipoCocina: nuevaPropiedad.tipoCocina,
          nomenclaturaCatastral: nuevaPropiedad.nomenclaturaCatastral,
          partidaInmobiliaria: nuevaPropiedad.partidaInmobiliaria,
          estado: nuevaPropiedad.estado,
          descripcion: nuevaPropiedad.descripcion,
          comentariosInternos: nuevaPropiedad.comentariosInternos,
          amenities: nuevaPropiedad.amenities,
          videoUrls: Array.isArray(nuevaPropiedad.videoUrls) ? nuevaPropiedad.videoUrls : [],
          agenteId: rawAgentId,
          agenteNombre,
          adminId: rawAdminId,
          adminNombre,
          comision: Number(nuevaPropiedad.comision || 0),
          funnelSettings: nuevaPropiedad.funnelSettings || {},
        },
      };

      const saved = editingPropiedadId
        ? await crmService.propiedades.update(editingPropiedadId, payload)
        : await crmService.propiedades.create(payload);

      const mapped = {
        id: saved._id,
        titulo: saved.title || payload.metadata.titulo || '',
        tipo: payload.metadata.tipo,
        categoria: payload.metadata.categoria,
        operacion: payload.metadata.operacion,
        unidadPrecio: payload.metadata.unit,
        precio: saved.price ?? payload.metadata.precio,
        moneda: saved.moneda || payload.metadata.moneda,
        featured: saved.featured ?? payload.featured,
        precioOferta: payload.metadata.precioOferta,
        precioPorM2: payload.metadata.precioPorM2,
        tipoEstructura: payload.metadata.tipoEstructura,
        idPropiedad: payload.metadata.idPropiedad,
        direccion: saved.address || payload.metadata.direccion,
        barrio: payload.metadata.barrio,
        ciudad: payload.metadata.ciudad,
        provincia: payload.metadata.provincia,
        pais: payload.metadata.pais,
        codigoPostal: payload.metadata.codigoPostal,
        lat: payload.metadata.lat || null,
        lng: payload.metadata.lng || null,
        descripcion: saved.description || payload.metadata.descripcion,
        comentariosInternos: payload.metadata.comentariosInternos || '',
        amenities: payload.metadata.amenities,
        videoUrls: payload.metadata.videoUrls,
        agente: payload.metadata.agenteNombre,
        agenteId: saved.agentId || payload.metadata.agenteId,
        visitas: 0,
        fotos: 0,
        fechaPublicacion: '',
        comision: payload.metadata.comision,
        m2: payload.metadata.m2Totales,
        m2Cubiertos: payload.metadata.m2Cubiertos,
        ambientes: payload.metadata.ambientes,
        dormitorios: payload.metadata.dormitorios,
        baños: payload.metadata.baños,
        cocheras: payload.metadata.cocheras,
        tipoCochera: payload.metadata.tipoCochera,
        balcon: payload.metadata.balcon,
        piso: payload.metadata.piso,
        armario: payload.metadata.armario,
        tv: payload.metadata.tv,
        purificadorAgua: payload.metadata.purificadorAgua,
        microondas: payload.metadata.microondas,
        aireAcondicionado: payload.metadata.aireAcondicionado,
        refrigerador: payload.metadata.refrigerador,
        tamanoGaraje: payload.metadata.tamanoGaraje,
        disponibleDesde: payload.metadata.disponibleDesde,
        anioConstruccion: payload.metadata.anioConstruccion,
        cortinas: payload.metadata.cortinas,
        antiguedad: payload.metadata.antiguedad,
        tipoCalefaccion: payload.metadata.tipoCalefaccion,
        tipoAguaCaliente: payload.metadata.tipoAguaCaliente,
        tipoCocina: payload.metadata.tipoCocina,
        nomenclaturaCatastral: payload.metadata.nomenclaturaCatastral,
        partidaInmobiliaria: payload.metadata.partidaInmobiliaria,
        adminId: payload.metadata.adminId,
        adminNombre: payload.metadata.adminNombre,
        estado: saved.status || payload.metadata.estado,
        ownerId: resolvedOwnerId || '',
        ownerData: selectedCliente ? { _id: selectedCliente._id, nombre: selectedCliente.nombre || '', email: selectedCliente.email || '', telefono: selectedCliente.telefono || '' } : null,
        funnelSettings: payload.metadata.funnelSettings || {},
      };

      setPropiedades((prev) => {
        const idx = prev.findIndex((p) => String(p.id) === String(mapped.id));
        if (idx === -1) return [mapped, ...prev];
        const next = [...prev];
        next[idx] = { ...next[idx], ...mapped };
        return next;
      });

      if (propiedadSeleccionada && String(propiedadSeleccionada.id) === String(mapped.id)) {
        setPropiedadSeleccionada(mapped);
      }

      // Client creation now handled before payload (resolvedOwnerId)

      const uploadGroup = async (files, categoria) => {
        const arr = Array.isArray(files) ? files : [];
        if (!arr.length) return [];
        const resp = await documentService.upload(arr, {
          fields: { categoria, relacionado: `Propiedad:${mapped.id}` },
          headers: { 'x-domain': 'crm' },
        });
        const uploaded = resp && resp.uploaded ? resp.uploaded : [];
        await Promise.all((Array.isArray(uploaded) ? uploaded : []).map((d) => crmService.links.link({ documentId: d._id, entityType: 'propiedad', entityId: mapped.id })));
        return Array.isArray(uploaded) ? uploaded : [];
      };

      const upFotos = await uploadGroup(filesFotos, 'Propiedad - Fotos');
      await uploadGroup(filesDocumentos, 'Propiedad - Documentos');
      await uploadGroup(filesPlanos, 'Propiedad - Planos');

      const fotosAdded = Array.isArray(upFotos) ? upFotos.length : 0;
      if (fotosAdded > 0) {
        const nextFotos = Number((propiedadSeleccionada && String(propiedadSeleccionada.id) === String(mapped.id) ? propiedadSeleccionada.fotos : mapped.fotos) || 0) + fotosAdded;
        setPropiedades((prev) => prev.map((p) => (String(p.id) === String(mapped.id) ? { ...p, fotos: nextFotos } : p)));
        if (propiedadSeleccionada && String(propiedadSeleccionada.id) === String(mapped.id)) {
          setPropiedadSeleccionada((cur) => (cur ? { ...cur, fotos: nextFotos } : cur));
        }
      }

      setEditingPropiedadId(null);
      setFilesFotos([]);
      setFilesDocumentos([]);
      setFilesPlanos([]);
      setVideoUrlDraft('');
      setShowModal(false);

      // Resetear formulario
      setNuevaPropiedad({
        titulo: '',
        tipo: 'Departamento',
        categoria: '',
        operacion: 'Venta',
        featured: false,
        precio: '',
        precioOferta: '',
        precioPorM2: '',
        tipoEstructura: '',
        idPropiedad: '',
        moneda: 'USD',
        unidadPrecio: 'month',
        direccion: '',
        barrio: '',
        ciudad: 'Buenos Aires',
        provincia: 'Buenos Aires',
        pais: 'AR',
        codigoPostal: '',
        lat: '',
        lng: '',
        m2Totales: '',
        m2Cubiertos: '',
        ambientes: '',
        dormitorios: '',
        baños: '',
        cocheras: '',
        tipoCochera: '',
        balcon: '',
        piso: '',
        armario: '',
        tv: '',
        purificadorAgua: '',
        microondas: '',
        aireAcondicionado: '',
        refrigerador: '',
        tamanoGaraje: '',
        disponibleDesde: '',
        anioConstruccion: '',
        cortinas: '',
        antiguedad: '',
        tipoCalefaccion: '',
        tipoAguaCaliente: '',
        tipoCocina: '',
        nomenclaturaCatastral: '',
        partidaInmobiliaria: '',
        estado: 'Disponible',
        descripcion: '',
        amenities: [],
        videoUrls: [],
        agente: '',
        comision: '3',
      });
      setFormStep(1);
      setIncluirCliente(false);
      setNuevoCliente(createEmptyClienteForm());
    } catch (e) {
      setError(e?.message || 'Error al guardar propiedad');
    } finally {
      setLoading(false);
    }
  };

  const eliminarPropiedad = async (prop) => {
    if (!prop?.id) return;
    const ok = await confirmToast('¿Eliminar esta propiedad?');
    if (!ok) return;

    try {
      setLoading(true);
      setError('');
      await crmService.propiedades.delete(prop.id);
      setPropiedades((prev) => prev.filter((p) => String(p.id) !== String(prop.id)));
      setVistaActual('dashboard');
      setPropiedadSeleccionada(null);
    } catch (e) {
      setError(e?.message || 'Error al eliminar propiedad');
    } finally {
      setLoading(false);
    }
  };

  // Amenities disponibles
  const amenitiesDisponibles = [
    'Pileta', 'Gimnasio', 'Parrilla', 'Seguridad 24hs', 'Cochera', 
    'Balcón', 'Terraza', 'Jardín', 'Aire Acondicionado', 'Calefacción',
    'Laundry', 'SUM', 'Solarium', 'Sauna', 'Ascensor'
  ];

  // Función para ver detalle de propiedad
  const verDetalle = async (propiedad) => {
    setPropiedadSeleccionada(propiedad);
    setVistaActual('detalle');

    const previousVisitas = Number(propiedad.visitas || 0);
    const optimisticVisitas = previousVisitas + 1;

    const applyVisitas = (visitas) => {
      setPropiedades((prev) => prev.map((p) => (String(p.id) === String(propiedad.id) ? { ...p, visitas } : p)));
      setPropiedadSeleccionada((prev) => (prev && String(prev.id) === String(propiedad.id) ? { ...prev, visitas } : prev));
    };

    applyVisitas(optimisticVisitas);

    try {
      const updated = await crmService.propiedades.incrementVisit(propiedad.id);
      const visitas = Number(updated.metadata?.visitas || updated.visitas || optimisticVisitas);
      applyVisitas(visitas);
    } catch (err) {
      console.warn('No se pudo incrementar visita', err);
      applyVisitas(previousVisitas);
    }
  };

  // Función para volver al dashboard
  const volverAlDashboard = () => {
    setVistaActual('dashboard');
    setPropiedadSeleccionada(null);
  };

  const getSuggestions = () => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return propiedades.filter((p) => p.titulo?.toLowerCase().includes(term)
      || p.barrio?.toLowerCase().includes(term)
      || p.ciudad?.toLowerCase().includes(term)
      || p.direccion?.toLowerCase().includes(term)
      || p.tipo?.toLowerCase().includes(term)).slice(0, 8);
  };

  const barriosUnicos = [...new Set(propiedades.map((p) => p.barrio).filter(Boolean))];
  const tiposUnicos = [...new Set(propiedades.map((p) => p.tipo).filter(Boolean))];

  const propiedadesFiltradas = propiedades
    .filter((p) => {
      if (filtroOperacion === 'venta' && p.operacion !== 'Venta') return false;
      if (filtroOperacion === 'alquiler' && p.operacion !== 'Alquiler') return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchSearch = p.titulo?.toLowerCase().includes(term)
          || p.barrio?.toLowerCase().includes(term)
          || p.ciudad?.toLowerCase().includes(term)
          || p.direccion?.toLowerCase().includes(term)
          || p.tipo?.toLowerCase().includes(term);
        if (!matchSearch) return false;
      }

      if (filtros.tipo && p.tipo !== filtros.tipo) return false;
      if (filtros.estado && p.estado !== filtros.estado) return false;
      if (filtros.moneda && p.moneda !== filtros.moneda) return false;
      if (filtros.barrio && p.barrio !== filtros.barrio) return false;
      if (filtros.precioMin && Number(p.precio) < Number(filtros.precioMin)) return false;
      if (filtros.precioMax && Number(p.precio) > Number(filtros.precioMax)) return false;
      if (filtros.dormitoriosMin && Number(p.dormitorios) < Number(filtros.dormitoriosMin)) return false;
      if (filtros.dormitoriosMax && Number(p.dormitorios) > Number(filtros.dormitoriosMax)) return false;
      if (filtros.m2Min && Number(p.m2) < Number(filtros.m2Min)) return false;
      if (filtros.m2Max && Number(p.m2) > Number(filtros.m2Max)) return false;

      return true;
    })
    .sort((a, b) => {
      switch (ordenarPor) {
        case 'precio_asc': return Number(a.precio) - Number(b.precio);
        case 'precio_desc': return Number(b.precio) - Number(a.precio);
        case 'm2_asc': return Number(a.m2) - Number(b.m2);
        case 'm2_desc': return Number(b.m2) - Number(a.m2);
        case 'nombre_asc': return (a.titulo || '').localeCompare(b.titulo || '');
        case 'recientes':
        default: return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    });

  const limpiarFiltros = () => {
    setSearchTerm('');
    setFiltros({
      tipo: '',
      estado: '',
      precioMin: '',
      precioMax: '',
      dormitoriosMin: '',
      dormitoriosMax: '',
      m2Min: '',
      m2Max: '',
      barrio: '',
      moneda: '',
    });
    setOrdenarPor('recientes');
    setFiltroOperacion('todas');
  };

  const filtrosActivos = Object.values(filtros).filter((v) => v !== '').length
    + (searchTerm ? 1 : 0)
    + (filtroOperacion !== 'todas' ? 1 : 0)
    + (ordenarPor !== 'recientes' ? 1 : 0);

  return (
    <div className={`min-h-screen px-6 lg:px-8 pt-4 pb-6 ${isDark ? 'bg-main-dark-bg' : 'bg-gray-50'}`}>
      <div className="mb-6">
        <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <FaHome className="text-blue-500" /> Gestión de Propiedades
        </h2>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Administra tu cartera inmobiliaria</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
          {error}
        </div>
      )}
      
      {/* Botones de Navegación */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button 
          onClick={volverAlDashboard}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-md ${vistaActual === 'dashboard' ? 'bg-blue-500 text-white' : isDark ? 'border border-gray-600 text-gray-200 hover:bg-gray-700' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
        >
          <FaChartLine /> Métricas
        </button>
        <button 
          onClick={() => setVistaActual('lista')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-md ${vistaActual === 'lista' ? 'bg-emerald-500 text-white' : isDark ? 'border border-gray-600 text-gray-200 hover:bg-gray-700' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
        >
          <FaThLarge /> Todas las Propiedades
        </button>
        <button
          onClick={() => setVistaActual('mapa')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-md ${vistaActual === 'mapa' ? 'bg-violet-500 text-white' : isDark ? 'border border-gray-600 text-gray-200 hover:bg-gray-700' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
        >
          <FaMapMarkerAlt /> Mapa
        </button>
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium bg-blue-500 hover:bg-blue-600 transition-all shadow-sm hover:shadow-md"
        >
          <FaPlus /> Nueva Propiedad
        </button>
      </div>

      {/* Vista Dashboard */}
      {vistaActual === 'dashboard' && (
        <>
      {/* KPIs de Propiedades */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpisPropiedades.map((kpi, i) => {
          const colorMap = { 'from-blue-500 to-blue-600': '#3b82f6', 'from-emerald-500 to-emerald-600': '#10b981', 'from-violet-500 to-violet-600': '#8b5cf6', 'from-amber-500 to-amber-600': '#f59e0b' };
          const accentColor = colorMap[kpi.color] || '#6366f1';
          const bgMap = { 'from-blue-500 to-blue-600': 'bg-blue-50 dark:bg-blue-900/20', 'from-emerald-500 to-emerald-600': 'bg-emerald-50 dark:bg-emerald-900/20', 'from-violet-500 to-violet-600': 'bg-purple-50 dark:bg-purple-900/20', 'from-amber-500 to-amber-600': 'bg-amber-50 dark:bg-amber-900/20' };
          const bgColor = bgMap[kpi.color] || 'bg-indigo-50 dark:bg-indigo-900/20';
          return (
            <div 
              key={i} 
              onClick={() => {
                if (i === 0) setShowModalTotalPropiedades(true);
                else if (i === 1) setShowModalValorPortfolio(true);
                else if (i === 2) setShowModalVisitasTotales(true);
                else if (i === 3) setShowModalReservadas(true);
              }}
              className={`rounded-2xl p-6 border shadow-sm cursor-pointer transition-all ${isDark ? 'bg-secondary-dark-bg border-gray-700/50 hover:border-indigo-500/30' : 'bg-white border-gray-100 hover:shadow-lg'}`}
              style={{ borderLeft: `4px solid ${accentColor}` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center`}>
                  <span className="text-lg" style={{ color: accentColor }}>{kpi.icon}</span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30">
                  {kpi.trend}
                </span>
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{kpi.value}</p>
              <p className={`text-sm font-semibold mt-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{kpi.title}</p>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{kpi.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Gráficos Principales - ApexCharts */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-8">
        {/* Tasa de Ocupación */}
        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-1">
            <FaHome className="text-emerald-500" />
            <h3 className="font-semibold dark:text-gray-100">Ocupación</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Propiedades ocupadas</p>
          <Chart options={ocupacionRadialOptions} series={ocupacionRadialSeries} type="radialBar" height={200} />
          <div className="flex justify-between items-center pt-3 border-t dark:border-gray-700">
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{propiedades.filter(p => p.estado === 'Alquilada' || p.estado === 'Vendida').length}</p>
              <p className="text-xs text-gray-500">Ocupadas</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-500">{propiedades.filter(p => p.estado === 'Disponible').length}</p>
              <p className="text-xs text-gray-500">Libres</p>
            </div>
          </div>
        </div>

        {/* Estado de Propiedades - Donut */}
        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-1">
            <FaBuilding className="text-blue-500" />
            <h3 className="font-semibold dark:text-gray-100">Estados</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Distribución actual</p>
          <Chart options={estadosDonutOptions} series={estadosDonutSeries} type="donut" height={260} />
        </div>

        {/* Tipos de Propiedades - Bar */}
        <div className={`xl:col-span-2 ${cardBase}`}>
          <div className="flex items-center gap-2 mb-1">
            <FaThLarge className="text-violet-500" />
            <h3 className="font-semibold dark:text-gray-100">Por Tipología</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Cantidad por tipo de propiedad</p>
          <Chart options={tiposBarOptions} series={tiposBarSeries} type="bar" height={260} />
        </div>
      </div>

      {/* Gráfico de Valor Portfolio - Full Width */}
      <div className="mb-8">
        <div className={cardBase}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <FaDollarSign className="text-violet-500" />
                <h3 className="font-semibold dark:text-gray-100">Evolución del Portfolio</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Valor total de propiedades por mes</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-violet-500"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Valor Portfolio</span>
              </div>
            </div>
          </div>
          <Chart options={valorPorTipoOptions} series={valorPorTipoSeries} type="area" height={240} />
          <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t dark:border-gray-700">
            <div className="text-center p-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
              <p className="text-xl font-bold text-violet-600 dark:text-violet-400">${(totalValorPortfolio / 1000000).toFixed(1)}M</p>
              <p className="text-xs text-gray-500">Total Actual</p>
            </div>
            <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{propiedades.length}</p>
              <p className="text-xs text-gray-500">Propiedades</p>
            </div>
            <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">${propiedades.length > 0 ? (totalValorPortfolio / propiedades.length / 1000).toFixed(0) : 0}K</p>
              <p className="text-xs text-gray-500">Promedio</p>
            </div>
            <div className="text-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">+12%</p>
              <p className="text-xs text-gray-500">vs Mes Ant.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Propiedades */}
      <div className="mb-6">
        <div className={cardBase}>
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">🏠 Listado de Propiedades</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-3 px-3 font-semibold dark:text-gray-300">Propiedad</th>
                  <th className="text-left py-3 px-3 font-semibold dark:text-gray-300">Tipo</th>
                  <th className="text-left py-3 px-3 font-semibold dark:text-gray-300">Estado</th>
                  <th className="text-right py-3 px-3 font-semibold dark:text-gray-300">Precio</th>
                  <th className="text-center py-3 px-3 font-semibold dark:text-gray-300">M²</th>
                  <th className="text-left py-3 px-3 font-semibold dark:text-gray-300">Agente</th>
                  <th className="text-center py-3 px-3 font-semibold dark:text-gray-300">Visitas</th>
                </tr>
              </thead>
              <tbody>
                {propiedades.slice(0, 10).map((p) => (
                  <tr key={p.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer" onClick={() => verDetalle(p)}>
                    <td className="py-2.5 px-3 dark:text-gray-200">{p.titulo}</td>
                    <td className="py-2.5 px-3 dark:text-gray-300">{p.tipo}</td>
                    <td className="py-2.5 px-3 dark:text-gray-300">{p.estado}</td>
                    <td className="py-2.5 px-3 text-right dark:text-gray-300">${p.precio?.toLocaleString() || 0}</td>
                    <td className="py-2.5 px-3 text-center dark:text-gray-300">{p.m2}</td>
                    <td className="py-2.5 px-3 dark:text-gray-300">{p.agente}</td>
                    <td className="py-2.5 px-3 text-center dark:text-gray-300">{p.visitas}</td>
                  </tr>
                ))}
                {propiedades.length === 0 && (
                  <tr><td colSpan={7} className="py-8 text-center text-gray-400">No hay propiedades registradas</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </>
      )}

      {/* Vista Mapa */}
      {vistaActual === 'mapa' && (
        <div className={`${cardBase} w-full`}>
          <h2 className="text-xl font-bold mb-6 dark:text-gray-100 flex items-center gap-2">
            <FaMapMarkerAlt className="text-violet-500" /> Ubicación y Características
          </h2>
          <PropiedadesMapView
            propiedades={propiedades}
            isDark={currentMode === 'Dark'}
            verDetalle={verDetalle}
            cardBase={cardBase}
            mapViewRef={mapViewRef}
            mapInstanceRef={mapInstanceRef}
            mapMarkersRef={mapMarkersRef}
          />
        </div>
      )}

      {/* Vista Lista de Propiedades */}
      {vistaActual === 'lista' && (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 max-w-md">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Buscar propiedades..."
                className="w-full pl-9 pr-8 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100 text-sm"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="text-sm" />
                </button>
              )}

              {showSuggestions && getSuggestions().length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
                  {getSuggestions().map((prop, i) => (
                    <div
                      key={prop.id || i}
                      onClick={() => {
                        setSearchTerm(prop.titulo);
                        setShowSuggestions(false);
                      }}
                      className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b dark:border-gray-700 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <FaHome className="text-blue-500 text-sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium dark:text-gray-100 truncate">{prop.titulo}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {prop.tipo} • {prop.barrio} • {prop.moneda} ${prop.precio?.toLocaleString()}
                          </p>
                        </div>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          prop.operacion === 'Venta'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {prop.operacion}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${
                showFilters || filtrosActivos > 0
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'border-gray-300 dark:border-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <FaFilter className="text-xs" />
              Filtros
              {filtrosActivos > 0 && (
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${showFilters || filtrosActivos > 0 ? 'bg-white text-blue-500' : 'bg-blue-500 text-white'}`}>
                  {filtrosActivos}
                </span>
              )}
            </button>

            {filtrosActivos > 0 && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="flex items-center gap-1 px-2 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <FaTimes className="text-xs" /> Limpiar
              </button>
            )}

            <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
              {propiedadesFiltradas.length} de {propiedades.length}
            </span>
          </div>

          {showFilters && (
            <div className={`${cardBase} mb-4`}>
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <h4 className="font-semibold dark:text-gray-100 flex items-center gap-2">
                  <FaFilter className="text-blue-500" /> Filtros y Ordenamiento
                </h4>

                <select
                  value={ordenarPor}
                  onChange={(e) => setOrdenarPor(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100 text-sm"
                >
                  <option value="recientes">Más recientes</option>
                  <option value="precio_asc">Precio ↑</option>
                  <option value="precio_desc">Precio ↓</option>
                  <option value="m2_asc">M² ↑</option>
                  <option value="m2_desc">M² ↓</option>
                  <option value="nombre_asc">A-Z</option>
                </select>

                <div className="flex items-center gap-3 ml-auto">
                  {['todas', 'venta', 'alquiler'].map((op) => (
                    <label key={op} className="flex items-center gap-1.5 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="filtroOp"
                        checked={filtroOperacion === op}
                        onChange={() => setFiltroOperacion(op)}
                        className="w-3.5 h-3.5 accent-blue-600"
                      />
                      <span className="dark:text-gray-200 capitalize">{op === 'todas' ? 'Todas' : op}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1 dark:text-gray-300">Tipo</label>
                  <select
                    value={filtros.tipo}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, tipo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100 text-sm"
                  >
                    <option value="">Todos los tipos</option>
                    {tiposUnicos.map((tipo) => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1 dark:text-gray-300">Estado</label>
                  <select
                    value={filtros.estado}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, estado: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100 text-sm"
                  >
                    <option value="">Todos</option>
                    <option value="Disponible">Disponible</option>
                    <option value="Reservada">Reservada</option>
                    <option value="Vendida">Vendida</option>
                    <option value="Alquilada">Alquilada</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1 dark:text-gray-300">Barrio</label>
                  <select
                    value={filtros.barrio}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, barrio: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100 text-sm"
                  >
                    <option value="">Todos los barrios</option>
                    {barriosUnicos.map((barrio) => (
                      <option key={barrio} value={barrio}>{barrio}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1 dark:text-gray-300">Moneda</label>
                  <select
                    value={filtros.moneda}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, moneda: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100 text-sm"
                  >
                    <option value="">Todas</option>
                    <option value="USD">USD</option>
                    <option value="ARS">ARS</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1 dark:text-gray-300">Precio mínimo</label>
                  <input
                    type="number"
                    value={filtros.precioMin}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, precioMin: e.target.value }))}
                    placeholder="Ej: 50000"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 dark:text-gray-300">Precio máximo</label>
                  <input
                    type="number"
                    value={filtros.precioMax}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, precioMax: e.target.value }))}
                    placeholder="Ej: 500000"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1 dark:text-gray-300">Dormitorios mín.</label>
                  <input
                    type="number"
                    value={filtros.dormitoriosMin}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, dormitoriosMin: e.target.value }))}
                    placeholder="Ej: 1"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 dark:text-gray-300">Dormitorios máx.</label>
                  <input
                    type="number"
                    value={filtros.dormitoriosMax}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, dormitoriosMax: e.target.value }))}
                    placeholder="Ej: 5"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1 dark:text-gray-300">M² mínimo</label>
                  <input
                    type="number"
                    value={filtros.m2Min}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, m2Min: e.target.value }))}
                    placeholder="Ej: 30"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1 dark:text-gray-300">M² máximo</label>
                  <input
                    type="number"
                    value={filtros.m2Max}
                    onChange={(e) => setFiltros((prev) => ({ ...prev, m2Max: e.target.value }))}
                    placeholder="Ej: 300"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {propiedadesFiltradas.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <FaHome className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No hay propiedades que coincidan con el filtro seleccionado</p>
              </div>
            ) : (
              propiedadesFiltradas.map((propiedad) => {
                const estadoClass = propiedad.estado === 'Disponible'
                  ? 'bg-green-500 text-white'
                  : propiedad.estado === 'Reservada'
                    ? 'bg-yellow-500 text-white'
                    : propiedad.estado === 'Vendida'
                      ? 'bg-gray-500 text-white'
                      : 'bg-blue-500 text-white';

                return (
                  <div key={propiedad.id} className={cardBase + ' hover:shadow-xl cursor-pointer'} onClick={() => verDetalle(propiedad)}>
                    {/* Portada */}
                    <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg mb-4 relative overflow-hidden">
                      {coverBlobUrls[propiedad.id] ? (
                        <img
                          src={coverBlobUrls[propiedad.id]}
                          alt={propiedad.titulo}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FaHome className="text-6xl text-white opacity-30" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3 flex gap-2">
                        <span className={'px-3 py-1 rounded-full text-xs font-semibold ' + estadoClass}>
                          {propiedad.estado}
                        </span>
                      </div>
                      <div className="absolute bottom-3 left-3 bg-black bg-opacity-60 text-white px-3 py-1 rounded-lg text-sm flex items-center gap-1">
                        <FaCamera /> {propiedad.fotos} fotos
                      </div>
                    </div>

                    {/* Información */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-lg font-bold dark:text-gray-100">{propiedad.titulo}</h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono select-all">ID: {propiedad.id}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <FaMapMarkerAlt className="text-red-500" /> {propiedad.barrio}, {propiedad.ciudad}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold" style={{ color: currentColor }}>
                          {propiedad.moneda} ${propiedad.precio.toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">{propiedad.operacion}</span>
                      </div>

                      <div className="grid grid-cols-4 gap-2 pt-3 border-t dark:border-gray-700">
                        <div className="text-center">
                          <FaRulerCombined className="text-gray-400 mx-auto mb-1" />
                          <p className="text-xs font-semibold dark:text-gray-200">{propiedad.m2}m²</p>
                        </div>
                        <div className="text-center">
                          <FaHome className="text-gray-400 mx-auto mb-1" />
                          <p className="text-xs font-semibold dark:text-gray-200">{propiedad.ambientes} amb</p>
                        </div>
                        <div className="text-center">
                          <FaBed className="text-gray-400 mx-auto mb-1" />
                          <p className="text-xs font-semibold dark:text-gray-200">{propiedad.dormitorios} dorm</p>
                        </div>
                        <div className="text-center">
                          <FaBath className="text-gray-400 mx-auto mb-1" />
                          <p className="text-xs font-semibold dark:text-gray-200">{propiedad.baños} baños</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <FaUser className="text-gray-400" />
                          <span className="text-sm dark:text-gray-300">{propiedad.agente}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                          <FaEye />
                          <span className="text-sm">{propiedad.visitas}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {/* Vista Detalle de Propiedad */}
      {vistaActual === 'detalle' && propiedadSeleccionada && (
        <div className="space-y-6">
          {/* Header con carrusel de imágenes */}
          <div className="relative h-96 rounded-2xl overflow-hidden">
            {fotoAdjuntos.length > 0 ? (
              <div className="w-full h-full bg-black flex items-center justify-center">
                {carouselSrc ? (
                  <img
                    src={carouselSrc}
                    alt={carouselDoc?.nombre || 'Imagen de propiedad'}
                    className="w-full h-full object-contain"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="animate-pulse w-full h-full bg-gray-800" />
                )}
                {fotoAdjuntos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setCarouselIdx((i) => (i <= 0 ? fotoAdjuntos.length - 1 : i - 1))}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors z-20"
                    >
                      <FaChevronLeft />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCarouselIdx((i) => (i >= fotoAdjuntos.length - 1 ? 0 : i + 1))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors z-20"
                    >
                      <FaChevronRight />
                    </button>
                    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 text-white text-xs z-20">
                      {safeCarouselIdx + 1} / {fotoAdjuntos.length}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                <FaHome className="text-9xl text-white opacity-20" />
              </div>
            )}
            <div className="absolute top-6 right-6 flex gap-3 z-10">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                propiedadSeleccionada.estado === 'Disponible' ? 'bg-green-500 text-white' :
                propiedadSeleccionada.estado === 'Reservada' ? 'bg-yellow-500 text-white' :
                propiedadSeleccionada.estado === 'Vendida' ? 'bg-gray-500 text-white' :
                'bg-blue-500 text-white'
              }`}>
                {propiedadSeleccionada.estado}
              </span>
              <button type="button" onClick={() => setShowInforme(true)} className="px-4 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors flex items-center gap-2">
                <FaFileAlt /> Informe
              </button>
              <button type="button" onClick={() => handleEditPropiedad(propiedadSeleccionada)} className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors flex items-center gap-2">
                <FaEdit /> Editar
              </button>
              <button type="button" onClick={() => eliminarPropiedad(propiedadSeleccionada)} className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center gap-2" disabled={loading}>
                <FaTrash /> Eliminar
              </button>
            </div>
            <div className="absolute bottom-6 left-6 text-white z-10" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
              <h1 className="text-4xl font-bold mb-2">{propiedadSeleccionada.titulo}</h1>
              <p className="text-sm opacity-80 font-mono select-all mb-1">ID: {propiedadSeleccionada.id}</p>
              <p className="text-xl flex items-center gap-2">
                <FaMapMarkerAlt /> {propiedadSeleccionada.direccion}, {propiedadSeleccionada.barrio}
              </p>
            </div>
          </div>

          {/* Información Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna Principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Precio y Operación */}
              <div className={cardBase}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Precio de {propiedadSeleccionada.operacion}</p>
                    <p className="text-4xl font-bold" style={{ color: currentColor }}>
                      {propiedadSeleccionada.moneda} ${propiedadSeleccionada.precio.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Comisión</p>
                    <p className="text-2xl font-bold text-green-500">{propiedadSeleccionada.comision}%</p>
                  </div>
                </div>
              </div>

              {/* Características Principales */}
              <div className={cardBase}>
                <h3 className="text-xl font-bold mb-4 dark:text-gray-100">📋 Características Principales</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-gray-800 rounded-lg">
                    <FaRulerCombined className="text-3xl text-blue-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Superficie Total</p>
                    <p className="text-xl font-bold dark:text-gray-100">{propiedadSeleccionada.m2}m²</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-gray-800 rounded-lg">
                    <FaHome className="text-3xl text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Ambientes</p>
                    <p className="text-xl font-bold dark:text-gray-100">{propiedadSeleccionada.ambientes}</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-gray-800 rounded-lg">
                    <FaBed className="text-3xl text-purple-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Dormitorios</p>
                    <p className="text-xl font-bold dark:text-gray-100">{propiedadSeleccionada.dormitorios}</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 dark:bg-gray-800 rounded-lg">
                    <FaBath className="text-3xl text-orange-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Baños</p>
                    <p className="text-xl font-bold dark:text-gray-100">{propiedadSeleccionada.baños}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                  <div className="flex items-center gap-3 p-3 border dark:border-gray-700 rounded-lg">
                    <FaCar className="text-2xl text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Cocheras</p>
                      <p className="font-bold dark:text-gray-100">{propiedadSeleccionada.cocheras}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border dark:border-gray-700 rounded-lg">
                    <FaRulerCombined className="text-2xl text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">M² Cubiertos</p>
                      <p className="font-bold dark:text-gray-100">{propiedadSeleccionada.m2Cubiertos}m²</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border dark:border-gray-700 rounded-lg">
                    <FaCalendar className="text-2xl text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Antigüedad</p>
                      <p className="font-bold dark:text-gray-100">{propiedadSeleccionada.antiguedad} años</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <div className={cardBase}>
                <h3 className="text-xl font-bold mb-4 dark:text-gray-100">📝 Descripción</h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{propiedadSeleccionada.descripcion}</p>
              </div>

              {/* Todos los campos completados */}
              <div className={cardBase}>
                <h3 className="text-xl font-bold mb-4 dark:text-gray-100">📋 Detalles Completos de la Propiedad</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {propiedadSeleccionada.tipo && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tipo</p>
                      <p className="font-semibold dark:text-gray-100">{propiedadSeleccionada.tipo}</p>
                    </div>
                  )}
                  {propiedadSeleccionada.categoria && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Categoría</p>
                      <p className="font-semibold dark:text-gray-100">{propiedadSeleccionada.categoria}</p>
                    </div>
                  )}
                  {propiedadSeleccionada.operacion && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Operación</p>
                      <p className="font-semibold dark:text-gray-100">{propiedadSeleccionada.operacion}</p>
                    </div>
                  )}
                  {propiedadSeleccionada.estado && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Estado</p>
                      <p className="font-semibold dark:text-gray-100">{propiedadSeleccionada.estado}</p>
                    </div>
                  )}
                  {propiedadSeleccionada.idPropiedad && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">ID Propiedad</p>
                      <p className="font-semibold dark:text-gray-100">{propiedadSeleccionada.idPropiedad}</p>
                    </div>
                  )}
                  {propiedadSeleccionada.precioOferta && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Precio Oferta</p>
                      <p className="font-semibold dark:text-gray-100">{propiedadSeleccionada.moneda} ${Number(propiedadSeleccionada.precioOferta).toLocaleString()}</p>
                    </div>
                  )}
                  {propiedadSeleccionada.precioPorM2 && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Precio por m²</p>
                      <p className="font-semibold dark:text-gray-100">{propiedadSeleccionada.moneda} ${Number(propiedadSeleccionada.precioPorM2).toLocaleString()}</p>
                    </div>
                  )}
                  {propiedadSeleccionada.tipoEstructura && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tipo de Estructura</p>
                      <p className="font-semibold dark:text-gray-100">{propiedadSeleccionada.tipoEstructura}</p>
                    </div>
                  )}
                  {propiedadSeleccionada.tipoCochera && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tipo de Cochera</p>
                      <p className="font-semibold dark:text-gray-100">{propiedadSeleccionada.tipoCochera}</p>
                    </div>
                  )}
                  {propiedadSeleccionada.balcon && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Balcón</p>
                      <p className="font-semibold dark:text-gray-100">{propiedadSeleccionada.balcon}</p>
                    </div>
                  )}
                  {propiedadSeleccionada.piso && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Piso</p>
                      <p className="font-semibold dark:text-gray-100">{propiedadSeleccionada.piso}</p>
                    </div>
                  )}
                  {propiedadSeleccionada.anioConstruccion && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Año de Construcción</p>
                      <p className="font-semibold dark:text-gray-100">{propiedadSeleccionada.anioConstruccion}</p>
                    </div>
                  )}
                  {propiedadSeleccionada.tipoCalefaccion && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Calefacción</p>
                      <p className="font-semibold dark:text-gray-100">{propiedadSeleccionada.tipoCalefaccion}</p>
                    </div>
                  )}
                  {propiedadSeleccionada.tipoAguaCaliente && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Agua Caliente</p>
                      <p className="font-semibold dark:text-gray-100">{propiedadSeleccionada.tipoAguaCaliente}</p>
                    </div>
                  )}
                  {propiedadSeleccionada.tipoCocina && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cocina</p>
                      <p className="font-semibold dark:text-gray-100">{propiedadSeleccionada.tipoCocina}</p>
                    </div>
                  )}
                  {propiedadSeleccionada.nomenclaturaCatastral && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Nomenclatura Catastral</p>
                      <p className="font-semibold dark:text-gray-100">{propiedadSeleccionada.nomenclaturaCatastral}</p>
                    </div>
                  )}
                  {propiedadSeleccionada.partidaInmobiliaria && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Partida Inmobiliaria</p>
                      <p className="font-semibold dark:text-gray-100">{propiedadSeleccionada.partidaInmobiliaria}</p>
                    </div>
                  )}
                  {propiedadSeleccionada.disponibleDesde && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Disponible Desde</p>
                      <p className="font-semibold dark:text-gray-100">{propiedadSeleccionada.disponibleDesde}</p>
                    </div>
                  )}
                  {propiedadSeleccionada.tamanoGaraje && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tamaño Garaje</p>
                      <p className="font-semibold dark:text-gray-100">{propiedadSeleccionada.tamanoGaraje}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Amenities */}
              <div className={cardBase}>
                <h3 className="text-xl font-bold mb-4 dark:text-gray-100">✨ Amenities</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {propiedadSeleccionada.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-gray-800 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm font-medium dark:text-gray-200">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Galería de Fotos — D&D reordering */}
              {fotoAdjuntos.length > 0 && (
                <div className={cardBase}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xl font-bold dark:text-gray-100">📷 Galería de Fotos</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                        <FaGripVertical size={10} /> Arrastrá para reordenar
                      </span>
                      {isSavingOrder && <span className="text-xs text-blue-500 animate-pulse">Guardando...</span>}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">La primera imagen (⭐) es la portada de la propiedad.</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
                    {fotoAdjuntos.map((l, fotoIdx) => {
                      const adjIdx = adjuntos.findIndex((x) => String(x._id) === String(l._id));
                      const d = l?.document;
                      const imgSrc = d ? getDocImgUrl(d) : null;
                      return (
                        <div
                          key={l._id}
                          draggable
                          onDragStart={() => { adjDragItem.current = adjIdx; }}
                          onDragEnter={() => { adjDragOverItem.current = adjIdx; }}
                          onDragOver={(e) => e.preventDefault()}
                          onDragEnd={() => {
                            const from = adjDragItem.current;
                            const to = adjDragOverItem.current;
                            adjDragItem.current = null;
                            adjDragOverItem.current = null;
                            reorderAdjuntos(from, to);
                          }}
                          className="group relative aspect-square rounded-lg overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-600 cursor-grab active:cursor-grabbing hover:border-blue-400 transition-all bg-gray-50 dark:bg-gray-800"
                        >
                          {imgSrc ? (
                            <img
                              src={imgSrc}
                              alt={d?.nombre || 'Foto'}
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="animate-pulse w-full h-full bg-gray-200 dark:bg-gray-700" />
                          )}
                          <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                            {fotoIdx === 0 ? '⭐' : fotoIdx + 1}
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => setLightboxDoc({ doc: d, link: l })}
                              className="p-1.5 rounded-full bg-white/90 text-gray-700 hover:bg-white transition-colors"
                              title="Ver"
                            >
                              <FaEye size={12} />
                            </button>
                            <button
                              type="button"
                              title="Quitar"
                              onClick={async () => {
                                if (!d?._id) return;
                                const ok = await confirmToast('¿Desvincular esta foto?');
                                if (!ok) return;
                                try {
                                  await crmService.links.unlink({ documentId: d._id, entityType: 'propiedad', entityId: propiedadSeleccionada.id });
                                  setAdjuntos((prev) => prev.filter((x) => String(x._id) !== String(l._id)));
                                } catch (e) {
                                  setAdjuntosError(e?.message || 'Error al desvincular foto');
                                }
                              }}
                              className="p-1.5 rounded-full bg-red-500/90 text-white hover:bg-red-500 transition-colors"
                            >
                              <FaTimes size={12} />
                            </button>
                          </div>
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/50 h-5 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-0.5">
                            <span className="text-[9px] text-white/80">arrastrá</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Archivos adjuntos (no imágenes) */}
              {adjuntosLoading && (
                <div className={cardBase}>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Cargando archivos...</p>
                </div>
              )}
              {!adjuntosLoading && adjuntos.filter((l) => l?.document && !isImageDoc(l.document)).length > 0 && (
                <div className={cardBase}>
                  <h3 className="text-xl font-bold mb-4 dark:text-gray-100">📎 Documentos y Planos</h3>
                  {adjuntosError && (
                    <div className="mb-3 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">{adjuntosError}</div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {adjuntos.filter((l) => l?.document && !isImageDoc(l.document)).map((l) => {
                      const d = l?.document;
                      return (
                        <div
                          key={l._id}
                          className="group relative rounded-xl overflow-hidden border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex flex-col"
                        >
                          <div className="aspect-square flex items-center justify-center bg-gray-100 dark:bg-gray-900">
                            <FaFileAlt className="text-3xl text-gray-400" />
                          </div>
                          <div className="p-2">
                            <p className="text-xs font-medium dark:text-gray-200 truncate" title={d?.nombre}>{d?.nombre || 'Documento'}</p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{d?.categoria || d?.tipo || ''}</p>
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                            <button type="button" onClick={() => setLightboxDoc({ doc: d, link: l })} className="p-2 rounded-full bg-white/90 text-gray-700 hover:bg-white transition-colors" title="Ver">
                              <FaEye size={14} />
                            </button>
                            <button
                              type="button"
                              title="Quitar"
                              onClick={async () => {
                                if (!d?._id) return;
                                const ok = await confirmToast('¿Desvincular este archivo?');
                                if (!ok) return;
                                try {
                                  await crmService.links.unlink({ documentId: d._id, entityType: 'propiedad', entityId: propiedadSeleccionada.id });
                                  setAdjuntos((prev) => prev.filter((x) => String(x._id) !== String(l._id)));
                                } catch (e) {
                                  setAdjuntosError(e?.message || 'Error al desvincular archivo');
                                }
                              }}
                              className="p-2 rounded-full bg-red-500/90 text-white hover:bg-red-500 transition-colors"
                            >
                              <FaTimes size={14} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

            {/* Columna Lateral */}
            <div className="space-y-6">
              {/* Agente Responsable */}
              <div className={cardBase}>
                <h3 className="text-lg font-bold mb-4 dark:text-gray-100 flex items-center gap-2">
                  <FaUser className="text-purple-500" /> Agente Responsable
                </h3>
                <div className="text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                    <FaUser className="text-3xl text-white" />
                  </div>
                  <p className="font-bold text-lg dark:text-gray-100">{propiedadSeleccionada.agente}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Agente Inmobiliario</p>
                </div>
              </div>

              {/* Propietario */}
              <div className={cardBase}>
                <h3 className="text-lg font-bold mb-4 dark:text-gray-100 flex items-center gap-2">
                  <FaUser className="text-blue-500" /> Propietario
                </h3>
                {propiedadSeleccionada.ownerData ? (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <span className="text-xl font-bold text-white">{(propiedadSeleccionada.ownerData.nombre || '?')[0].toUpperCase()}</span>
                    </div>
                    <p className="font-semibold dark:text-gray-100 mb-1">{propiedadSeleccionada.ownerData.nombre}</p>
                    {propiedadSeleccionada.ownerData.email && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{propiedadSeleccionada.ownerData.email}</p>
                    )}
                    {propiedadSeleccionada.ownerData.telefono && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">{propiedadSeleccionada.ownerData.telefono}</p>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = `/clientes?id=${propiedadSeleccionada.ownerId}`;
                      }}
                      className="mt-3 px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2 mx-auto"
                    >
                      <FaEye /> Ver Cliente
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-3 flex items-center justify-center">
                      <FaUser className="text-2xl text-gray-400" />
                    </div>
                    <p className="font-semibold text-gray-400 dark:text-gray-500 mb-1">Sin asignar</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">No vinculado a cliente</p>
                  </div>
                )}
              </div>

              {/* Ubicación con mapa */}
              <div className={cardBase}>
                <h3 className="text-lg font-bold mb-4 dark:text-gray-100 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-red-500" /> Ubicación
                </h3>
                {propiedadSeleccionada.lat && propiedadSeleccionada.lng && (
                  <div className="mb-4 h-32 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FaMapMarkerAlt className="text-4xl text-red-500" />
                    </div>
                    <p className="absolute bottom-2 left-2 right-2 text-center text-xs bg-black bg-opacity-60 text-white px-2 py-1 rounded">Lat: {Number(propiedadSeleccionada.lat).toFixed(6)}, Lng: {Number(propiedadSeleccionada.lng).toFixed(6)}</p>
                  </div>
                )}
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Dirección</p>
                    <p className="font-semibold dark:text-gray-200">{propiedadSeleccionada.direccion}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Barrio</p>
                    <p className="font-semibold dark:text-gray-200">{propiedadSeleccionada.barrio}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Ciudad</p>
                    <p className="font-semibold dark:text-gray-200">{propiedadSeleccionada.ciudad}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Provincia</p>
                    <p className="font-semibold dark:text-gray-200">{propiedadSeleccionada.provincia}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Código Postal</p>
                    <p className="font-semibold dark:text-gray-200">{propiedadSeleccionada.codigoPostal}</p>
                  </div>
                </div>
              </div>

              {/* Estadísticas */}
              <div className={cardBase}>
                <h3 className="text-lg font-bold mb-4 dark:text-gray-100">📊 Estadísticas</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FaEye className="text-blue-500" />
                      <span className="text-sm dark:text-gray-200">Visitas</span>
                    </div>
                    <span className="font-bold dark:text-gray-100">{propiedadSeleccionada.visitas}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FaCamera className="text-green-500" />
                      <span className="text-sm dark:text-gray-200">Fotos</span>
                    </div>
                    <span className="font-bold dark:text-gray-100">{propiedadSeleccionada.fotos}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FaCalendar className="text-purple-500" />
                      <span className="text-sm dark:text-gray-200">Publicada</span>
                    </div>
                    <span className="font-bold dark:text-gray-100">{propiedadSeleccionada.fechaPublicacion}</span>
                  </div>
                </div>
              </div>

              {/* Publicación y Link Privado */}
              <div className={cardBase}>
                <h3 className="text-lg font-bold mb-4 dark:text-gray-100 flex items-center gap-2">
                  <FaGlobe className="text-green-500" /> Publicación
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium dark:text-gray-200">Publicar en sitio web</span>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await crmService.propiedades.togglePublish(propiedadSeleccionada.id, !propiedadSeleccionada.published);
                          const newVal = !!res.published;
                          setPropiedadSeleccionada((prev) => ({ ...prev, published: newVal }));
                          setPropiedades((prev) => prev.map((p) => (String(p.id) === String(propiedadSeleccionada.id) ? { ...p, published: newVal } : p)));
                        } catch (e) { setError(e?.message || 'Error al cambiar publicación'); }
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${propiedadSeleccionada.published ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${propiedadSeleccionada.published ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {propiedadSeleccionada.published ? 'Visible en el sitio web público' : 'No visible en el sitio web público'}
                  </div>
                  <hr className="dark:border-gray-700" />
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <FaLock className="text-amber-500" />
                      <span className="text-sm font-medium dark:text-gray-200">Link Privado</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                      Genera un link secreto para compartir esta propiedad. Solo quien tenga el link podrá verla.
                    </p>
                    {propiedadSeleccionada.privateToken ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={`https://anabellaluna.com.ar/propiedad/${propiedadSeleccionada.id}?token=${propiedadSeleccionada.privateToken}`}
                            className="flex-1 px-3 py-2 text-xs border dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 dark:text-gray-200 truncate"
                          />
                          <button
                            type="button"
                            title="Copiar link"
                            onClick={() => {
                              navigator.clipboard.writeText(`https://anabellaluna.com.ar/propiedad/${propiedadSeleccionada.id}?token=${propiedadSeleccionada.privateToken}`);
                            }}
                            className="p-2 rounded-lg border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          >
                            <FaCopy className="text-sm dark:text-gray-300" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            const ok = await confirmToast('¿Eliminar el link privado? Las personas con este link ya no podrán acceder.');
                            if (!ok) return;
                            try {
                              await crmService.propiedades.revokePrivateLink(propiedadSeleccionada.id);
                              setPropiedadSeleccionada((prev) => ({ ...prev, privateToken: '' }));
                              setPropiedades((prev) => prev.map((p) => (String(p.id) === String(propiedadSeleccionada.id) ? { ...p, privateToken: '' } : p)));
                            } catch (e) { setError(e?.message || 'Error al eliminar link'); }
                          }}
                          className="w-full px-3 py-2 text-xs text-red-600 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"
                        >
                          <FaTrash /> Eliminar acceso
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const res = await crmService.propiedades.generatePrivateLink(propiedadSeleccionada.id);
                            const tok = res.privateToken || '';
                            setPropiedadSeleccionada((prev) => ({ ...prev, privateToken: tok }));
                            setPropiedades((prev) => prev.map((p) => (String(p.id) === String(propiedadSeleccionada.id) ? { ...p, privateToken: tok } : p)));
                          } catch (e) { setError(e?.message || 'Error al generar link'); }
                        }}
                        className="w-full px-3 py-2 text-sm rounded-lg border border-amber-400 dark:border-amber-600 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors flex items-center justify-center gap-2"
                      >
                        <FaLink /> Generar link privado
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox modal for file preview */}
      {lightboxDoc && (() => {
        const d = lightboxDoc.doc;
        const l = lightboxDoc.link;
        const isImg = d && isImageDoc(d);
        const imgSrc = isImg ? getDocImgUrl(d) : null;
        return (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70" onClick={() => setLightboxDoc(null)}>
            <div className="relative max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-3 border-b dark:border-gray-700">
                <div>
                  <p className="font-semibold dark:text-gray-100 truncate">{d?.nombre || 'Archivo'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{d?.categoria || d?.tipo || ''}</p>
                </div>
                <button type="button" onClick={() => setLightboxDoc(null)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                  <FaTimes className="text-lg dark:text-gray-300" />
                </button>
              </div>
              <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-50 dark:bg-gray-950 min-h-[300px]">
                {isImg && imgSrc ? (
                  <img src={imgSrc} alt={d?.nombre} className="max-w-full max-h-[70vh] object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-3 p-10 text-gray-400">
                    <FaFileAlt className="text-6xl" />
                    <p className="text-sm">{d?.nombre}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-3 px-5 py-3 border-t dark:border-gray-700">
                <button type="button" onClick={() => downloadOrOpenDoc(d, 'download')} className="px-4 py-2 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center gap-2">
                  <FaDownload size={12} /> Descargar
                </button>
                <button type="button" onClick={() => setLightboxDoc(null)} className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors dark:text-gray-200">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Informe de Mercado */}
      {showInforme && propiedadSeleccionada && (
        <PropiedadInforme
          propiedad={propiedadSeleccionada}
          onClose={() => setShowInforme(false)}
          isDark={isDark}
        />
      )}

      {/* Modal de Nueva Propiedad */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            {/* Header del Modal */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaHome /> {editingPropiedadId ? 'Editar Propiedad' : 'Nueva Propiedad'}
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  {formStep === 1 ? 'Paso 1: Datos de la propiedad' : 'Paso 2: Datos del cliente (opcional)'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${formStep === 1 ? 'bg-white text-blue-600' : 'bg-blue-400 text-white'}`}>1</span>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${formStep === 2 ? 'bg-white text-blue-600' : 'bg-blue-400 text-white'}`}>2</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                >
                  <FaTimes className="text-2xl" />
                </button>
              </div>
            </div>

            {/* Formulario con scroll */}
            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {formStep === 1 && (
                  <>
                  {/* Información Básica */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 flex items-center gap-2">
                      <FaBuilding className="text-blue-500" /> Información Básica
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                          Título de la Propiedad *
                        </label>
                        <input
                          type="text"
                          name="titulo"
                          value={nuevaPropiedad.titulo}
                          onChange={handleInputChange}
                          required
                          placeholder="Ej: Depto 2amb Palermo con balcón"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                          Tipo de Propiedad *
                        </label>
                        <select
                          name="tipo"
                          value={nuevaPropiedad.tipo}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                        >
                          <option value="Departamento">Departamento</option>
                          <option value="Casa">Casa</option>
                          <option value="PH">PH</option>
                          <option value="Oficina">Oficina</option>
                          <option value="Local">Local Comercial</option>
                          <option value="Terreno">Terreno</option>
                          <option value="Cochera">Cochera</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                          Categoría
                        </label>
                        <input
                          type="text"
                          name="categoria"
                          value={nuevaPropiedad.categoria}
                          onChange={handleInputChange}
                          placeholder="Ej: Residencial"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                          Operación *
                        </label>
                        <select
                          name="operacion"
                          value={nuevaPropiedad.operacion}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                        >
                          <option value="Venta">Venta</option>
                          <option value="Alquiler">Alquiler</option>
                          <option value="Alquiler Temporal">Alquiler Temporal</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                          Precio *
                        </label>
                        <div className="flex gap-2">
                          <select
                            name="moneda"
                            value={nuevaPropiedad.moneda}
                            onChange={handleInputChange}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                          >
                            <option value="USD">USD</option>
                            <option value="ARS">ARS</option>
                          </select>
                          {String(nuevaPropiedad.operacion || '').toLowerCase().includes('alquil') ? (
                            <select
                              name="unidadPrecio"
                              value={nuevaPropiedad.unidadPrecio}
                              onChange={handleInputChange}
                              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                            >
                              <option value="month">Mes</option>
                              <option value="week">Semana</option>
                              <option value="day">Día</option>
                              <option value="night">Noche</option>
                            </select>
                          ) : null}
                          <input
                            type="number"
                            name="precio"
                            value={nuevaPropiedad.precio}
                            onChange={handleInputChange}
                            required
                            placeholder="150000"
                            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                          Precio de Oferta
                        </label>
                        <input
                          type="number"
                          name="precioOferta"
                          value={nuevaPropiedad.precioOferta}
                          onChange={handleInputChange}
                          placeholder="140000"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                          Estado *
                        </label>
                        <select
                          name="estado"
                          value={nuevaPropiedad.estado}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                        >
                          <option value="Disponible">Disponible</option>
                          <option value="Reservada">Reservada</option>
                          <option value="Vendida">Vendida</option>
                          <option value="Alquilada">Alquilada</option>
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="flex items-center gap-3 text-sm font-medium dark:text-gray-200">
                          <input
                            type="checkbox"
                            name="featured"
                            checked={!!nuevaPropiedad.featured}
                            onChange={handleInputChange}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          Featured
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Ubicación */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 flex items-center gap-2">
                      <FaMapMarkerAlt className="text-red-500" /> Ubicación
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                          Dirección *
                        </label>
                        <input
                          ref={addressInputRef}
                          type="text"
                          name="direccion"
                          value={nuevaPropiedad.direccion}
                          onChange={handleInputChange}
                          required
                          placeholder="Av. Santa Fe 1234"
                          autoComplete="off"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                        />
                        {process.env.REACT_APP_GOOGLE_MAPS_API_KEY && (
                          <p className="text-xs text-blue-400 mt-1 flex items-center gap-1">
                            <FaMapMarkerAlt size={10} /> Tip: escribí y seleccioná de la lista para autocompletar coordenadas
                          </p>
                        )}
                        {nuevaPropiedad.lat && nuevaPropiedad.lng && (
                          <p className="text-xs text-emerald-500 mt-1">✓ Coordenadas guardadas ({Number(nuevaPropiedad.lat).toFixed(5)}, {Number(nuevaPropiedad.lng).toFixed(5)})</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                          Barrio *
                        </label>
                        <input
                          type="text"
                          name="barrio"
                          value={nuevaPropiedad.barrio}
                          onChange={handleInputChange}
                          required
                          placeholder="Palermo"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                          Ciudad *
                        </label>
                        <input
                          type="text"
                          name="ciudad"
                          value={nuevaPropiedad.ciudad}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                          Provincia *
                        </label>
                        <input
                          type="text"
                          name="provincia"
                          value={nuevaPropiedad.provincia}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                          País
                        </label>
                        <input
                          type="text"
                          name="pais"
                          value={nuevaPropiedad.pais}
                          onChange={handleInputChange}
                          placeholder="AR"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                          Código Postal
                        </label>
                        <input
                          type="text"
                          name="codigoPostal"
                          value={nuevaPropiedad.codigoPostal}
                          onChange={handleInputChange}
                          placeholder="C1425"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Características */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 flex items-center gap-2">
                      <FaHome className="text-green-500" /> Características
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                          ID de la propiedad
                        </label>
                        <input
                          type="text"
                          name="idPropiedad"
                          value={nuevaPropiedad.idPropiedad}
                          onChange={handleInputChange}
                          placeholder="PROP-001"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                          Precio por m²
                        </label>
                        <input
                          type="number"
                          name="precioPorM2"
                          value={nuevaPropiedad.precioPorM2}
                          onChange={handleInputChange}
                          placeholder="3500"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                          Tipo de estructura
                        </label>
                        <input
                          type="text"
                          name="tipoEstructura"
                          value={nuevaPropiedad.tipoEstructura}
                          onChange={handleInputChange}
                          placeholder="Hormigón"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                          M² Totales *
                        </label>
                        <input
                          type="number"
                          name="m2Totales"
                          value={nuevaPropiedad.m2Totales}
                          onChange={handleInputChange}
                          required
                          placeholder="45"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                          M² Cubiertos
                        </label>
                        <input
                          type="number"
                          name="m2Cubiertos"
                          value={nuevaPropiedad.m2Cubiertos}
                          onChange={handleInputChange}
                          placeholder="40"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                          Ambientes *
                        </label>
                        <input
                          type="number"
                          name="ambientes"
                          value={nuevaPropiedad.ambientes}
                          onChange={handleInputChange}
                          required
                          placeholder="2"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                          Dormitorios
                        </label>
                        <input
                          type="number"
                          name="dormitorios"
                          value={nuevaPropiedad.dormitorios}
                          onChange={handleInputChange}
                          placeholder="1"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                          Baños
                        </label>
                        <input
                          type="number"
                          name="baños"
                          value={nuevaPropiedad.baños}
                          onChange={handleInputChange}
                          placeholder="1"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                          Cocheras
                        </label>
                        <input
                          type="number"
                          name="cocheras"
                          value={nuevaPropiedad.cocheras}
                          onChange={handleInputChange}
                          placeholder="0"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                          Tipo de Cochera
                        </label>
                        <select
                          name="tipoCochera"
                          value={nuevaPropiedad.tipoCochera}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                        >
                          <option value="">— Sin especificar —</option>
                          <option value="Cubierta">Cubierta</option>
                          <option value="Descubierta">Descubierta</option>
                          <option value="Semicubierta">Semicubierta</option>
                          <option value="Espacio para estacionar">Espacio para estacionar</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                          Calefacción
                        </label>
                        <select
                          name="tipoCalefaccion"
                          value={nuevaPropiedad.tipoCalefaccion}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                        >
                          <option value="">— Sin especificar —</option>
                          <option value="Gas natural">Gas natural</option>
                          <option value="Gas envasado">Gas envasado</option>
                          <option value="Eléctrica">Eléctrica</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                          Agua Caliente
                        </label>
                        <select
                          name="tipoAguaCaliente"
                          value={nuevaPropiedad.tipoAguaCaliente}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                        >
                          <option value="">— Sin especificar —</option>
                          <option value="Gas natural">Gas natural</option>
                          <option value="Gas envasado">Gas envasado</option>
                          <option value="Termotanque eléctrico">Termotanque eléctrico</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                          Cocina
                        </label>
                        <select
                          name="tipoCocina"
                          value={nuevaPropiedad.tipoCocina}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                        >
                          <option value="">— Sin especificar —</option>
                          <option value="Gas natural">Gas natural</option>
                          <option value="Gas envasado">Gas envasado</option>
                          <option value="Eléctrica">Eléctrica</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                          Antigüedad (años)
                        </label>
                        <input
                          type="number"
                          name="antiguedad"
                          value={nuevaPropiedad.antiguedad}
                          onChange={handleInputChange}
                          placeholder="5"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Descripción */}
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Descripción
                    </label>
                    <textarea
                      name="descripcion"
                      value={nuevaPropiedad.descripcion}
                      onChange={handleInputChange}
                      rows="4"
                      placeholder="Descripción detallada de la propiedad..."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>

                  {/* Comentarios Internos */}
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Comentarios Internos
                    </label>
                    <textarea
                      name="comentariosInternos"
                      value={nuevaPropiedad.comentariosInternos}
                      onChange={handleInputChange}
                      rows="3"
                      placeholder="Notas internas visibles solo para el agente asignado..."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Estos comentarios son privados y solo visibles para el agente asignado a esta propiedad.
                    </p>
                  </div>

                  {/* Amenities */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">
                      Amenities
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                      {amenitiesDisponibles.map((amenity) => (
                        <label key={amenity} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={nuevaPropiedad.amenities.includes(amenity)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setNuevaPropiedad(prev => ({
                                  ...prev,
                                  amenities: [...prev.amenities, amenity]
                                }));
                              } else {
                                setNuevaPropiedad(prev => ({
                                  ...prev,
                                  amenities: prev.amenities.filter(a => a !== amenity)
                                }));
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="dark:text-gray-200">{amenity}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">Multimedia</h3>

                    {/* Fotos */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                        Fotos <span className="text-gray-400 font-normal">(arrastra para reordenar)</span>
                      </label>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => {
                          const nf = Array.from(e.target.files || []);
                          if (nf.length) setFilesFotos((prev) => [...prev, ...nf]);
                          e.target.value = '';
                        }}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100"
                      />
                      {renderFileGrid(filesFotos, setFilesFotos)}
                    </div>

                    {/* Planos */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                        Planos
                      </label>
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const nf = Array.from(e.target.files || []);
                          if (nf.length) setFilesPlanos((prev) => [...prev, ...nf]);
                          e.target.value = '';
                        }}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100"
                      />
                      {renderFileGrid(filesPlanos, setFilesPlanos)}
                    </div>

                    {/* Documentos */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                        Documentos
                      </label>
                      <input
                        type="file"
                        multiple
                        accept="image/*,.pdf,.doc,.docx,.zip"
                        onChange={(e) => {
                          const nf = Array.from(e.target.files || []);
                          if (nf.length) setFilesDocumentos((prev) => [...prev, ...nf]);
                          e.target.value = '';
                        }}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100"
                      />
                      {renderFileGrid(filesDocumentos, setFilesDocumentos)}
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                        Videos (YouTube/Vimeo)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={videoUrlDraft}
                          onChange={(e) => setVideoUrlDraft(e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const v = String(videoUrlDraft || '').trim();
                            if (!v) return;
                            setNuevaPropiedad((prev) => ({
                              ...prev,
                              videoUrls: Array.from(new Set([...(prev.videoUrls || []), v])),
                            }));
                            setVideoUrlDraft('');
                          }}
                          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        >
                          Agregar
                        </button>
                      </div>
                      {(nuevaPropiedad.videoUrls || []).length ? (
                        <div className="mt-3 space-y-2">
                          {(nuevaPropiedad.videoUrls || []).map((u, idx) => (
                            <div
                              key={`${u}-${idx}`}
                              className="flex items-center justify-between gap-2 p-2 border border-gray-200 dark:border-gray-700 rounded-lg"
                            >
                              <div className="text-sm dark:text-gray-200 break-all">{u}</div>
                              <button
                                type="button"
                                onClick={() =>
                                  setNuevaPropiedad((prev) => ({
                                    ...prev,
                                    videoUrls: (prev.videoUrls || []).filter((x) => x !== u),
                                  }))
                                }
                                className="text-red-600 hover:text-red-700"
                              >
                                <FaTimes />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Datos Registrales */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 flex items-center gap-2">
                      <FaFileAlt className="text-indigo-500" /> Datos Registrales
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                          Nomenclatura Catastral
                        </label>
                        <input
                          type="text"
                          name="nomenclaturaCatastral"
                          value={nuevaPropiedad.nomenclaturaCatastral}
                          onChange={handleInputChange}
                          placeholder="Ej: Circ. I - Secc. A - Manz. 10 - Parc. 5"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                          Partida Inmobiliaria
                        </label>
                        <input
                          type="text"
                          name="partidaInmobiliaria"
                          value={nuevaPropiedad.partidaInmobiliaria}
                          onChange={handleInputChange}
                          placeholder="Ej: 012-34567"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Asignación y Comisión */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 flex items-center gap-2">
                      <FaUser className="text-purple-500" /> Asignación
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                          Responsable *
                        </label>
                        <select
                          name="agente"
                          value={nuevaPropiedad.agente}
                          onChange={handleInputChange}
                          required
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                        >
                          <option value="">Seleccionar responsable</option>
                          {admins.length > 0 && (
                            <optgroup label="Administrador (ERP)">
                              {admins.map((a) => (
                                <option key={`admin-${a._id}`} value={`admin:${a._id}`}>{a.nombre}</option>
                              ))}
                            </optgroup>
                          )}
                          <optgroup label="Agentes">
                            {agentes.map((a) => (
                              <option key={a._id} value={a._id}>{a.nombre}</option>
                            ))}
                          </optgroup>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                          Comisión (%)
                        </label>
                        <input
                          type="number"
                          name="comision"
                          value={nuevaPropiedad.comision}
                          onChange={handleInputChange}
                          step="0.5"
                          min="0"
                          max="10"
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ── DISEÑO DEL FUNNEL ──────────────────────────────────── */}
                  <div className="border dark:border-gray-700 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setFunnelEditorOpen((v) => !v)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span style={{ fontSize: 20 }}>🎨</span>
                        <div>
                          <div className="font-semibold dark:text-gray-100 text-sm">Diseño del Funnel</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Personaliza el fondo, colores y la imagen del hero de la página de detalle</div>
                        </div>
                      </div>
                      <span className="text-gray-400 text-lg" style={{ transform: funnelEditorOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}>▼</span>
                    </button>
                    {funnelEditorOpen && (
                      <div className="px-5 pb-5 border-t dark:border-gray-700 bg-white dark:bg-gray-900">
                        <div className="pt-4">
                          <FunnelDesignEditor
                            value={nuevaPropiedad.funnelSettings || {}}
                            onChange={(fs) => setNuevaPropiedad((prev) => ({ ...prev, funnelSettings: fs }))}
                            previewTitle={nuevaPropiedad.titulo || 'Título de la propiedad'}
                            previewCoverUrl={
                              filesFotos.length > 0 && filesFotos[0].type?.startsWith('image/')
                                ? URL.createObjectURL(filesFotos[0])
                                : ''
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botones Paso 1 */}
                  <div className="flex gap-3 justify-end pt-4 border-t dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormStep(2)}
                      style={{ backgroundColor: currentColor }}
                      className="flex items-center gap-2 px-6 py-3 text-white rounded-lg hover:opacity-90 transition-opacity shadow-md"
                    >
                      Siguiente <FaChevronRight />
                    </button>
                  </div>
                  </>
                )}

                {formStep === 2 && (
                  <>
                    {/* Propietario / Cliente */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-semibold dark:text-gray-100 flex items-center gap-2">
                        <FaUser className="text-blue-500" /> Propietario / Cliente
                      </h3>

                      {/* Autocomplete search */}
                      <div ref={clienteSearchRef} className="relative">
                        <label className="block text-sm font-medium mb-2 dark:text-gray-200">Buscar cliente existente</label>
                        {selectedCliente ? (
                          <div className="flex items-center gap-3 p-3 border border-blue-300 dark:border-blue-600 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {(selectedCliente.nombre || '?')[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium dark:text-gray-100 truncate">{selectedCliente.nombre}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{selectedCliente.email || selectedCliente.telefono || ''}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => { setSelectedCliente(null); setClienteQuery(''); }}
                              className="text-red-500 hover:text-red-700 text-sm font-medium"
                            >✕</button>
                          </div>
                        ) : (
                          <>
                            <input
                              type="text"
                              value={clienteQuery}
                              onChange={(e) => setClienteQuery(e.target.value)}
                              placeholder="Escribí nombre, email o teléfono..."
                              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                            />
                            {showClienteDropdown && clientesBusqueda.length > 0 && (
                              <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {clientesBusqueda.map((c) => (
                                  <button
                                    key={c._id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedCliente(c);
                                      setClienteQuery('');
                                      setShowClienteDropdown(false);
                                      setIncluirCliente(false);
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-gray-700 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                                  >
                                    <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                                      {(c.nombre || '?')[0].toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium dark:text-gray-100 truncate">{c.nombre}</p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{[c.email, c.telefono].filter(Boolean).join(' · ')}</p>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>

                      {/* Or create new client */}
                      {!selectedCliente && (
                        <div className="flex items-center gap-3 p-3 rounded-lg border dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                          <input
                            type="checkbox"
                            id="incluirClienteAdmin"
                            checked={incluirCliente}
                            onChange={(e) => setIncluirCliente(e.target.checked)}
                            className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                          />
                          <label htmlFor="incluirClienteAdmin" className="text-sm font-medium dark:text-gray-200">
                            Crear nuevo cliente
                          </label>
                        </div>
                      )}
                    </div>

                    {incluirCliente && !selectedCliente && (
                      <>
                        {/* Información Personal del Cliente */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 flex items-center gap-2">
                            <FaUser className="text-blue-500" /> Información del Nuevo Cliente
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-2 dark:text-gray-200">Nombre</label>
                              <input type="text" name="nombre" value={nuevoCliente.nombre} onChange={handleClienteInputChange} placeholder="Juan" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2 dark:text-gray-200">Apellido</label>
                              <input type="text" name="apellido" value={nuevoCliente.apellido} onChange={handleClienteInputChange} placeholder="Pérez" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2 dark:text-gray-200">Email</label>
                              <input type="email" name="email" value={nuevoCliente.email} onChange={handleClienteInputChange} placeholder="juan@email.com" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2 dark:text-gray-200">Teléfono</label>
                              <input type="tel" name="telefono" value={nuevoCliente.telefono} onChange={handleClienteInputChange} placeholder="+54 11 1234-5678" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2 dark:text-gray-200">Teléfono Alternativo</label>
                              <input type="tel" name="telefonoAlternativo" value={nuevoCliente.telefonoAlternativo} onChange={handleClienteInputChange} placeholder="+54 11 8765-4321" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2 dark:text-gray-200">Ocupación</label>
                              <input type="text" name="ocupacion" value={nuevoCliente.ocupacion} onChange={handleClienteInputChange} placeholder="Ingeniero" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2 dark:text-gray-200">Empresa</label>
                              <input type="text" name="empresa" value={nuevoCliente.empresa} onChange={handleClienteInputChange} placeholder="Tech Corp" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2 dark:text-gray-200">Dirección</label>
                              <input type="text" name="direccion" value={nuevoCliente.direccion} onChange={handleClienteInputChange} placeholder="Av. Corrientes 1234" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2 dark:text-gray-200">Ciudad</label>
                              <input type="text" name="ciudad" value={nuevoCliente.ciudad} onChange={handleClienteInputChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2 dark:text-gray-200">Provincia</label>
                              <input type="text" name="provincia" value={nuevoCliente.provincia} onChange={handleClienteInputChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                            </div>
                          </div>
                        </div>

                        {/* Clasificación CRM del Cliente */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 flex items-center gap-2">
                            <FaChartLine className="text-purple-500" /> Clasificación CRM
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-2 dark:text-gray-200">Tipo de Cliente</label>
                              <select name="tipoCliente" value={nuevoCliente.tipoCliente} onChange={handleClienteInputChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100">
                                <option value="Comprador">Comprador</option>
                                <option value="Propietario">Propietario</option>
                                <option value="Inversor">Inversor</option>
                                <option value="Inquilino">Inquilino</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2 dark:text-gray-200">Estado en el Ciclo</label>
                              <select name="estado" value={nuevoCliente.estado} onChange={handleClienteInputChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100">
                                <option value="Lead">Lead</option>
                                <option value="Contacto">Contacto</option>
                                <option value="Prospecto">Prospecto</option>
                                <option value="Negociación">Negociación</option>
                                <option value="Cerrado">Cerrado</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2 dark:text-gray-200">Origen del Lead</label>
                              <select name="origen" value={nuevoCliente.origen} onChange={handleClienteInputChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100">
                                <option value="Web">Sitio Web</option>
                                <option value="Redes Sociales">Redes Sociales</option>
                                <option value="Referido">Referido</option>
                                <option value="Llamada">Llamada Directa</option>
                                <option value="Email">Email</option>
                                <option value="Evento">Evento</option>
                                <option value="Otro">Otro</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        {/* Preferencias de Búsqueda del Cliente */}
                        <div>
                          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 flex items-center gap-2">
                            <FaHome className="text-green-500" /> Preferencias de Búsqueda
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-2 dark:text-gray-200">Presupuesto</label>
                              <div className="flex gap-2">
                                <select name="moneda" value={nuevoCliente.moneda} onChange={handleClienteInputChange} className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100">
                                  <option value="USD">USD</option>
                                  <option value="ARS">ARS</option>
                                </select>
                                <input type="number" name="presupuesto" value={nuevoCliente.presupuesto} onChange={handleClienteInputChange} placeholder="150000" className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2 dark:text-gray-200">Zona de Interés</label>
                              <input type="text" name="zonaInteres" value={nuevoCliente.zonaInteres} onChange={handleClienteInputChange} placeholder="Palermo, Belgrano" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                            </div>
                          </div>
                        </div>

                        {/* Notas del Cliente */}
                        <div>
                          <label className="block text-sm font-medium mb-2 dark:text-gray-200">Notas Adicionales</label>
                          <textarea name="notas" value={nuevoCliente.notas} onChange={handleClienteInputChange} rows="3" placeholder="Información adicional..." className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                        </div>
                      </>
                    )}

                    {/* Botones Paso 2 */}
                    <div className="flex gap-3 justify-between pt-4 border-t dark:border-gray-700">
                      <button
                        type="button"
                        onClick={() => setFormStep(1)}
                        className="flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors"
                      >
                        <FaChevronLeft /> Anterior
                      </button>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setShowModal(false)}
                          className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          style={{ backgroundColor: currentColor }}
                          className="flex items-center gap-2 px-6 py-3 text-white rounded-lg hover:opacity-90 transition-opacity shadow-md"
                          disabled={loading}
                        >
                          <FaSave /> Guardar Propiedad
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Total Propiedades */}
      {showModalTotalPropiedades && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaHome /> Total Propiedades
                </h2>
                <p className="text-blue-100 text-sm mt-1">{propiedades.length} propiedades en el sistema</p>
              </div>
              <button onClick={() => setShowModalTotalPropiedades(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {propiedades.map((prop) => (
                  <div key={prop.id} className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 border ${currentMode === 'Dark' ? 'border-gray-700' : 'border-gray-200'} hover:shadow-lg transition-shadow`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg dark:text-gray-100">{prop.titulo}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{prop.barrio}, {prop.ciudad}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        prop.estado === 'Disponible' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                        prop.estado === 'Reservada' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        prop.estado === 'Vendida' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' :
                        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      }`}>
                        {prop.estado}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Tipo:</span>
                        <span className="font-medium dark:text-gray-200">{prop.tipo}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Operación:</span>
                        <span className="font-medium dark:text-gray-200">{prop.operacion}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Precio:</span>
                        <span className="font-bold text-green-600 dark:text-green-400">{prop.moneda} ${prop.precio.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t dark:border-gray-700">
                        <span className="flex items-center gap-1"><FaBed /> {prop.dormitorios}</span>
                        <span className="flex items-center gap-1"><FaBath /> {prop.baños}</span>
                        <span className="flex items-center gap-1"><FaRulerCombined /> {prop.m2}m²</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Valor Total Portfolio */}
      {showModalValorPortfolio && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className="sticky top-0 bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaDollarSign /> Valor Total del Portfolio
                </h2>
                <p className="text-green-100 text-sm mt-1">
                  Total: ${totalValorPortfolio.toLocaleString()} USD
                </p>
              </div>
              <button onClick={() => setShowModalValorPortfolio(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {[...propiedades].sort((a, b) => b.precio - a.precio).map((prop) => (
                  <div key={prop.id} className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 border ${currentMode === 'Dark' ? 'border-gray-700' : 'border-gray-200'} hover:shadow-md transition-shadow`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg dark:text-gray-100">{prop.titulo}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{prop.tipo} • {prop.operacion} • {prop.barrio}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-2">
                          <span>{prop.m2}m²</span>
                          <span>{prop.ambientes} amb</span>
                          <span>{prop.dormitorios} dorm</span>
                          <span className={`px-2 py-1 rounded ${
                            prop.estado === 'Disponible' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                            prop.estado === 'Reservada' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {prop.estado}
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{prop.moneda} ${prop.precio.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Comisión: {prop.comision}%</p>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400 mt-1">
                          ${((prop.precio * prop.comision) / 100).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className={`mt-6 p-4 ${currentMode === 'Dark' ? 'bg-green-900/20' : 'bg-green-50'} rounded-lg border-2 border-green-500`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Valor Total</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${totalValorPortfolio.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Comisión Potencial</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${propiedades.reduce((sum, p) => sum + ((Number(p.precio || 0) || 0) * (Number(p.comision || 0) || 0) / 100), 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Precio Promedio</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${Math.round(propiedades.length ? (totalValorPortfolio / propiedades.length) : 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Visitas Totales */}
      {showModalVisitasTotales && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaEye /> Visitas Totales
                </h2>
                <p className="text-purple-100 text-sm mt-1">
                  {totalVisitas.toLocaleString()} visitas totales
                </p>
              </div>
              <button onClick={() => setShowModalVisitasTotales(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {[...propiedades].sort((a, b) => b.visitas - a.visitas).map((prop, index) => (
                  <div key={prop.id} className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 border ${currentMode === 'Dark' ? 'border-gray-700' : 'border-gray-200'} hover:shadow-md transition-shadow`}>
                    <div className="flex items-center gap-4">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                        index === 0 ? 'bg-yellow-400 text-yellow-900' :
                        index === 1 ? 'bg-gray-300 text-gray-700' :
                        index === 2 ? 'bg-orange-400 text-orange-900' :
                        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                      }`}>
                        #{index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg dark:text-gray-100">{prop.titulo}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{prop.tipo} • {prop.barrio} • {prop.moneda} ${prop.precio.toLocaleString()}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            prop.estado === 'Disponible' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {prop.estado}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">Agente: {prop.agente}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{prop.visitas.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">visitas</p>
                        <div className="mt-2 w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ width: `${maxVisitas ? ((prop.visitas / maxVisitas) * 100) : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className={`mt-6 p-4 ${currentMode === 'Dark' ? 'bg-purple-900/20' : 'bg-purple-50'} rounded-lg border-2 border-purple-500`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Visitas</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {totalVisitas.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Promedio por Propiedad</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {Math.round(propiedades.length ? (totalVisitas / propiedades.length) : 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Más Visitada</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {maxVisitas.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reservadas */}
      {showModalReservadas && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className="sticky top-0 bg-gradient-to-r from-amber-500 to-amber-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaBuilding /> Propiedades Reservadas
                </h2>
                <p className="text-amber-100 text-sm mt-1">
                  {reservadasCount !== null ? reservadasCount : reservadas} propiedades con contrato de reserva
                </p>
              </div>
              <button type="button" onClick={() => setShowModalReservadas(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <FaTimes className="text-2xl" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {(() => {
                const reservadas_list = reservadasPropertyIds.length > 0
                  ? propiedades.filter(p => reservadasPropertyIds.includes(String(p.id)))
                  : propiedades.filter(p => p.estado === 'Reservada');
                if (!reservadas_list.length) {
                  return (
                    <div className="text-center py-16 text-gray-400">
                      <FaBuilding className="text-5xl mx-auto mb-4 opacity-30" />
                      <p className="text-lg font-medium">No hay propiedades reservadas</p>
                      <p className="text-sm mt-1">Las reservas aparecerán aquí cuando se registre una operación de reserva o se emita un contrato de reserva.</p>
                    </div>
                  );
                }
                return (
                  <div className="space-y-3">
                    {reservadas_list.map((prop) => (
                      <div key={prop.id} className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 border ${currentMode === 'Dark' ? 'border-amber-700/40' : 'border-amber-200'} hover:shadow-md transition-shadow`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg dark:text-gray-100">{prop.titulo}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{prop.tipo} • {prop.barrio}{prop.ciudad ? `, ${prop.ciudad}` : ''}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                              <span className="text-gray-500 dark:text-gray-400">Publicada: {prop.fechaPublicacion}</span>
                              <span className="px-2 py-1 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 font-medium">{prop.estado}</span>
                              {prop.operacion && <span className="px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">{prop.operacion}</span>}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{prop.moneda} {Number(prop.precio || 0).toLocaleString()}</p>
                            {prop.agente && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Agente: {prop.agente}</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
              <div className={`mt-6 p-4 ${currentMode === 'Dark' ? 'bg-amber-900/20' : 'bg-amber-50'} rounded-lg border-2 border-amber-500`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Reservadas</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{reservadasCount !== null ? reservadasCount : reservadas}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Por Operación Registrada</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{propiedades.filter(p => p.estado === 'Reservada').length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Por Contrato Emitido</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{Math.max(0, (reservadasCount ?? 0) - propiedades.filter(p => p.estado === 'Reservada').length)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Fotos Subidas */}
      {showModalFotosSubidas && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaCamera /> Fotos Subidas
                </h2>
                <p className="text-orange-100 text-sm mt-1">
                  {totalFotos} fotos en total
                </p>
              </div>
              <button onClick={() => setShowModalFotosSubidas(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {[...propiedades].sort((a, b) => b.fotos - a.fotos).map((prop) => (
                  <div key={prop.id} className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 border ${currentMode === 'Dark' ? 'border-gray-700' : 'border-gray-200'} hover:shadow-md transition-shadow`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg dark:text-gray-100">{prop.titulo}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{prop.tipo} • {prop.barrio}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span className="text-gray-600 dark:text-gray-400">Publicada: {prop.fechaPublicacion}</span>
                          <span className={`px-2 py-1 rounded ${
                            prop.estado === 'Disponible' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {prop.estado}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <FaCamera className="text-4xl text-orange-500 mx-auto mb-1" />
                          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{prop.fotos}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">fotos</p>
                        </div>
                        <div className="text-center">
                          <FaEye className="text-2xl text-purple-500 mx-auto mb-1" />
                          <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">{prop.visitas}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">visitas</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Ratio</p>
                          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {prop.fotos ? Math.round(prop.visitas / prop.fotos) : 0}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">visitas/foto</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            prop.fotos >= 10 ? 'bg-green-500' :
                            prop.fotos >= 6 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${(prop.fotos / 15) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {prop.fotos >= 10 ? 'Completo' : prop.fotos >= 6 ? 'Bueno' : 'Necesita más fotos'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className={`mt-6 p-4 ${currentMode === 'Dark' ? 'bg-orange-900/20' : 'bg-orange-50'} rounded-lg border-2 border-orange-500`}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Fotos</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {totalFotos}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Promedio por Propiedad</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {Math.round(propiedades.length ? (totalFotos / propiedades.length) : 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Más Fotos</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {maxFotos}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Propiedades Completas</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {propiedades.filter(p => p.fotos >= 10).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Propiedades;
