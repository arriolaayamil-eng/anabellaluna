import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { confirmToast } from '../utils/confirmToast';
import { FaPlus, FaSearch, FaTags, FaEnvelope, FaWhatsapp, FaPhone, FaBell, FaUsers, FaChartLine, FaFire, FaTimes, FaSave, FaUser, FaMapMarkerAlt, FaDollarSign, FaStar, FaCalendar, FaBuilding, FaHome, FaArrowLeft, FaEdit, FaTrash, FaHistory, FaComments, FaBriefcase, FaPercentage, FaFunnelDollar, FaArrowUp, FaHeart, FaEye, FaUserClock, FaHandshake, FaThermometerHalf, FaGlobe, FaDesktop, FaMobileAlt, FaLink, FaMousePointer } from 'react-icons/fa';
import Chart from 'react-apexcharts';
import { Header } from '../components';
import { useStateContext } from '../contexts/ContextProvider';
import { crmService } from '../services/crmService';

// Syncfusion Components
import { ChartComponent, SeriesCollectionDirective, SeriesDirective, Inject, LineSeries, Category, Tooltip, Legend, ColumnSeries, AccumulationChartComponent, AccumulationSeriesCollectionDirective, AccumulationSeriesDirective, AccumulationLegend, AccumulationDataLabel, AccumulationTooltip, PieSeries } from '@syncfusion/ej2-react-charts';
import { GridComponent, ColumnsDirective, ColumnDirective, Page, Sort, Filter, Inject as GridInject } from '@syncfusion/ej2-react-grids';

