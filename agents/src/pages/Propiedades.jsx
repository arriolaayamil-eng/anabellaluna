import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { confirmToast } from '../utils/confirmToast';
import { FaPlus, FaUpload, FaHome, FaEye, FaDollarSign, FaUser, FaCamera, FaMapMarkerAlt, FaBuilding, FaTimes, FaSave, FaArrowLeft, FaBed, FaBath, FaCar, FaRulerCombined, FaCalendar, FaEdit, FaTrash, FaChartLine, FaChartPie, FaArrowUp, FaArrowDown, FaSearch, FaFilter } from 'react-icons/fa';
import { Header } from '../components';
import { useStateContext } from '../contexts/ContextProvider';
import { crmService } from '../services/crmService';
import { documentService } from '../services/documentService';
import API_CONFIG, { getAuthToken } from '../config/api';
import Chart from 'react-apexcharts';

// Syncfusion Components
import { ChartComponent, SeriesCollectionDirective, SeriesDirective, Inject, ColumnSeries, Category, Tooltip, Legend, AccumulationChartComponent, AccumulationSeriesCollectionDirective, AccumulationSeriesDirective, AccumulationLegend, AccumulationDataLabel, AccumulationTooltip, PieSeries } from '@syncfusion/ej2-react-charts';
import { GridComponent, ColumnsDirective, ColumnDirective, Page, Sort, Filter, Inject as GridInject } from '@syncfusion/ej2-react-grids';

