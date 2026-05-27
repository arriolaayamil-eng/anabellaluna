import React, { useEffect, useMemo, useState } from 'react';

import { toast } from 'react-toastify';
import Chart from 'react-apexcharts';
import { FaCalendarPlus, FaSync, FaClock, FaUsers, FaPhoneAlt, FaBell, FaCheckCircle, FaTimes, FaSave, FaChartLine, FaArrowUp, FaPercentage, FaCalendarAlt, FaTasks } from 'react-icons/fa';

import { useStateContext } from '../contexts/ContextProvider';
import { crmService } from '../services/crmService';
import { Tareas } from './Tareas';

const Citas = () => {
  const { currentMode } = useStateContext();

  // Estado para calendario nativo
  const [calDate, setCalDate] = useState(new Date());
  const [calSelectedDay, setCalSelectedDay] = useState(null);

  // Estados para modales
  const [showModalCita, setShowModalCita] = useState(false);

  // Sección activa: agenda o tareas
  const [activeSection, setActiveSection] = useState('agenda');
  const [taskStats, setTaskStats] = useState(null);

  // Estados para modales de estadísticas
  const [showModalCitasHoy, setShowModalCitasHoy] = useState(false);
  const [showModalEstaSemana, setShowModalEstaSemana] = useState(false);
  const [showModalTasaAsistencia, setShowModalTasaAsistencia] = useState(false);
  const [showModalPendientes, setShowModalPendientes] = useState(false);

  // Estado para nueva cita
  const [nuevaCita, setNuevaCita] = useState({
    tipo: 'Visita',
    titulo: '',
    cliente: '',
    clienteId: '',
    propiedad: '',
    propiedadId: '',
    agente: '',
    inmobiliaria: '',
    inmobiliariaId: '',
    fecha: '',
    horaInicio: '',
    horaFin: '',
    ubicacion: '',
    descripcion: '',
    recordatorio: '24h',
  });

  // Autocomplete: clients & properties from DB
  const [clientesLista, setClientesLista] = useState([]);
  const [propiedadesLista, setPropiedadesLista] = useState([]);
  const [clienteQuery, setClienteQuery] = useState('');
  const [propQuery, setPropQuery] = useState('');
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const [showPropDropdown, setShowPropDropdown] = useState(false);
  const clienteRef = React.useRef(null);
  const propRef = React.useRef(null);

  useEffect(() => {
    crmService.clientes.getAll().then(data => setClientesLista(Array.isArray(data) ? data : [])).catch(() => {});
    crmService.propiedades.getAll().then(data => setPropiedadesLista(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (clienteRef.current && !clienteRef.current.contains(e.target)) setShowClienteDropdown(false);
      if (propRef.current && !propRef.current.contains(e.target)) setShowPropDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredClientes = clienteQuery.length >= 1
    ? clientesLista.filter(c => {
        const nombre = (c.nombre || '') + ' ' + (c.apellido || '');
        return nombre.toLowerCase().includes(clienteQuery.toLowerCase());
      }).slice(0, 8)
    : clientesLista.slice(0, 8);

  const filteredProps = propQuery.length >= 1
    ? propiedadesLista.filter(p => {
        const text = (p.title || '') + ' ' + (p.address || '') + ' ' + (p.metadata?.barrio || '');
        return text.toLowerCase().includes(propQuery.toLowerCase());
      }).slice(0, 8)
    : propiedadesLista.slice(0, 8);

  // Cargar estadísticas de tareas para las KPIs
  const loadTaskStats = async () => {
    try {
      const stats = await crmService.tareas.getStats();
      setTaskStats(stats || {});
    } catch { setTaskStats({}); }
  };

  useEffect(() => { loadTaskStats(); }, []);

  // Agentes e Inmobiliarias desde DB
  const [agentesLista, setAgentesLista] = useState([]);
  const [inmobiliariasLista, setInmobiliariasLista] = useState([]);
  const [contactoTipo, setContactoTipo] = useState('cliente'); // 'cliente' | 'inmobiliaria'
  const [inmoQuery, setInmoQuery] = useState('');
  const [showInmoDropdown, setShowInmoDropdown] = useState(false);
  const inmoRef = React.useRef(null);

  useEffect(() => {
    crmService.agentes?.getAll?.().then(data => {
      setAgentesLista(Array.isArray(data) ? data : []);
    }).catch(() => {});
    crmService.inmobiliarias?.getAll?.().then(data => {
      setInmobiliariasLista(Array.isArray(data) ? data : []);
    }).catch(() => {});
  }, []);

  // Close inmobiliaria dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (inmoRef.current && !inmoRef.current.contains(e.target)) setShowInmoDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredInmobiliarias = inmoQuery.length >= 1
    ? inmobiliariasLista.filter(i => (i.nombre || '').toLowerCase().includes(inmoQuery.toLowerCase())).slice(0, 8)
    : inmobiliariasLista.slice(0, 8);

  const [citasItems, setCitasItems] = useState([]);
  const [citasLoading, setCitasLoading] = useState(false);
  const [citasError, setCitasError] = useState('');

  const reloadCitas = async () => {
    setCitasLoading(true);
    setCitasError('');
    try {
      const items = await crmService.citas.getAll();
      setCitasItems(Array.isArray(items) ? items : []);
    } catch (e) {
      setCitasError(e?.message || 'Error al cargar citas');
      setCitasItems([]);
    } finally {
      setCitasLoading(false);
    }
  };

  useEffect(() => {
    reloadCitas();
  }, []);

  const citasData = useMemo(() => (Array.isArray(citasItems) ? citasItems : []).map((c) => {
    const md = c && c.metadata ? c.metadata : {};
    const contact = md.contact || {};
    const start = c.fecha ? new Date(c.fecha) : new Date();
    const end = c.fechaFin ? new Date(c.fechaFin) : new Date(start.getTime() + 60 * 60 * 1000);
    return {
      Id: c._id || c.id,
      Subject: c.titulo || c.tipo || 'Cita',
      StartTime: start,
      EndTime: end,
      Description: c.notas || '',
      IsAllDay: false,
      tipo: c.tipo || '',
      cliente: contact.fullName || md.clienteNombre || '',
      agente: '',
      estado: c.estado || '',
    };
  }), [citasItems]);

  // KPIs de Citas
  const kpisCitas = [
    { title: 'Citas Hoy', value: citasData.filter((c) => c.StartTime.toDateString() === new Date().toDateString()).length, desc: '2 confirmadas', icon: <FaClock />, color: 'from-blue-500 to-blue-600' },
    { title: 'Esta Semana', value: citasData.length, desc: '3 visitas programadas', icon: <FaCalendarPlus />, color: 'from-green-500 to-green-600' },
    { title: 'Tasa Asistencia', value: '85%', desc: 'Últimos 30 días', icon: <FaCheckCircle />, color: 'from-purple-500 to-purple-600' },
    { title: 'Pendientes', value: citasData.filter((c) => c.estado === 'Programada' || c.estado === 'Pendiente').length, desc: 'Por confirmar', icon: <FaBell />, color: 'from-orange-500 to-orange-600' },
  ];

  // Datos para gráficos
  const tiposCitasData = [
    { tipo: 'Visita', cantidad: citasData.filter((c) => c.tipo === 'Visita').length, fill: '#3B82F6' },
    { tipo: 'Reunión', cantidad: citasData.filter((c) => c.tipo === 'Reunión').length, fill: '#10B981' },
    { tipo: 'Firma', cantidad: citasData.filter((c) => c.tipo === 'Firma').length, fill: '#F59E0B' },
    { tipo: 'Llamada', cantidad: citasData.filter((c) => c.tipo === 'Llamada').length, fill: '#8B5CF6' },
  ];

  const citasPorDia = [
    { dia: 'Lun', cantidad: 3 },
    { dia: 'Mar', cantidad: 5 },
    { dia: 'Mié', cantidad: 2 },
    { dia: 'Jue', cantidad: 4 },
    { dia: 'Vie', cantidad: 6 },
    { dia: 'Sáb', cantidad: 1 },
    { dia: 'Dom', cantidad: 0 },
  ];

  // ApexCharts - Distribución de Citas (Donut)
  const citasDonutOptions = {
    chart: { type: 'donut', height: 220, background: 'transparent' },
    labels: ['Visita', 'Reunión', 'Firma', 'Llamada'],
    colors: ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'],
    plotOptions: { pie: { donut: { size: '65%', labels: { show: true, name: { fontSize: '11px', color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' }, value: { fontSize: '18px', fontWeight: 700, color: currentMode === 'Dark' ? '#F3F4F6' : '#1F2937' }, total: { show: true, label: 'Total', fontSize: '10px', color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', formatter: () => citasData.length || '0' } } } } },
    dataLabels: { enabled: false },
    legend: { show: true, position: 'bottom', fontSize: '10px', labels: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' } },
    stroke: { show: false },
    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light' },
  };
  const citasDonutSeries = tiposCitasData.map((t) => t.cantidad);

  // ApexCharts - Citas por Día (Bar)
  const citasDiaOptions = {
    chart: { type: 'bar', height: 200, background: 'transparent', toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 6, columnWidth: '50%', distributed: true } },
    colors: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6B7280', '#9CA3AF'],
    dataLabels: { enabled: false },
    xaxis: { categories: citasPorDia.map((c) => c.dia), labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '10px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '10px' } } },
    grid: { borderColor: currentMode === 'Dark' ? '#374151' : '#E5E7EB', strokeDashArray: 4 },
    legend: { show: false },
    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light' },
  };
  const citasDiaSeries = [{ name: 'Citas', data: citasPorDia.map((c) => c.cantidad) }];

  // ApexCharts - Tasa de Asistencia (Gauge)
  const asistenciaOptions = {
    chart: { type: 'radialBar', height: 180, background: 'transparent', sparkline: { enabled: true } },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        hollow: { size: '55%' },
        track: { background: currentMode === 'Dark' ? '#374151' : '#E5E7EB', strokeWidth: '100%' },
        dataLabels: {
          name: { show: true, fontSize: '10px', color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', offsetY: 16 },
          value: { show: true, fontSize: '22px', fontWeight: 700, color: currentMode === 'Dark' ? '#F3F4F6' : '#1F2937', offsetY: -10, formatter: (val) => `${val}%` },
        },
      },
    },
    fill: { type: 'gradient', gradient: { shade: 'dark', colorStops: [{ offset: 0, color: '#8B5CF6', opacity: 1 }, { offset: 100, color: '#6366F1', opacity: 1 }] } },
    stroke: { lineCap: 'round' },
    labels: ['Asistencia'],
  };
  const asistenciaSeries = [85];

  // ApexCharts - Tendencia Semanal (Area)
  const tendenciaSemanalOptions = {
    chart: { type: 'area', height: 200, background: 'transparent', toolbar: { show: false }, zoom: { enabled: false }, sparkline: { enabled: false } },
    colors: ['#3B82F6'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2.5 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] } },
    xaxis: { categories: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'], labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '10px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '10px' } } },
    grid: { borderColor: currentMode === 'Dark' ? '#374151' : '#E5E7EB', strokeDashArray: 4 },
    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light' },
  };
  const tendenciaSemanalSeries = [{ name: 'Citas', data: [12, 18, 15, 21] }];

  const isDark = currentMode === 'Dark';
  const cardBase = `rounded-2xl p-6 border transition-shadow ${isDark ? 'bg-secondary-dark-bg border-gray-700/50 hover:border-indigo-500/30' : 'bg-white border-gray-100 shadow-md hover:shadow-lg'}`;

  // Funciones de manejo para Cita
  const handleCitaChange = (e) => {
    const { name, value } = e.target;
    setNuevaCita((prev) => ({ ...prev, [name]: value }));
  };

  const handleCitaSubmit = async (e) => {
    e.preventDefault();
    setCitasError('');

    try {
      const hora = nuevaCita.horaInicio || '00:00';
      const startStr = `${nuevaCita.fecha}T${hora}`;
      const endStr = nuevaCita.horaFin ? `${nuevaCita.fecha}T${nuevaCita.horaFin}` : '';
      const start = new Date(startStr);
      const end = endStr ? new Date(endStr) : new Date(start.getTime() + 60 * 60 * 1000);
      if (Number.isNaN(start.getTime())) throw new Error('Fecha inválida');

      // If inmobiliaria mode and new name (no ID), auto-create it
      let inmobiliariaId = nuevaCita.inmobiliariaId || null;
      let inmobiliariaNombre = nuevaCita.inmobiliaria || null;
      if (contactoTipo === 'inmobiliaria' && inmobiliariaNombre && !inmobiliariaId) {
        try {
          const created = await crmService.inmobiliarias.create({ nombre: inmobiliariaNombre });
          inmobiliariaId = created._id || created.id || null;
          setInmobiliariasLista(prev => [...prev, created]);
        } catch (_e) { /* will still save cita with name only */ }
      }

      await crmService.citas.create({
        fecha: start.toISOString(),
        fechaFin: end.toISOString(),
        titulo: nuevaCita.titulo,
        tipo: nuevaCita.tipo,
        ubicacion: nuevaCita.ubicacion,
        notas: nuevaCita.descripcion,
        estado: 'Programada',
        agenteNombre: nuevaCita.agente || null,
        metadata: {
          contactoTipo,
          clienteNombre: contactoTipo === 'cliente' ? nuevaCita.cliente : null,
          clienteId: contactoTipo === 'cliente' ? (nuevaCita.clienteId || null) : null,
          inmobiliariaNombre: contactoTipo === 'inmobiliaria' ? inmobiliariaNombre : null,
          inmobiliariaId: contactoTipo === 'inmobiliaria' ? inmobiliariaId : null,
          propiedadNombre: nuevaCita.propiedad,
          propiedadId: nuevaCita.propiedadId || null,
          agenteNombre: nuevaCita.agente || null,
          recordatorio: nuevaCita.recordatorio,
          horaInicio: nuevaCita.horaInicio || null,
          horaFin: nuevaCita.horaFin || null,
          source: 'crm_agent',
        },
      });

      await reloadCitas();
      // Check milestones (non-blocking)
      crmService.rewards.checkMilestones('appointment').catch(() => {});
      toast.success('¡Cita agendada exitosamente!');
      setShowModalCita(false);
      setClienteQuery('');
      setPropQuery('');
      setInmoQuery('');
      setContactoTipo('cliente');
      setNuevaCita({
        tipo: 'Visita',
        titulo: '',
        cliente: '',
        clienteId: '',
        propiedad: '',
        propiedadId: '',
        agente: '',
        inmobiliaria: '',
        inmobiliariaId: '',
        fecha: '',
        horaInicio: '',
        horaFin: '',
        ubicacion: '',
        descripcion: '',
        recordatorio: '24h',
      });
    } catch (err) {
      setCitasError(err?.message || 'No se pudo agendar la cita');
    }
  };


  return (
    <div className={`min-h-screen px-6 lg:px-8 pt-4 pb-6 ${isDark ? 'bg-main-dark-bg' : 'bg-gray-50'}`}>
      <div className="mb-6">
        <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <FaCalendarAlt className="text-blue-500" /> Agenda y Citas
        </h2>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Gestión de citas, calendario y tareas</p>
      </div>

      {/* Tab Switcher + Acciones */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div className={`flex rounded-xl overflow-hidden border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <button onClick={() => setActiveSection('agenda')} className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors ${activeSection === 'agenda' ? 'bg-blue-500 text-white' : isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-50'}`}>
            <FaCalendarAlt /> Agenda y Citas
          </button>
          <button onClick={() => setActiveSection('tareas')} className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-colors ${activeSection === 'tareas' ? 'bg-indigo-500 text-white' : isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-50'}`}>
            <FaTasks /> Gestión de Tareas
          </button>
        </div>
        {activeSection === 'agenda' && (
          <button type="button" onClick={() => setShowModalCita(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium bg-blue-500 hover:bg-blue-600 transition-all shadow-sm hover:shadow-md">
            <FaCalendarPlus /> Nueva Cita
          </button>
        )}
      </div>

      {/* KPIs de Citas - Clickeables */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {kpisCitas.map((kpi, i) => {
          const colorMap = {
            'from-blue-500 to-blue-600': '#3b82f6',
            'from-green-500 to-green-600': '#10b981',
            'from-purple-500 to-purple-600': '#8b5cf6',
            'from-orange-500 to-orange-600': '#f59e0b',
          };
          const bgMap = {
            'from-blue-500 to-blue-600': 'bg-blue-50 dark:bg-blue-900/20',
            'from-green-500 to-green-600': 'bg-emerald-50 dark:bg-emerald-900/20',
            'from-purple-500 to-purple-600': 'bg-purple-50 dark:bg-purple-900/20',
            'from-orange-500 to-orange-600': 'bg-amber-50 dark:bg-amber-900/20',
          };
          const accentColor = colorMap[kpi.color] || '#6366f1';
          const bgColor = bgMap[kpi.color] || 'bg-indigo-50 dark:bg-indigo-900/20';
          return (
            <div
              key={i}
              onClick={() => {
                if (i === 0) setShowModalCitasHoy(true);
                else if (i === 1) setShowModalEstaSemana(true);
                else if (i === 2) setShowModalTasaAsistencia(true);
                else if (i === 3) setShowModalPendientes(true);
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

      {/* ===== TAREAS SECTION ===== */}
      {activeSection === 'tareas' && (
        <Tareas embedded />
      )}

      {/* ===== AGENDA SECTION ===== */}
      {activeSection === 'agenda' && (<>

      {/* Gráficos ApexCharts - Métricas de Agenda */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">
        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-1">
            <FaPercentage className="text-purple-500" />
            <h3 className="font-semibold dark:text-gray-100 text-sm">Tasa Asistencia</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Efectividad de citas</p>
          <Chart options={asistenciaOptions} series={asistenciaSeries} type="radialBar" height={160} />
          <div className="space-y-2 mt-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600 dark:text-gray-400">Objetivo</span>
              <span className="font-bold text-gray-500">90%</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600 dark:text-gray-400">Actual</span>
              <span className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                <FaArrowUp className="text-xs" /> 85%
              </span>
            </div>
          </div>
        </div>

        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-1">
            <FaCalendarAlt className="text-blue-500" />
            <h3 className="font-semibold dark:text-gray-100 text-sm">Tipos de Citas</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Distribución actual</p>
          <Chart options={citasDonutOptions} series={citasDonutSeries} type="donut" height={200} />
        </div>

        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-1">
            <FaClock className="text-emerald-500" />
            <h3 className="font-semibold dark:text-gray-100 text-sm">Citas por Día</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Esta semana</p>
          <Chart options={citasDiaOptions} series={citasDiaSeries} type="bar" height={180} />
        </div>

        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-1">
            <FaChartLine className="text-orange-500" />
            <h3 className="font-semibold dark:text-gray-100 text-sm">Tendencia Mensual</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Últimas 4 semanas</p>
          <Chart options={tendenciaSemanalOptions} series={tendenciaSemanalSeries} type="area" height={180} />
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t dark:border-gray-700">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-center">
              <p className="text-sm font-bold text-blue-600 dark:text-blue-400">66</p>
              <p className="text-xs text-gray-500">Total Mes</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded text-center">
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">+12%</p>
              <p className="text-xs text-gray-500">vs Ant.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendario Principal y Próximas Citas */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className={`xl:col-span-2 ${cardBase}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold dark:text-gray-100">📅 Calendario Completo</h3>
            <button
              type="button"
              onClick={reloadCitas}
              disabled={citasLoading}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <FaSync className={citasLoading ? 'animate-spin' : ''} />
              {citasLoading ? 'Cargando...' : 'Actualizar'}
            </button>
          </div>
          {citasError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {citasError}
            </div>
          )}
          {/* Native Monthly Calendar */}
          {(() => {
            const year = calDate.getFullYear();
            const month = calDate.getMonth();
            const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
            const dayNames = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
            const firstDay = new Date(year, month, 1);
            const startDow = (firstDay.getDay() + 6) % 7;
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const cells = [];
            for (let i = 0; i < startDow; i++) cells.push(null);
            for (let d = 1; d <= daysInMonth; d++) cells.push(d);
            while (cells.length % 7 !== 0) cells.push(null);
            const today = new Date();
            const typeColor = { 'Visita': '#3B82F6', 'Reunión': '#10B981', 'Firma': '#F59E0B', 'Llamada': '#8B5CF6', 'Foto/Video': '#EC4899' };
            return (
              <div style={{ minHeight: 520 }}>
                <div className="flex items-center justify-between mb-4">
                  <button type="button" onClick={() => setCalDate(new Date(year, month - 1, 1))} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>‹ Ant.</button>
                  <span className={`font-semibold text-base ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{monthNames[month]} {year}</span>
                  <button type="button" onClick={() => setCalDate(new Date(year, month + 1, 1))} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Sig. ›</button>
                </div>
                <div className="grid grid-cols-7 mb-1">
                  {dayNames.map(d => (
                    <div key={d} className={`text-center text-xs font-semibold py-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {cells.map((day, idx) => {
                    if (!day) return <div key={idx} />;
                    const cellDate = new Date(year, month, day);
                    const isToday = cellDate.toDateString() === today.toDateString();
                    const isSelected = calSelectedDay && cellDate.toDateString() === calSelectedDay.toDateString();
                    const dayCitas = citasData.filter(c => c.StartTime.toDateString() === cellDate.toDateString());
                    return (
                      <div
                        key={idx}
                        onClick={() => setCalSelectedDay(isSelected ? null : cellDate)}
                        className={`relative rounded-lg p-1 min-h-[70px] cursor-pointer border transition-all ${
                          isSelected ? 'border-blue-500 ring-2 ring-blue-300' :
                          isToday ? 'border-blue-400' :
                          isDark ? 'border-gray-700 hover:border-gray-500' : 'border-gray-100 hover:border-gray-300'
                        } ${isDark ? 'bg-gray-800' : 'bg-white'}`}
                      >
                        <span className={`text-xs font-bold block mb-1 ${
                          isToday ? 'bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-center' :
                          isDark ? 'text-gray-300' : 'text-gray-700'
                        }`}>{day}</span>
                        <div className="space-y-0.5">
                          {dayCitas.slice(0, 3).map((c, ci) => (
                            <div key={ci} className="text-xs truncate rounded px-1 py-0.5 text-white font-medium" style={{ backgroundColor: typeColor[c.tipo] || '#6B7280', fontSize: '10px' }}>
                              {c.StartTime.getHours()}:{c.StartTime.getMinutes().toString().padStart(2,'0')} {c.Subject}
                            </div>
                          ))}
                          {dayCitas.length > 3 && (
                            <div className="text-xs text-gray-400 pl-1">+{dayCitas.length - 3} más</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {calSelectedDay && (() => {
                  const sel = citasData.filter(c => c.StartTime.toDateString() === calSelectedDay.toDateString()).sort((a,b) => a.StartTime - b.StartTime);
                  return (
                    <div className={`mt-4 p-4 rounded-xl border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className={`font-semibold text-sm ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>
                          Citas del {calSelectedDay.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </h4>
                        <button type="button" onClick={() => setCalSelectedDay(null)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
                      </div>
                      {sel.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-2">No hay citas este día</p>
                      ) : (
                        <div className="space-y-2">
                          {sel.map((c, i) => (
                            <div key={i} className={`flex items-center gap-3 p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white'} border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                              <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: typeColor[c.tipo] || '#6B7280' }} />
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{c.Subject}</p>
                                <p className="text-xs text-gray-400">{c.tipo} · {c.cliente || ''} · {c.StartTime.getHours()}:{c.StartTime.getMinutes().toString().padStart(2,'0')}–{c.EndTime.getHours()}:{c.EndTime.getMinutes().toString().padStart(2,'0')}</p>
                              </div>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                                c.estado === 'Confirmada' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : c.estado === 'Pendiente' ? 'bg-amber-100 text-amber-700'
                                : 'bg-blue-100 text-blue-700'
                              }`}>{c.estado || 'Programada'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })()}
        </div>

        {/* Próximas citas */}
        <div className={cardBase}>
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">📋 Próximas Citas</h3>
          <div className="space-y-3">
            {citasData
              .filter(c => c.StartTime >= new Date())
              .sort((a, b) => a.StartTime - b.StartTime)
              .slice(0, 6)
              .map((c, i) => (
                <div key={i} className={`p-3 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{c.Subject}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {c.StartTime.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} · {c.StartTime.getHours()}:{c.StartTime.getMinutes().toString().padStart(2,'0')} · {c.tipo}
                  </p>
                </div>
              ))}
            {citasData.filter(c => c.StartTime >= new Date()).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No hay citas próximas</p>
            )}
          </div>
        </div>
      </div>

      {/* Panel de Seguimiento Post-Cita */}
      <div className={cardBase}>
        <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">📋 Seguimiento Post-Cita</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="p-6 border-2 border-green-500 rounded-lg hover:bg-green-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
              <FaCheckCircle className="text-4xl text-green-500 mx-auto mb-3" />
              <h4 className="font-bold dark:text-gray-200">Completadas</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Citas finalizadas</p>
              <p className="text-2xl font-bold text-green-600 mt-2">18</p>
              <p className="text-xs text-gray-500">Esta semana</p>
            </div>
          </div>

          <div className="text-center">
            <div className="p-6 border-2 border-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
              <FaUsers className="text-4xl text-blue-500 mx-auto mb-3" />
              <h4 className="font-bold dark:text-gray-200">Interesados</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Clientes con interés</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">12</p>
              <p className="text-xs text-gray-500">Requieren seguimiento</p>
            </div>
          </div>

          <div className="text-center">
            <div className="p-6 border-2 border-yellow-500 rounded-lg hover:bg-yellow-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
              <FaClock className="text-4xl text-yellow-500 mx-auto mb-3" />
              <h4 className="font-bold dark:text-gray-200">Reagendar</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Citas a reprogramar</p>
              <p className="text-2xl font-bold text-yellow-600 mt-2">3</p>
              <p className="text-xs text-gray-500">Pendientes</p>
            </div>
          </div>

          <div className="text-center">
            <div className="p-6 border-2 border-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
              <FaPhoneAlt className="text-4xl text-red-500 mx-auto mb-3" />
              <h4 className="font-bold dark:text-gray-200">No Contactados</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Sin respuesta</p>
              <p className="text-2xl font-bold text-red-600 mt-2">2</p>
              <p className="text-xs text-gray-500">Requieren atención</p>
            </div>
          </div>
        </div>
      </div>

      </>)}
      {/* END AGENDA SECTION */}

      {/* Modal de Nueva Cita */}
      {showModalCita && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaCalendarPlus /> Nueva Cita
                </h2>
                <p className="text-blue-100 text-sm mt-1">Agendar una nueva cita o reunión</p>
              </div>
              <button type="button" onClick={() => setShowModalCita(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleCitaSubmit} className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 flex items-center gap-2">
                    <FaClock className="text-blue-500" /> Información de la Cita
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-gray-200">Tipo de Cita *</label>
                      <select name="tipo" value={nuevaCita.tipo} onChange={handleCitaChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100">
                        <option value="Visita">Visita a Propiedad</option>
                        <option value="Reunión">Reunión</option>
                        <option value="Firma">Firma de Contrato</option>
                        <option value="Llamada">Llamada</option>
                        <option value="Videollamada">Videollamada</option>
                        <option value="Foto/Video">Foto/Video de Propiedad</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-gray-200">Título *</label>
                      <input type="text" name="titulo" value={nuevaCita.titulo} onChange={handleCitaChange} required placeholder="Ej: Visita Depto Palermo" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2 dark:text-gray-200">Contacto *</label>
                      <div className="flex items-center gap-4 mb-3">
                        <label className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border transition-colors ${contactoTipo === 'cliente' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : 'border-gray-300 dark:border-gray-600 dark:text-gray-400'}`}>
                          <input type="radio" name="contactoTipo" value="cliente" checked={contactoTipo === 'cliente'} onChange={() => { setContactoTipo('cliente'); setNuevaCita(prev => ({ ...prev, cliente: '', clienteId: '', inmobiliaria: '', inmobiliariaId: '' })); setClienteQuery(''); setInmoQuery(''); }} className="accent-blue-500" />
                          Cliente
                        </label>
                        <label className={`flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border transition-colors ${contactoTipo === 'inmobiliaria' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'border-gray-300 dark:border-gray-600 dark:text-gray-400'}`}>
                          <input type="radio" name="contactoTipo" value="inmobiliaria" checked={contactoTipo === 'inmobiliaria'} onChange={() => { setContactoTipo('inmobiliaria'); setNuevaCita(prev => ({ ...prev, cliente: '', clienteId: '', inmobiliaria: '', inmobiliariaId: '' })); setClienteQuery(''); setInmoQuery(''); }} className="accent-purple-500" />
                          Inmobiliaria
                        </label>
                      </div>

                      {contactoTipo === 'cliente' ? (
                        <div ref={clienteRef} className="relative">
                          <input
                            type="text"
                            autoComplete="off"
                            value={clienteQuery || nuevaCita.cliente}
                            onChange={(e) => {
                              const v = e.target.value;
                              setClienteQuery(v);
                              setNuevaCita(prev => ({ ...prev, cliente: v, clienteId: '' }));
                              setShowClienteDropdown(true);
                            }}
                            onFocus={() => setShowClienteDropdown(true)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && filteredClientes.length > 0 && showClienteDropdown) {
                                e.preventDefault();
                                const c = filteredClientes[0];
                                const nombre = ((c.nombre || '') + ' ' + (c.apellido || '')).trim();
                                setNuevaCita(prev => ({ ...prev, cliente: nombre, clienteId: c._id || c.id || '' }));
                                setClienteQuery('');
                                setShowClienteDropdown(false);
                              }
                            }}
                            required
                            placeholder="Buscar cliente..."
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                          />
                          {showClienteDropdown && filteredClientes.length > 0 && (
                            <div className={`absolute z-50 w-full mt-1 max-h-48 overflow-y-auto rounded-lg border shadow-lg ${currentMode === 'Dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
                              {filteredClientes.map(c => {
                                const nombre = ((c.nombre || '') + ' ' + (c.apellido || '')).trim();
                                return (
                                  <div
                                    key={c._id || c.id}
                                    onClick={() => {
                                      setNuevaCita(prev => ({ ...prev, cliente: nombre, clienteId: c._id || c.id || '' }));
                                      setClienteQuery('');
                                      setShowClienteDropdown(false);
                                    }}
                                    className={`px-4 py-2 cursor-pointer text-sm ${currentMode === 'Dark' ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-blue-50 text-gray-800'}`}
                                  >
                                    <span className="font-medium">{nombre}</span>
                                    {c.email && <span className="text-xs text-gray-400 ml-2">{c.email}</span>}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {nuevaCita.clienteId && <p className="text-xs text-green-500 mt-1">Vinculado: {nuevaCita.clienteId}</p>}
                        </div>
                      ) : (
                        <div ref={inmoRef} className="relative">
                          <input
                            type="text"
                            autoComplete="off"
                            value={inmoQuery || nuevaCita.inmobiliaria || ''}
                            onChange={(e) => {
                              const v = e.target.value;
                              setInmoQuery(v);
                              setNuevaCita(prev => ({ ...prev, inmobiliaria: v, inmobiliariaId: '' }));
                              setShowInmoDropdown(true);
                            }}
                            onFocus={() => setShowInmoDropdown(true)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && showInmoDropdown && filteredInmobiliarias.length > 0) {
                                e.preventDefault();
                                const i = filteredInmobiliarias[0];
                                setNuevaCita(prev => ({ ...prev, inmobiliaria: i.nombre, inmobiliariaId: i._id || i.id || '' }));
                                setInmoQuery('');
                                setShowInmoDropdown(false);
                              }
                            }}
                            required
                            placeholder="Buscar o escribir nombre de inmobiliaria..."
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-gray-100"
                          />
                          {showInmoDropdown && (inmoQuery.length >= 1) && (
                            <div className={`absolute z-50 w-full mt-1 max-h-48 overflow-y-auto rounded-lg border shadow-lg ${currentMode === 'Dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
                              {filteredInmobiliarias.length > 0 ? filteredInmobiliarias.map(i => (
                                <div
                                  key={i._id || i.id}
                                  onClick={() => {
                                    setNuevaCita(prev => ({ ...prev, inmobiliaria: i.nombre, inmobiliariaId: i._id || i.id || '' }));
                                    setInmoQuery('');
                                    setShowInmoDropdown(false);
                                  }}
                                  className={`px-4 py-2 cursor-pointer text-sm ${currentMode === 'Dark' ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-purple-50 text-gray-800'}`}
                                >
                                  <span className="font-medium">{i.nombre}</span>
                                </div>
                              )) : (
                                <div className={`px-4 py-2 text-sm ${currentMode === 'Dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                  No encontrada — se guardará como nueva inmobiliaria
                                </div>
                              )}
                            </div>
                          )}
                          {nuevaCita.inmobiliariaId && <p className="text-xs text-green-500 mt-1">Vinculado: {nuevaCita.inmobiliariaId}</p>}
                          {nuevaCita.inmobiliaria && !nuevaCita.inmobiliariaId && !inmoQuery && <p className="text-xs text-amber-500 mt-1">Nueva inmobiliaria (se creará al guardar)</p>}
                        </div>
                      )}
                    </div>
                    <div ref={propRef} className="relative">
                      <label className="block text-sm font-medium mb-2 dark:text-gray-200">Propiedad</label>
                      <input
                        type="text"
                        autoComplete="off"
                        value={propQuery || nuevaCita.propiedad}
                        onChange={(e) => {
                          const v = e.target.value;
                          setPropQuery(v);
                          setNuevaCita(prev => ({ ...prev, propiedad: v, propiedadId: '' }));
                          setShowPropDropdown(true);
                        }}
                        onFocus={() => setShowPropDropdown(true)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && filteredProps.length > 0 && showPropDropdown) {
                            e.preventDefault();
                            const p = filteredProps[0];
                            const label = p.title || p.address || 'Sin título';
                            setNuevaCita(prev => ({ ...prev, propiedad: label, propiedadId: p._id || p.id || '' }));
                            setPropQuery('');
                            setShowPropDropdown(false);
                          }
                        }}
                        placeholder="Buscar propiedad..."
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                      />
                      {showPropDropdown && filteredProps.length > 0 && (
                        <div className={`absolute z-50 w-full mt-1 max-h-48 overflow-y-auto rounded-lg border shadow-lg ${currentMode === 'Dark' ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
                          {filteredProps.map(p => {
                            const label = p.title || p.address || 'Sin título';
                            return (
                              <div
                                key={p._id || p.id}
                                onClick={() => {
                                  setNuevaCita(prev => ({ ...prev, propiedad: label, propiedadId: p._id || p.id || '' }));
                                  setPropQuery('');
                                  setShowPropDropdown(false);
                                }}
                                className={`px-4 py-2 cursor-pointer text-sm ${currentMode === 'Dark' ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-blue-50 text-gray-800'}`}
                              >
                                <span className="font-medium">{label}</span>
                                {p.address && p.title && <span className="text-xs text-gray-400 ml-2">{p.address}</span>}
                                {p.metadata?.barrio && <span className="text-xs text-gray-400 ml-1">({p.metadata.barrio})</span>}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {nuevaCita.propiedadId && <p className="text-xs text-green-500 mt-1">Vinculado: {nuevaCita.propiedadId}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-gray-200">Agente *</label>
                      <select name="agente" value={nuevaCita.agente} onChange={handleCitaChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100">
                        <option value="">Seleccionar agente</option>
                        {agentesLista.map(a => (
                          <option key={a._id || a.id} value={a.nombre}>{a.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-gray-200">Fecha *</label>
                      <input type="date" name="fecha" value={nuevaCita.fecha} onChange={handleCitaChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-gray-200">Hora Inicio</label>
                      <input type="time" name="horaInicio" value={nuevaCita.horaInicio} onChange={handleCitaChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-gray-200">Hora Fin</label>
                      <input type="time" name="horaFin" value={nuevaCita.horaFin} onChange={handleCitaChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2 dark:text-gray-200">Ubicación</label>
                      <input type="text" name="ubicacion" value={nuevaCita.ubicacion} onChange={handleCitaChange} placeholder="Av. Santa Fe 1234, Palermo" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 dark:text-gray-200">Recordatorio</label>
                      <select name="recordatorio" value={nuevaCita.recordatorio} onChange={handleCitaChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100">
                        <option value="24h">24 horas antes</option>
                        <option value="12h">12 horas antes</option>
                        <option value="2h">2 horas antes</option>
                        <option value="1h">1 hora antes</option>
                        <option value="30m">30 minutos antes</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-200">Descripción</label>
                  <textarea name="descripcion" value={nuevaCita.descripcion} onChange={handleCitaChange} rows="3" placeholder="Detalles adicionales de la cita..." className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t dark:border-gray-700">
                  <button type="button" onClick={() => setShowModalCita(false)} className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors font-medium">
                    Cancelar
                  </button>
                  <button type="submit" className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2">
                    <FaSave /> Agendar Cita
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Citas Hoy */}
      {showModalCitasHoy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaClock /> Citas de Hoy
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  {citasData.filter((c) => c.StartTime.toDateString() === new Date().toDateString()).length} citas programadas
                </p>
              </div>
              <button type="button" onClick={() => setShowModalCitasHoy(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {citasData
                  .filter((c) => c.StartTime.toDateString() === new Date().toDateString())
                  .sort((a, b) => a.StartTime - b.StartTime)
                  .map((cita) => (
                    <div key={cita.Id} className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 border-2 ${currentMode === 'Dark' ? 'border-blue-700' : 'border-blue-200'} hover:shadow-md transition-shadow`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                              {cita.StartTime.getHours()}:{cita.StartTime.getMinutes().toString().padStart(2, '0')}
                            </div>
                            <div>
                              <h3 className="font-bold text-lg dark:text-gray-100">{cita.Subject}</h3>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{cita.Location}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Cliente:</p>
                              <p className="font-medium dark:text-gray-200">{cita.Cliente}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Agente:</p>
                              <p className="font-medium dark:text-gray-200">{cita.Agente}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Duración:</p>
                              <p className="font-medium dark:text-gray-200">
                                {Math.round((cita.EndTime - cita.StartTime) / (1000 * 60))} min
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Estado:</p>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                cita.CategoryColor === '#10B981' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                  : cita.CategoryColor === '#F59E0B' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              }`}
                              >
                                Confirmada
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {citasData.filter((c) => c.StartTime.toDateString() === new Date().toDateString()).length === 0 && (
                <div className="text-center py-12">
                  <FaClock className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No hay citas programadas para hoy</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Esta Semana */}
      {showModalEstaSemana && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className="sticky top-0 bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaCalendarPlus /> Citas de Esta Semana
                </h2>
                <p className="text-green-100 text-sm mt-1">{citasData.length} citas programadas</p>
              </div>
              <button type="button" onClick={() => setShowModalEstaSemana(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {Object.entries(
                  citasData.reduce((acc, cita) => {
                    const dateKey = cita.StartTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
                    if (!acc[dateKey]) acc[dateKey] = [];
                    acc[dateKey].push(cita);
                    return acc;
                  }, {}),
                ).map(([fecha, citas]) => (
                  <div key={fecha}>
                    <h3 className="font-bold text-lg mb-3 dark:text-gray-100 capitalize">{fecha}</h3>
                    <div className="space-y-2">
                      {citas.map((cita) => (
                        <div key={cita.Id} className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-3 border ${currentMode === 'Dark' ? 'border-gray-700' : 'border-gray-200'} hover:shadow-md transition-shadow`}>
                          <div className="flex items-center gap-3">
                            <div className="w-16 text-center">
                              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {cita.StartTime.getHours()}:{cita.StartTime.getMinutes().toString().padStart(2, '0')}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {Math.round((cita.EndTime - cita.StartTime) / (1000 * 60))} min
                              </p>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold dark:text-gray-100">{cita.Subject}</h4>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{cita.Location}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium dark:text-gray-200">{cita.Cliente}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{cita.Agente}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tasa de Asistencia */}
      {showModalTasaAsistencia && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaCheckCircle /> Tasa de Asistencia
                </h2>
                <p className="text-purple-100 text-sm mt-1">Análisis de últimos 30 días</p>
              </div>
              <button type="button" onClick={() => setShowModalTasaAsistencia(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Métricas Principales */}
              <div className={`p-6 ${currentMode === 'Dark' ? 'bg-purple-900/20' : 'bg-purple-50'} rounded-lg border-2 border-purple-500 mb-6`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tasa de Asistencia</p>
                    <p className="text-5xl font-bold text-purple-600 dark:text-purple-400 my-2">85%</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">17 de 20 citas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Cancelaciones</p>
                    <p className="text-5xl font-bold text-red-600 dark:text-red-400 my-2">10%</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">2 citas</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">No Asistieron</p>
                    <p className="text-5xl font-bold text-orange-600 dark:text-orange-400 my-2">5%</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">1 cita</p>
                  </div>
                </div>
              </div>

              {/* Estadísticas por Tipo */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">Asistencia por Tipo de Cita</h3>
                <div className="space-y-3">
                  {[
                    { tipo: 'Visitas', total: 12, asistieron: 11, porcentaje: 92 },
                    { tipo: 'Reuniones', total: 5, asistieron: 4, porcentaje: 80 },
                    { tipo: 'Firmas', total: 3, asistieron: 2, porcentaje: 67 },
                  ].map((item) => (
                    <div key={item.tipo} className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 border ${currentMode === 'Dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium dark:text-gray-200">{item.tipo}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {item.asistieron} de {item.total} citas
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6 relative overflow-hidden">
                        <div
                          className={`h-6 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                            item.porcentaje >= 90 ? 'bg-green-500'
                              : item.porcentaje >= 75 ? 'bg-blue-500'
                                : 'bg-orange-500'
                          }`}
                          style={{ width: `${item.porcentaje}%` }}
                        >
                          {item.porcentaje}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Estadísticas por Agente */}
              <div>
                <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">Asistencia por Agente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { agente: 'María García', asistencia: 90, citas: 10 },
                    { agente: 'Juan Pérez', asistencia: 85, citas: 7 },
                    { agente: 'Ana Martínez', asistencia: 75, citas: 3 },
                  ].map((item) => (
                    <div key={item.agente} className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 border ${currentMode === 'Dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium dark:text-gray-200">{item.agente}</span>
                        <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{item.asistencia}%</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.citas} citas gestionadas</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Pendientes */}
      {showModalPendientes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaBell /> Pendientes
                </h2>
                <p className="text-orange-100 text-sm mt-1">Resumen de tareas</p>
              </div>
              <button type="button" onClick={() => setShowModalPendientes(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className={`p-4 ${currentMode === 'Dark' ? 'bg-orange-900/20' : 'bg-orange-50'} rounded-lg border-2 border-orange-500 mb-6`}>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{taskStats?.byStatus?.pendiente || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">En Progreso</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{taskStats?.byStatus?.en_progreso || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Completadas</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{taskStats?.byStatus?.completada || 0}</p>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <button type="button" onClick={() => { setShowModalPendientes(false); setActiveSection('tareas'); }} className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium flex items-center gap-2 mx-auto">
                  <FaTasks /> Ver Gestión de Tareas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Citas;