const ClientesCRM = () => {
  const { currentMode, currentColor } = useStateContext();

  const formatUltimaInteraccion = (value) => {
    if (!value) return { short: '-/-', full: '-' };
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      const parts = String(value).split('-');
      if (parts.length === 3) return { short: `${parts[2]}/${parts[1]}`, full: value };
      return { short: '-/-', full: String(value) };
    }
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return { short: `${dd}/${mm}`, full: `${dd}/${mm}/${yyyy}` };
  };
  
  // Estado para tabs internas
  const [activeTab, setActiveTab] = useState('metricas'); // 'metricas', 'clientes'
  
  // Estado para filtro de tipo de cliente
  const [filtroTipo, setFiltroTipo] = useState('todos'); // 'comprador', 'propietario', 'inversor', 'todos'
  
  // Estado para el modal
  const [showModal, setShowModal] = useState(false);
  
  // Estados para modales de estadísticas
  const [showModalTotalClientes, setShowModalTotalClientes] = useState(false);
  const [showModalLeadsCalientes, setShowModalLeadsCalientes] = useState(false);
  const [showModalEnNegociacion, setShowModalEnNegociacion] = useState(false);
  const [showModalConversion, setShowModalConversion] = useState(false);
  
  // Estados para las vistas
  const [vistaActual, setVistaActual] = useState('dashboard'); // 'dashboard', 'detalle'
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  
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
    baños: '',
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
    genero: '',
    estadoParental: '',
    profesion: '',
    tieneHijos: '',
    fechaNacimiento: '',
    preferenciaComunicacion: 'whatsapp',
  });

  // Estado para el formulario de nuevo cliente
  const [nuevoCliente, setNuevoCliente] = useState(createEmptyClienteForm);
  const [editingClienteId, setEditingClienteId] = useState(null);

  const [clientesEjemplo, setClientesEjemplo] = useState([]);
  const [clientesLoading, setClientesLoading] = useState(false);
  const [clientesError, setClientesError] = useState('');
  const [dashStats, setDashStats] = useState(null);

  const normalizeCliente = useCallback((item) => {
    const md = (item && item.metadata) ? item.metadata : {};
    const id = item?._id || item?.id;
    const tipoCliente = md.tipoCliente || md.tipo || 'Comprador';
    const zonaInteres = md.zonaInteres || md.zona || '';
    const presupuestoRaw = (md.presupuesto === 0 || md.presupuesto) ? md.presupuesto : '';
    const scoringRaw = (md.scoring === 0 || md.scoring) ? md.scoring : 50;
    const bañosVal = (md['baños'] === 0 || md['baños']) ? md['baños'] : (md.baños === 0 || md.baños) ? md.baños : '';

    return {
      id,
      _id: id,
      nombre: item?.nombre || '',
      apellido: md.apellido || '',
      tipo: tipoCliente,
      tipoCliente,
      email: item?.email || '',
      telefono: item?.telefono || '',
      telefonoAlternativo: md.telefonoAlternativo || '',
      estado: md.estado || 'Lead',
      presupuesto: typeof presupuestoRaw === 'number' ? presupuestoRaw : Number(presupuestoRaw || 0),
      moneda: md.moneda || 'USD',
      zona: zonaInteres,
      zonaInteres,
      scoring: typeof scoringRaw === 'number' ? scoringRaw : Number(scoringRaw || 50),
      ultimaInteraccion: md.ultimaActividad || md.ultimaInteraccion || '',
      fechaRegistro: md.fechaRegistro || '',
      origen: md.origen || 'Web',
      agente: md.agente || '',
      ocupacion: md.ocupacion || '',
      empresa: md.empresa || '',
      direccion: item?.direccion || md.direccion || '',
      ciudad: md.ciudad || 'Buenos Aires',
      provincia: md.provincia || 'Buenos Aires',
      tipoPropiedad: md.tipoPropiedad || 'Departamento',
      ambientes: md.ambientes || '',
      dormitorios: md.dormitorios || '',
      baños: bañosVal,
      caracteristicas: Array.isArray(md.caracteristicas) ? md.caracteristicas : [],
      notas: item?.notas || md.notas || '',
      interacciones: typeof md.interacciones === 'number' ? md.interacciones : Number(md.interacciones || 0),
      propiedadesVistas: typeof md.propiedadesVistas === 'number' ? md.propiedadesVistas : Number(md.propiedadesVistas || 0),
      agenteId: item?.agenteId || '',
      genero: md.genero || '',
      estadoParental: md.estadoParental || '',
      profesion: md.profesion || '',
      tieneHijos: md.tieneHijos || '',
      fechaNacimiento: md.fechaNacimiento || '',
      preferenciaComunicacion: md.preferenciaComunicacion || 'whatsapp',
      metadata: md,
    };
  }, []);

  const formFromCliente = (cliente) => {
    const base = createEmptyClienteForm();
    const fullName = String(cliente?.nombre || '').trim();
    const tokens = fullName.split(' ').filter(Boolean);
    const nombre = tokens[0] || '';
    const apellido = cliente?.apellido || tokens.slice(1).join(' ');

    return {
      ...base,
      nombre,
      apellido,
      email: cliente?.email || '',
      telefono: cliente?.telefono || '',
      telefonoAlternativo: cliente?.telefonoAlternativo || '',
      tipoCliente: cliente?.tipoCliente || cliente?.tipo || base.tipoCliente,
      estado: cliente?.estado || base.estado,
      presupuesto: cliente?.presupuesto || '',
      moneda: cliente?.moneda || base.moneda,
      zonaInteres: cliente?.zonaInteres || cliente?.zona || '',
      tipoPropiedad: cliente?.tipoPropiedad || base.tipoPropiedad,
      ambientes: cliente?.ambientes || '',
      dormitorios: cliente?.dormitorios || '',
      baños: cliente?.baños || '',
      caracteristicas: Array.isArray(cliente?.caracteristicas) ? cliente.caracteristicas : [],
      origen: cliente?.origen || base.origen,
      agente: cliente?.agente || '',
      scoring: typeof cliente?.scoring === 'number' ? cliente.scoring : Number(cliente?.scoring || base.scoring),
      notas: cliente?.notas || '',
      direccion: cliente?.direccion || '',
      ciudad: cliente?.ciudad || base.ciudad,
      provincia: cliente?.provincia || base.provincia,
      ocupacion: cliente?.ocupacion || '',
      empresa: cliente?.empresa || '',
      genero: cliente?.genero || '',
      estadoParental: cliente?.estadoParental || '',
      profesion: cliente?.profesion || '',
      tieneHijos: cliente?.tieneHijos || '',
      fechaNacimiento: cliente?.fechaNacimiento || '',
      preferenciaComunicacion: cliente?.preferenciaComunicacion || base.preferenciaComunicacion,
    };
  };

  const buildClientePayload = (form) => {
    const fullName = [form?.nombre, form?.apellido].filter(Boolean).join(' ').trim();

    return {
      nombre: fullName || String(form?.nombre || '').trim(),
      email: form?.email || '',
      telefono: form?.telefono || '',
      direccion: form?.direccion || '',
      notas: form?.notas || '',
      metadata: {
        apellido: form?.apellido || '',
        telefonoAlternativo: form?.telefonoAlternativo || '',
        tipoCliente: form?.tipoCliente || 'Comprador',
        estado: form?.estado || 'Lead',
        presupuesto: form?.presupuesto === '' ? 0 : Number(form?.presupuesto || 0),
        moneda: form?.moneda || 'USD',
        zonaInteres: form?.zonaInteres || '',
        tipoPropiedad: form?.tipoPropiedad || 'Departamento',
        ambientes: form?.ambientes || '',
        dormitorios: form?.dormitorios || '',
        'baños': form?.baños || '',
        caracteristicas: Array.isArray(form?.caracteristicas) ? form.caracteristicas : [],
        origen: form?.origen || 'Web',
        agente: form?.agente || '',
        scoring: Number(form?.scoring || 50),
        ciudad: form?.ciudad || 'Buenos Aires',
        provincia: form?.provincia || 'Buenos Aires',
        ocupacion: form?.ocupacion || '',
        empresa: form?.empresa || '',
        genero: form?.genero || '',
        estadoParental: form?.estadoParental || '',
        profesion: form?.profesion || '',
        tieneHijos: form?.tieneHijos || '',
        fechaNacimiento: form?.fechaNacimiento || '',
        preferenciaComunicacion: form?.preferenciaComunicacion || 'whatsapp',
      },
    };
  };

  const reloadClientes = useCallback(async () => {
    setClientesLoading(true);
    setClientesError('');
    try {
      const items = await crmService.clientes.getAll();
      const normalized = Array.isArray(items) ? items.map(normalizeCliente) : [];
      setClientesEjemplo(normalized);
    } catch (err) {
      setClientesError(err?.message || 'Error al cargar clientes');
      setClientesEjemplo([]);
    } finally {
      setClientesLoading(false);
    }
  }, [normalizeCliente]);

  useEffect(() => {
    reloadClientes();
    crmService.stats.getDashboard().then(setDashStats).catch(() => {});
  }, [reloadClientes]);

  const openCreateModal = () => {
    setEditingClienteId(null);
    setNuevoCliente(createEmptyClienteForm());
    setShowModal(true);
  };

  const handleEditCliente = (cliente) => {
    const id = cliente?._id || cliente?.id;
    setEditingClienteId(id || null);
    setNuevoCliente(formFromCliente(cliente));
    setShowModal(true);
  };

  const handleDeleteCliente = async (cliente) => {
    const id = cliente?._id || cliente?.id;
    if (!id) return;
    if (!(await confirmToast('¿Eliminar este cliente?'))) return;

    setClientesError('');
    try {
      await crmService.clientes.delete(id);
      setClientesEjemplo(prev => prev.filter(c => String(c.id) !== String(id)));
      if (clienteSeleccionado && String(clienteSeleccionado.id) === String(id)) {
        setClienteSeleccionado(null);
        setVistaActual('dashboard');
      }
    } catch (err) {
      setClientesError(err?.message || 'Error al eliminar cliente');
    }
  };

  // KPIs de Clientes
  const kpisClientes = [
    { title: 'Total Clientes', value: clientesEjemplo.length, desc: `${dashStats?.clientesNuevosMes ?? 0} nuevos este mes`, icon: <FaUsers />, color: 'from-blue-500 to-blue-600' },
    { title: 'Leads Calientes', value: clientesEjemplo.filter(c => c.scoring >= 80).length, desc: 'Scoring > 80', icon: <FaFire />, color: 'from-red-500 to-red-600' },
    { title: 'En Negociación', value: clientesEjemplo.filter(c => c.estado === 'Negociación').length, desc: 'Próximos a cerrar', icon: <FaChartLine />, color: 'from-green-500 to-green-600' },
    { title: 'Conversión', value: `${clientesEjemplo.length > 0 ? Math.round((clientesEjemplo.filter(c => c.estado === 'Cerrado').length / clientesEjemplo.length) * 100) : 0}%`, desc: 'Lead → Cliente', icon: <FaTags />, color: 'from-purple-500 to-purple-600' },
  ];

  // Datos para gráficos
  const cicloVidaData = [
    { etapa: 'Lead', cantidad: clientesEjemplo.filter(c => c.estado === 'Lead').length, fill: '#F59E0B' },
    { etapa: 'Contacto', cantidad: clientesEjemplo.filter(c => c.estado === 'Contacto').length, fill: '#3B82F6' },
    { etapa: 'Prospecto', cantidad: clientesEjemplo.filter(c => c.estado === 'Prospecto').length, fill: '#8B5CF6' },
    { etapa: 'Negociación', cantidad: clientesEjemplo.filter(c => c.estado === 'Negociación').length, fill: '#F97316' },
    { etapa: 'Cerrado', cantidad: clientesEjemplo.filter(c => c.estado === 'Cerrado').length, fill: '#10B981' },
  ];

  const segmentacionData = [
    { tipo: 'Comprador', cantidad: clientesEjemplo.filter(c => c.tipo === 'Comprador').length },
    { tipo: 'Propietario', cantidad: clientesEjemplo.filter(c => c.tipo === 'Propietario').length },
    { tipo: 'Inversor', cantidad: clientesEjemplo.filter(c => c.tipo === 'Inversor').length },
  ];

  // ApexCharts - Ciclo de Vida del Lead (Pie Chart)
  const cicloVidaPieOptions = {
    chart: { type: 'pie', height: 280, background: 'transparent' },
    labels: ['Lead', 'Contacto', 'Prospecto', 'Negociación', 'Cerrado'],
    colors: ['#F59E0B', '#3B82F6', '#8B5CF6', '#F97316', '#10B981'],
    plotOptions: { pie: { expandOnClick: true, donut: { size: '0%' } } },
    dataLabels: { enabled: true, style: { fontSize: '11px', fontWeight: 600, colors: ['#fff'] }, dropShadow: { enabled: false } },
    legend: { show: true, position: 'bottom', fontSize: '11px', labels: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' }, markers: { width: 10, height: 10, radius: 2 } },
    stroke: { show: true, width: 2, colors: [currentMode === 'Dark' ? '#1F2937' : '#fff'] },
    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light', y: { formatter: (val) => `${val} clientes` } },
    responsive: [{ breakpoint: 480, options: { chart: { height: 260 }, legend: { position: 'bottom' } } }],
  };
  const cicloVidaPieSeries = cicloVidaData.map(c => c.cantidad || 1);

  // ApexCharts - Scoring de Leads (Gauge semicircular)
  const scoringAvg = clientesEjemplo.length > 0 ? Math.round(clientesEjemplo.reduce((sum, c) => sum + c.scoring, 0) / clientesEjemplo.length) : 0;
  const scoringGaugeOptions = {
    chart: { type: 'radialBar', height: 200, background: 'transparent', sparkline: { enabled: false } },
    plotOptions: {
      radialBar: {
        startAngle: -135, endAngle: 135,
        hollow: { size: '60%', background: 'transparent' },
        track: { background: currentMode === 'Dark' ? '#374151' : '#E5E7EB', strokeWidth: '100%' },
        dataLabels: {
          name: { show: true, fontSize: '11px', fontWeight: 600, color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', offsetY: -8 },
          value: { show: true, fontSize: '24px', fontWeight: 700, color: currentMode === 'Dark' ? '#F3F4F6' : '#1F2937', offsetY: 4, formatter: () => `${scoringAvg}` },
        },
      },
    },
    fill: { type: 'gradient', gradient: { shade: 'dark', type: 'horizontal', colorStops: [{ offset: 0, color: scoringAvg >= 70 ? '#10B981' : scoringAvg >= 40 ? '#F59E0B' : '#EF4444', opacity: 1 }, { offset: 100, color: scoringAvg >= 70 ? '#059669' : scoringAvg >= 40 ? '#D97706' : '#DC2626', opacity: 1 }] } },
    stroke: { lineCap: 'round' },
    labels: ['Scoring Promedio'],
  };
  const scoringGaugeSeries = [scoringAvg];

  // ApexCharts - Funnel de Conversión (Bar horizontal)
  const funnelOptions = {
    chart: { type: 'bar', height: 180, background: 'transparent', toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 4, horizontal: true, distributed: true, barHeight: '70%' } },
    colors: ['#F59E0B', '#3B82F6', '#8B5CF6', '#F97316', '#10B981'],
    dataLabels: { enabled: true, textAnchor: 'start', style: { colors: ['#fff'], fontSize: '10px', fontWeight: 600 }, formatter: (val) => val, offsetX: 5 },
    xaxis: { categories: ['Lead', 'Contactado', 'Prospecto', 'Negociación', 'Cerrado'], labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '10px' } } },
    grid: { show: false },
    legend: { show: false },
    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light' },
  };
  const funnelSeries = [{ name: 'Clientes', data: cicloVidaData.map(c => c.cantidad) }];

  // ApexCharts - Intereses de Propiedad (Donut)
  const interesesDonutOptions = {
    chart: { type: 'donut', height: 220, background: 'transparent' },
    labels: ['Departamento', 'Casa', 'PH', 'Local', 'Oficina', 'Terreno'],
    colors: ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#6B7280'],
    plotOptions: { pie: { donut: { size: '65%', labels: { show: true, name: { fontSize: '11px', color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' }, value: { fontSize: '18px', fontWeight: 700, color: currentMode === 'Dark' ? '#F3F4F6' : '#1F2937' }, total: { show: true, label: 'Intereses', fontSize: '10px', color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', formatter: () => clientesEjemplo.length } } } } },
    dataLabels: { enabled: false },
    legend: { show: true, position: 'bottom', fontSize: '10px', labels: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' } },
    stroke: { show: false },
    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light' },
  };
  const interesesDonutSeries = [
    clientesEjemplo.filter(c => c.tipoPropiedad === 'Departamento').length || 1,
    clientesEjemplo.filter(c => c.tipoPropiedad === 'Casa').length || 1,
    clientesEjemplo.filter(c => c.tipoPropiedad === 'PH').length || 1,
    clientesEjemplo.filter(c => c.tipoPropiedad === 'Local').length || 1,
    clientesEjemplo.filter(c => c.tipoPropiedad === 'Oficina').length || 1,
    clientesEjemplo.filter(c => c.tipoPropiedad === 'Terreno').length || 1,
  ];

  // ApexCharts - Segmentación por Tipo (Donut)
  const segmentacionDonutOptions = {
    chart: { type: 'donut', height: 200, background: 'transparent' },
    labels: ['Compradores', 'Propietarios', 'Inversores'],
    colors: ['#3B82F6', '#10B981', '#8B5CF6'],
    plotOptions: { pie: { donut: { size: '60%', labels: { show: true, name: { fontSize: '10px', color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' }, value: { fontSize: '16px', fontWeight: 700, color: currentMode === 'Dark' ? '#F3F4F6' : '#1F2937' }, total: { show: true, label: 'Total', fontSize: '9px', color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', formatter: () => clientesEjemplo.length } } } } },
    dataLabels: { enabled: false },
    legend: { show: false },
    stroke: { show: false },
    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light' },
  };
  const segmentacionDonutSeries = segmentacionData.map(s => s.cantidad || 1);

  // ApexCharts - Origen de Leads (Bar)
  const origenesData = [
    { origen: 'Web', cantidad: clientesEjemplo.filter(c => c.origen === 'Web').length },
    { origen: 'Referido', cantidad: clientesEjemplo.filter(c => c.origen === 'Referido').length },
    { origen: 'Redes', cantidad: clientesEjemplo.filter(c => c.origen === 'Redes Sociales' || c.origen === 'Redes').length },
    { origen: 'Portal', cantidad: clientesEjemplo.filter(c => c.origen === 'Portal').length },
    { origen: 'Directo', cantidad: clientesEjemplo.filter(c => c.origen === 'Directo' || c.origen === 'Teléfono').length },
  ];
  const origenBarOptions = {
    chart: { type: 'bar', height: 180, background: 'transparent', toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 6, columnWidth: '55%', distributed: true } },
    colors: ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'],
    dataLabels: { enabled: false },
    xaxis: { categories: origenesData.map(o => o.origen), labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '10px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '10px' } } },
    grid: { borderColor: currentMode === 'Dark' ? '#374151' : '#E5E7EB', strokeDashArray: 4 },
    legend: { show: false },
    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light' },
  };
  const origenBarSeries = [{ name: 'Leads', data: origenesData.map(o => o.cantidad) }];

  // ApexCharts - Presupuesto por Rango (Bar horizontal)
  const presupuestoRangos = [
    { rango: '< $50K', cantidad: clientesEjemplo.filter(c => c.presupuesto < 50000).length },
    { rango: '$50K-100K', cantidad: clientesEjemplo.filter(c => c.presupuesto >= 50000 && c.presupuesto < 100000).length },
    { rango: '$100K-200K', cantidad: clientesEjemplo.filter(c => c.presupuesto >= 100000 && c.presupuesto < 200000).length },
    { rango: '$200K-500K', cantidad: clientesEjemplo.filter(c => c.presupuesto >= 200000 && c.presupuesto < 500000).length },
    { rango: '> $500K', cantidad: clientesEjemplo.filter(c => c.presupuesto >= 500000).length },
  ];
  const presupuestoBarOptions = {
    chart: { type: 'bar', height: 160, background: 'transparent', toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 4, horizontal: true, distributed: true, barHeight: '65%' } },
    colors: ['#6B7280', '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B'],
    dataLabels: { enabled: true, textAnchor: 'start', style: { colors: ['#fff'], fontSize: '10px', fontWeight: 600 }, formatter: (val) => val, offsetX: 5 },
    xaxis: { categories: presupuestoRangos.map(p => p.rango), labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '9px' } } },
    grid: { show: false },
    legend: { show: false },
    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light' },
  };
  const presupuestoBarSeries = [{ name: 'Clientes', data: presupuestoRangos.map(p => p.cantidad) }];

  // ApexCharts - Tendencia de Captación (Area)
  const capMensual = dashStats?.captacionMensual || {};
  const captacionAreaOptions = {
    chart: { type: 'area', height: 200, background: 'transparent', toolbar: { show: false }, zoom: { enabled: false }, sparkline: { enabled: false } },
    colors: ['#3B82F6', '#10B981'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2.5 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] } },
    xaxis: { categories: capMensual.meses || ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'], labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '10px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '10px' } } },
    grid: { borderColor: currentMode === 'Dark' ? '#374151' : '#E5E7EB', strokeDashArray: 4 },
    legend: { show: true, position: 'top', fontSize: '10px', labels: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' } },
    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light' },
  };
  const captacionAreaSeries = [
    { name: 'Nuevos Leads', data: capMensual.nuevosLeads || [0] },
    { name: 'Convertidos', data: capMensual.convertidos || [0] },
  ];

  // ApexCharts - Tasa de Conversión (Radial Gauge)
  const conversionRate = clientesEjemplo.length > 0 
    ? Math.round((clientesEjemplo.filter(c => c.estado === 'Cerrado').length / clientesEjemplo.length) * 100) 
    : 0;
  const conversionGaugeOptions = {
    chart: { type: 'radialBar', height: 180, background: 'transparent', sparkline: { enabled: true } },
    plotOptions: {
      radialBar: {
        startAngle: -90, endAngle: 90,
        hollow: { size: '55%' },
        track: { background: currentMode === 'Dark' ? '#374151' : '#E5E7EB', strokeWidth: '100%' },
        dataLabels: {
          name: { show: true, fontSize: '10px', color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', offsetY: 16 },
          value: { show: true, fontSize: '22px', fontWeight: 700, color: currentMode === 'Dark' ? '#F3F4F6' : '#1F2937', offsetY: -10, formatter: (val) => `${val}%` },
        },
      },
    },
    fill: { type: 'gradient', gradient: { shade: 'dark', colorStops: [{ offset: 0, color: '#10B981', opacity: 1 }, { offset: 100, color: '#059669', opacity: 1 }] } },
    stroke: { lineCap: 'round' },
    labels: ['Conversión'],
  };
  const conversionGaugeSeries = [conversionRate];

  // ApexCharts - Engagement Score (actividad)
  const engagementAvg = clientesEjemplo.length > 0 
    ? Math.min(100, Math.round((clientesEjemplo.reduce((sum, c) => sum + (c.interacciones || 0), 0) / clientesEjemplo.length) * 10))
    : 0;
  const engagementOptions = {
    chart: { type: 'radialBar', height: 160, background: 'transparent' },
    plotOptions: {
      radialBar: {
        hollow: { size: '50%' },
        track: { background: currentMode === 'Dark' ? '#374151' : '#E5E7EB' },
        dataLabels: {
          name: { show: true, fontSize: '10px', color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', offsetY: 14 },
          value: { show: true, fontSize: '18px', fontWeight: 700, color: currentMode === 'Dark' ? '#F3F4F6' : '#1F2937', offsetY: -8, formatter: (val) => `${val}%` },
        },
      },
    },
    fill: { colors: ['#8B5CF6'] },
    stroke: { lineCap: 'round' },
    labels: ['Engagement'],
  };
  const engagementSeries = [engagementAvg];

  // ApexCharts - Zonas de Interés (Treemap simulado con Bar)
  const zonasData = [...new Set(clientesEjemplo.map(c => c.zonaInteres).filter(Boolean))].slice(0, 5).map(zona => ({
    zona,
    cantidad: clientesEjemplo.filter(c => c.zonaInteres === zona).length
  })).sort((a, b) => b.cantidad - a.cantidad);
  const zonasBarOptions = {
    chart: { type: 'bar', height: 140, background: 'transparent', toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 4, horizontal: true, distributed: true, barHeight: '70%' } },
    colors: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'],
    dataLabels: { enabled: true, textAnchor: 'start', style: { colors: ['#fff'], fontSize: '9px', fontWeight: 600 }, formatter: (val) => val, offsetX: 5 },
    xaxis: { categories: zonasData.length > 0 ? zonasData.map(z => z.zona) : ['Palermo', 'Belgrano', 'Recoleta'], labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '9px' } } },
    grid: { show: false },
    legend: { show: false },
    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light' },
  };
  const zonasBarSeries = [{ name: 'Clientes', data: zonasData.length > 0 ? zonasData.map(z => z.cantidad) : [8, 6, 5] }];

  const isDark = currentMode === 'Dark';
  const cardBase = `rounded-2xl p-6 border transition-shadow ${isDark ? 'bg-secondary-dark-bg border-gray-700/50 hover:border-indigo-500/30' : 'bg-white border-gray-100 shadow-md hover:shadow-lg'}`;

  // Clientes filtrados por tipo
  const clientesFiltrados = clientesEjemplo.filter((c) => {
    if (filtroTipo === 'todos') return true;
    if (filtroTipo === 'comprador') return c.tipo === 'Comprador';
    if (filtroTipo === 'propietario') return c.tipo === 'Propietario';
    if (filtroTipo === 'inversor') return c.tipo === 'Inversor';
    return true;
  });

  // Función para manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevoCliente(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setClientesError('');
    try {
      const payload = buildClientePayload(nuevoCliente);
      const saved = editingClienteId
        ? await crmService.clientes.update(editingClienteId, payload)
        : await crmService.clientes.create(payload);

      const normalized = normalizeCliente(saved);
      setClientesEjemplo(prev => {
        const idx = prev.findIndex(c => String(c.id) === String(normalized.id));
        if (idx === -1) return [normalized, ...prev];
        const next = [...prev];
        next[idx] = normalized;
        return next;
      });

      if (clienteSeleccionado && String(clienteSeleccionado.id) === String(normalized.id)) {
        setClienteSeleccionado(normalized);
      }

      // Check milestones (non-blocking)
      if (!editingClienteId) {
        crmService.rewards.checkMilestones('client').catch(() => {});
      }

      setShowModal(false);
      setEditingClienteId(null);
      setNuevoCliente(createEmptyClienteForm());
    } catch (err) {
      setClientesError(err?.message || 'Error al guardar cliente');
    }
  };

  // Características disponibles
  const caracteristicasDisponibles = [
    'Balcón', 'Terraza', 'Jardín', 'Pileta', 'Gimnasio', 'Parrilla',
    'Cochera', 'Seguridad 24hs', 'Aire Acondicionado', 'Calefacción'
  ];

  // Función para ver detalle de cliente
  const verDetalle = (cliente) => {
    setClienteSeleccionado(cliente);
    setVistaActual('detalle');
  };

  // Función para volver al dashboard
  const volverAlDashboard = () => {
    setVistaActual('dashboard');
    setClienteSeleccionado(null);
  };

  return (
    <div className={`min-h-screen px-6 lg:px-8 pt-4 pb-6 ${isDark ? 'bg-main-dark-bg' : 'bg-gray-50'}`}>
      <div className="mb-6">
        <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <FaUsers className="text-blue-500" /> CRM de Clientes
        </h2>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Gestión avanzada de leads y clientes</p>
      </div>

      {(clientesError || clientesLoading) && (
        <div className="mb-4">
          {clientesError && (
            <div className="text-sm rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3">
              {clientesError}
            </div>
          )}
          {clientesLoading && !clientesError && (
            <div className="text-sm text-gray-600 dark:text-gray-400">Cargando clientes...</div>
          )}
        </div>
      )}
      
      {/* Botones de Acción */}
      <div className="flex flex-wrap gap-3 mb-6">
        {vistaActual === 'detalle' && (
          <button 
            onClick={volverAlDashboard}
            className="flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors"
          >
            <FaArrowLeft /> Volver
          </button>
        )}
        <button 
          onClick={openCreateModal}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md"
        >
          <FaPlus /> Nuevo Cliente
        </button>
        <button className="flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors">
          <FaSearch /> Búsqueda Avanzada
        </button>
      </div>

      {/* Tabs Internas - Solo visibles cuando no estamos en detalle */}
      {vistaActual !== 'detalle' && (
        <div className="mb-6">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('metricas')}
              className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'metricas'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              📊 Métricas de Clientes
              {activeTab === 'metricas' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('clientes')}
              className={`px-6 py-3 text-sm font-medium transition-colors relative ${
                activeTab === 'clientes'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              👥 Clientes
              {activeTab === 'clientes' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Tab: Métricas de Clientes */}
      {vistaActual !== 'detalle' && activeTab === 'metricas' && (
        <>
      {/* KPIs de Clientes - Clickeables */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
        {kpisClientes.map((kpi, i) => (
          <div 
            key={i} 
            onClick={() => {
              if (i === 0) setShowModalTotalClientes(true);
              else if (i === 1) setShowModalLeadsCalientes(true);
              else if (i === 2) setShowModalEnNegociacion(true);
              else if (i === 3) setShowModalConversion(true);
            }}
            className={`${cardBase} overflow-hidden cursor-pointer hover:shadow-xl`}
          >
            <div className={`h-2 w-full bg-gradient-to-r ${kpi.color}`} />
            <div className="flex items-center gap-4 mt-3">
              <div className={`text-3xl text-white p-3 rounded-lg bg-gradient-to-br ${kpi.color}`}>{kpi.icon}</div>
              <div className="min-w-0">
                <p className="text-sm text-gray-500 dark:text-gray-400">{kpi.title}</p>
                <p className="text-2xl font-semibold dark:text-gray-100 truncate">{kpi.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{kpi.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico Principal - Ciclo de Vida del Lead */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 mb-6">
        {/* Ciclo de Vida - Ocupa 2 columnas */}
        <div className={`${cardBase} xl:col-span-2`}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <FaFunnelDollar className="text-indigo-500" />
                <h3 className="font-semibold dark:text-gray-100">Ciclo de Vida del Lead</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Distribución de clientes por etapa</p>
            </div>
          </div>
          <Chart options={cicloVidaPieOptions} series={cicloVidaPieSeries} type="pie" height={260} />
          <div className="grid grid-cols-5 gap-2 mt-3 pt-3 border-t dark:border-gray-700">
            {cicloVidaData.map((etapa, i) => (
              <div key={etapa.etapa} className="text-center">
                <p className="text-sm font-bold" style={{ color: ['#F59E0B', '#3B82F6', '#8B5CF6', '#F97316', '#10B981'][i] }}>{etapa.cantidad}</p>
                <p className="text-xs text-gray-500 truncate">{etapa.etapa}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scoring Promedio */}
        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-1">
            <FaThermometerHalf className="text-orange-500" />
            <h3 className="font-semibold dark:text-gray-100 text-sm">Scoring de Leads</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Calidad promedio</p>
          <Chart options={scoringGaugeOptions} series={scoringGaugeSeries} type="radialBar" height={160} />
          <div className="flex justify-between items-center pt-2 border-t dark:border-gray-700">
            <div className="text-center">
              <p className="text-sm font-bold text-red-500">{clientesEjemplo.filter(c => c.scoring < 40).length}</p>
              <p className="text-xs text-gray-500">Fríos</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-yellow-500">{clientesEjemplo.filter(c => c.scoring >= 40 && c.scoring < 70).length}</p>
              <p className="text-xs text-gray-500">Tibios</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-bold text-emerald-500">{clientesEjemplo.filter(c => c.scoring >= 70).length}</p>
              <p className="text-xs text-gray-500">Calientes</p>
            </div>
          </div>
        </div>

        {/* Tasa de Conversión */}
        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-1">
            <FaPercentage className="text-emerald-500" />
            <h3 className="font-semibold dark:text-gray-100 text-sm">Tasa Conversión</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Lead → Cerrado</p>
          <Chart options={conversionGaugeOptions} series={conversionGaugeSeries} type="radialBar" height={140} />
          <div className="space-y-2 mt-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600 dark:text-gray-400">Sector</span>
              <span className="font-bold text-gray-500">25%</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600 dark:text-gray-400">Actual</span>
              <span className={`font-bold flex items-center gap-1 ${conversionRate >= 25 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                {conversionRate >= 25 ? <FaArrowUp className="text-xs" /> : null} {conversionRate > 25 ? '+' : ''}{conversionRate - 25}%
              </span>
            </div>
          </div>
        </div>

        {/* Engagement */}
        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-1">
            <FaUserClock className="text-purple-500" />
            <h3 className="font-semibold dark:text-gray-100 text-sm">Engagement</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Nivel de interacción</p>
          <Chart options={engagementOptions} series={engagementSeries} type="radialBar" height={130} />
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t dark:border-gray-700">
            <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded text-center">
              <p className="text-sm font-bold text-purple-600 dark:text-purple-400">{clientesEjemplo.reduce((sum, c) => sum + (c.interacciones || 0), 0)}</p>
              <p className="text-xs text-gray-500">Interacc.</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-center">
              <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{clientesEjemplo.reduce((sum, c) => sum + (c.propiedadesVistas || 0), 0)}</p>
              <p className="text-xs text-gray-500">Vistas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Segunda fila - Intereses y Análisis */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Intereses de Propiedad */}
        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-1">
            <FaHeart className="text-pink-500" />
            <h3 className="font-semibold dark:text-gray-100 text-sm">Intereses</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Tipo de propiedad buscada</p>
          <Chart options={interesesDonutOptions} series={interesesDonutSeries} type="donut" height={200} />
        </div>

        {/* Funnel de Conversión */}
        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-1">
            <FaFunnelDollar className="text-indigo-500" />
            <h3 className="font-semibold dark:text-gray-100 text-sm">Funnel de Conversión</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Etapas del ciclo de vida</p>
          <Chart options={funnelOptions} series={funnelSeries} type="bar" height={160} />
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t dark:border-gray-700">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded text-center">
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{cicloVidaData[4]?.cantidad || 0}</p>
              <p className="text-xs text-gray-500">Cerrados</p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded text-center">
              <p className="text-sm font-bold text-orange-600 dark:text-orange-400">{cicloVidaData[3]?.cantidad || 0}</p>
              <p className="text-xs text-gray-500">Negociando</p>
            </div>
          </div>
        </div>

        {/* Origen de Leads */}
        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-1">
            <FaChartLine className="text-blue-500" />
            <h3 className="font-semibold dark:text-gray-100 text-sm">Origen de Leads</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Canales de captación</p>
          <Chart options={origenBarOptions} series={origenBarSeries} type="bar" height={160} />
          <div className="text-center mt-2 pt-2 border-t dark:border-gray-700">
            <p className="text-xs text-gray-500">Canal más efectivo: <span className="font-bold text-blue-600 dark:text-blue-400">{dashStats?.topOrigen || 'Web'}</span></p>
          </div>
        </div>

        {/* Presupuesto por Rango */}
        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-1">
            <FaDollarSign className="text-emerald-500" />
            <h3 className="font-semibold dark:text-gray-100 text-sm">Rangos de Presupuesto</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Capacidad de inversión</p>
          <Chart options={presupuestoBarOptions} series={presupuestoBarSeries} type="bar" height={140} />
          <div className="text-center mt-2 pt-2 border-t dark:border-gray-700">
            <p className="text-xs text-gray-500">Presupuesto promedio: <span className="font-bold text-emerald-600 dark:text-emerald-400">${clientesEjemplo.length > 0 ? Math.round(clientesEjemplo.reduce((sum, c) => sum + c.presupuesto, 0) / clientesEjemplo.length / 1000) : 0}K</span></p>
          </div>
        </div>
      </div>

      {/* Tercera fila - Tendencias y Zonas */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Tendencia de Captación */}
        <div className={cardBase}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <FaUsers className="text-blue-500" />
                <h3 className="font-semibold dark:text-gray-100">Tendencia de Captación</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Nuevos leads vs convertidos - últimos 6 meses</p>
            </div>
          </div>
          <Chart options={captacionAreaOptions} series={captacionAreaSeries} type="area" height={200} />
          <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t dark:border-gray-700">
            <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{capMensual.totalLeads ?? 0}</p>
              <p className="text-xs text-gray-500">Total Leads</p>
            </div>
            <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{capMensual.totalConvertidos ?? 0}</p>
              <p className="text-xs text-gray-500">Convertidos</p>
            </div>
            <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{capMensual.totalLeads > 0 ? Math.round((capMensual.totalConvertidos / capMensual.totalLeads) * 100) : 0}%</p>
              <p className="text-xs text-gray-500">Conversión</p>
            </div>
            <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{dashStats?.kpis?.leadsActivosTrend || '+0%'}</p>
              <p className="text-xs text-gray-500">vs Ant.</p>
            </div>
          </div>
        </div>

        {/* Panel de Segmentación y Zonas */}
        <div className="grid grid-cols-2 gap-6">
          {/* Segmentación */}
          <div className={cardBase}>
            <div className="flex items-center gap-2 mb-1">
              <FaTags className="text-indigo-500" />
              <h3 className="font-semibold dark:text-gray-100 text-sm">Segmentación</h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Tipo de cliente</p>
            <Chart options={segmentacionDonutOptions} series={segmentacionDonutSeries} type="donut" height={160} />
            <div className="grid grid-cols-3 gap-1 mt-2 pt-2 border-t dark:border-gray-700">
              <div className="text-center">
                <p className="text-xs font-bold text-blue-600">Comp.</p>
                <p className="text-xs text-gray-500">{segmentacionData[0]?.cantidad || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-emerald-600">Prop.</p>
                <p className="text-xs text-gray-500">{segmentacionData[1]?.cantidad || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-xs font-bold text-purple-600">Inv.</p>
                <p className="text-xs text-gray-500">{segmentacionData[2]?.cantidad || 0}</p>
              </div>
            </div>
          </div>

          {/* Zonas de Interés */}
          <div className={cardBase}>
            <div className="flex items-center gap-2 mb-1">
              <FaMapMarkerAlt className="text-red-500" />
              <h3 className="font-semibold dark:text-gray-100 text-sm">Zonas de Interés</h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Ubicaciones más buscadas</p>
            <Chart options={zonasBarOptions} series={zonasBarSeries} type="bar" height={120} />
            <div className="text-center mt-2 pt-2 border-t dark:border-gray-700">
              <p className="text-xs text-gray-500">Zona más demandada: <span className="font-bold text-blue-600 dark:text-blue-400">{zonasData[0]?.zona || 'Palermo'}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos de Ciclo de Vida y Segmentación */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Gráfico de Ciclo de Vida */}
        <div className={cardBase}>
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">📊 Ciclo de Vida (Lead → Cerrado)</h3>
          <AccumulationChartComponent
            id="ciclo-vida-chart"
            tooltip={{ enable: true }}
            legendSettings={{ visible: true }}
            height="300px"
          >
            <Inject services={[PieSeries, AccumulationLegend, AccumulationDataLabel, AccumulationTooltip]} />
            <AccumulationSeriesCollectionDirective>
              <AccumulationSeriesDirective
                type="Pie"
                dataSource={cicloVidaData}
                xName="etapa"
                yName="cantidad"
                name="Clientes"
                innerRadius="40%"
                dataLabel={{ visible: true, name: 'etapa', position: 'Outside' }}
              />
            </AccumulationSeriesCollectionDirective>
          </AccumulationChartComponent>
        </div>

        {/* Gráfico de Segmentación */}
        <div className={cardBase}>
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">🎯 Segmentación por Tipo</h3>
          <ChartComponent
            id="segmentacion-chart"
            primaryXAxis={{ valueType: 'Category', title: 'Tipo de Cliente' }}
            primaryYAxis={{ title: 'Cantidad' }}
            tooltip={{ enable: true }}
            legendSettings={{ visible: false }}
            height="300px"
          >
            <Inject services={[ColumnSeries, Category, Tooltip]} />
            <SeriesCollectionDirective>
              <SeriesDirective
                type="Column"
                dataSource={segmentacionData}
                xName="tipo"
                yName="cantidad"
                name="Cantidad"
                fill={currentColor || '#3B82F6'}
              />
            </SeriesCollectionDirective>
          </ChartComponent>
        </div>
      </div>

      {/* Grid de Clientes y Lead Scoring */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Grid Principal */}
        <div className={`xl:col-span-2 ${cardBase}`}>
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">👥 Base de Datos de Clientes</h3>
          <GridComponent
            dataSource={clientesEjemplo}
            allowPaging
            pageSettings={{ pageSize: 10 }}
            allowSorting
            allowFiltering
          >
            <GridInject services={[Page, Sort, Filter]} />
            <ColumnsDirective>
              <ColumnDirective field="nombre" headerText="Cliente" width="150" />
              <ColumnDirective field="tipo" headerText="Tipo" width="120" />
              <ColumnDirective field="estado" headerText="Estado" width="120" />
              <ColumnDirective field="presupuesto" headerText="Presupuesto" textAlign="Right" width="120" format="C0" />
              <ColumnDirective field="zona" headerText="Zona" width="120" />
              <ColumnDirective field="scoring" headerText="Scoring" textAlign="Center" width="100" />
            </ColumnsDirective>
          </GridComponent>
        </div>

        {/* Panel de Lead Scoring */}
        <div className={cardBase}>
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">🔥 Lead Scoring</h3>
          <div className="space-y-4">
            {clientesEjemplo.map((cliente) => (
              <div key={cliente.id} className="border dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold dark:text-gray-200 text-sm">{cliente.nombre}</h4>
                  <span className={`px-3 py-1 rounded-full font-bold text-xs ${
                    cliente.scoring >= 90 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                    cliente.scoring >= 80 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                    cliente.scoring >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                  }`}>
                    {cliente.scoring} pts
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className={`h-2 rounded-full ${
                      cliente.scoring >= 90 ? 'bg-red-500' :
                      cliente.scoring >= 80 ? 'bg-orange-500' :
                      cliente.scoring >= 60 ? 'bg-yellow-500' : 'bg-gray-500'
                    }`} 
                    style={{ width: `${cliente.scoring}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {cliente.scoring >= 90 ? '🔥 Lead súper caliente' :
                   cliente.scoring >= 80 ? '🔥 Lead caliente' :
                   cliente.scoring >= 60 ? '⚠️ Lead tibio' :
                   '❄️ Lead frío'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comunicación Integrada */}
      <div className={cardBase}>
        <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">📞 Comunicación Integrada</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="p-6 border-2 border-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
              <FaEnvelope className="text-4xl text-blue-500 mx-auto mb-3" />
              <h4 className="font-bold dark:text-gray-200">Email Marketing</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Campañas automatizadas</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">1,247</p>
              <p className="text-xs text-gray-500">Enviados este mes</p>
            </div>
          </div>
          
          <div className="text-center">
            <div className="p-6 border-2 border-green-500 rounded-lg hover:bg-green-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
              <FaWhatsapp className="text-4xl text-green-500 mx-auto mb-3" />
              <h4 className="font-bold dark:text-gray-200">WhatsApp</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Mensajes directos</p>
              <p className="text-2xl font-bold text-green-600 mt-2">432</p>
              <p className="text-xs text-gray-500">Conversaciones activas</p>
            </div>
          </div>
          
          <div className="text-center">
            <div className="p-6 border-2 border-purple-500 rounded-lg hover:bg-purple-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
              <FaPhone className="text-4xl text-purple-500 mx-auto mb-3" />
              <h4 className="font-bold dark:text-gray-200">Llamadas</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Registro completo</p>
              <p className="text-2xl font-bold text-purple-600 mt-2">89</p>
              <p className="text-xs text-gray-500">Esta semana</p>
            </div>
          </div>

          <div className="text-center">
            <div className="p-6 border-2 border-orange-500 rounded-lg hover:bg-orange-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
              <FaBell className="text-4xl text-orange-500 mx-auto mb-3" />
              <h4 className="font-bold dark:text-gray-200">Recordatorios</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Automáticos</p>
              <p className="text-2xl font-bold text-orange-600 mt-2">15</p>
              <p className="text-xs text-gray-500">Pendientes hoy</p>
            </div>
          </div>
        </div>
      </div>
        </>
      )}

      {/* Tab: Clientes con filtros */}
      {vistaActual !== 'detalle' && activeTab === 'clientes' && (
        <>
          {/* Checkboxes de filtro */}
          <div className={`${cardBase} mb-6`}>
            <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">🔍 Filtrar por tipo de cliente</h3>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="filtroTipo"
                  checked={filtroTipo === 'comprador'}
                  onChange={() => setFiltroTipo('comprador')}
                  className="w-5 h-5 text-blue-600 accent-blue-600"
                />
                <span className="text-sm font-medium dark:text-gray-200">Compradores</span>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {clientesEjemplo.filter(c => c.tipo === 'Comprador').length}
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="filtroTipo"
                  checked={filtroTipo === 'propietario'}
                  onChange={() => setFiltroTipo('propietario')}
                  className="w-5 h-5 text-blue-600 accent-blue-600"
                />
                <span className="text-sm font-medium dark:text-gray-200">Propietarios</span>
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  {clientesEjemplo.filter(c => c.tipo === 'Propietario').length}
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="filtroTipo"
                  checked={filtroTipo === 'inversor'}
                  onChange={() => setFiltroTipo('inversor')}
                  className="w-5 h-5 text-blue-600 accent-blue-600"
                />
                <span className="text-sm font-medium dark:text-gray-200">Inversores</span>
                <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  {clientesEjemplo.filter(c => c.tipo === 'Inversor').length}
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="filtroTipo"
                  checked={filtroTipo === 'todos'}
                  onChange={() => setFiltroTipo('todos')}
                  className="w-5 h-5 text-blue-600 accent-blue-600"
                />
                <span className="text-sm font-medium dark:text-gray-200">Todos</span>
                <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                  {clientesEjemplo.length}
                </span>
              </label>
            </div>
          </div>

          {/* Lista de clientes filtrados */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clientesFiltrados.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <FaUsers className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No hay clientes que coincidan con el filtro seleccionado</p>
              </div>
            ) : (
              clientesFiltrados.map((cliente) => (
            <div key={cliente.id} className={`${cardBase} hover:shadow-xl cursor-pointer`} onClick={() => verDetalle(cliente)}>
              {/* Header con avatar */}
              <div className="flex items-center gap-4 mb-4 pb-4 border-b dark:border-gray-700">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white ${
                  cliente.scoring >= 90 ? 'bg-gradient-to-br from-red-500 to-red-600' :
                  cliente.scoring >= 80 ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
                  cliente.scoring >= 60 ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' :
                  'bg-gradient-to-br from-gray-400 to-gray-500'
                }`}>
                  {cliente.nombre.charAt(0)}{cliente.nombre.split(' ')[1]?.charAt(0) || ''}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold dark:text-gray-100 truncate">{cliente.nombre}</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-mono select-all">ID: {cliente.id}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{cliente.tipo}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  cliente.estado === 'Lead' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                  cliente.estado === 'Contacto' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                  cliente.estado === 'Prospecto' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                  cliente.estado === 'Negociación' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300' :
                  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                }`}>
                  {cliente.estado}
                </span>
              </div>

              {/* Información de contacto */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <FaEnvelope className="text-blue-500" />
                  <span className="dark:text-gray-300 truncate">{cliente.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FaPhone className="text-green-500" />
                  <span className="dark:text-gray-300">{cliente.telefono}</span>
                </div>
                {cliente.presupuesto > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <FaDollarSign className="text-green-500" />
                    <span className="font-semibold" style={{ color: currentColor }}>
                      {cliente.moneda} ${cliente.presupuesto.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <FaMapMarkerAlt className="text-red-500" />
                  <span className="dark:text-gray-300">{cliente.zona}</span>
                </div>
              </div>

              {/* Lead Scoring */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium dark:text-gray-300">Lead Scoring</span>
                  <span className="text-xs font-bold" style={{ color: currentColor }}>{cliente.scoring}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      cliente.scoring >= 90 ? 'bg-red-500' :
                      cliente.scoring >= 80 ? 'bg-orange-500' :
                      cliente.scoring >= 60 ? 'bg-yellow-500' :
                      'bg-gray-400'
                    }`}
                    style={{ width: `${cliente.scoring}%` }}
                  />
                </div>
              </div>

              {/* Footer con estadísticas */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t dark:border-gray-700">
                <div className="text-center">
                  <FaHistory className="text-gray-400 mx-auto mb-1 text-sm" />
                  <p className="text-xs font-semibold dark:text-gray-200">{cliente.interacciones}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Interacciones</p>
                </div>
                <div className="text-center">
                  <FaHome className="text-gray-400 mx-auto mb-1 text-sm" />
                  <p className="text-xs font-semibold dark:text-gray-200">{cliente.propiedadesVistas}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Vistas</p>
                </div>
                <div className="text-center">
                  <FaCalendar className="text-gray-400 mx-auto mb-1 text-sm" />
                  <p className="text-xs font-semibold dark:text-gray-200">{formatUltimaInteraccion(cliente.ultimaInteraccion).short}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Última</p>
                </div>
              </div>
            </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Vista Detalle de Cliente */}
      {vistaActual === 'detalle' && clienteSeleccionado && (
        <div className="space-y-6">
          {/* Header con información principal */}
          <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-8 text-white">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-4xl font-bold">
                  {clienteSeleccionado.nombre.charAt(0)}{clienteSeleccionado.nombre.split(' ')[1]?.charAt(0) || ''}
                </div>
                <div>
                  <h1 className="text-3xl font-bold mb-1">{clienteSeleccionado.nombre}</h1>
                  <p className="text-sm opacity-80 font-mono select-all mb-1">ID: {clienteSeleccionado.id}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-2">
                      <FaUser /> {clienteSeleccionado.tipo}
                    </span>
                    <span className="flex items-center gap-2">
                      <FaBriefcase /> {clienteSeleccionado.ocupacion}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  clienteSeleccionado.estado === 'Lead' ? 'bg-yellow-500 text-white' :
                  clienteSeleccionado.estado === 'Contacto' ? 'bg-blue-500 text-white' :
                  clienteSeleccionado.estado === 'Prospecto' ? 'bg-purple-500 text-white' :
                  clienteSeleccionado.estado === 'Negociación' ? 'bg-orange-500 text-white' :
                  'bg-green-500 text-white'
                }`}>
                  {clienteSeleccionado.estado}
                </span>
                <button onClick={() => handleEditCliente(clienteSeleccionado)} className="px-4 py-2 bg-white text-blue-600 rounded-full hover:bg-opacity-90 transition-colors flex items-center gap-2 font-semibold">
                  <FaEdit /> Editar
                </button>
                <button onClick={() => handleDeleteCliente(clienteSeleccionado)} className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center gap-2 font-semibold">
                  <FaTrash /> Eliminar
                </button>
              </div>
            </div>
          </div>

          {/* Información Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna Principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Información de Contacto */}
              <div className={cardBase}>
                <h3 className="text-xl font-bold mb-4 dark:text-gray-100 flex items-center gap-2">
                  <FaPhone className="text-blue-500" /> Información de Contacto
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-gray-800 rounded-lg">
                    <FaEnvelope className="text-2xl text-blue-500" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                      <p className="font-semibold dark:text-gray-200">{clienteSeleccionado.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-gray-800 rounded-lg">
                    <FaPhone className="text-2xl text-green-500" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Teléfono Principal</p>
                      <p className="font-semibold dark:text-gray-200">{clienteSeleccionado.telefono}</p>
                    </div>
                  </div>
                  {clienteSeleccionado.telefonoAlternativo && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-gray-800 rounded-lg">
                      <FaWhatsapp className="text-2xl text-green-500" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Teléfono Alternativo</p>
                        <p className="font-semibold dark:text-gray-200">{clienteSeleccionado.telefonoAlternativo}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-gray-800 rounded-lg">
                    <FaBriefcase className="text-2xl text-purple-500" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Empresa</p>
                      <p className="font-semibold dark:text-gray-200">{clienteSeleccionado.empresa}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preferencias de Búsqueda */}
              {clienteSeleccionado.presupuesto > 0 && (
                <div className={cardBase}>
                  <h3 className="text-xl font-bold mb-4 dark:text-gray-100 flex items-center gap-2">
                    <FaHome className="text-green-500" /> Preferencias de Búsqueda
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Presupuesto</p>
                        <p className="text-3xl font-bold" style={{ color: currentColor }}>
                          {clienteSeleccionado.moneda} ${clienteSeleccionado.presupuesto.toLocaleString()}
                        </p>
                      </div>
                      <FaDollarSign className="text-4xl text-green-500 opacity-20" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="text-center p-3 border dark:border-gray-700 rounded-lg">
                        <FaBuilding className="text-2xl text-blue-500 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">Tipo</p>
                        <p className="font-bold dark:text-gray-100">{clienteSeleccionado.tipoPropiedad}</p>
                      </div>
                      <div className="text-center p-3 border dark:border-gray-700 rounded-lg">
                        <FaHome className="text-2xl text-green-500 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">Ambientes</p>
                        <p className="font-bold dark:text-gray-100">{clienteSeleccionado.ambientes || 'N/A'}</p>
                      </div>
                      <div className="text-center p-3 border dark:border-gray-700 rounded-lg">
                        <FaMapMarkerAlt className="text-2xl text-red-500 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">Zona</p>
                        <p className="font-bold dark:text-gray-100">{clienteSeleccionado.zona}</p>
                      </div>
                      <div className="text-center p-3 border dark:border-gray-700 rounded-lg">
                        <FaStar className="text-2xl text-yellow-500 mx-auto mb-2" />
                        <p className="text-xs text-gray-500 dark:text-gray-400">Scoring</p>
                        <p className="font-bold dark:text-gray-100">{clienteSeleccionado.scoring}</p>
                      </div>
                    </div>
                    {clienteSeleccionado.caracteristicas.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-3 dark:text-gray-200">Características Deseadas:</p>
                        <div className="flex flex-wrap gap-2">
                          {clienteSeleccionado.caracteristicas.map((car, idx) => (
                            <span key={idx} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm">
                              {car}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notas */}
              {clienteSeleccionado.notas && (
                <div className={cardBase}>
                  <h3 className="text-xl font-bold mb-4 dark:text-gray-100 flex items-center gap-2">
                    <FaComments className="text-purple-500" /> Notas
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{clienteSeleccionado.notas}</p>
                </div>
              )}
            </div>

            {/* Columna Lateral */}
            <div className="space-y-6">
              {/* Lead Scoring */}
              <div className={cardBase}>
                <h3 className="text-lg font-bold mb-4 dark:text-gray-100 flex items-center gap-2">
                  <FaFire className="text-red-500" /> Lead Scoring
                </h3>
                <div className="text-center mb-4">
                  <div className={`w-32 h-32 mx-auto rounded-full flex items-center justify-center text-4xl font-bold text-white ${
                    clienteSeleccionado.scoring >= 90 ? 'bg-gradient-to-br from-red-500 to-red-600' :
                    clienteSeleccionado.scoring >= 80 ? 'bg-gradient-to-br from-orange-500 to-orange-600' :
                    clienteSeleccionado.scoring >= 60 ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' :
                    'bg-gradient-to-br from-gray-400 to-gray-500'
                  }`}>
                    {clienteSeleccionado.scoring}
                  </div>
                  <p className="mt-3 font-bold text-lg dark:text-gray-100">
                    {clienteSeleccionado.scoring >= 90 ? '🔥 Caliente' :
                     clienteSeleccionado.scoring >= 80 ? '🌡️ Tibio-Caliente' :
                     clienteSeleccionado.scoring >= 60 ? '☀️ Tibio' :
                     '❄️ Frío'}
                  </p>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div 
                    className={`h-3 rounded-full ${
                      clienteSeleccionado.scoring >= 90 ? 'bg-red-500' :
                      clienteSeleccionado.scoring >= 80 ? 'bg-orange-500' :
                      clienteSeleccionado.scoring >= 60 ? 'bg-yellow-500' :
                      'bg-gray-400'
                    }`}
                    style={{ width: `${clienteSeleccionado.scoring}%` }}
                  />
                </div>
              </div>

              {/* Información CRM */}
              <div className={cardBase}>
                <h3 className="text-lg font-bold mb-4 dark:text-gray-100 flex items-center gap-2">
                  <FaTags className="text-purple-500" /> Información CRM
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Origen</p>
                    <p className="font-semibold dark:text-gray-200">{clienteSeleccionado.origen}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Agente Asignado</p>
                    <p className="font-semibold dark:text-gray-200">{clienteSeleccionado.agente}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Fecha de Registro</p>
                    <p className="font-semibold dark:text-gray-200">{clienteSeleccionado.fechaRegistro}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Última Interacción</p>
                    <p className="font-semibold dark:text-gray-200">{formatUltimaInteraccion(clienteSeleccionado.ultimaInteraccion).full}</p>
                  </div>
                </div>
              </div>

              {/* Estadísticas */}
              <div className={cardBase}>
                <h3 className="text-lg font-bold mb-4 dark:text-gray-100">📊 Estadísticas</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FaHistory className="text-blue-500" />
                      <span className="text-sm dark:text-gray-200">Interacciones</span>
                    </div>
                    <span className="font-bold dark:text-gray-100">{clienteSeleccionado.interacciones}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FaHome className="text-green-500" />
                      <span className="text-sm dark:text-gray-200">Propiedades Vistas</span>
                    </div>
                    <span className="font-bold dark:text-gray-100">{clienteSeleccionado.propiedadesVistas}</span>
                  </div>
                </div>
              </div>

              {/* Ubicación */}
              <div className={cardBase}>
                <h3 className="text-lg font-bold mb-4 dark:text-gray-100 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-red-500" /> Ubicación
                </h3>
                <div className="space-y-2">
                  <p className="text-sm dark:text-gray-300">{clienteSeleccionado.direccion}</p>
                  <p className="text-sm dark:text-gray-300">{clienteSeleccionado.ciudad}, {clienteSeleccionado.provincia}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sección de Gráficos - Datos por Canales */}
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-4 dark:text-gray-100 flex items-center gap-2">
              <FaChartLine className="text-blue-500" /> Análisis de Comportamiento e Interacciones
            </h2>
            
            {/* Primera fila de gráficos */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">
              {/* Actividad por Canal */}
              <div className={`${cardBase} xl:col-span-2`}>
                <div className="flex items-center gap-2 mb-2">
                  <FaUsers className="text-indigo-500" />
                  <h3 className="font-semibold dark:text-gray-100">Interacciones por Canal</h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Origen de cada contacto con el cliente</p>
                <Chart 
                  options={{
                    chart: { type: 'bar', height: 220, background: 'transparent', toolbar: { show: false } },
                    plotOptions: { bar: { borderRadius: 6, horizontal: false, columnWidth: '55%', distributed: true } },
                    colors: ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#6B7280'],
                    dataLabels: { enabled: false },
                    xaxis: { 
                      categories: ['Sitio Web', 'WhatsApp', 'Teléfono', 'Email', 'Presencial', 'Redes'], 
                      labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '10px' } },
                      axisBorder: { show: false }, axisTicks: { show: false }
                    },
                    yaxis: { labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '10px' } } },
                    grid: { borderColor: currentMode === 'Dark' ? '#374151' : '#E5E7EB', strokeDashArray: 4 },
                    legend: { show: false },
                    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light' },
                  }} 
                  series={[{ name: 'Interacciones', data: [
                    Math.floor((clienteSeleccionado.interacciones || 5) * 0.35),
                    Math.floor((clienteSeleccionado.interacciones || 5) * 0.25),
                    Math.floor((clienteSeleccionado.interacciones || 5) * 0.15),
                    Math.floor((clienteSeleccionado.interacciones || 5) * 0.12),
                    Math.floor((clienteSeleccionado.interacciones || 5) * 0.08),
                    Math.floor((clienteSeleccionado.interacciones || 5) * 0.05)
                  ] }]} 
                  type="bar" 
                  height={200} 
                />
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t dark:border-gray-700">
                  <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {Math.floor((clienteSeleccionado.interacciones || 5) * 0.35)}
                    </p>
                    <p className="text-xs text-gray-500">Sitio Web</p>
                  </div>
                  <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded">
                    <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {Math.floor((clienteSeleccionado.interacciones || 5) * 0.25)}
                    </p>
                    <p className="text-xs text-gray-500">WhatsApp</p>
                  </div>
                  <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                    <p className="text-sm font-bold text-purple-600 dark:text-purple-400">
                      {Math.floor((clienteSeleccionado.interacciones || 5) * 0.15)}
                    </p>
                    <p className="text-xs text-gray-500">Teléfono</p>
                  </div>
                </div>
              </div>

              {/* Actividad Web del Usuario */}
              <div className={cardBase}>
                <div className="flex items-center gap-2 mb-2">
                  <FaGlobe className="text-blue-500" />
                  <h3 className="font-semibold dark:text-gray-100 text-sm">Actividad Web</h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Comportamiento en el sitio</p>
                <Chart 
                  options={{
                    chart: { type: 'donut', height: 180, background: 'transparent' },
                    labels: ['Búsquedas', 'Visitas', 'Favoritos', 'Consultas'],
                    colors: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'],
                    plotOptions: { pie: { donut: { size: '60%', labels: { show: true, name: { fontSize: '10px', color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' }, value: { fontSize: '14px', fontWeight: 700, color: currentMode === 'Dark' ? '#F3F4F6' : '#1F2937' }, total: { show: true, label: 'Total', fontSize: '9px', color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' } } } } },
                    dataLabels: { enabled: false },
                    legend: { show: false },
                    stroke: { show: false },
                    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light' },
                  }} 
                  series={[
                    Math.floor((clienteSeleccionado.propiedadesVistas || 5) * 2.5),
                    clienteSeleccionado.propiedadesVistas || 5,
                    Math.floor((clienteSeleccionado.propiedadesVistas || 5) * 0.4),
                    Math.floor((clienteSeleccionado.interacciones || 3) * 0.3)
                  ]} 
                  type="donut" 
                  height={160} 
                />
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t dark:border-gray-700">
                  <div className="text-center">
                    <p className="text-xs font-bold text-blue-600">{Math.floor((clienteSeleccionado.propiedadesVistas || 5) * 2.5)}</p>
                    <p className="text-xs text-gray-500">Búsquedas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-emerald-600">{clienteSeleccionado.propiedadesVistas || 5}</p>
                    <p className="text-xs text-gray-500">Visitas</p>
                  </div>
                </div>
              </div>

              {/* Engagement Score */}
              <div className={cardBase}>
                <div className="flex items-center gap-2 mb-2">
                  <FaUserClock className="text-purple-500" />
                  <h3 className="font-semibold dark:text-gray-100 text-sm">Engagement</h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Nivel de compromiso</p>
                <Chart 
                  options={{
                    chart: { type: 'radialBar', height: 160, background: 'transparent' },
                    plotOptions: {
                      radialBar: {
                        hollow: { size: '55%' },
                        track: { background: currentMode === 'Dark' ? '#374151' : '#E5E7EB' },
                        dataLabels: {
                          name: { show: true, fontSize: '10px', color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', offsetY: 14 },
                          value: { show: true, fontSize: '20px', fontWeight: 700, color: currentMode === 'Dark' ? '#F3F4F6' : '#1F2937', offsetY: -8, formatter: (val) => `${val}%` },
                        },
                      },
                    },
                    fill: { colors: [clienteSeleccionado.scoring >= 70 ? '#10B981' : clienteSeleccionado.scoring >= 40 ? '#F59E0B' : '#EF4444'] },
                    stroke: { lineCap: 'round' },
                    labels: ['Engagement'],
                  }} 
                  series={[Math.min(100, Math.round(((clienteSeleccionado.interacciones || 0) + (clienteSeleccionado.propiedadesVistas || 0)) * 5))]} 
                  type="radialBar" 
                  height={150} 
                />
                <div className="text-center mt-2 pt-2 border-t dark:border-gray-700">
                  <p className="text-xs text-gray-500">Última actividad: <span className="font-bold text-blue-600 dark:text-blue-400">{formatUltimaInteraccion(clienteSeleccionado.ultimaInteraccion).full}</span></p>
                </div>
              </div>
            </div>

            {/* Segunda fila de gráficos */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
              {/* Timeline de Actividad */}
              <div className={`${cardBase} xl:col-span-2`}>
                <div className="flex items-center gap-2 mb-2">
                  <FaHistory className="text-indigo-500" />
                  <h3 className="font-semibold dark:text-gray-100">Historial de Actividad</h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Actividad del cliente en los últimos 6 meses</p>
                <Chart 
                  options={{
                    chart: { type: 'area', height: 200, background: 'transparent', toolbar: { show: false }, zoom: { enabled: false } },
                    colors: ['#3B82F6', '#10B981', '#8B5CF6'],
                    dataLabels: { enabled: false },
                    stroke: { curve: 'smooth', width: 2.5 },
                    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] } },
                    xaxis: { categories: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'], labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '10px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
                    yaxis: { labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '10px' } } },
                    grid: { borderColor: currentMode === 'Dark' ? '#374151' : '#E5E7EB', strokeDashArray: 4 },
                    legend: { show: true, position: 'top', fontSize: '10px', labels: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' } },
                    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light' },
                  }} 
                  series={[
                    { name: 'Visitas Web', data: [2, 4, 3, 5, 8, clienteSeleccionado.propiedadesVistas || 6] },
                    { name: 'Interacciones', data: [1, 2, 1, 3, 4, Math.floor((clienteSeleccionado.interacciones || 3) * 0.4)] },
                    { name: 'Consultas', data: [0, 1, 0, 1, 2, Math.floor((clienteSeleccionado.interacciones || 2) * 0.2)] },
                  ]} 
                  type="area" 
                  height={180} 
                />
              </div>

              {/* Propiedades de Interés */}
              <div className={cardBase}>
                <div className="flex items-center gap-2 mb-2">
                  <FaHome className="text-green-500" />
                  <h3 className="font-semibold dark:text-gray-100 text-sm">Propiedades Vistas</h3>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Por tipo de propiedad</p>
                <Chart 
                  options={{
                    chart: { type: 'polarArea', height: 200, background: 'transparent' },
                    labels: [clienteSeleccionado.tipoPropiedad || 'Depto', 'Casa', 'PH', 'Otros'],
                    colors: ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B'],
                    stroke: { colors: [currentMode === 'Dark' ? '#1F2937' : '#fff'] },
                    fill: { opacity: 0.8 },
                    legend: { show: true, position: 'bottom', fontSize: '10px', labels: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' } },
                    plotOptions: { polarArea: { rings: { strokeWidth: 0 }, spokes: { strokeWidth: 0 } } },
                    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light' },
                  }} 
                  series={[
                    Math.floor((clienteSeleccionado.propiedadesVistas || 5) * 0.5),
                    Math.floor((clienteSeleccionado.propiedadesVistas || 5) * 0.25),
                    Math.floor((clienteSeleccionado.propiedadesVistas || 5) * 0.15),
                    Math.floor((clienteSeleccionado.propiedadesVistas || 5) * 0.1)
                  ]} 
                  type="polarArea" 
                  height={180} 
                />
              </div>
            </div>

            {/* Tercera fila - Datos de Usuario Web */}
            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
              {/* Sesiones Web */}
              <div className={cardBase}>
                <div className="flex items-center gap-2 mb-2">
                  <FaDesktop className="text-blue-500" />
                  <h3 className="font-semibold dark:text-gray-100 text-sm">Sesiones Web</h3>
                </div>
                <div className="text-center py-3">
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{Math.floor((clienteSeleccionado.propiedadesVistas || 5) * 1.5)}</p>
                  <p className="text-xs text-gray-500 mt-1">Total de visitas</p>
                </div>
                <div className="space-y-2 pt-2 border-t dark:border-gray-700">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Tiempo promedio</span>
                    <span className="font-bold dark:text-gray-200">4:32 min</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Páginas/sesión</span>
                    <span className="font-bold dark:text-gray-200">3.2</span>
                  </div>
                </div>
              </div>

              {/* Dispositivos */}
              <div className={cardBase}>
                <div className="flex items-center gap-2 mb-2">
                  <FaMobileAlt className="text-purple-500" />
                  <h3 className="font-semibold dark:text-gray-100 text-sm">Dispositivos</h3>
                </div>
                <Chart 
                  options={{
                    chart: { type: 'donut', height: 140, background: 'transparent', sparkline: { enabled: true } },
                    labels: ['Móvil', 'Desktop', 'Tablet'],
                    colors: ['#8B5CF6', '#3B82F6', '#10B981'],
                    plotOptions: { pie: { donut: { size: '70%' } } },
                    legend: { show: false },
                    stroke: { show: false },
                    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light' },
                  }} 
                  series={[55, 35, 10]} 
                  type="donut" 
                  height={110} 
                />
                <div className="grid grid-cols-3 gap-1 mt-2 text-center">
                  <div><p className="text-xs font-bold text-purple-600">55%</p><p className="text-xs text-gray-500">Móvil</p></div>
                  <div><p className="text-xs font-bold text-blue-600">35%</p><p className="text-xs text-gray-500">Desktop</p></div>
                  <div><p className="text-xs font-bold text-emerald-600">10%</p><p className="text-xs text-gray-500">Tablet</p></div>
                </div>
              </div>

              {/* Fuente de Tráfico */}
              <div className={cardBase}>
                <div className="flex items-center gap-2 mb-2">
                  <FaLink className="text-indigo-500" />
                  <h3 className="font-semibold dark:text-gray-100 text-sm">Fuente Tráfico</h3>
                </div>
                <Chart 
                  options={{
                    chart: { type: 'bar', height: 130, background: 'transparent', toolbar: { show: false }, sparkline: { enabled: false } },
                    plotOptions: { bar: { borderRadius: 3, horizontal: true, distributed: true, barHeight: '60%' } },
                    colors: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'],
                    dataLabels: { enabled: false },
                    xaxis: { categories: ['Google', 'Directo', 'Redes', 'Otros'], labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
                    yaxis: { labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '9px' } } },
                    grid: { show: false },
                    legend: { show: false },
                    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light' },
                  }} 
                  series={[{ name: 'Visitas', data: [45, 30, 15, 10] }]} 
                  type="bar" 
                  height={120} 
                />
              </div>

              {/* Acciones en Web */}
              <div className={cardBase}>
                <div className="flex items-center gap-2 mb-2">
                  <FaMousePointer className="text-orange-500" />
                  <h3 className="font-semibold dark:text-gray-100 text-sm">Acciones Web</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <span className="text-xs dark:text-gray-300">Favoritos guardados</span>
                    <span className="font-bold text-blue-600">{Math.floor((clienteSeleccionado.propiedadesVistas || 3) * 0.4)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <span className="text-xs dark:text-gray-300">Consultas enviadas</span>
                    <span className="font-bold text-green-600">{Math.floor((clienteSeleccionado.interacciones || 2) * 0.3)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                    <span className="text-xs dark:text-gray-300">Comparaciones</span>
                    <span className="font-bold text-purple-600">{Math.floor((clienteSeleccionado.propiedadesVistas || 2) * 0.2)}</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                    <span className="text-xs dark:text-gray-300">Descargas PDF</span>
                    <span className="font-bold text-orange-600">{Math.floor((clienteSeleccionado.propiedadesVistas || 1) * 0.15)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nuevo Cliente */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            {/* Header del Modal */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaUsers /> {editingClienteId ? 'Editar Cliente' : 'Nuevo Cliente'}
                </h2>
                <p className="text-blue-100 text-sm mt-1">Complete los datos del cliente</p>
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
              {/* Información Personal */}
              <div>
                <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 flex items-center gap-2">
                  <FaUser className="text-blue-500" /> Información Personal
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      value={nuevoCliente.nombre}
                      onChange={handleInputChange}
                      required
                      placeholder="Juan"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Apellido *
                    </label>
                    <input
                      type="text"
                      name="apellido"
                      value={nuevoCliente.apellido}
                      onChange={handleInputChange}
                      required
                      placeholder="Pérez"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={nuevoCliente.email}
                      onChange={handleInputChange}
                      required
                      placeholder="juan@email.com"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      name="telefono"
                      value={nuevoCliente.telefono}
                      onChange={handleInputChange}
                      required
                      placeholder="+54 11 1234-5678"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Teléfono Alternativo
                    </label>
                    <input
                      type="tel"
                      name="telefonoAlternativo"
                      value={nuevoCliente.telefonoAlternativo}
                      onChange={handleInputChange}
                      placeholder="+54 11 8765-4321"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Ocupación
                    </label>
                    <input
                      type="text"
                      name="ocupacion"
                      value={nuevoCliente.ocupacion}
                      onChange={handleInputChange}
                      placeholder="Ingeniero"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Empresa
                    </label>
                    <input
                      type="text"
                      name="empresa"
                      value={nuevoCliente.empresa}
                      onChange={handleInputChange}
                      placeholder="Tech Corp"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Dirección
                    </label>
                    <input
                      type="text"
                      name="direccion"
                      value={nuevoCliente.direccion}
                      onChange={handleInputChange}
                      placeholder="Av. Corrientes 1234"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      name="ciudad"
                      value={nuevoCliente.ciudad}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Provincia
                    </label>
                    <input
                      type="text"
                      name="provincia"
                      value={nuevoCliente.provincia}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Datos Demográficos */}
              <div>
                <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 flex items-center gap-2">
                  <FaUsers className="text-green-500" /> Datos Demográficos
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Género
                    </label>
                    <select
                      name="genero"
                      value={nuevoCliente.genero}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="masculino">Masculino</option>
                      <option value="femenino">Femenino</option>
                      <option value="otro">Otro</option>
                      <option value="prefiero_no_decir">Prefiero no decir</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Fecha de Nacimiento
                    </label>
                    <input
                      type="date"
                      name="fechaNacimiento"
                      value={nuevoCliente.fechaNacimiento}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Profesión
                    </label>
                    <select
                      name="profesion"
                      value={nuevoCliente.profesion}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="abogado">Abogado/a</option>
                      <option value="arquitecto">Arquitecto/a</option>
                      <option value="comerciante">Comerciante</option>
                      <option value="contador">Contador/a</option>
                      <option value="diseñador">Diseñador/a</option>
                      <option value="docente">Docente</option>
                      <option value="empresario">Empresario/a</option>
                      <option value="enfermero">Enfermero/a</option>
                      <option value="ingeniero">Ingeniero/a</option>
                      <option value="medico">Médico/a</option>
                      <option value="periodista">Periodista</option>
                      <option value="programador">Programador/a</option>
                      <option value="psicologo">Psicólogo/a</option>
                      <option value="publicista">Publicista</option>
                      <option value="vendedor">Vendedor/a</option>
                      <option value="autonomo">Trabajador/a Autónomo/a</option>
                      <option value="empleado">Empleado/a</option>
                      <option value="jubilado">Jubilado/a</option>
                      <option value="estudiante">Estudiante</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Estado Parental
                    </label>
                    <select
                      name="estadoParental"
                      value={nuevoCliente.estadoParental}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="padre">Padre</option>
                      <option value="madre">Madre</option>
                      <option value="sin_hijos">Sin hijos</option>
                      <option value="esperando">Esperando hijo/a</option>
                      <option value="prefiero_no_decir">Prefiero no decir</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      ¿Tiene Hijos?
                    </label>
                    <select
                      name="tieneHijos"
                      value={nuevoCliente.tieneHijos}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    >
                      <option value="">Seleccionar...</option>
                      <option value="si">Sí</option>
                      <option value="no">No</option>
                      <option value="prefiero_no_decir">Prefiero no decir</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Preferencia de Comunicación
                    </label>
                    <select
                      name="preferenciaComunicacion"
                      value={nuevoCliente.preferenciaComunicacion}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    >
                      <option value="whatsapp">WhatsApp</option>
                      <option value="email">Email</option>
                      <option value="telefono">Teléfono</option>
                      <option value="sms">SMS</option>
                      <option value="todos">Todos los canales</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Clasificación CRM */}
              <div>
                <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 flex items-center gap-2">
                  <FaTags className="text-purple-500" /> Clasificación CRM
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Tipo de Cliente *
                    </label>
                    <select
                      name="tipoCliente"
                      value={nuevoCliente.tipoCliente}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    >
                      <option value="Comprador">Comprador</option>
                      <option value="Propietario">Propietario</option>
                      <option value="Inversor">Inversor</option>
                      <option value="Inquilino">Inquilino</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Estado en el Ciclo *
                    </label>
                    <select
                      name="estado"
                      value={nuevoCliente.estado}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    >
                      <option value="Lead">Lead</option>
                      <option value="Contacto">Contacto</option>
                      <option value="Prospecto">Prospecto</option>
                      <option value="Negociación">Negociación</option>
                      <option value="Cerrado">Cerrado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Origen del Lead
                    </label>
                    <select
                      name="origen"
                      value={nuevoCliente.origen}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    >
                      <option value="Web">Sitio Web</option>
                      <option value="Redes Sociales">Redes Sociales</option>
                      <option value="Referido">Referido</option>
                      <option value="Llamada">Llamada Directa</option>
                      <option value="Email">Email</option>
                      <option value="Evento">Evento</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Agente Asignado
                    </label>
                    <select
                      name="agente"
                      value={nuevoCliente.agente}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    >
                      <option value="">Sin asignar</option>
                      <option value="Ana López">Ana López</option>
                      <option value="Carlos Ruiz">Carlos Ruiz</option>
                      <option value="Laura Fernández">Laura Fernández</option>
                      <option value="Sofía Torres">Sofía Torres</option>
                      <option value="Marcos Silva">Marcos Silva</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Lead Scoring: {nuevoCliente.scoring}
                    </label>
                    <input
                      type="range"
                      name="scoring"
                      value={nuevoCliente.scoring}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>Frío (0)</span>
                      <span>Tibio (50)</span>
                      <span>Caliente (100)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preferencias de Búsqueda */}
              <div>
                <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 flex items-center gap-2">
                  <FaHome className="text-green-500" /> Preferencias de Búsqueda
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Presupuesto
                    </label>
                    <div className="flex gap-2">
                      <select
                        name="moneda"
                        value={nuevoCliente.moneda}
                        onChange={handleInputChange}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                      >
                        <option value="USD">USD</option>
                        <option value="ARS">ARS</option>
                      </select>
                      <input
                        type="number"
                        name="presupuesto"
                        value={nuevoCliente.presupuesto}
                        onChange={handleInputChange}
                        placeholder="150000"
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Zona de Interés
                    </label>
                    <input
                      type="text"
                      name="zonaInteres"
                      value={nuevoCliente.zonaInteres}
                      onChange={handleInputChange}
                      placeholder="Palermo, Belgrano, Recoleta"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Tipo de Propiedad
                    </label>
                    <select
                      name="tipoPropiedad"
                      value={nuevoCliente.tipoPropiedad}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    >
                      <option value="Departamento">Departamento</option>
                      <option value="Casa">Casa</option>
                      <option value="PH">PH</option>
                      <option value="Oficina">Oficina</option>
                      <option value="Local">Local Comercial</option>
                      <option value="Terreno">Terreno</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Ambientes
                    </label>
                    <input
                      type="number"
                      name="ambientes"
                      value={nuevoCliente.ambientes}
                      onChange={handleInputChange}
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
                      value={nuevoCliente.dormitorios}
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
                      value={nuevoCliente.baños}
                      onChange={handleInputChange}
                      placeholder="1"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Características Deseadas */}
              <div>
                <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">
                  Características Deseadas
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {caracteristicasDisponibles.map((caracteristica) => (
                    <label key={caracteristica} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={nuevoCliente.caracteristicas.includes(caracteristica)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNuevoCliente(prev => ({
                              ...prev,
                              caracteristicas: [...prev.caracteristicas, caracteristica]
                            }));
                          } else {
                            setNuevoCliente(prev => ({
                              ...prev,
                              caracteristicas: prev.caracteristicas.filter(c => c !== caracteristica)
                            }));
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="dark:text-gray-200">{caracteristica}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  Notas Adicionales
                </label>
                <textarea
                  name="notas"
                  value={nuevoCliente.notas}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Información adicional sobre el cliente, preferencias especiales, observaciones..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                />
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
                >
                  <FaSave /> Guardar Cliente
                </button>
              </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Total Clientes */}
      {showModalTotalClientes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaUsers /> Total Clientes
                </h2>
                <p className="text-blue-100 text-sm mt-1">{clientesEjemplo.length} clientes en el sistema</p>
              </div>
              <button onClick={() => setShowModalTotalClientes(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clientesEjemplo.map((cliente) => (
                  <div key={cliente.id} className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 border ${currentMode === 'Dark' ? 'border-gray-700' : 'border-gray-200'} hover:shadow-lg transition-shadow`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg dark:text-gray-100">{cliente.nombre}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{cliente.email}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        cliente.estado === 'Lead' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                        cliente.estado === 'Contactado' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                        cliente.estado === 'Negociación' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      }`}>
                        {cliente.estado}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Tipo:</span>
                        <span className="font-medium dark:text-gray-200">{cliente.tipoCliente}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Presupuesto:</span>
                        <span className="font-bold text-green-600 dark:text-green-400">{cliente.moneda} ${cliente.presupuesto.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Scoring:</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                cliente.scoring >= 80 ? 'bg-green-500' :
                                cliente.scoring >= 60 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${cliente.scoring}%` }}
                            />
                          </div>
                          <span className="font-bold dark:text-gray-200">{cliente.scoring}</span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t dark:border-gray-700">
                        <p>Interés: {cliente.zonaInteres}</p>
                        <p>Agente: {cliente.agente}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Leads Calientes */}
      {showModalLeadsCalientes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className="sticky top-0 bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaFire /> Leads Calientes
                </h2>
                <p className="text-red-100 text-sm mt-1">
                  {clientesEjemplo.filter(c => c.scoring >= 80).length} clientes con scoring ≥ 80
                </p>
              </div>
              <button onClick={() => setShowModalLeadsCalientes(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {clientesEjemplo
                  .filter(c => c.scoring >= 80)
                  .sort((a, b) => b.scoring - a.scoring)
                  .map((cliente, index) => (
                    <div key={cliente.id} className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 border-2 ${currentMode === 'Dark' ? 'border-red-700' : 'border-red-200'} hover:shadow-md transition-shadow`}>
                      <div className="flex items-center gap-4">
                        <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl ${
                          index === 0 ? 'bg-gradient-to-br from-red-500 to-red-600 text-white' :
                          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {cliente.scoring}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-lg dark:text-gray-100">{cliente.nombre}</h3>
                            {index === 0 && <FaFire className="text-red-500 text-xl" />}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{cliente.email} • {cliente.telefono}</p>
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <span className={`px-2 py-1 rounded text-xs ${
                              cliente.estado === 'Negociación' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                              'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            }`}>
                              {cliente.estado}
                            </span>
                            <span className="text-xs text-gray-600 dark:text-gray-400">{cliente.tipoCliente}</span>
                            <span className="text-xs font-medium text-green-600 dark:text-green-400">
                              {cliente.moneda} ${cliente.presupuesto.toLocaleString()}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Interés</p>
                          <p className="font-medium dark:text-gray-200">{cliente.zonaInteres}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{cliente.tipoPropiedad}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Agente: {cliente.agente}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              
              {clientesEjemplo.filter(c => c.scoring >= 80).length === 0 && (
                <div className="text-center py-12">
                  <FaFire className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No hay leads calientes en este momento</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal En Negociación */}
      {showModalEnNegociacion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className="sticky top-0 bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaChartLine /> En Negociación
                </h2>
                <p className="text-green-100 text-sm mt-1">
                  {clientesEjemplo.filter(c => c.estado === 'Negociación').length} clientes próximos a cerrar
                </p>
              </div>
              <button onClick={() => setShowModalEnNegociacion(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {clientesEjemplo
                  .filter(c => c.estado === 'Negociación')
                  .sort((a, b) => b.scoring - a.scoring)
                  .map((cliente) => (
                    <div key={cliente.id} className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 border-2 ${currentMode === 'Dark' ? 'border-green-700' : 'border-green-200'} hover:shadow-md transition-shadow`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-lg dark:text-gray-100">{cliente.nombre}</h3>
                            <div className="flex items-center gap-1">
                              <FaStar className="text-yellow-500" />
                              <span className="text-sm font-bold text-yellow-600 dark:text-yellow-400">{cliente.scoring}</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{cliente.email} • {cliente.telefono}</p>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Tipo de Cliente:</p>
                              <p className="font-medium dark:text-gray-200">{cliente.tipoCliente}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Presupuesto:</p>
                              <p className="font-bold text-green-600 dark:text-green-400">
                                {cliente.moneda} ${cliente.presupuesto.toLocaleString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Zona de Interés:</p>
                              <p className="font-medium dark:text-gray-200">{cliente.zonaInteres}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Tipo de Propiedad:</p>
                              <p className="font-medium dark:text-gray-200">{cliente.tipoPropiedad}</p>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t dark:border-gray-700 flex items-center justify-between">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Agente: <span className="font-medium text-gray-700 dark:text-gray-300">{cliente.agente}</span>
                            </span>
                            <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-3 py-1 rounded-full font-medium">
                              Próximo a cerrar
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              
              {clientesEjemplo.filter(c => c.estado === 'Negociación').length === 0 && (
                <div className="text-center py-12">
                  <FaChartLine className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No hay clientes en negociación</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Conversión */}
      {showModalConversion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaTags /> Tasa de Conversión
                </h2>
                <p className="text-purple-100 text-sm mt-1">Análisis del embudo de ventas</p>
              </div>
              <button onClick={() => setShowModalConversion(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Embudo de Conversión */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">Embudo de Conversión</h3>
                <div className="space-y-4">
                  {[
                    { estado: 'Lead', count: clientesEjemplo.filter(c => c.estado === 'Lead').length, color: 'yellow', width: '100%' },
                    { estado: 'Contactado', count: clientesEjemplo.filter(c => c.estado === 'Contactado').length, color: 'blue', width: '75%' },
                    { estado: 'Negociación', count: clientesEjemplo.filter(c => c.estado === 'Negociación').length, color: 'orange', width: '50%' },
                    { estado: 'Cliente', count: clientesEjemplo.filter(c => c.estado === 'Cliente').length, color: 'green', width: '32%' },
                  ].map((etapa) => (
                    <div key={etapa.estado} className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium dark:text-gray-200">{etapa.estado}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{etapa.count} clientes</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-8 relative overflow-hidden">
                        <div 
                          className={`h-8 rounded-full bg-${etapa.color}-500 flex items-center justify-center text-white font-bold transition-all duration-500`}
                          style={{ width: etapa.width }}
                        >
                          {etapa.width}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Estadísticas de Conversión */}
              <div className={`p-6 ${currentMode === 'Dark' ? 'bg-purple-900/20' : 'bg-purple-50'} rounded-lg border-2 border-purple-500`}>
                <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">Métricas de Conversión</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Lead → Contactado</p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 my-2">
                      {Math.round((clientesEjemplo.filter(c => c.estado !== 'Lead').length / clientesEjemplo.length) * 100)}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {clientesEjemplo.filter(c => c.estado !== 'Lead').length} de {clientesEjemplo.length}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Contactado → Negociación</p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 my-2">
                      {clientesEjemplo.filter(c => c.estado === 'Contactado').length > 0 
                        ? Math.round((clientesEjemplo.filter(c => c.estado === 'Negociación' || c.estado === 'Cliente').length / clientesEjemplo.filter(c => c.estado === 'Contactado').length) * 100)
                        : 0}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {clientesEjemplo.filter(c => c.estado === 'Negociación' || c.estado === 'Cliente').length} conversiones
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Lead → Cliente</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400 my-2">
                      {Math.round((clientesEjemplo.filter(c => c.estado === 'Cliente').length / clientesEjemplo.length) * 100)}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {clientesEjemplo.filter(c => c.estado === 'Cliente').length} clientes cerrados
                    </p>
                  </div>
                </div>
              </div>

              {/* Clientes por Estado */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { estado: 'Lead', color: 'yellow', icon: '📋' },
                  { estado: 'Contactado', color: 'blue', icon: '📞' },
                  { estado: 'Negociación', color: 'orange', icon: '💼' },
                  { estado: 'Cliente', color: 'green', icon: '✅' },
                ].map((item) => (
                  <div key={item.estado} className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 border ${currentMode === 'Dark' ? 'border-gray-700' : 'border-gray-200'} text-center`}>
                    <div className="text-3xl mb-2">{item.icon}</div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.estado}</p>
                    <p className="text-2xl font-bold dark:text-gray-100">
                      {clientesEjemplo.filter(c => c.estado === item.estado).length}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientesCRM;
