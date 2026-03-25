import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { confirmToast } from '../utils/confirmToast';
import { FaPlus, FaSearch, FaTags, FaEnvelope, FaWhatsapp, FaPhone, FaBell, FaUsers, FaChartLine, FaFire, FaTimes, FaSave, FaUser, FaMapMarkerAlt, FaDollarSign, FaStar, FaCalendar, FaBuilding, FaHome, FaArrowLeft, FaEdit, FaTrash, FaHistory, FaComments, FaBriefcase } from 'react-icons/fa';
import { useStateContext } from '../contexts/ContextProvider';
import { crmService } from '../services/crmService';

import Chart from 'react-apexcharts';

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
  const [filtroTipo, setFiltroTipo] = useState('todos');

  // Estado para el modal
  const [showModal, setShowModal] = useState(false);
  
  // Estados para modales de estadísticas
  const [showModalTotalClientes, setShowModalTotalClientes] = useState(false);
  const [showModalLeadsCalientes, setShowModalLeadsCalientes] = useState(false);
  const [showModalEnNegociacion, setShowModalEnNegociacion] = useState(false);
  const [showModalConversion, setShowModalConversion] = useState(false);
  
  // Estados para las vistas
  const [vistaActual, setVistaActual] = useState('dashboard'); // 'dashboard', 'lista', 'detalle'
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [propiedadesList, setPropiedadesList] = useState([]);
  const [propSearch, setPropSearch] = useState('');
  const [interesInput, setInteresInput] = useState('');
  const [agentesOptions, setAgentesOptions] = useState([]);

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
    agenteId: '',
    propiedadConsultadaInicial: { id: '', titulo: '', direccion: '' },
    interesesCliente: [],
  });

  // Estado para el formulario de nuevo cliente
  const [nuevoCliente, setNuevoCliente] = useState(createEmptyClienteForm);
  const [editingClienteId, setEditingClienteId] = useState(null);

  const [clientesEjemplo, setClientesEjemplo] = useState([]);
  const [clientesLoading, setClientesLoading] = useState(false);
  const [clientesError, setClientesError] = useState('');

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
      ultimaInteraccion: md.ultimaInteraccion || '',
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
      agenteNombre: md.agente || '',
      propiedadConsultadaInicial: md.propiedadConsultadaInicial || { id: '', titulo: '', direccion: '' },
      interesesCliente: Array.isArray(md.interesesCliente) ? md.interesesCliente : [],
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
      agenteId: cliente?.agenteId || '',
      propiedadConsultadaInicial: cliente?.propiedadConsultadaInicial || { id: '', titulo: '', direccion: '' },
      interesesCliente: Array.isArray(cliente?.interesesCliente) ? cliente.interesesCliente : [],
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
        scoring: Number(form?.scoring || 50),
        ciudad: form?.ciudad || 'Buenos Aires',
        provincia: form?.provincia || 'Buenos Aires',
        ocupacion: form?.ocupacion || '',
        empresa: form?.empresa || '',
        agente: form?.agenteNombre || form?.agente || '',
        agenteId: form?.agenteId || '',
        propiedadConsultadaInicial: form?.propiedadConsultadaInicial?.id ? form.propiedadConsultadaInicial : null,
        interesesCliente: Array.isArray(form?.interesesCliente) ? form.interesesCliente : [],
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
  }, [reloadClientes]);

  // Auto-open client detail when navigating via ?id=
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const clienteId = params.get('id');
    if (clienteId && clientesEjemplo.length > 0) {
      const found = clientesEjemplo.find((c) => String(c.id) === clienteId || String(c._id) === clienteId);
      if (found) {
        setClienteSeleccionado(found);
        setVistaActual('detalle');
        setActiveTab('clientes');
        // Clean the URL
        window.history.replaceState({}, '', window.location.pathname);
      }
    }
  }, [clientesEjemplo]);

  useEffect(() => {
    if (showModal) {
      crmService.propiedades.getAll().then((data) => {
        setPropiedadesList(Array.isArray(data) ? data : []);
      }).catch(() => setPropiedadesList([]));
      crmService.agentes.forAssignment().then((data) => {
        setAgentesOptions(Array.isArray(data) ? data : []);
      }).catch(() => setAgentesOptions([]));
      setPropSearch('');
      setInteresInput('');
    }
  }, [showModal]);

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
  const leadsCalientes = clientesEjemplo.filter(c => c.scoring >= 80).length;
  const enNegociacion = clientesEjemplo.filter(c => c.estado === 'Negociación').length;
  const cerrados = clientesEjemplo.filter(c => c.estado === 'Cerrado').length;
  const conversionRate = clientesEjemplo.length > 0 ? Math.round((cerrados / clientesEjemplo.length) * 100) : 0;

  const kpisClientes = [
    { title: 'Total Clientes', value: clientesEjemplo.length, desc: `${clientesEjemplo.filter(c => c.estado === 'Lead').length} leads activos`, icon: <FaUsers />, color: 'from-blue-500 to-blue-600', trend: '+12%' },
    { title: 'Leads Calientes', value: leadsCalientes, desc: 'Scoring > 80', icon: <FaFire />, color: 'from-red-500 to-red-600', trend: '+8%' },
    { title: 'En Negociación', value: enNegociacion, desc: 'Próximos a cerrar', icon: <FaChartLine />, color: 'from-emerald-500 to-emerald-600', trend: '+15%' },
    { title: 'Tasa Conversión', value: `${conversionRate}%`, desc: 'Lead → Cliente', icon: <FaTags />, color: 'from-violet-500 to-violet-600', trend: '+5%' },
  ];

  // ApexCharts configurations
  const cicloVidaDonutOptions = {
    chart: { type: 'donut', height: 280, background: 'transparent' },
    labels: ['Lead', 'Contacto', 'Prospecto', 'Negociación', 'Cerrado'],
    colors: ['#F59E0B', '#3B82F6', '#8B5CF6', '#F97316', '#10B981'],
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: { show: true, fontSize: '12px', fontWeight: 600, color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' },
            value: { show: true, fontSize: '20px', fontWeight: 700, color: currentMode === 'Dark' ? '#F3F4F6' : '#1F2937' },
            total: { show: true, label: 'Total', fontSize: '11px', color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', formatter: () => clientesEjemplo.length },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    legend: { show: true, position: 'bottom', fontSize: '11px', labels: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' } },
    stroke: { show: false },
    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light' },
  };
  const cicloVidaDonutSeries = [
    clientesEjemplo.filter(c => c.estado === 'Lead').length,
    clientesEjemplo.filter(c => c.estado === 'Contacto').length,
    clientesEjemplo.filter(c => c.estado === 'Prospecto').length,
    clientesEjemplo.filter(c => c.estado === 'Negociación').length,
    clientesEjemplo.filter(c => c.estado === 'Cerrado').length,
  ];

  const funnelOptions = {
    chart: { type: 'bar', height: 200, background: 'transparent', toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 6, horizontal: true, distributed: true, barHeight: '70%' } },
    colors: ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981'],
    dataLabels: { enabled: true, textAnchor: 'start', style: { colors: ['#fff'], fontSize: '11px', fontWeight: 600 }, formatter: (val, opt) => `${opt.w.globals.labels[opt.dataPointIndex]}: ${val}`, offsetX: 5 },
    xaxis: { categories: ['Captados', 'Contactados', 'Negociación', 'Cerrados'], labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { show: false } },
    grid: { show: false },
    legend: { show: false },
    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light', y: { formatter: (val) => `${val} clientes` } },
  };
  const funnelSeries = [{ name: 'Clientes', data: [clientesEjemplo.length, clientesEjemplo.filter(c => c.estado !== 'Lead').length, enNegociacion, cerrados] }];

  const conversionRadialOptions = {
    chart: { type: 'radialBar', height: 200, background: 'transparent' },
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
    fill: { type: 'gradient', gradient: { shade: 'dark', type: 'horizontal', colorStops: [{ offset: 0, color: '#8B5CF6', opacity: 1 }, { offset: 100, color: '#6366F1', opacity: 1 }] } },
    stroke: { lineCap: 'round' },
    labels: ['Conversión'],
  };
  const conversionRadialSeries = [conversionRate];

  const scoringAreaOptions = {
    chart: { type: 'area', height: 260, background: 'transparent', toolbar: { show: false }, zoom: { enabled: false } },
    colors: ['#10B981', '#F59E0B'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2.5 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] } },
    xaxis: {
      categories: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
      labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '10px' } },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '10px' } } },
    grid: { borderColor: currentMode === 'Dark' ? '#374151' : '#E5E7EB', strokeDashArray: 4 },
    legend: { show: true, position: 'top', horizontalAlign: 'right', fontSize: '11px', labels: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' } },
    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light' },
  };
  const scoringAreaSeries = [
    { name: 'Nuevos Leads', data: [12, 18, 15, 22, 28, clientesEjemplo.filter(c => c.estado === 'Lead').length] },
    { name: 'Conversiones', data: [3, 5, 4, 7, 9, cerrados] },
  ];

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

  const handleAgenteChange = (e) => {
    const id = e.target.value;
    const found = agentesOptions.find((a) => a._id === id);
    setNuevoCliente(prev => ({
      ...prev,
      agenteId: id,
      agenteNombre: found ? found.nombre : '',
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
      
      {/* Botones de Navegación */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button 
          onClick={() => { volverAlDashboard(); setActiveTab('metricas'); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-md ${vistaActual !== 'detalle' && activeTab === 'metricas' ? 'bg-blue-500 text-white' : isDark ? 'border border-gray-600 text-gray-200 hover:bg-gray-700' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
        >
          <FaChartLine /> Métricas de Clientes
        </button>
        <button
          type="button"
          onClick={() => { volverAlDashboard(); setActiveTab('clientes'); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-md ${vistaActual !== 'detalle' && activeTab === 'clientes' ? 'bg-emerald-500 text-white' : isDark ? 'border border-gray-600 text-gray-200 hover:bg-gray-700' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
        >
          <FaUsers /> Ver Clientes
        </button>
        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium bg-blue-500 hover:bg-blue-600 transition-all shadow-sm hover:shadow-md"
        >
          <FaPlus /> Nuevo Cliente
        </button>
      </div>

      {/* Tab: Métricas */}
      {vistaActual !== 'detalle' && activeTab === 'metricas' && (
        <>
      {/* KPIs de Clientes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpisClientes.map((kpi, i) => {
          const colorMap = { 'from-blue-500 to-blue-600': '#3b82f6', 'from-red-500 to-red-600': '#ef4444', 'from-emerald-500 to-emerald-600': '#10b981', 'from-violet-500 to-violet-600': '#8b5cf6' };
          const accentColor = colorMap[kpi.color] || '#6366f1';
          const bgMap = { 'from-blue-500 to-blue-600': 'bg-blue-50 dark:bg-blue-900/20', 'from-red-500 to-red-600': 'bg-red-50 dark:bg-red-900/20', 'from-emerald-500 to-emerald-600': 'bg-emerald-50 dark:bg-emerald-900/20', 'from-violet-500 to-violet-600': 'bg-purple-50 dark:bg-purple-900/20' };
          const bgColor = bgMap[kpi.color] || 'bg-indigo-50 dark:bg-indigo-900/20';
          return (
            <div 
              key={i} 
              onClick={() => {
                if (i === 0) setShowModalTotalClientes(true);
                else if (i === 1) setShowModalLeadsCalientes(true);
                else if (i === 2) setShowModalEnNegociacion(true);
                else if (i === 3) setShowModalConversion(true);
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
        {/* Tasa de Conversión */}
        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-1">
            <FaTags className="text-violet-500" />
            <h3 className="font-semibold dark:text-gray-100">Conversión</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Lead → Cliente</p>
          <Chart options={conversionRadialOptions} series={conversionRadialSeries} type="radialBar" height={180} />
          <div className="flex justify-between items-center pt-3 border-t dark:border-gray-700">
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{cerrados}</p>
              <p className="text-xs text-gray-500">Cerrados</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-500">{clientesEjemplo.length}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>

        {/* Ciclo de Vida - Donut */}
        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-1">
            <FaChartLine className="text-blue-500" />
            <h3 className="font-semibold dark:text-gray-100">Ciclo de Vida</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Distribución por etapa</p>
          <Chart options={cicloVidaDonutOptions} series={cicloVidaDonutSeries} type="donut" height={260} />
        </div>

        {/* Funnel de Conversión */}
        <div className={`xl:col-span-2 ${cardBase}`}>
          <div className="flex items-center gap-2 mb-1">
            <FaFire className="text-orange-500" />
            <h3 className="font-semibold dark:text-gray-100">Funnel de Clientes</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Proceso de conversión</p>
          <Chart options={funnelOptions} series={funnelSeries} type="bar" height={180} />
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t dark:border-gray-700">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded text-center">
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{conversionRate}%</p>
              <p className="text-xs text-gray-500">Tasa Cierre</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-center">
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{clientesEjemplo.length > 0 ? Math.round((clientesEjemplo.filter(c => c.estado !== 'Lead').length / clientesEjemplo.length) * 100) : 0}%</p>
              <p className="text-xs text-gray-500">Contactados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Tendencias - Full Width */}
      <div className="mb-8">
        <div className={cardBase}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <FaUsers className="text-emerald-500" />
                <h3 className="font-semibold dark:text-gray-100">Tendencia de Captación</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Nuevos leads vs conversiones mensuales</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Leads</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Conversiones</span>
              </div>
            </div>
          </div>
          <Chart options={scoringAreaOptions} series={scoringAreaSeries} type="area" height={240} />
          <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t dark:border-gray-700">
            <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{clientesEjemplo.length}</p>
              <p className="text-xs text-gray-500">Total Clientes</p>
            </div>
            <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-xl font-bold text-red-600 dark:text-red-400">{leadsCalientes}</p>
              <p className="text-xs text-gray-500">Leads Calientes</p>
            </div>
            <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{enNegociacion}</p>
              <p className="text-xs text-gray-500">En Negociación</p>
            </div>
            <div className="text-center p-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
              <p className="text-xl font-bold text-violet-600 dark:text-violet-400">+12%</p>
              <p className="text-xs text-gray-500">vs Mes Ant.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Clientes y Lead Scoring */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Grid Principal */}
        <div className={`xl:col-span-2 ${cardBase}`}>
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">👥 Base de Datos de Clientes</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <th className="text-left py-3 px-3 font-semibold dark:text-gray-300">Cliente</th>
                  <th className="text-left py-3 px-3 font-semibold dark:text-gray-300">Tipo</th>
                  <th className="text-left py-3 px-3 font-semibold dark:text-gray-300">Estado</th>
                  <th className="text-right py-3 px-3 font-semibold dark:text-gray-300">Presupuesto</th>
                  <th className="text-left py-3 px-3 font-semibold dark:text-gray-300">Zona</th>
                  <th className="text-center py-3 px-3 font-semibold dark:text-gray-300">Scoring</th>
                </tr>
              </thead>
              <tbody>
                {clientesEjemplo.slice(0, 10).map((c) => (
                  <tr key={c.id} className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-100 hover:bg-gray-50'} cursor-pointer`} onClick={() => verDetalle(c)}>
                    <td className="py-2.5 px-3 dark:text-gray-200">{c.nombre}</td>
                    <td className="py-2.5 px-3 dark:text-gray-300">{c.tipo}</td>
                    <td className="py-2.5 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        c.estado === 'Lead' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        : c.estado === 'Negociación' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        : c.estado === 'Cerrado' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>{c.estado}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right dark:text-gray-300">${Number(c.presupuesto || 0).toLocaleString()}</td>
                    <td className="py-2.5 px-3 dark:text-gray-300">{c.zona}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        c.scoring >= 80 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                        : c.scoring >= 60 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                      }`}>{c.scoring}</span>
                    </td>
                  </tr>
                ))}
                {!clientesEjemplo.length && (
                  <tr><td colSpan={6} className="py-8 text-center text-gray-400">No hay clientes registrados</td></tr>
                )}
              </tbody>
            </table>
          </div>
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
          {/* Filtro por tipo */}
          <div className={`${cardBase} mb-6`}>
            <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">🔍 Filtrar por tipo de cliente</h3>
            <div className="flex flex-wrap gap-6">
              <label htmlFor="filtro-comprador" className="flex items-center gap-3 cursor-pointer">
                <input
                  id="filtro-comprador"
                  type="radio"
                  name="filtroTipoAdmin"
                  checked={filtroTipo === 'comprador'}
                  onChange={() => setFiltroTipo('comprador')}
                  className="w-5 h-5 text-blue-600 accent-blue-600"
                />
                <span className="text-sm font-medium dark:text-gray-200">Compradores</span>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  {clientesEjemplo.filter((c) => c.tipo === 'Comprador').length}
                </span>
              </label>
              <label htmlFor="filtro-propietario" className="flex items-center gap-3 cursor-pointer">
                <input
                  id="filtro-propietario"
                  type="radio"
                  name="filtroTipoAdmin"
                  checked={filtroTipo === 'propietario'}
                  onChange={() => setFiltroTipo('propietario')}
                  className="w-5 h-5 text-blue-600 accent-blue-600"
                />
                <span className="text-sm font-medium dark:text-gray-200">Propietarios</span>
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  {clientesEjemplo.filter((c) => c.tipo === 'Propietario').length}
                </span>
              </label>
              <label htmlFor="filtro-inversor" className="flex items-center gap-3 cursor-pointer">
                <input
                  id="filtro-inversor"
                  type="radio"
                  name="filtroTipoAdmin"
                  checked={filtroTipo === 'inversor'}
                  onChange={() => setFiltroTipo('inversor')}
                  className="w-5 h-5 text-blue-600 accent-blue-600"
                />
                <span className="text-sm font-medium dark:text-gray-200">Inversores</span>
                <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  {clientesEjemplo.filter((c) => c.tipo === 'Inversor').length}
                </span>
              </label>
              <label htmlFor="filtro-todos" className="flex items-center gap-3 cursor-pointer">
                <input
                  id="filtro-todos"
                  type="radio"
                  name="filtroTipoAdmin"
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

              {/* Información Comercial */}
              {(clienteSeleccionado.propiedadConsultadaInicial?.id || (clienteSeleccionado.interesesCliente && clienteSeleccionado.interesesCliente.length > 0)) && (
                <div className={cardBase}>
                  <h3 className="text-xl font-bold mb-4 dark:text-gray-100 flex items-center gap-2">
                    <FaBuilding className="text-orange-500" /> Información Comercial
                  </h3>
                  <div className="space-y-4">
                    {clienteSeleccionado.propiedadConsultadaInicial?.id && (
                      <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Propiedad por la que consultó primero</p>
                        <div className="flex items-center gap-2">
                          <FaBuilding className="text-orange-500" />
                          <span className="font-semibold dark:text-gray-200">{clienteSeleccionado.propiedadConsultadaInicial.titulo}</span>
                        </div>
                        {clienteSeleccionado.propiedadConsultadaInicial.direccion && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{clienteSeleccionado.propiedadConsultadaInicial.direccion}</p>
                        )}
                      </div>
                    )}
                    {clienteSeleccionado.interesesCliente?.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-3 dark:text-gray-200">Intereses del cliente:</p>
                        <div className="flex flex-wrap gap-2">
                          {clienteSeleccionado.interesesCliente.map((interes, idx) => (
                            <span key={idx} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm">
                              {interes}
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
                    <p className="font-semibold dark:text-gray-200">{clienteSeleccionado.ultimaInteraccion}</p>
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
                      Nombre
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      value={nuevoCliente.nombre}
                      onChange={handleInputChange}
                      placeholder="Juan"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Apellido
                    </label>
                    <input
                      type="text"
                      name="apellido"
                      value={nuevoCliente.apellido}
                      onChange={handleInputChange}
                      placeholder="Pérez"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={nuevoCliente.email}
                      onChange={handleInputChange}
                      placeholder="juan@email.com"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Teléfono
                    </label>
                    <input
                      type="tel"
                      name="telefono"
                      value={nuevoCliente.telefono}
                      onChange={handleInputChange}
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

              {/* Clasificación CRM */}
              <div>
                <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 flex items-center gap-2">
                  <FaTags className="text-purple-500" /> Clasificación CRM
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Tipo de Cliente
                    </label>
                    <select
                      name="tipoCliente"
                      value={nuevoCliente.tipoCliente}
                      onChange={handleInputChange}
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
                      Estado en el Ciclo
                    </label>
                    <select
                      name="estado"
                      value={nuevoCliente.estado}
                      onChange={handleInputChange}
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
                      value={nuevoCliente.agenteId}
                      onChange={handleAgenteChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    >
                      <option value="">Sin asignar</option>
                      {agentesOptions.map((a) => (
                        <option key={a._id} value={a._id}>{a.nombre}{a.cargo ? ` — ${a.cargo}` : ''}</option>
                      ))}
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

              {/* Información Comercial */}
              <div>
                <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 flex items-center gap-2">
                  <FaBuilding className="text-orange-500" /> Información Comercial
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Propiedad por la que consultó primero
                    </label>
                    {nuevoCliente.propiedadConsultadaInicial?.id && (
                      <div className="flex items-center gap-2 mb-2 p-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg">
                        <FaBuilding className="text-orange-500 flex-shrink-0" />
                        <span className="flex-1 text-sm dark:text-gray-200">{nuevoCliente.propiedadConsultadaInicial.titulo}</span>
                        <button
                          type="button"
                          onClick={() => setNuevoCliente(prev => ({ ...prev, propiedadConsultadaInicial: { id: '', titulo: '', direccion: '' } }))}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    )}
                    <div className="relative">
                      <input
                        type="text"
                        value={propSearch}
                        onChange={(e) => setPropSearch(e.target.value)}
                        placeholder="Buscar por título o dirección..."
                        className="w-full px-4 py-2 pl-9 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                      />
                      <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    {propSearch.trim().length > 1 && (
                      <div className="mt-1 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                        {propiedadesList
                          .filter((p) => {
                            const q = propSearch.toLowerCase();
                            return (p.titulo || p.nombre || '').toLowerCase().includes(q) || (p.direccion || '').toLowerCase().includes(q);
                          })
                          .slice(0, 8)
                          .map((p) => (
                            <button
                              key={p._id || p.id}
                              type="button"
                              onClick={() => {
                                setNuevoCliente(prev => ({
                                  ...prev,
                                  propiedadConsultadaInicial: {
                                    id: String(p._id || p.id),
                                    titulo: p.titulo || p.nombre || 'Sin título',
                                    direccion: p.direccion || '',
                                  },
                                }));
                                setPropSearch('');
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-b dark:border-gray-700 last:border-0 text-sm dark:text-gray-200"
                            >
                              <span className="font-medium">{p.titulo || p.nombre || 'Sin título'}</span>
                              {p.direccion && <span className="text-gray-500 dark:text-gray-400 ml-2 text-xs">{p.direccion}</span>}
                            </button>
                          ))}
                        {propiedadesList.filter((p) => {
                          const q = propSearch.toLowerCase();
                          return (p.titulo || p.nombre || '').toLowerCase().includes(q) || (p.direccion || '').toLowerCase().includes(q);
                        }).length === 0 && (
                          <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">Sin resultados</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                      Intereses del cliente
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {nuevoCliente.interesesCliente.map((interes, idx) => (
                        <span key={idx} className="flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm">
                          {interes}
                          <button
                            type="button"
                            onClick={() => setNuevoCliente(prev => ({ ...prev, interesesCliente: prev.interesesCliente.filter((_, i) => i !== idx) }))}
                            className="text-blue-500 hover:text-red-500 ml-1"
                          >
                            <FaTimes className="text-xs" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={interesInput}
                        onChange={(e) => setInteresInput(e.target.value)}
                        onKeyDown={(e) => {
                          if ((e.key === 'Enter' || e.key === ',') && interesInput.trim()) {
                            e.preventDefault();
                            const val = interesInput.trim().replace(/,$/, '');
                            if (val && !nuevoCliente.interesesCliente.includes(val)) {
                              setNuevoCliente(prev => ({ ...prev, interesesCliente: [...prev.interesesCliente, val] }));
                            }
                            setInteresInput('');
                          }
                        }}
                        placeholder="Ej: inversión, alquiler, zona norte... (Enter para agregar)"
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = interesInput.trim();
                          if (val && !nuevoCliente.interesesCliente.includes(val)) {
                            setNuevoCliente(prev => ({ ...prev, interesesCliente: [...prev.interesesCliente, val] }));
                          }
                          setInteresInput('');
                        }}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        +
                      </button>
                    </div>
                  </div>
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
