import React, { useState, useEffect, useCallback } from 'react';

import { toast } from 'react-toastify';
import Chart from 'react-apexcharts';
import { FaDollarSign, FaFileContract, FaChartLine, FaPlus, FaPercentage, FaHandshake, FaArrowUp, FaCalendarAlt, FaTimes, FaSave, FaHome, FaClock, FaCheckCircle, FaFunnelDollar } from 'react-icons/fa';

import { useStateContext } from '../contexts/ContextProvider';
import { crmService } from '../services/crmService';

const APORTE_COLEGA_COMPRADOR = 'comprador';
const APORTE_COLEGA_PROPIEDAD = 'propiedad';

const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch (_) {
    return {};
  }
};

const createVentaForm = () => {
  const user = getStoredUser();
  return {
    propiedad: '',
    cliente: '',
    monto: '',
    moneda: 'USD',
    agente: '',
    fechaCierre: '',
    comision: '3.5',
    inmobiliariaNombre: user?.empresa || 'Inmobiliaria',
    comisionInmobiliariaPorcentaje: '3.5',
    comparteConInmobiliaria: false,
    aporteInmobiliariaColega: APORTE_COLEGA_COMPRADOR,
    inmobiliariaColega: '',
    colega: '',
    comisionColegaPorcentaje: '',
    propiedadColegaNombre: '',
    propiedadColegaPrecio: '',
    propiedadColegaDireccion: '',
    formaPago: 'Contado',
    observaciones: '',
  };
};