const Propiedades = () => {
  const { currentMode, currentColor } = useStateContext();
  
  // Estado para tabs internas
  const [activeTab, setActiveTab] = useState('metricas'); // 'metricas', 'propiedades'
  
  // Estado para filtro de operación
  const [filtroOperacion, setFiltroOperacion] = useState('todas'); // 'venta', 'alquiler', 'todas'
  
  // Estado para el modal
  const [showModal, setShowModal] = useState(false);
  
  // Estados para modales de estadísticas
  const [showModalTotalPropiedades, setShowModalTotalPropiedades] = useState(false);
  const [showModalValorPortfolio, setShowModalValorPortfolio] = useState(false);
  const [showModalVisitasTotales, setShowModalVisitasTotales] = useState(false);
  const [showModalFotosSubidas, setShowModalFotosSubidas] = useState(false);
  
  // Estados para las vistas
  const [vistaActual, setVistaActual] = useState('dashboard'); // 'dashboard', 'lista', 'detalle'
  const [propiedadSeleccionada, setPropiedadSeleccionada] = useState(null);

  const [propiedades, setPropiedades] = useState([]);
  const [agentes, setAgentes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados para búsqueda y filtros avanzados
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
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
  const [ordenarPor, setOrdenarPor] = useState('recientes'); // 'recientes', 'precio_asc', 'precio_desc', 'm2_asc', 'm2_desc', 'nombre_asc'

  const [editingPropiedadId, setEditingPropiedadId] = useState(null);
  const [adjuntos, setAdjuntos] = useState([]);
  const [adjuntosLoading, setAdjuntosLoading] = useState(false);
  const [adjuntosError, setAdjuntosError] = useState('');

  const [filesFotos, setFilesFotos] = useState([]);
  const [filesDocumentos, setFilesDocumentos] = useState([]);
  const [filesPlanos, setFilesPlanos] = useState([]);

  const [videoUrlDraft, setVideoUrlDraft] = useState('');
  
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
    m2Totales: '',
    m2Cubiertos: '',
    ambientes: '',
    dormitorios: '',
    baños: '',
    cocheras: '',
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
    estado: 'Disponible',
    descripcion: '',
    amenities: [],
    videoUrls: [],
    agente: '',
    comision: '3',
  });

  const openCreateModal = () => {
    setEditingPropiedadId(null);
    setFilesFotos([]);
    setFilesDocumentos([]);
    setFilesPlanos([]);
    setVideoUrlDraft('');
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
      m2Totales: '',
      m2Cubiertos: '',
      ambientes: '',
      dormitorios: '',
      baños: '',
      cocheras: '',
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
      estado: 'Disponible',
      descripcion: '',
      amenities: [],
      videoUrls: [],
      agente: '',
      comision: '3',
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
      m2Totales: prop.m2 || '',
      m2Cubiertos: prop.m2Cubiertos || '',
      ambientes: prop.ambientes || '',
      dormitorios: prop.dormitorios || '',
      baños: prop.baños || '',
      cocheras: prop.cocheras || '',
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
      estado: prop.estado || 'Disponible',
      descripcion: prop.descripcion || '',
      amenities: Array.isArray(prop.amenities) ? prop.amenities : [],
      videoUrls: Array.isArray(prop.videoUrls) ? prop.videoUrls : [],
      agente: prop.agenteId || '',
      comision: String(prop.comision ?? '3'),
    });
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
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const [agentesData, propiedadesData] = await Promise.all([
          crmService.agentes.getAll(),
          crmService.propiedades.getAll(),
        ]);

        if (!mounted) return;
        const agentesArr = Array.isArray(agentesData) ? agentesData : [];
        setAgentes(agentesArr);
        if (agentesArr.length === 1) {
          setNuevaPropiedad((prev) => ({
            ...prev,
            agente: prev.agente || String(agentesArr[0]._id),
          }));
        }

        const agentesById = new Map(agentesArr.map((a) => [String(a._id), a]));
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
            descripcion: p.description || meta.descripcion || '',
            amenities: Array.isArray(meta.amenities) ? meta.amenities : [],
            videoUrls: Array.isArray(meta.videoUrls)
              ? meta.videoUrls
              : meta.videoUrl
                ? [meta.videoUrl]
                : [],
            agente: agenteNombre,
            agenteId: meta.agenteId || p.agentId || '',
            visitas: Number(meta.visitas || 0),
            fotos: Number(meta.fotos || 0),
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
            estado: p.status || meta.estado || 'Disponible',
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

  // ApexCharts - Distribución por Tipo (Donut)
  const tipoDonutOptions = {
    chart: { type: 'donut', height: 220, background: 'transparent' },
    labels: ['Departamento', 'Casa', 'PH', 'Local', 'Oficina'],
    colors: ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'],
    plotOptions: { pie: { donut: { size: '65%', labels: { show: true, name: { fontSize: '11px', color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' }, value: { fontSize: '18px', fontWeight: 700, color: currentMode === 'Dark' ? '#F3F4F6' : '#1F2937' }, total: { show: true, label: 'Total', fontSize: '10px', color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', formatter: () => propiedades.length } } } } },
    dataLabels: { enabled: false },
    legend: { show: true, position: 'bottom', fontSize: '10px', labels: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' } },
    stroke: { show: false },
    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light' },
  };
  const tipoDonutSeries = [
    propiedades.filter(p => p.tipo === 'Departamento').length,
    propiedades.filter(p => p.tipo === 'Casa').length,
    propiedades.filter(p => p.tipo === 'PH').length,
    propiedades.filter(p => p.tipo === 'Local').length,
    propiedades.filter(p => p.tipo === 'Oficina').length,
  ];

  // ApexCharts - Estado de Propiedades (Bar)
  const estadoBarOptions = {
    chart: { type: 'bar', height: 180, background: 'transparent', toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 6, horizontal: true, distributed: true, barHeight: '60%' } },
    colors: ['#10B981', '#F59E0B', '#3B82F6', '#EF4444'],
    dataLabels: { enabled: true, textAnchor: 'start', style: { colors: ['#fff'], fontSize: '10px', fontWeight: 600 }, formatter: (val) => val, offsetX: 5 },
    xaxis: { categories: ['Disponible', 'Reservada', 'En Negociación', 'Vendida'], labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '10px' } } },
    grid: { show: false },
    legend: { show: false },
    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light' },
  };
  const estadoBarSeries = [{ name: 'Propiedades', data: [
    propiedades.filter(p => p.estado === 'Disponible').length,
    propiedades.filter(p => p.estado === 'Reservada').length,
    propiedades.filter(p => p.estado === 'En Negociación').length,
    propiedades.filter(p => p.estado === 'Vendida').length,
  ] }];

  // ApexCharts - Valor Portfolio (Radial)
  const portfolioOptions = {
    chart: { type: 'radialBar', height: 200, background: 'transparent', sparkline: { enabled: false } },
    plotOptions: {
      radialBar: {
        startAngle: -135, endAngle: 135,
        hollow: { size: '60%', background: 'transparent' },
        track: { background: currentMode === 'Dark' ? '#374151' : '#E5E7EB', strokeWidth: '100%' },
        dataLabels: {
          name: { show: true, fontSize: '11px', fontWeight: 600, color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', offsetY: -8 },
          value: { show: true, fontSize: '22px', fontWeight: 700, color: currentMode === 'Dark' ? '#F3F4F6' : '#1F2937', offsetY: 4, formatter: () => `$${(propiedades.reduce((sum, p) => sum + p.precio, 0) / 1000000).toFixed(1)}M` },
        },
      },
    },
    fill: { type: 'gradient', gradient: { shade: 'dark', type: 'horizontal', colorStops: [{ offset: 0, color: '#10B981', opacity: 1 }, { offset: 100, color: '#059669', opacity: 1 }] } },
    stroke: { lineCap: 'round' },
    labels: ['Portfolio'],
  };
  const portfolioSeries = [75];

  // ApexCharts - Tendencia de Visitas (Area)
  const visitasAreaOptions = {
    chart: { type: 'area', height: 200, background: 'transparent', toolbar: { show: false }, zoom: { enabled: false }, sparkline: { enabled: false } },
    colors: ['#8B5CF6'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2.5 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] } },
    xaxis: { categories: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'], labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '10px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '10px' } } },
    grid: { borderColor: currentMode === 'Dark' ? '#374151' : '#E5E7EB', strokeDashArray: 4 },
    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light' },
  };
  const visitasAreaSeries = [{ name: 'Visitas', data: [450, 620, 580, 720] }];

  // KPIs de Propiedades
  const kpisPropiedades = [
    { title: 'Total Propiedades', value: propiedades.length, desc: '3 nuevas esta semana', icon: <FaHome />, color: 'from-blue-500 to-blue-600' },
    { title: 'Valor Total Portfolio', value: `$${(propiedades.reduce((sum, p) => sum + p.precio, 0) / 1000).toFixed(0)}K`, desc: 'Inventario completo', icon: <FaDollarSign />, color: 'from-green-500 to-green-600' },
    { title: 'Visitas Totales', value: propiedades.reduce((sum, p) => sum + p.visitas, 0).toLocaleString(), desc: 'Este mes', icon: <FaEye />, color: 'from-purple-500 to-purple-600' },
    { title: 'Fotos Subidas', value: propiedades.reduce((sum, p) => sum + p.fotos, 0), desc: 'Galería completa', icon: <FaCamera />, color: 'from-orange-500 to-orange-600' },
  ];

  // Datos para gráficos
  const estadosData = [
    { estado: 'Disponible', cantidad: propiedades.filter(p => p.estado === 'Disponible').length, fill: '#10B981' },
    { estado: 'Reservada', cantidad: propiedades.filter(p => p.estado === 'Reservada').length, fill: '#F59E0B' },
    { estado: 'Vendida', cantidad: propiedades.filter(p => p.estado === 'Vendida').length, fill: '#6B7280' },
    { estado: 'Alquilada', cantidad: propiedades.filter(p => p.estado === 'Alquilada').length, fill: '#3B82F6' },
  ];

  const tiposData = [
    { tipo: 'Departamento', cantidad: propiedades.filter(p => p.tipo === 'Departamento').length },
    { tipo: 'Casa', cantidad: propiedades.filter(p => p.tipo === 'Casa').length },
    { tipo: 'Oficina', cantidad: propiedades.filter(p => p.tipo === 'Oficina').length },
    { tipo: 'PH', cantidad: propiedades.filter(p => p.tipo === 'PH').length },
    { tipo: 'Local', cantidad: propiedades.filter(p => p.tipo === 'Local').length },
  ];

  const isDark = currentMode === 'Dark';
  const cardBase = `rounded-2xl p-6 border transition-shadow ${isDark ? 'bg-secondary-dark-bg border-gray-700/50 hover:border-indigo-500/30' : 'bg-white border-gray-100 shadow-md hover:shadow-lg'}`;

  // Función para manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNuevaPropiedad(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');

      const agenteDoc = agentes.find((a) => String(a._id) === String(nuevaPropiedad.agente));
      const agenteNombre = agenteDoc ? agenteDoc.nombre : '';

      const payload = {
        title: nuevaPropiedad.titulo,
        description: nuevaPropiedad.descripcion,
        address: nuevaPropiedad.direccion,
        price: Number(nuevaPropiedad.precio || 0),
        moneda: nuevaPropiedad.moneda,
        featured: !!nuevaPropiedad.featured,
        status: nuevaPropiedad.estado,
        agentId: nuevaPropiedad.agente || undefined,
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
          m2Totales: Number(nuevaPropiedad.m2Totales || 0),
          m2Cubiertos: Number(nuevaPropiedad.m2Cubiertos || 0),
          ambientes: Number(nuevaPropiedad.ambientes || 0),
          dormitorios: Number(nuevaPropiedad.dormitorios || 0),
          baños: Number(nuevaPropiedad.baños || 0),
          cocheras: Number(nuevaPropiedad.cocheras || 0),
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
          estado: nuevaPropiedad.estado,
          descripcion: nuevaPropiedad.descripcion,
          amenities: nuevaPropiedad.amenities,
          videoUrls: Array.isArray(nuevaPropiedad.videoUrls) ? nuevaPropiedad.videoUrls : [],
          agenteId: nuevaPropiedad.agente,
          agenteNombre,
          comision: Number(nuevaPropiedad.comision || 0),
        },
      };

      const saved = editingPropiedadId
        ? await crmService.propiedades.update(editingPropiedadId, payload)
        : await crmService.propiedades.create(payload);

      const existingProp = propiedades.find((p) => String(p.id) === String(saved._id));

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
        descripcion: saved.description || payload.metadata.descripcion,
        amenities: payload.metadata.amenities,
        videoUrls: payload.metadata.videoUrls,
        agente: payload.metadata.agenteNombre,
        agenteId: saved.agentId || payload.metadata.agenteId,
        visitas: existingProp ? Number(existingProp.visitas || 0) : 0,
        fotos: existingProp ? Number(existingProp.fotos || 0) : 0,
        fechaPublicacion: existingProp ? (existingProp.fechaPublicacion || '') : '',
        comision: payload.metadata.comision,
        m2: payload.metadata.m2Totales,
        m2Cubiertos: payload.metadata.m2Cubiertos,
        ambientes: payload.metadata.ambientes,
        dormitorios: payload.metadata.dormitorios,
        baños: payload.metadata.baños,
        cocheras: payload.metadata.cocheras,
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
        estado: saved.status || payload.metadata.estado,
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

      // Check milestones (non-blocking)
      if (!editingPropiedadId) {
        crmService.rewards.checkMilestones('property').catch(() => {});
      }

      setEditingPropiedadId(null);
      setFilesFotos([]);
      setFilesDocumentos([]);
      setFilesPlanos([]);
      setVideoUrlDraft('');
      setShowModal(false);

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
        m2Totales: '',
        m2Cubiertos: '',
        ambientes: '',
        dormitorios: '',
        baños: '',
        cocheras: '',
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
        estado: 'Disponible',
        descripcion: '',
        amenities: [],
        videoUrls: [],
        agente: '',
        comision: '3',
      });
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
      if (propiedadSeleccionada && String(propiedadSeleccionada.id) === String(prop.id)) {
        setPropiedadSeleccionada(null);
        setVistaActual('dashboard');
      }
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
  const verDetalle = (propiedad) => {
    setPropiedadSeleccionada(propiedad);
    setVistaActual('detalle');
  };

  // Función para volver al dashboard
  const volverAlDashboard = () => {
    setVistaActual('dashboard');
    setPropiedadSeleccionada(null);
  };

  // Obtener sugerencias de búsqueda basadas en el texto
  const getSuggestions = () => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return propiedades.filter(p => 
      p.titulo?.toLowerCase().includes(term) ||
      p.barrio?.toLowerCase().includes(term) ||
      p.ciudad?.toLowerCase().includes(term) ||
      p.direccion?.toLowerCase().includes(term) ||
      p.tipo?.toLowerCase().includes(term)
    ).slice(0, 8); // Máximo 8 sugerencias
  };

  // Obtener barrios únicos de las propiedades
  const barriosUnicos = [...new Set(propiedades.map(p => p.barrio).filter(Boolean))];
  
  // Tipos de propiedades únicos
  const tiposUnicos = [...new Set(propiedades.map(p => p.tipo).filter(Boolean))];

  // Aplicar búsqueda, filtros y ordenamiento
  const propiedadesFiltradas = propiedades
    .filter(p => {
      // Filtro por operación (radio buttons existentes)
      if (filtroOperacion === 'venta' && p.operacion !== 'Venta') return false;
      if (filtroOperacion === 'alquiler' && p.operacion !== 'Alquiler') return false;
      
      // Búsqueda por texto
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchSearch = 
          p.titulo?.toLowerCase().includes(term) ||
          p.barrio?.toLowerCase().includes(term) ||
          p.ciudad?.toLowerCase().includes(term) ||
          p.direccion?.toLowerCase().includes(term) ||
          p.tipo?.toLowerCase().includes(term);
        if (!matchSearch) return false;
      }
      
      // Filtros avanzados
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

  // Limpiar todos los filtros
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

  // Contar filtros activos
  const filtrosActivos = Object.values(filtros).filter(v => v !== '').length + 
    (searchTerm ? 1 : 0) + 
    (filtroOperacion !== 'todas' ? 1 : 0) +
    (ordenarPor !== 'recientes' ? 1 : 0);

  return (
    <div className={`min-h-screen px-6 lg:px-8 pt-4 pb-6 ${isDark ? 'bg-main-dark-bg' : 'bg-gray-50'}`}>
      <div className="mb-6">
        <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <FaHome className="text-blue-500" /> Gestión de Propiedades
        </h2>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Administra tu cartera inmobiliaria</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">
          {error}
        </div>
      )}
      
      {/* Botones de Acción */}
      <div className="flex flex-wrap gap-3 mb-6">
        {vistaActual === 'detalle' && (
          <button 
            onClick={volverAlDashboard}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border transition-all ${isDark ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
          >
            <FaArrowLeft /> Volver
          </button>
        )}
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium bg-blue-500 hover:bg-blue-600 transition-all shadow-sm hover:shadow-md"
        >
          <FaPlus /> Nueva Propiedad
        </button>
      </div>

      {/* Tabs Estilo Chrome - Solo visibles cuando no estamos en detalle */}
      {vistaActual !== 'detalle' && (
        <div className="mb-6">
          <div className="flex items-end gap-1">
            <button
              onClick={() => setActiveTab('metricas')}
              className={`px-5 py-2.5 text-sm font-medium transition-all rounded-t-xl border-t border-l border-r ${
                activeTab === 'metricas'
                  ? 'bg-white dark:bg-secondary-dark-bg text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700 shadow-sm -mb-px z-10'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-transparent hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              📊 Métricas
            </button>
            <button
              onClick={() => setActiveTab('propiedades')}
              className={`px-5 py-2.5 text-sm font-medium transition-all rounded-t-xl border-t border-l border-r ${
                activeTab === 'propiedades'
                  ? 'bg-white dark:bg-secondary-dark-bg text-gray-800 dark:text-gray-100 border-gray-200 dark:border-gray-700 shadow-sm -mb-px z-10'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-transparent hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              🏠 Propiedades
            </button>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-700" />
        </div>
      )}

      {/* Tab: Métricas de Propiedades */}
      {vistaActual !== 'detalle' && activeTab === 'metricas' && (
        <>
      {/* KPIs de Propiedades - Clickeables */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
              else if (i === 3) setShowModalFotosSubidas(true);
            }}
            className={`rounded-2xl p-6 border shadow-sm cursor-pointer transition-all ${isDark ? 'bg-secondary-dark-bg border-gray-700/50 hover:border-indigo-500/30' : 'bg-white border-gray-100 hover:shadow-lg'}`}
            style={{ borderLeft: `4px solid ${accentColor}` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center`}>
                <span className="text-lg" style={{ color: accentColor }}>{kpi.icon}</span>
              </div>
            </div>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{kpi.value}</p>
            <p className={`text-sm font-semibold mt-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{kpi.title}</p>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{kpi.desc}</p>
          </div>
          );
        })}
      </div>

      {/* Gráficos ApexCharts - Métricas de Propiedades */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">
        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-1">
            <FaDollarSign className="text-emerald-500" />
            <h3 className="font-semibold dark:text-gray-100 text-sm">Valor Portfolio</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Inventario total</p>
          <Chart options={portfolioOptions} series={portfolioSeries} type="radialBar" height={180} />
          <div className="flex justify-between items-center pt-2 border-t dark:border-gray-700">
            <div className="text-center">
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{propiedades.filter(p => p.operacion === 'Venta').length}</p>
              <p className="text-xs text-gray-500">Venta</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{propiedades.filter(p => p.operacion === 'Alquiler').length}</p>
              <p className="text-xs text-gray-500">Alquiler</p>
            </div>
          </div>
        </div>

        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-1">
            <FaBuilding className="text-blue-500" />
            <h3 className="font-semibold dark:text-gray-100 text-sm">Por Tipo</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Distribución de inventario</p>
          <Chart options={tipoDonutOptions} series={tipoDonutSeries} type="donut" height={200} />
        </div>

        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-1">
            <FaHome className="text-purple-500" />
            <h3 className="font-semibold dark:text-gray-100 text-sm">Por Estado</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Disponibilidad actual</p>
          <Chart options={estadoBarOptions} series={estadoBarSeries} type="bar" height={160} />
        </div>

        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-1">
            <FaChartLine className="text-orange-500" />
            <h3 className="font-semibold dark:text-gray-100 text-sm">Tendencia Visitas</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Últimas 4 semanas</p>
          <Chart options={visitasAreaOptions} series={visitasAreaSeries} type="area" height={180} />
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t dark:border-gray-700">
            <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded text-center">
              <p className="text-sm font-bold text-purple-600 dark:text-purple-400">2.3K</p>
              <p className="text-xs text-gray-500">Total Mes</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded text-center">
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">+24%</p>
              <p className="text-xs text-gray-500">vs Ant.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos de Estados y Tipos */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Gráfico de Estados */}
        <div className={cardBase}>
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">📊 Estados de Propiedades</h3>
          <AccumulationChartComponent
            id="estados-chart"
            tooltip={{ enable: true }}
            legendSettings={{ visible: true }}
            height="300px"
          >
            <Inject services={[PieSeries, AccumulationLegend, AccumulationDataLabel, AccumulationTooltip]} />
            <AccumulationSeriesCollectionDirective>
              <AccumulationSeriesDirective
                type="Pie"
                dataSource={estadosData}
                xName="estado"
                yName="cantidad"
                name="Propiedades"
                innerRadius="40%"
                dataLabel={{ visible: true, name: 'estado', position: 'Outside' }}
              />
            </AccumulationSeriesCollectionDirective>
          </AccumulationChartComponent>
        </div>

        {/* Gráfico de Tipos */}
        <div className={cardBase}>
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">🏗️ Tipos de Propiedades</h3>
          <ChartComponent
            id="tipos-chart"
            primaryXAxis={{ valueType: 'Category', title: 'Tipos' }}
            primaryYAxis={{ title: 'Cantidad' }}
            tooltip={{ enable: true }}
            legendSettings={{ visible: false }}
            height="300px"
          >
            <Inject services={[ColumnSeries, Category, Tooltip]} />
            <SeriesCollectionDirective>
              <SeriesDirective
                type="Column"
                dataSource={tiposData}
                xName="tipo"
                yName="cantidad"
                name="Cantidad"
                fill={currentColor || '#3B82F6'}
              />
            </SeriesCollectionDirective>
          </ChartComponent>
        </div>
      </div>

      {/* Grid de Propiedades y Galería */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Grid Principal */}
        <div className={`xl:col-span-2 ${cardBase}`}>
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">🏠 Listado de Propiedades</h3>
          <GridComponent
            dataSource={propiedades}
            allowPaging
            pageSettings={{ pageSize: 10 }}
            allowSorting
            allowFiltering
          >
            <GridInject services={[Page, Sort, Filter]} />
            <ColumnsDirective>
              <ColumnDirective field="titulo" headerText="Propiedad" width="200" />
              <ColumnDirective field="tipo" headerText="Tipo" width="120" />
              <ColumnDirective field="estado" headerText="Estado" width="120" />
              <ColumnDirective field="precio" headerText="Precio" textAlign="Right" width="120" format="C0" />
              <ColumnDirective field="m2" headerText="M²" textAlign="Center" width="80" />
              <ColumnDirective field="agente" headerText="Agente" width="150" />
              <ColumnDirective field="visitas" headerText="Visitas" textAlign="Center" width="100" />
            </ColumnsDirective>
          </GridComponent>
        </div>

        {/* Panel de Galería */}
        <div className={cardBase}>
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">📸 Galería y Multimedia</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-square border-2 border-dashed dark:border-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer text-xs">
                  <FaCamera className="text-gray-400" />
                </div>
              ))}
            </div>
            <div className="text-center">
              <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm">
                <FaUpload className="inline mr-2" />Subir Fotos
              </button>
            </div>
            <div>
              <h4 className="font-bold mb-2 dark:text-gray-200 text-sm">Videos Integrados</h4>
              <input 
                type="text" 
                placeholder="URL de YouTube/Vimeo..." 
                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tipología y Características */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Tipología */}
        <div className={cardBase}>
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">🏗️ Tipología Completa</h3>
          <div className="grid grid-cols-3 gap-4">
            {['Casa', 'Departamento', 'Lote', 'Local', 'Oficina', 'Cochera'].map((tipo) => (
              <div key={tipo} className="p-4 border dark:border-gray-700 rounded-lg text-center hover:bg-blue-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
                <FaBuilding className="text-2xl mx-auto mb-2 text-blue-500" />
                <p className="font-medium dark:text-gray-200 text-sm">{tipo}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Características y Ubicación */}
        <div className={cardBase}>
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">📍 Ubicación y Características</h3>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <FaMapMarkerAlt className="text-2xl text-gray-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Mapa Interactivo</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input type="number" placeholder="M²" className="px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm" />
              <input type="number" placeholder="Ambientes" className="px-3 py-2 border dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-200 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-1">
              {['Piscina', 'Gym', 'Seguridad', 'Parrilla'].map((amenity) => (
                <label key={amenity} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="w-3 h-3" />
                  <span className="dark:text-gray-200">{amenity}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
        </>
      )}

      {/* Tab: Propiedades con filtros */}
      {vistaActual !== 'detalle' && activeTab === 'propiedades' && (
        <>
          {/* Barra de Búsqueda Compacta */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            {/* Campo de búsqueda */}
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
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <FaTimes className="text-sm" />
                </button>
              )}
              
              {/* Sugerencias de búsqueda */}
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
                          prop.operacion === 'Venta' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {prop.operacion}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Botón de filtros y ordenamiento */}
            <button
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
              
            {/* Limpiar filtros */}
            {filtrosActivos > 0 && (
              <button
                onClick={limpiarFiltros}
                className="flex items-center gap-1 px-2 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <FaTimes className="text-xs" /> Limpiar
              </button>
            )}
            
            {/* Contador de resultados */}
            <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
              {propiedadesFiltradas.length} de {propiedades.length}
            </span>
          </div>

          {/* Panel de filtros avanzados - Colapsable */}
          {showFilters && (
            <div className={`${cardBase} mb-4`}>
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <h4 className="font-semibold dark:text-gray-100 flex items-center gap-2">
                  <FaFilter className="text-blue-500" /> Filtros y Ordenamiento
                </h4>
                
                {/* Selector de ordenamiento */}
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
                
                {/* Filtros rápidos de operación */}
                <div className="flex items-center gap-3 ml-auto">
                  {['todas', 'venta', 'alquiler'].map(op => (
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
                  {/* Tipo de propiedad */}
                  <div>
                    <label className="block text-xs font-medium mb-1 dark:text-gray-300">Tipo</label>
                    <select
                      value={filtros.tipo}
                      onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100 text-sm"
                    >
                      <option value="">Todos los tipos</option>
                      {tiposUnicos.map(tipo => (
                        <option key={tipo} value={tipo}>{tipo}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Estado */}
                  <div>
                    <label className="block text-xs font-medium mb-1 dark:text-gray-300">Estado</label>
                    <select
                      value={filtros.estado}
                      onChange={(e) => setFiltros(prev => ({ ...prev, estado: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100 text-sm"
                    >
                      <option value="">Todos</option>
                      <option value="Disponible">Disponible</option>
                      <option value="Reservada">Reservada</option>
                      <option value="Vendida">Vendida</option>
                      <option value="Alquilada">Alquilada</option>
                    </select>
                  </div>
                  
                  {/* Barrio */}
                  <div>
                    <label className="block text-xs font-medium mb-1 dark:text-gray-300">Barrio</label>
                    <select
                      value={filtros.barrio}
                      onChange={(e) => setFiltros(prev => ({ ...prev, barrio: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100 text-sm"
                    >
                      <option value="">Todos los barrios</option>
                      {barriosUnicos.map(barrio => (
                        <option key={barrio} value={barrio}>{barrio}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Moneda */}
                  <div>
                    <label className="block text-xs font-medium mb-1 dark:text-gray-300">Moneda</label>
                    <select
                      value={filtros.moneda}
                      onChange={(e) => setFiltros(prev => ({ ...prev, moneda: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100 text-sm"
                    >
                      <option value="">Todas</option>
                      <option value="USD">USD</option>
                      <option value="ARS">ARS</option>
                    </select>
                  </div>
                  
                  {/* Rango de precio */}
                  <div>
                    <label className="block text-xs font-medium mb-1 dark:text-gray-300">Precio mínimo</label>
                    <input
                      type="number"
                      value={filtros.precioMin}
                      onChange={(e) => setFiltros(prev => ({ ...prev, precioMin: e.target.value }))}
                      placeholder="Ej: 50000"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1 dark:text-gray-300">Precio máximo</label>
                    <input
                      type="number"
                      value={filtros.precioMax}
                      onChange={(e) => setFiltros(prev => ({ ...prev, precioMax: e.target.value }))}
                      placeholder="Ej: 500000"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100 text-sm"
                    />
                  </div>
                  
                  {/* Dormitorios */}
                  <div>
                    <label className="block text-xs font-medium mb-1 dark:text-gray-300">Dormitorios mín.</label>
                    <input
                      type="number"
                      value={filtros.dormitoriosMin}
                      onChange={(e) => setFiltros(prev => ({ ...prev, dormitoriosMin: e.target.value }))}
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
                      onChange={(e) => setFiltros(prev => ({ ...prev, dormitoriosMax: e.target.value }))}
                      placeholder="Ej: 5"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100 text-sm"
                    />
                  </div>
                  
                  {/* M2 */}
                  <div>
                    <label className="block text-xs font-medium mb-1 dark:text-gray-300">M² mínimo</label>
                    <input
                      type="number"
                      value={filtros.m2Min}
                      onChange={(e) => setFiltros(prev => ({ ...prev, m2Min: e.target.value }))}
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
                      onChange={(e) => setFiltros(prev => ({ ...prev, m2Max: e.target.value }))}
                      placeholder="Ej: 300"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100 text-sm"
                    />
                  </div>
                </div>
            </div>
          )}

          {/* Lista de propiedades filtradas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {propiedadesFiltradas.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <FaHome className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No hay propiedades que coincidan con el filtro seleccionado</p>
              </div>
            ) : (
              propiedadesFiltradas.map((propiedad) => (
            <div key={propiedad.id} className={`${cardBase} hover:shadow-xl cursor-pointer`} onClick={() => verDetalle(propiedad)}>
              {/* Imagen placeholder */}
              <div className="h-48 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
                <FaHome className="text-6xl text-white opacity-30" />
                <div className="absolute top-3 right-3 flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    propiedad.estado === 'Disponible' ? 'bg-green-500 text-white' :
                    propiedad.estado === 'Reservada' ? 'bg-yellow-500 text-white' :
                    propiedad.estado === 'Vendida' ? 'bg-gray-500 text-white' :
                    'bg-blue-500 text-white'
                  }`}>
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
              ))
            )}
          </div>
        </>
      )}

      {/* Vista Detalle de Propiedad */}
      {vistaActual === 'detalle' && propiedadSeleccionada && (
        <div className="space-y-6">
          {/* Header con imagen */}
          <div className="relative h-96 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl overflow-hidden">
            <FaHome className="absolute inset-0 m-auto text-9xl text-white opacity-20" />
            <div className="absolute top-6 right-6 flex gap-3">
              <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                propiedadSeleccionada.estado === 'Disponible' ? 'bg-green-500 text-white' :
                propiedadSeleccionada.estado === 'Reservada' ? 'bg-yellow-500 text-white' :
                propiedadSeleccionada.estado === 'Vendida' ? 'bg-gray-500 text-white' :
                'bg-blue-500 text-white'
              }`}>
                {propiedadSeleccionada.estado}
              </span>
              <button onClick={() => handleEditPropiedad(propiedadSeleccionada)} className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors flex items-center gap-2">
                <FaEdit /> Editar
              </button>
              <button onClick={() => eliminarPropiedad(propiedadSeleccionada)} className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center gap-2" disabled={loading}>
                <FaTrash /> Eliminar
              </button>
            </div>
            <div className="absolute bottom-6 left-6 text-white">
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

              <div className={cardBase}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold dark:text-gray-100">📎 Archivos</h3>
                  {adjuntosLoading && <span className="text-sm text-gray-500 dark:text-gray-400">Cargando...</span>}
                </div>

                {adjuntosError && (
                  <div className="mb-3 p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
                    {adjuntosError}
                  </div>
                )}

                {!adjuntosLoading && (!adjuntos || adjuntos.length === 0) && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">Sin archivos vinculados.</div>
                )}

                {Array.isArray(adjuntos) && adjuntos.length > 0 && (
                  <div className="space-y-3">
                    {adjuntos.map((l) => {
                      const d = l && l.document ? l.document : null;
                      const docId = d && d._id ? d._id : null;
                      return (
                        <div key={l._id} className="flex items-center justify-between gap-3 p-3 border dark:border-gray-700 rounded-lg">
                          <div className="min-w-0">
                            <div className="font-semibold dark:text-gray-100 truncate">{d ? d.nombre : 'Documento'}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">{d ? `${d.tipo || ''}${d.categoria ? ` • ${d.categoria}` : ''}` : ''}</div>
                          </div>
                          <div className="flex gap-2">
                            <button type="button" onClick={() => downloadOrOpenDoc(d, 'view')} className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800">
                              Ver
                            </button>
                            <button type="button" onClick={() => downloadOrOpenDoc(d, 'download')} className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800">
                              Descargar
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!docId) return;
                                const ok = await confirmToast('¿Desvincular este archivo?');
                                if (!ok) return;
                                try {
                                  await crmService.links.unlink({ documentId: docId, entityType: 'propiedad', entityId: propiedadSeleccionada.id });
                                  setAdjuntos((prev) => (Array.isArray(prev) ? prev.filter((x) => String(x._id) !== String(l._id)) : prev));
                                } catch (e) {
                                  setAdjuntosError(e?.message || 'Error al desvincular archivo');
                                }
                              }}
                              className="px-3 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600"
                            >
                              Quitar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Columna Lateral */}
            <div className="space-y-6">
              {/* Información de Ubicación */}
              <div className={cardBase}>
                <h3 className="text-lg font-bold mb-4 dark:text-gray-100 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-red-500" /> Ubicación
                </h3>
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
            </div>
          </div>
        </div>
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
                <p className="text-blue-100 text-sm mt-1">Complete los datos de la propiedad</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
              >
                <FaTimes className="text-2xl" />
              </button>
            </div>

            {/* Formulario con scroll */}
            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                      type="text"
                      name="direccion"
                      value={nuevaPropiedad.direccion}
                      onChange={handleInputChange}
                      required
                      placeholder="Av. Santa Fe 1234"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    />
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Fotos
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => setFilesFotos(Array.from(e.target.files || []))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100"
                    />
                    {filesFotos.length ? (
                      <div className="mt-2 text-sm dark:text-gray-200">
                        {filesFotos.length} archivo(s) seleccionado(s)
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Planos
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf"
                      onChange={(e) => setFilesPlanos(Array.from(e.target.files || []))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100"
                    />
                    {filesPlanos.length ? (
                      <div className="mt-2 text-sm dark:text-gray-200">
                        {filesPlanos.length} archivo(s) seleccionado(s)
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Documentos
                    </label>
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.zip"
                      onChange={(e) => setFilesDocumentos(Array.from(e.target.files || []))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-gray-100"
                    />
                    {filesDocumentos.length ? (
                      <div className="mt-2 text-sm dark:text-gray-200">
                        {filesDocumentos.length} archivo(s) seleccionado(s)
                      </div>
                    ) : null}
                  </div>
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

              {/* Agente y Comisión */}
              <div>
                <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 flex items-center gap-2">
                  <FaUser className="text-purple-500" /> Asignación
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Agente Responsable *
                    </label>
                    <select
                      name="agente"
                      value={nuevaPropiedad.agente}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    >
                      <option value="">Seleccionar agente</option>
                      {agentes.map((a) => (
                        <option key={a._id} value={a._id}>{a.nombre}</option>
                      ))}
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

              {/* Botones de Acción */}
              <div className="flex gap-3 justify-end pt-4 border-t dark:border-gray-700">
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
              </div>              </form>
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
                  Total: ${propiedades.reduce((sum, p) => sum + p.precio, 0).toLocaleString()} USD
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
                      ${propiedades.reduce((sum, p) => sum + p.precio, 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Comisión Potencial</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${propiedades.reduce((sum, p) => sum + (p.precio * p.comision / 100), 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Precio Promedio</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${Math.round(propiedades.reduce((sum, p) => sum + p.precio, 0) / propiedades.length).toLocaleString()}
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
                  {propiedades.reduce((sum, p) => sum + p.visitas, 0).toLocaleString()} visitas totales
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
                            style={{ width: `${(prop.visitas / Math.max(...propiedades.map(p => p.visitas))) * 100}%` }}
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
                      {propiedades.reduce((sum, p) => sum + p.visitas, 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Promedio por Propiedad</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {Math.round(propiedades.reduce((sum, p) => sum + p.visitas, 0) / propiedades.length).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Más Visitada</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {Math.max(...propiedades.map(p => p.visitas)).toLocaleString()}
                    </p>
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
                  {propiedades.reduce((sum, p) => sum + p.fotos, 0)} fotos en total
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
                            {Math.round(prop.visitas / prop.fotos)}
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
                      {propiedades.reduce((sum, p) => sum + p.fotos, 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Promedio por Propiedad</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {Math.round(propiedades.reduce((sum, p) => sum + p.fotos, 0) / propiedades.length)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Más Fotos</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {Math.max(...propiedades.map(p => p.fotos))}
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