const Ventas = () => {
  const { currentMode } = useStateContext();

  // Estados para los modales
  const [showModalVenta, setShowModalVenta] = useState(false);
  const [showModalAlquiler, setShowModalAlquiler] = useState(false);
  const [showModalSeguimiento, setShowModalSeguimiento] = useState(false);

  // Estados para modales de estadísticas
  const [showModalVentasMes, setShowModalVentasMes] = useState(false);
  const [showModalOperacionesActivas, setShowModalOperacionesActivas] = useState(false);
  const [showModalComisiones, setShowModalComisiones] = useState(false);
  const [showModalTasaCierre, setShowModalTasaCierre] = useState(false);

  // Estado para nueva venta
  const [nuevaVenta, setNuevaVenta] = useState(createVentaForm);
  const ventaUsaPropiedadExterna = nuevaVenta.comparteConInmobiliaria
    && nuevaVenta.aporteInmobiliariaColega === APORTE_COLEGA_PROPIEDAD;

  // Estado para nuevo alquiler
  const [nuevoAlquiler, setNuevoAlquiler] = useState({
    propiedad: '',
    cliente: '',
    montoMensual: '',
    moneda: 'USD',
    agente: '',
    fechaInicio: '',
    duracion: '12',
    deposito: '',
    comision: '1',
    observaciones: '',
  });

  // Estado para seguimiento
  const [nuevoSeguimiento, setNuevoSeguimiento] = useState({
    operacion: '',
    tipo: 'Llamada',
    fecha: '',
    hora: '',
    descripcion: '',
    prioridad: 'Media',
  });

  const [statsData, setStatsData] = useState(null);
  const [operaciones, setOperaciones] = useState([]);

  const loadStats = useCallback(async () => {
    try {
      const result = await crmService.stats.getOperacionesStats();
      setStatsData(result);
      setOperaciones(result.operaciones || []);
    } catch (err) {
      toast.error('Error cargando estadísticas de operaciones');
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // KPIs de Ventas
  const sk = statsData?.kpis || {};
  const kpisVentas = [
    { title: 'Ventas del Mes', value: `$${((sk.ventasMes?.value || 0) / 1000).toFixed(0)}K`, desc: `${sk.ventasMes?.trend || '0%'} vs anterior`, icon: <FaDollarSign />, color: 'from-green-500 to-green-600' },
    { title: 'Operaciones Activas', value: sk.operacionesActivas?.value ?? 0, desc: `${sk.operacionesActivas?.enReserva ?? 0} en cierre`, icon: <FaFileContract />, color: 'from-blue-500 to-blue-600' },
    { title: 'Comisiones', value: `$${((sk.comisiones?.value || 0) / 1000).toFixed(0)}K`, desc: `Este mes ${sk.comisiones?.trend || ''}`, icon: <FaChartLine />, color: 'from-purple-500 to-purple-600' },
    { title: 'Tasa de Cierre', value: `${sk.tasaCierre?.value ?? 0}%`, desc: `${sk.tasaCierre?.trend || '0%'} vs anterior`, icon: <FaPercentage />, color: 'from-orange-500 to-orange-600' },
  ];

  // Datos reales de backend
  const tend = statsData?.tendencia || {};
  const est = statsData?.estados || {};
  const fun = statsData?.funnel || {};
  const metaData = statsData?.meta || {};
  const seg = statsData?.seguimiento || {};

  const ventasPorMes = (tend.meses || []).map((mes, i) => ({
    mes,
    ventas: (tend.ventas || [])[i] || 0,
    alquileres: (tend.alquileres || [])[i] || 0,
  }));

  const estadosData = [
    { estado: 'Cerrada', cantidad: est.cerradas || 0, fill: '#10B981' },
    { estado: 'En Curso', cantidad: est.enCurso || 0, fill: '#3B82F6' },
    { estado: 'Reservada', cantidad: est.reservadas || 0, fill: '#F59E0B' },
  ];

  // ApexCharts - Progreso Meta de Ventas
  const metaVentasOptions = {
    chart: { type: 'radialBar', height: 200, background: 'transparent', sparkline: { enabled: false } },
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        hollow: { size: '60%', background: 'transparent' },
        track: { background: currentMode === 'Dark' ? '#374151' : '#E5E7EB', strokeWidth: '100%' },
        dataLabels: {
          name: { show: true, fontSize: '11px', fontWeight: 600, color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', offsetY: -8 },
          value: { show: true, fontSize: '24px', fontWeight: 700, color: currentMode === 'Dark' ? '#F3F4F6' : '#1F2937', offsetY: 4, formatter: (val) => `${val}%` },
        },
      },
    },
    fill: { type: 'gradient', gradient: { shade: 'dark', type: 'horizontal', colorStops: [{ offset: 0, color: '#10B981', opacity: 1 }, { offset: 100, color: '#059669', opacity: 1 }] } },
    stroke: { lineCap: 'round' },
    labels: ['Meta Mensual'],
  };
  const metaVentasSeries = [metaData.progress || 0];

  // ApexCharts - Distribución de Operaciones (Donut)
  const operacionesDonutOptions = {
    chart: { type: 'donut', height: 220, background: 'transparent' },
    labels: ['Cerradas', 'En Curso', 'Reservadas'],
    colors: ['#10B981', '#3B82F6', '#F59E0B'],
    plotOptions: { pie: { donut: { size: '65%', labels: { show: true, name: { fontSize: '11px', color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' }, value: { fontSize: '18px', fontWeight: 700, color: currentMode === 'Dark' ? '#F3F4F6' : '#1F2937' }, total: { show: true, label: 'Total', fontSize: '10px', color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', formatter: () => est.total || 0 } } } } },
    dataLabels: { enabled: false },
    legend: { show: true, position: 'bottom', fontSize: '10px', labels: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' } },
    stroke: { show: false },
    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light' },
  };
  const operacionesDonutSeries = [estadosData[0].cantidad, estadosData[1].cantidad, estadosData[2].cantidad];

  // ApexCharts - Tendencia Ingresos (Area)
  const ingresosTrendOptions = {
    chart: { type: 'area', height: 260, background: 'transparent', toolbar: { show: false }, zoom: { enabled: false } },
    colors: ['#8B5CF6', '#10B981'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2.5 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] } },
    xaxis: { categories: ventasPorMes.map((v) => v.mes), labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '10px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '10px' } } },
    grid: { borderColor: currentMode === 'Dark' ? '#374151' : '#E5E7EB', strokeDashArray: 4 },
    legend: { show: true, position: 'top', horizontalAlign: 'right', fontSize: '10px', labels: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' } },
    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light' },
  };
  const ingresosTrendSeries = [
    { name: 'Ventas', data: ventasPorMes.map((v) => v.ventas) },
    { name: 'Alquileres', data: ventasPorMes.map((v) => v.alquileres) },
  ];

  // ApexCharts - Funnel de Conversión
  const funnelVentasOptions = {
    chart: { type: 'bar', height: 180, background: 'transparent', toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 6, horizontal: true, distributed: true, barHeight: '60%' } },
    colors: ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981'],
    dataLabels: { enabled: true, textAnchor: 'start', style: { colors: ['#fff'], fontSize: '10px', fontWeight: 600 }, formatter: (val, opt) => `${opt.w.globals.labels[opt.dataPointIndex]}: ${val}`, offsetX: 5 },
    xaxis: { categories: ['Leads', 'Visitas', 'Ofertas', 'Cerradas'], labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { show: false } },
    grid: { show: false },
    legend: { show: false },
    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light' },
  };
  const funnelVentasSeries = [{ name: 'Operaciones', data: [fun.leads || 0, fun.visitas || 0, fun.ofertas || 0, fun.cerradas || 0] }];

  // ApexCharts - Tasa de Cierre (Gauge)
  const tasaCierreOptions = {
    chart: { type: 'radialBar', height: 160, background: 'transparent', sparkline: { enabled: true } },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        hollow: { size: '55%' },
        track: { background: currentMode === 'Dark' ? '#374151' : '#E5E7EB', strokeWidth: '100%' },
        dataLabels: {
          name: { show: true, fontSize: '10px', color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', offsetY: 16 },
          value: { show: true, fontSize: '20px', fontWeight: 700, color: currentMode === 'Dark' ? '#F3F4F6' : '#1F2937', offsetY: -10, formatter: (val) => `${val}%` },
        },
      },
    },
    fill: { type: 'gradient', gradient: { shade: 'dark', colorStops: [{ offset: 0, color: '#F59E0B', opacity: 1 }, { offset: 100, color: '#D97706', opacity: 1 }] } },
    stroke: { lineCap: 'round' },
    labels: ['Tasa Cierre'],
  };
  const tasaCierreSeries = [sk.tasaCierre?.value || 0];

  const isDark = currentMode === 'Dark';
  const cardBase = `rounded-2xl p-6 border transition-shadow ${isDark ? 'bg-secondary-dark-bg border-gray-700/50 hover:border-indigo-500/30' : 'bg-white border-gray-100 shadow-md hover:shadow-lg'}`;

  const getRankBadgeClass = (index) => {
    if (index === 0) return 'bg-yellow-400 text-yellow-900';
    if (index === 1) return 'bg-gray-300 text-gray-700';
    if (index === 2) return 'bg-orange-400 text-orange-900';
    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
  };

  const getRankBadgeGradientClass = (index) => {
    if (index === 0) return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white';
    if (index === 1) return 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700';
    if (index === 2) return 'bg-gradient-to-br from-orange-400 to-orange-600 text-white';
    return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
  };

  const getEstadoClass = (estado) => {
    if (estado === 'Reservada') return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
    if (estado === 'En Proceso') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
  };

  // Funciones de manejo para Venta
  const handleVentaChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNuevaVenta((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleOpenVentaModal = () => {
    setNuevaVenta((prev) => ({
      ...createVentaForm(),
      ...prev,
      inmobiliariaNombre: prev.inmobiliariaNombre || createVentaForm().inmobiliariaNombre,
    }));
    setShowModalVenta(true);
  };

  const handleVentaSubmit = (e) => {
    e.preventDefault();
    // Check milestones (non-blocking)
    crmService.rewards.checkMilestones('operation').catch(() => {});
    toast.success('¡Venta registrada exitosamente!');
    setShowModalVenta(false);
    setNuevaVenta(createVentaForm());
  };

  // Funciones de manejo para Alquiler
  const handleAlquilerChange = (e) => {
    const { name, value } = e.target;
    setNuevoAlquiler((prev) => ({ ...prev, [name]: value }));
  };

  const handleAlquilerSubmit = (e) => {
    e.preventDefault();
    toast.success('¡Alquiler registrado exitosamente!');
    setShowModalAlquiler(false);
    setNuevoAlquiler({
      propiedad: '',
      cliente: '',
      montoMensual: '',
      moneda: 'USD',
      agente: '',
      fechaInicio: '',
      duracion: '12',
      deposito: '',
      comision: '1',
      observaciones: '',
    });
  };

  // Funciones de manejo para Seguimiento
  const handleSeguimientoChange = (e) => {
    const { name, value } = e.target;
    setNuevoSeguimiento((prev) => ({ ...prev, [name]: value }));
  };

  const handleSeguimientoSubmit = (e) => {
    e.preventDefault();
    toast.success('¡Seguimiento programado exitosamente!');
    setShowModalSeguimiento(false);
    setNuevoSeguimiento({
      operacion: '',
      tipo: 'Llamada',
      fecha: '',
      hora: '',
      descripcion: '',
      prioridad: 'Media',
    });
  };

  return (
    <div className={`min-h-screen px-6 lg:px-8 pt-4 pb-6 ${isDark ? 'bg-main-dark-bg' : 'bg-gray-50'}`}>
      <div className="mb-6">
        <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <FaFileContract className="text-emerald-500" /> Gestión de Operaciones
        </h2>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Ventas, alquileres y seguimiento</p>
      </div>

      {/* Botones de Navegación */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          type="button"
          onClick={handleOpenVentaModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium bg-emerald-500 hover:bg-emerald-600 transition-all shadow-sm hover:shadow-md"
        >
          <FaPlus /> Nueva Venta
        </button>
        <button
          type="button"
          onClick={() => setShowModalAlquiler(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium bg-blue-500 hover:bg-blue-600 transition-all shadow-sm hover:shadow-md"
        >
          <FaHandshake /> Nuevo Alquiler
        </button>
        <button
          type="button"
          onClick={() => setShowModalSeguimiento(true)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border transition-all shadow-sm hover:shadow-md ${isDark ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
        >
          <FaCalendarAlt /> Programar Seguimiento
        </button>
      </div>

      {/* KPIs de Operaciones - Clickeables */}
      {(() => {
        const colorMap = {
          'from-green-500 to-green-600': { hex: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
          'from-blue-500 to-blue-600': { hex: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          'from-purple-500 to-purple-600': { hex: '#8b5cf6', bg: 'bg-purple-50 dark:bg-purple-900/20' },
          'from-orange-500 to-orange-600': { hex: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/20' },
        };
        return (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {kpisVentas.map((kpi, i) => {
              const cm = colorMap[kpi.color] || { hex: '#6366f1', bg: 'bg-indigo-50 dark:bg-indigo-900/20' };
              return (
                <div
                  key={i}
                  onClick={() => {
                    if (i === 0) setShowModalVentasMes(true);
                    else if (i === 1) setShowModalOperacionesActivas(true);
                    else if (i === 2) setShowModalComisiones(true);
                    else if (i === 3) setShowModalTasaCierre(true);
                  }}
                  className={`rounded-2xl p-5 border shadow-sm cursor-pointer transition-all ${isDark ? 'bg-secondary-dark-bg border-gray-700/50 hover:border-indigo-500/30' : 'bg-white border-gray-100 hover:shadow-lg'}`}
                  style={{ borderLeft: `4px solid ${cm.hex}` }}
                >
                  <div className={`w-9 h-9 rounded-xl ${cm.bg} flex items-center justify-center mb-3`} style={{ color: cm.hex }}>
                    {kpi.icon}
                  </div>
                  <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{kpi.value}</p>
                  <p className={`text-sm font-semibold mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{kpi.title}</p>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{kpi.desc}</p>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Gráficos ApexCharts - Métricas Financieras */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">
        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-1">
            <FaDollarSign className="text-emerald-500" />
            <h3 className="font-semibold dark:text-gray-100 text-sm">Meta Ventas</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Progreso mensual</p>
          <Chart options={metaVentasOptions} series={metaVentasSeries} type="radialBar" height={180} />
          <div className="flex justify-between items-center pt-2 border-t dark:border-gray-700">
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{metaData.cerradas ?? 0}</p>
              <p className="text-xs text-gray-500">Cerradas</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-500">{metaData.objetivo ?? 5}</p>
              <p className="text-xs text-gray-500">Meta</p>
            </div>
          </div>
        </div>

        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-1">
            <FaFileContract className="text-blue-500" />
            <h3 className="font-semibold dark:text-gray-100 text-sm">Estado Operaciones</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Distribución actual</p>
          <Chart options={operacionesDonutOptions} series={operacionesDonutSeries} type="donut" height={200} />
        </div>

        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-1">
            <FaFunnelDollar className="text-purple-500" />
            <h3 className="font-semibold dark:text-gray-100 text-sm">Funnel de Ventas</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Conversión de leads</p>
          <Chart options={funnelVentasOptions} series={funnelVentasSeries} type="bar" height={160} />
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t dark:border-gray-700">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded text-center">
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{fun.conversion || 0}%</p>
              <p className="text-xs text-gray-500">Conversión</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-center">
              <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{fun.visitasPct || 0}%</p>
              <p className="text-xs text-gray-500">Visitas</p>
            </div>
          </div>
        </div>

        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-1">
            <FaPercentage className="text-orange-500" />
            <h3 className="font-semibold dark:text-gray-100 text-sm">Tasa de Cierre</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Efectividad</p>
          <Chart options={tasaCierreOptions} series={tasaCierreSeries} type="radialBar" height={140} />
          <div className="space-y-2 mt-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600 dark:text-gray-400">Promedio sector</span>
              <span className="font-bold text-gray-500">35%</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600 dark:text-gray-400">Tu rendimiento</span>
              <span className={`font-bold flex items-center gap-1 ${(sk.tasaCierre?.value || 0) >= 35 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                {(sk.tasaCierre?.value || 0) >= 35 ? <FaArrowUp className="text-xs" /> : null} {sk.tasaCierre?.trend || '0%'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico de Tendencia Amplio */}
      <div className="mb-6">
        <div className={cardBase}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <FaChartLine className="text-purple-500" />
                <h3 className="font-semibold dark:text-gray-100">Tendencia de Operaciones</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ventas vs Alquileres últimos 6 meses</p>
            </div>
          </div>
          <Chart options={ingresosTrendOptions} series={ingresosTrendSeries} type="area" height={240} />
          <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t dark:border-gray-700">
            <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{tend.totalVentas ?? 0}</p>
              <p className="text-xs text-gray-500">Ventas Total</p>
            </div>
            <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{tend.totalAlquileres ?? 0}</p>
              <p className="text-xs text-gray-500">Alquileres</p>
            </div>
            <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">${((tend.totalComisiones || 0) / 1000).toFixed(1)}K</p>
              <p className="text-xs text-gray-500">Comisiones</p>
            </div>
            <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <p className="text-lg font-bold text-orange-600 dark:text-orange-400">{tend.trendVsAnterior || '0%'}</p>
              <p className="text-xs text-gray-500">vs Ant.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos de Tendencias y Estados */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Gráfico de Tendencias */}
        <div className={cardBase}>
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">📈 Tendencias de Ventas vs Alquileres</h3>
          <Chart
            options={{
              chart: { type: 'line', height: 300, background: 'transparent', toolbar: { show: false } },
              xaxis: { categories: ventasPorMes.map((v) => v.mes), labels: { style: { colors: isDark ? '#9CA3AF' : '#6B7280', fontSize: '10px' } } },
              yaxis: { labels: { style: { colors: isDark ? '#9CA3AF' : '#6B7280', fontSize: '10px' } } },
              stroke: { curve: 'smooth', width: 2.5 },
              markers: { size: 4 },
              colors: ['#10B981', '#3B82F6'],
              legend: { show: true, position: 'top', labels: { colors: isDark ? '#9CA3AF' : '#6B7280' } },
              tooltip: { theme: isDark ? 'dark' : 'light' },
              grid: { borderColor: isDark ? '#374151' : '#E5E7EB', strokeDashArray: 4 },
              theme: { mode: isDark ? 'dark' : 'light' },
            }}
            series={[
              { name: 'Ventas', data: ventasPorMes.map((v) => v.ventas) },
              { name: 'Alquileres', data: ventasPorMes.map((v) => v.alquileres) },
            ]}
            type="line"
            height={300}
          />
        </div>

        {/* Gráfico de Estados */}
        <div className={cardBase}>
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">📊 Estados de Operaciones</h3>
          <Chart
            options={{
              chart: { type: 'donut', height: 300, background: 'transparent' },
              labels: estadosData.map((d) => d.estado),
              colors: estadosData.map((d) => d.fill),
              legend: { show: true, position: 'bottom', labels: { colors: isDark ? '#9CA3AF' : '#6B7280' } },
              tooltip: { theme: isDark ? 'dark' : 'light' },
              plotOptions: { pie: { donut: { size: '50%' } } },
              dataLabels: { enabled: true },
              stroke: { show: false },
              theme: { mode: isDark ? 'dark' : 'light' },
            }}
            series={estadosData.map((d) => d.cantidad)}
            type="donut"
            height={300}
          />
        </div>
      </div>

      {/* Grid de Operaciones y Panel de Comisiones */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className={`xl:col-span-2 ${cardBase}`}>
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">💼 Operaciones Activas</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <th className="text-left py-3 px-3 font-semibold dark:text-gray-300">Tipo</th>
                  <th className="text-left py-3 px-3 font-semibold dark:text-gray-300">Propiedad</th>
                  <th className="text-left py-3 px-3 font-semibold dark:text-gray-300">Cliente</th>
                  <th className="text-right py-3 px-3 font-semibold dark:text-gray-300">Monto</th>
                  <th className="text-left py-3 px-3 font-semibold dark:text-gray-300">Estado</th>
                  <th className="text-left py-3 px-3 font-semibold dark:text-gray-300">Agente</th>
                  <th className="text-right py-3 px-3 font-semibold dark:text-gray-300">Comisión</th>
                </tr>
              </thead>
              <tbody>
                {operaciones.slice(0, 10).map((op, idx) => (
                  <tr key={idx} className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-100 hover:bg-gray-50'}`}>
                    <td className="py-2.5 px-3 dark:text-gray-200">{op.tipo}</td>
                    <td className="py-2.5 px-3 dark:text-gray-200">{op.propiedad}</td>
                    <td className="py-2.5 px-3 dark:text-gray-300">{op.cliente}</td>
                    <td className="py-2.5 px-3 text-right dark:text-gray-300">${Number(op.monto || 0).toLocaleString()}</td>
                    <td className="py-2.5 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        op.estado === 'Cerrada' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : op.estado === 'Reservada' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>{op.estado}</span>
                    </td>
                    <td className="py-2.5 px-3 dark:text-gray-300">{op.agente}</td>
                    <td className="py-2.5 px-3 text-right dark:text-gray-300">${Number(op.comision || 0).toLocaleString()}</td>
                  </tr>
                ))}
                {!operaciones.length && (
                  <tr><td colSpan={7} className="py-8 text-center text-gray-400">No hay operaciones registradas</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel de Comisiones */}
        <div className={cardBase}>
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">💰 Comisiones por Agente</h3>
          <div className="space-y-4">
            {(statsData?.agentComisiones || []).map((ag, i) => {
              const maxCom = Math.max(...(statsData?.agentComisiones || []).map((a) => a.comision), 1);
              return (
                <div key={i} className="border dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold dark:text-gray-200 text-sm">{ag.nombre}</h4>
                    <span className="text-lg font-bold text-green-600 dark:text-green-400">
                      ${ag.comision.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: `${Math.min((ag.comision / maxCom) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {ag.operaciones} operaciones
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Panel de Seguimiento y Próximas Acciones */}
      <div className={cardBase}>
        <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">🎯 Seguimiento y Próximas Acciones</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="p-6 border-2 border-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
              <FaArrowUp className="text-4xl text-red-500 mx-auto mb-3" />
              <h4 className="font-bold dark:text-gray-200">Urgentes</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Requieren atención inmediata</p>
              <p className="text-2xl font-bold text-red-600 mt-2">{seg.urgentes ?? 0}</p>
              <p className="text-xs text-gray-500">Operaciones</p>
            </div>
          </div>

          <div className="text-center">
            <div className="p-6 border-2 border-yellow-500 rounded-lg hover:bg-yellow-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
              <FaCalendarAlt className="text-4xl text-yellow-500 mx-auto mb-3" />
              <h4 className="font-bold dark:text-gray-200">Esta Semana</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Seguimientos programados</p>
              <p className="text-2xl font-bold text-yellow-600 mt-2">{seg.estaSemana ?? 0}</p>
              <p className="text-xs text-gray-500">Contactos</p>
            </div>
          </div>

          <div className="text-center">
            <div className="p-6 border-2 border-green-500 rounded-lg hover:bg-green-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
              <FaHandshake className="text-4xl text-green-500 mx-auto mb-3" />
              <h4 className="font-bold dark:text-gray-200">Por Cerrar</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">Próximas a finalizar</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{seg.porCerrar ?? 0}</p>
              <p className="text-xs text-gray-500">Operaciones</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Nueva Venta */}
      {showModalVenta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className="sticky top-0 bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaPlus /> Nueva Venta
                </h2>
                <p className="text-green-100 text-sm mt-1">Registrar una nueva operación de venta</p>
              </div>
              <button type="button" onClick={() => setShowModalVenta(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleVentaSubmit} className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 flex items-center gap-2">
                    <FaHome className="text-green-500" /> Información de la Operación
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {!ventaUsaPropiedadExterna ? (
                      <div>
                        <label htmlFor="field-128" className="block text-sm font-medium mb-2 dark:text-gray-200">Propiedad nuestra *</label>
                        <input id="field-128" type="text" name="propiedad" value={nuevaVenta.propiedad} onChange={handleVentaChange} required={!ventaUsaPropiedadExterna} placeholder="Depto 2amb Palermo" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100" />
                      </div>
                    ) : (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-900/20">
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-100">Propiedad externa</p>
                        <p className="text-sm text-amber-700 dark:text-amber-200">No se exige propiedad interna porque la parte vendedora la aporta la inmobiliaria colega.</p>
                      </div>
                    )}
                    <div>
                      <label htmlFor="field-129" className="block text-sm font-medium mb-2 dark:text-gray-200">
                        {ventaUsaPropiedadExterna ? 'Cliente comprador *' : nuevaVenta.comparteConInmobiliaria ? 'Cliente vendedor *' : 'Cliente *'}
                      </label>
                      <input id="field-129" type="text" name="cliente" value={nuevaVenta.cliente} onChange={handleVentaChange} required placeholder="Juan Pérez" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100" />
                    </div>
                    <div>
                      <label htmlFor="field-130" className="block text-sm font-medium mb-2 dark:text-gray-200">Monto *</label>
                      <input id="field-130" type="number" name="monto" value={nuevaVenta.monto} onChange={handleVentaChange} required placeholder="150000" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100" />
                    </div>
                    <div>
                      <label htmlFor="field-131" className="block text-sm font-medium mb-2 dark:text-gray-200">Moneda *</label>
                      <select id="field-131" name="moneda" value={nuevaVenta.moneda} onChange={handleVentaChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100">
                        <option value="USD">USD - Dólares</option>
                        <option value="ARS">ARS - Pesos</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="field-132" className="block text-sm font-medium mb-2 dark:text-gray-200">Agente *</label>
                      <select id="field-132" name="agente" value={nuevaVenta.agente} onChange={handleVentaChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100">
                        <option value="">Seleccionar agente</option>
                        <option value="Ana López">Ana López</option>
                        <option value="Carlos Ruiz">Carlos Ruiz</option>
                        <option value="Laura Fernández">Laura Fernández</option>
                        <option value="Sofía Torres">Sofía Torres</option>
                        <option value="Marcos Silva">Marcos Silva</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="field-133" className="block text-sm font-medium mb-2 dark:text-gray-200">Fecha de Cierre *</label>
                      <input id="field-133" type="date" name="fechaCierre" value={nuevaVenta.fechaCierre} onChange={handleVentaChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100" />
                    </div>
                    <div>
                      <label htmlFor="field-134" className="block text-sm font-medium mb-2 dark:text-gray-200">Comisión (%)</label>
                      <input id="field-134" type="number" name="comision" value={nuevaVenta.comision} onChange={handleVentaChange} step="0.1" placeholder="3.5" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100" />
                    </div>
                    <div>
                      <label htmlFor="field-venta-inmobiliaria" className="block text-sm font-medium mb-2 dark:text-gray-200">Inmobiliaria</label>
                      <input id="field-venta-inmobiliaria" type="text" name="inmobiliariaNombre" value={nuevaVenta.inmobiliariaNombre} onChange={handleVentaChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100" />
                    </div>
                    <div>
                      <label htmlFor="field-venta-comision-inmobiliaria" className="block text-sm font-medium mb-2 dark:text-gray-200">Comisión inmobiliaria (%)</label>
                      <input id="field-venta-comision-inmobiliaria" type="number" name="comisionInmobiliariaPorcentaje" value={nuevaVenta.comisionInmobiliariaPorcentaje} onChange={handleVentaChange} step="0.1" placeholder="3.5" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="inline-flex items-center gap-2 text-sm font-medium dark:text-gray-200">
                        <input type="checkbox" name="comparteConInmobiliaria" checked={nuevaVenta.comparteConInmobiliaria} onChange={handleVentaChange} className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                        La venta se cierra con inmobiliaria colega
                      </label>
                    </div>
                    {nuevaVenta.comparteConInmobiliaria && (
                      <>
                        <div className="md:col-span-2 rounded-xl border border-gray-200 p-4 dark:border-gray-700">
                          <p className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-200">¿Qué aporta la inmobiliaria colega?</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <label className="flex gap-3 rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700 dark:text-gray-200">
                              <input type="radio" name="aporteInmobiliariaColega" value={APORTE_COLEGA_COMPRADOR} checked={nuevaVenta.aporteInmobiliariaColega === APORTE_COLEGA_COMPRADOR} onChange={handleVentaChange} className="mt-1 text-green-600 focus:ring-green-500" />
                              <span><strong>Trae comprador</strong><br />Nosotros aportamos la propiedad del vendedor.</span>
                            </label>
                            <label className="flex gap-3 rounded-lg border border-gray-200 p-3 text-sm dark:border-gray-700 dark:text-gray-200">
                              <input type="radio" name="aporteInmobiliariaColega" value={APORTE_COLEGA_PROPIEDAD} checked={nuevaVenta.aporteInmobiliariaColega === APORTE_COLEGA_PROPIEDAD} onChange={handleVentaChange} className="mt-1 text-green-600 focus:ring-green-500" />
                              <span><strong>Trae propiedad/vendedor</strong><br />Nosotros aportamos el comprador y cargamos propiedad ajena.</span>
                            </label>
                          </div>
                        </div>
                        <div>
                          <label htmlFor="field-venta-inmobiliaria-colega" className="block text-sm font-medium mb-2 dark:text-gray-200">Inmobiliaria colega</label>
                          <input id="field-venta-inmobiliaria-colega" type="text" name="inmobiliariaColega" value={nuevaVenta.inmobiliariaColega} onChange={handleVentaChange} placeholder="Nombre de la inmobiliaria" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100" />
                        </div>
                        <div>
                          <label htmlFor="field-venta-colega" className="block text-sm font-medium mb-2 dark:text-gray-200">Colega</label>
                          <input id="field-venta-colega" type="text" name="colega" value={nuevaVenta.colega} onChange={handleVentaChange} placeholder="Nombre del colega" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100" />
                        </div>
                        <div>
                          <label htmlFor="field-venta-comision-colega" className="block text-sm font-medium mb-2 dark:text-gray-200">Comisión colega (%)</label>
                          <input id="field-venta-comision-colega" type="number" name="comisionColegaPorcentaje" value={nuevaVenta.comisionColegaPorcentaje} onChange={handleVentaChange} step="0.1" placeholder="0" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100" />
                        </div>
                        {ventaUsaPropiedadExterna && (
                          <>
                            <div className="md:col-span-2 pt-2">
                              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">Propiedad ajena</p>
                            </div>
                            <div>
                              <label htmlFor="field-venta-propiedad-colega" className="block text-sm font-medium mb-2 dark:text-gray-200">Nombre de la propiedad *</label>
                              <input id="field-venta-propiedad-colega" type="text" name="propiedadColegaNombre" value={nuevaVenta.propiedadColegaNombre} onChange={handleVentaChange} required={ventaUsaPropiedadExterna} placeholder="Nombre o referencia" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100" />
                            </div>
                            <div>
                              <label htmlFor="field-venta-precio-colega" className="block text-sm font-medium mb-2 dark:text-gray-200">Precio</label>
                              <input id="field-venta-precio-colega" type="number" name="propiedadColegaPrecio" value={nuevaVenta.propiedadColegaPrecio} onChange={handleVentaChange} step="0.01" placeholder="0" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100" />
                            </div>
                            <div className="md:col-span-2">
                              <label htmlFor="field-venta-direccion-colega" className="block text-sm font-medium mb-2 dark:text-gray-200">Dirección</label>
                              <input id="field-venta-direccion-colega" type="text" name="propiedadColegaDireccion" value={nuevaVenta.propiedadColegaDireccion} onChange={handleVentaChange} placeholder="Dirección de la propiedad" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100" />
                            </div>
                          </>
                        )}
                      </>
                    )}
                    <div>
                      <label htmlFor="field-135" className="block text-sm font-medium mb-2 dark:text-gray-200">Forma de Pago</label>
                      <select id="field-135" name="formaPago" value={nuevaVenta.formaPago} onChange={handleVentaChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100">
                        <option value="Contado">Contado</option>
                        <option value="Financiado">Financiado</option>
                        <option value="Hipoteca">Hipoteca</option>
                        <option value="Mixto">Mixto</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="field-136" className="block text-sm font-medium mb-2 dark:text-gray-200">Observaciones</label>
                  <textarea id="field-136" name="observaciones" value={nuevaVenta.observaciones} onChange={handleVentaChange} rows="3" placeholder="Detalles adicionales de la operación..." className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100" />
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t dark:border-gray-700">
                  <button type="button" onClick={() => setShowModalVenta(false)} className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors font-medium">
                    Cancelar
                  </button>
                  <button type="submit" className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium flex items-center gap-2">
                    <FaSave /> Registrar Venta
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nuevo Alquiler */}
      {showModalAlquiler && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaHandshake /> Nuevo Alquiler
                </h2>
                <p className="text-blue-100 text-sm mt-1">Registrar una nueva operación de alquiler</p>
              </div>
              <button type="button" onClick={() => setShowModalAlquiler(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleAlquilerSubmit} className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 flex items-center gap-2">
                    <FaHome className="text-blue-500" /> Información del Alquiler
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="field-137" className="block text-sm font-medium mb-2 dark:text-gray-200">Propiedad *</label>
                      <input id="field-137" type="text" name="propiedad" value={nuevoAlquiler.propiedad} onChange={handleAlquilerChange} required placeholder="Casa 3amb Belgrano" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                    </div>
                    <div>
                      <label htmlFor="field-138" className="block text-sm font-medium mb-2 dark:text-gray-200">Cliente *</label>
                      <input id="field-138" type="text" name="cliente" value={nuevoAlquiler.cliente} onChange={handleAlquilerChange} required placeholder="María González" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                    </div>
                    <div>
                      <label htmlFor="field-139" className="block text-sm font-medium mb-2 dark:text-gray-200">Monto Mensual *</label>
                      <input id="field-139" type="number" name="montoMensual" value={nuevoAlquiler.montoMensual} onChange={handleAlquilerChange} required placeholder="1200" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                    </div>
                    <div>
                      <label htmlFor="field-140" className="block text-sm font-medium mb-2 dark:text-gray-200">Moneda *</label>
                      <select id="field-140" name="moneda" value={nuevoAlquiler.moneda} onChange={handleAlquilerChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100">
                        <option value="USD">USD - Dólares</option>
                        <option value="ARS">ARS - Pesos</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="field-141" className="block text-sm font-medium mb-2 dark:text-gray-200">Agente *</label>
                      <select id="field-141" name="agente" value={nuevoAlquiler.agente} onChange={handleAlquilerChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100">
                        <option value="">Seleccionar agente</option>
                        <option value="Ana López">Ana López</option>
                        <option value="Carlos Ruiz">Carlos Ruiz</option>
                        <option value="Laura Fernández">Laura Fernández</option>
                        <option value="Sofía Torres">Sofía Torres</option>
                        <option value="Marcos Silva">Marcos Silva</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="field-142" className="block text-sm font-medium mb-2 dark:text-gray-200">Fecha de Inicio *</label>
                      <input id="field-142" type="date" name="fechaInicio" value={nuevoAlquiler.fechaInicio} onChange={handleAlquilerChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                    </div>
                    <div>
                      <label htmlFor="field-143" className="block text-sm font-medium mb-2 dark:text-gray-200">Duración (meses)</label>
                      <input id="field-143" type="number" name="duracion" value={nuevoAlquiler.duracion} onChange={handleAlquilerChange} placeholder="12" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                    </div>
                    <div>
                      <label htmlFor="field-144" className="block text-sm font-medium mb-2 dark:text-gray-200">Depósito</label>
                      <input id="field-144" type="number" name="deposito" value={nuevoAlquiler.deposito} onChange={handleAlquilerChange} placeholder="2400" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                    </div>
                    <div>
                      <label htmlFor="field-145" className="block text-sm font-medium mb-2 dark:text-gray-200">Comisión (meses)</label>
                      <input id="field-145" type="number" name="comision" value={nuevoAlquiler.comision} onChange={handleAlquilerChange} step="0.5" placeholder="1" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="field-146" className="block text-sm font-medium mb-2 dark:text-gray-200">Observaciones</label>
                  <textarea id="field-146" name="observaciones" value={nuevoAlquiler.observaciones} onChange={handleAlquilerChange} rows="3" placeholder="Detalles adicionales del alquiler..." className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t dark:border-gray-700">
                  <button type="button" onClick={() => setShowModalAlquiler(false)} className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors font-medium">
                    Cancelar
                  </button>
                  <button type="submit" className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2">
                    <FaSave /> Registrar Alquiler
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Seguimiento */}
      {showModalSeguimiento && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaCalendarAlt /> Programar Seguimiento
                </h2>
                <p className="text-purple-100 text-sm mt-1">Agendar una acción de seguimiento</p>
              </div>
              <button type="button" onClick={() => setShowModalSeguimiento(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleSeguimientoSubmit} className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 flex items-center gap-2">
                    <FaClock className="text-purple-500" /> Detalles del Seguimiento
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label htmlFor="field-147" className="block text-sm font-medium mb-2 dark:text-gray-200">Operación *</label>
                      <select id="field-147" name="operacion" value={nuevoSeguimiento.operacion} onChange={handleSeguimientoChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-gray-100">
                        <option value="">Seleccionar operación</option>
                        {operaciones.map((op) => (
                          <option key={op.id} value={op.id}>{op.propiedad} - {op.cliente}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label htmlFor="field-148" className="block text-sm font-medium mb-2 dark:text-gray-200">Tipo de Seguimiento *</label>
                      <select id="field-148" name="tipo" value={nuevoSeguimiento.tipo} onChange={handleSeguimientoChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-gray-100">
                        <option value="Llamada">Llamada</option>
                        <option value="Email">Email</option>
                        <option value="WhatsApp">WhatsApp</option>
                        <option value="Reunión">Reunión</option>
                        <option value="Visita">Visita</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="field-149" className="block text-sm font-medium mb-2 dark:text-gray-200">Prioridad *</label>
                      <select id="field-149" name="prioridad" value={nuevoSeguimiento.prioridad} onChange={handleSeguimientoChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-gray-100">
                        <option value="Baja">Baja</option>
                        <option value="Media">Media</option>
                        <option value="Alta">Alta</option>
                        <option value="Urgente">Urgente</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="field-150" className="block text-sm font-medium mb-2 dark:text-gray-200">Fecha *</label>
                      <input id="field-150" type="date" name="fecha" value={nuevoSeguimiento.fecha} onChange={handleSeguimientoChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-gray-100" />
                    </div>
                    <div>
                      <label htmlFor="field-151" className="block text-sm font-medium mb-2 dark:text-gray-200">Hora *</label>
                      <input id="field-151" type="time" name="hora" value={nuevoSeguimiento.hora} onChange={handleSeguimientoChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-gray-100" />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="field-152" className="block text-sm font-medium mb-2 dark:text-gray-200">Descripción *</label>
                  <textarea id="field-152" name="descripcion" value={nuevoSeguimiento.descripcion} onChange={handleSeguimientoChange} required rows="4" placeholder="Detalles del seguimiento a realizar..." className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-gray-100" />
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t dark:border-gray-700">
                  <button type="button" onClick={() => setShowModalSeguimiento(false)} className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors font-medium">
                    Cancelar
                  </button>
                  <button type="submit" className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-medium flex items-center gap-2">
                    <FaCheckCircle /> Programar Seguimiento
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ventas del Mes */}
      {showModalVentasMes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className="sticky top-0 bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaDollarSign /> Ventas del Mes
                </h2>
                <p className="text-green-100 text-sm mt-1">
                  ${operaciones.filter((o) => o.tipo === 'Venta' && o.estado === 'Cerrada').reduce((sum, o) => sum + o.monto, 0).toLocaleString()} en ventas cerradas
                </p>
              </div>
              <button type="button" onClick={() => setShowModalVentasMes(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {operaciones
                  .filter((o) => o.tipo === 'Venta' && o.estado === 'Cerrada')
                  .sort((a, b) => b.monto - a.monto)
                  .map((operacion, index) => (
                    <div key={operacion.id} className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 border ${currentMode === 'Dark' ? 'border-gray-700' : 'border-gray-200'} hover:shadow-md transition-shadow`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${getRankBadgeClass(index)}`}>
                            #{index + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg dark:text-gray-100">{operacion.propiedad}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Cliente: {operacion.cliente}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-600 dark:text-gray-400">
                              <span>Agente: {operacion.agente}</span>
                              <span>•</span>
                              <span>Fecha: {operacion.fecha}</span>
                              <span>•</span>
                              <span className="px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                                {operacion.estado}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-3xl font-bold text-green-600 dark:text-green-400">${operacion.monto.toLocaleString()}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Comisión: {operacion.comisionPorcentaje}%</p>
                          <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">
                            ${operacion.comision.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              <div className={`mt-6 p-4 ${currentMode === 'Dark' ? 'bg-green-900/20' : 'bg-green-50'} rounded-lg border-2 border-green-500`}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Ventas</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${operaciones.filter((o) => o.tipo === 'Venta' && o.estado === 'Cerrada').reduce((sum, o) => sum + o.monto, 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Cantidad</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {operaciones.filter((o) => o.tipo === 'Venta' && o.estado === 'Cerrada').length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Promedio</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${Math.round(operaciones.filter((o) => o.tipo === 'Venta' && o.estado === 'Cerrada').reduce((sum, o) => sum + o.monto, 0) / operaciones.filter((o) => o.tipo === 'Venta' && o.estado === 'Cerrada').length).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Comisiones</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${operaciones.filter((o) => o.tipo === 'Venta' && o.estado === 'Cerrada').reduce((sum, o) => sum + o.comision, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Operaciones Activas */}
      {showModalOperacionesActivas && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaFileContract /> Operaciones Activas
                </h2>
                <p className="text-blue-100 text-sm mt-1">
                  {operaciones.filter((o) => o.estado !== 'Cerrada').length} operaciones en proceso
                </p>
              </div>
              <button type="button" onClick={() => setShowModalOperacionesActivas(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {operaciones
                  .filter((o) => o.estado !== 'Cerrada')
                  .sort((a, b) => {
                    const estadoOrder = { Reservada: 1, 'En Proceso': 2, Pendiente: 3 };
                    return (estadoOrder[a.estado] || 4) - (estadoOrder[b.estado] || 4);
                  })
                  .map((operacion) => (
                    <div key={operacion.id} className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 border-2 ${currentMode === 'Dark' ? 'border-blue-700' : 'border-blue-200'} hover:shadow-md transition-shadow`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-lg dark:text-gray-100">{operacion.propiedad}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoClass(operacion.estado)}`}>
                              {operacion.estado}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Cliente:</p>
                              <p className="font-medium dark:text-gray-200">{operacion.cliente}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Tipo:</p>
                              <p className="font-medium dark:text-gray-200">{operacion.tipo}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Agente:</p>
                              <p className="font-medium dark:text-gray-200">{operacion.agente}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Fecha:</p>
                              <p className="font-medium dark:text-gray-200">{operacion.fecha}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">${operacion.monto.toLocaleString()}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Comisión potencial</p>
                          <p className="text-lg font-medium text-blue-600 dark:text-blue-400">
                            ${operacion.comision.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              {operaciones.filter((o) => o.estado !== 'Cerrada').length === 0 && (
                <div className="text-center py-12">
                  <FaFileContract className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No hay operaciones activas</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Comisiones */}
      {showModalComisiones && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaChartLine /> Comisiones Totales
                </h2>
                <p className="text-purple-100 text-sm mt-1">
                  ${operaciones.reduce((sum, o) => sum + o.comision, 0).toLocaleString()} en comisiones
                </p>
              </div>
              <button type="button" onClick={() => setShowModalComisiones(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {operaciones
                  .sort((a, b) => b.comision - a.comision)
                  .map((operacion, index) => (
                    <div key={operacion.id} className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 border ${currentMode === 'Dark' ? 'border-gray-700' : 'border-gray-200'} hover:shadow-md transition-shadow`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${getRankBadgeGradientClass(index)}`}>
                            #{index + 1}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg dark:text-gray-100">{operacion.propiedad}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{operacion.tipo} • {operacion.cliente}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-600 dark:text-gray-400">
                              <span>Agente: {operacion.agente}</span>
                              <span>•</span>
                              <span>{operacion.comisionPorcentaje}% comisión</span>
                              <span>•</span>
                              <span className={`px-2 py-1 rounded ${
                                operacion.estado === 'Cerrada' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                  : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              }`}
                              >
                                {operacion.estado}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-xs text-gray-500 dark:text-gray-400">Monto operación</p>
                          <p className="text-lg font-semibold dark:text-gray-200">${operacion.monto.toLocaleString()}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Comisión</p>
                          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">${operacion.comision.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>

              <div className={`mt-6 p-4 ${currentMode === 'Dark' ? 'bg-purple-900/20' : 'bg-purple-50'} rounded-lg border-2 border-purple-500`}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Comisiones</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      ${operaciones.reduce((sum, o) => sum + o.comision, 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Comisiones Cerradas</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      ${operaciones.filter((o) => o.estado === 'Cerrada').reduce((sum, o) => sum + o.comision, 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Promedio</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      ${Math.round(operaciones.reduce((sum, o) => sum + o.comision, 0) / operaciones.length).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Mayor Comisión</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      ${Math.max(...operaciones.map((o) => o.comision)).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tasa de Cierre */}
      {showModalTasaCierre && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaPercentage /> Tasa de Cierre
                </h2>
                <p className="text-orange-100 text-sm mt-1">Análisis de efectividad de ventas</p>
              </div>
              <button type="button" onClick={() => setShowModalTasaCierre(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Embudo de Ventas */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">Embudo de Operaciones</h3>
                <div className="space-y-4">
                  {[
                    { estado: 'Total Operaciones', count: operaciones.length, color: 'blue', width: '100%' },
                    { estado: 'En Proceso', count: operaciones.filter((o) => o.estado === 'En Proceso').length, color: 'yellow', width: '75%' },
                    { estado: 'Reservadas', count: operaciones.filter((o) => o.estado === 'Reservada').length, color: 'orange', width: '50%' },
                    { estado: 'Cerradas', count: operaciones.filter((o) => o.estado === 'Cerrada').length, color: 'green', width: `${((operaciones.filter((o) => o.estado === 'Cerrada').length / operaciones.length) * 100).toFixed(0)}%` },
                  ].map((etapa) => (
                    <div key={etapa.estado} className="relative">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium dark:text-gray-200">{etapa.estado}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{etapa.count} operaciones</span>
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

              {/* Estadísticas de Cierre */}
              <div className={`p-6 ${currentMode === 'Dark' ? 'bg-orange-900/20' : 'bg-orange-50'} rounded-lg border-2 border-orange-500`}>
                <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">Métricas de Cierre</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Tasa de Cierre</p>
                    <p className="text-4xl font-bold text-orange-600 dark:text-orange-400 my-2">
                      {Math.round((operaciones.filter((o) => o.estado === 'Cerrada').length / operaciones.length) * 100)}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {operaciones.filter((o) => o.estado === 'Cerrada').length} de {operaciones.length} operaciones
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">En Proceso → Cerrada</p>
                    <p className="text-4xl font-bold text-orange-600 dark:text-orange-400 my-2">
                      {operaciones.filter((o) => o.estado === 'En Proceso').length > 0
                        ? Math.round((operaciones.filter((o) => o.estado === 'Cerrada').length / (operaciones.filter((o) => o.estado === 'En Proceso').length + operaciones.filter((o) => o.estado === 'Cerrada').length)) * 100)
                        : 0}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Conversión efectiva</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Operaciones Activas</p>
                    <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 my-2">
                      {operaciones.filter((o) => o.estado !== 'Cerrada').length}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Potencial de cierre</p>
                  </div>
                </div>
              </div>

              {/* Operaciones por Estado */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { estado: 'Pendiente', color: 'yellow', icon: '📋', count: operaciones.filter((o) => o.estado === 'Pendiente').length },
                  { estado: 'En Proceso', color: 'blue', icon: '⚙️', count: operaciones.filter((o) => o.estado === 'En Proceso').length },
                  { estado: 'Reservada', color: 'orange', icon: '🔒', count: operaciones.filter((o) => o.estado === 'Reservada').length },
                  { estado: 'Cerrada', color: 'green', icon: '✅', count: operaciones.filter((o) => o.estado === 'Cerrada').length },
                ].map((item) => (
                  <div key={item.estado} className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 border ${currentMode === 'Dark' ? 'border-gray-700' : 'border-gray-200'} text-center`}>
                    <div className="text-3xl mb-2">{item.icon}</div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{item.estado}</p>
                    <p className="text-2xl font-bold dark:text-gray-100">{item.count}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {Math.round((item.count / operaciones.length) * 100)}%
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

export default Ventas;
