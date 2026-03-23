import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FaDollarSign, FaFileContract, FaChartLine, FaPlus, FaPercentage, FaHandshake, FaArrowUp, FaCalendarAlt, FaTimes, FaSave, FaHome, FaUser, FaMapMarkerAlt, FaClock, FaCheckCircle } from 'react-icons/fa';
import { useStateContext } from '../contexts/ContextProvider';
import { crmService } from '../services/crmService';

import Chart from 'react-apexcharts';

const Ventas = () => {
  const { currentMode, currentColor } = useStateContext();
  
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
  const [nuevaVenta, setNuevaVenta] = useState({
    propiedad: '',
    cliente: '',
    monto: '',
    moneda: 'USD',
    agente: '',
    fechaCierre: '',
    comision: '3.5',
    formaPago: 'Contado',
    observaciones: '',
  });
  
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
      console.error('Error loading operaciones stats:', err);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Datos reales de backend
  const sk = statsData?.kpis || {};
  const tend = statsData?.tendencia || {};
  const est = statsData?.estados || {};
  const metaData = statsData?.meta || {};
  const seg = statsData?.seguimiento || {};

  const kpisVentas = [
    { title: 'Ventas del Mes', value: `$${((sk.ventasMes?.value || 0) / 1000).toFixed(0)}K`, desc: `${sk.ventasMes?.count ?? 0} operaciones`, icon: <FaDollarSign />, color: 'from-emerald-500 to-emerald-600', trend: sk.ventasMes?.trend || '0%' },
    { title: 'Operaciones Activas', value: sk.operacionesActivas?.value ?? 0, desc: `${sk.operacionesActivas?.enReserva ?? 0} en cierre`, icon: <FaFileContract />, color: 'from-blue-500 to-blue-600', trend: `+${sk.operacionesActivas?.value ?? 0}` },
    { title: 'Comisiones', value: `$${((sk.comisiones?.value || 0) / 1000).toFixed(0)}K`, desc: 'Este mes', icon: <FaChartLine />, color: 'from-violet-500 to-violet-600', trend: sk.comisiones?.trend || '0%' },
    { title: 'Tasa de Cierre', value: `${sk.tasaCierre?.value ?? 0}%`, desc: 'Últimos 30 días', icon: <FaPercentage />, color: 'from-amber-500 to-amber-600', trend: sk.tasaCierre?.trend || '0%' },
  ];

  // ApexCharts configurations
  const tendenciasAreaOptions = {
    chart: { type: 'area', height: 280, background: 'transparent', toolbar: { show: false }, zoom: { enabled: false } },
    colors: ['#10B981', '#3B82F6'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2.5 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] } },
    xaxis: {
      categories: tend.meses || [''],
      labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '10px' } },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '10px' } } },
    grid: { borderColor: currentMode === 'Dark' ? '#374151' : '#E5E7EB', strokeDashArray: 4 },
    legend: { show: true, position: 'top', horizontalAlign: 'right', fontSize: '11px', labels: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' } },
    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light' },
  };
  const tendenciasAreaSeries = [
    { name: 'Ventas', data: tend.ventas || [0] },
    { name: 'Alquileres', data: tend.alquileres || [0] },
  ];

  const estadosDonutOptions = {
    chart: { type: 'donut', height: 260, background: 'transparent' },
    labels: ['Cerrada', 'En Curso', 'Reservada'],
    colors: ['#10B981', '#3B82F6', '#F59E0B'],
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: { show: true, fontSize: '12px', fontWeight: 600, color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' },
            value: { show: true, fontSize: '20px', fontWeight: 700, color: currentMode === 'Dark' ? '#F3F4F6' : '#1F2937' },
            total: { show: true, label: 'Total', fontSize: '11px', color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', formatter: () => est.total || 0 },
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
    est.cerradas || 0,
    est.enCurso || 0,
    est.reservadas || 0,
  ];

  const cierreRadialOptions = {
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
    fill: { type: 'gradient', gradient: { shade: 'dark', type: 'horizontal', colorStops: [{ offset: 0, color: '#10B981', opacity: 1 }, { offset: 100, color: '#059669', opacity: 1 }] } },
    stroke: { lineCap: 'round' },
    labels: ['Cierre'],
  };
  const cierreRadialSeries = [sk.tasaCierre?.value || 0];

  const agCom = statsData?.agentComisiones || [];
  const comisionesBarOptions = {
    chart: { type: 'bar', height: 200, background: 'transparent', toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 6, horizontal: true, distributed: true, barHeight: '70%' } },
    colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
    dataLabels: { enabled: true, style: { colors: ['#fff'], fontSize: '11px', fontWeight: 600 }, formatter: (val) => `$${(val/1000).toFixed(0)}K` },
    xaxis: { categories: agCom.map(a => a.nombre.split(' ')[0]), labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '11px' } } },
    grid: { show: false },
    legend: { show: false },
    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light', y: { formatter: (val) => `$${val.toLocaleString()}` } },
  };
  const comisionesBarSeries = [{ name: 'Comisiones', data: agCom.map(a => a.comision) }];

  const isDark = currentMode === 'Dark';
  const cardBase = `rounded-2xl p-6 border transition-shadow ${isDark ? 'bg-secondary-dark-bg border-gray-700/50 hover:border-indigo-500/30' : 'bg-white border-gray-100 shadow-md hover:shadow-lg'}`;

  // Funciones de manejo para Venta
  const handleVentaChange = (e) => {
    const { name, value } = e.target;
    setNuevaVenta(prev => ({ ...prev, [name]: value }));
  };

  const handleVentaSubmit = (e) => {
    e.preventDefault();
    console.log('Nueva venta:', nuevaVenta);
    toast.success('¡Venta registrada exitosamente!');
    setShowModalVenta(false);
    setNuevaVenta({
      propiedad: '',
      cliente: '',
      monto: '',
      moneda: 'USD',
      agente: '',
      fechaCierre: '',
      comision: '3.5',
      formaPago: 'Contado',
      observaciones: '',
    });
  };

  // Funciones de manejo para Alquiler
  const handleAlquilerChange = (e) => {
    const { name, value } = e.target;
    setNuevoAlquiler(prev => ({ ...prev, [name]: value }));
  };

  const handleAlquilerSubmit = (e) => {
    e.preventDefault();
    console.log('Nuevo alquiler:', nuevoAlquiler);
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
    setNuevoSeguimiento(prev => ({ ...prev, [name]: value }));
  };

  const handleSeguimientoSubmit = (e) => {
    e.preventDefault();
    console.log('Nuevo seguimiento:', nuevoSeguimiento);
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
      
      {/* Botones de Acción */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button 
          onClick={() => setShowModalVenta(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium bg-emerald-500 hover:bg-emerald-600 transition-all shadow-sm hover:shadow-md"
        >
          <FaPlus /> Nueva Venta
        </button>
        <button 
          onClick={() => setShowModalAlquiler(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium bg-blue-500 hover:bg-blue-600 transition-all shadow-sm hover:shadow-md"
        >
          <FaHandshake /> Nuevo Alquiler
        </button>
        <button 
          onClick={() => setShowModalSeguimiento(true)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border transition-all ${isDark ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
        >
          <FaCalendarAlt /> Programar Seguimiento
        </button>
      </div>

      {/* KPIs de Operaciones */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpisVentas.map((kpi, i) => {
          const colorMap = { 'from-emerald-500 to-emerald-600': '#10b981', 'from-blue-500 to-blue-600': '#3b82f6', 'from-violet-500 to-violet-600': '#8b5cf6', 'from-amber-500 to-amber-600': '#f59e0b' };
          const accentColor = colorMap[kpi.color] || '#6366f1';
          const bgMap = { 'from-emerald-500 to-emerald-600': 'bg-emerald-50 dark:bg-emerald-900/20', 'from-blue-500 to-blue-600': 'bg-blue-50 dark:bg-blue-900/20', 'from-violet-500 to-violet-600': 'bg-purple-50 dark:bg-purple-900/20', 'from-amber-500 to-amber-600': 'bg-amber-50 dark:bg-amber-900/20' };
          const bgColor = bgMap[kpi.color] || 'bg-indigo-50 dark:bg-indigo-900/20';
          return (
            <div 
              key={i} 
              onClick={() => {
                if (i === 0) setShowModalVentasMes(true);
                else if (i === 1) setShowModalOperacionesActivas(true);
                else if (i === 2) setShowModalComisiones(true);
                else if (i === 3) setShowModalTasaCierre(true);
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
        {/* Tasa de Cierre */}
        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-1">
            <FaPercentage className="text-emerald-500" />
            <h3 className="font-semibold dark:text-gray-100">Tasa Cierre</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Operaciones cerradas</p>
          <Chart options={cierreRadialOptions} series={cierreRadialSeries} type="radialBar" height={180} />
          <div className="flex justify-between items-center pt-3 border-t dark:border-gray-700">
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{est.cerradas ?? 0}</p>
              <p className="text-xs text-gray-500">Cerradas</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-500">{est.total ?? 0}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>

        {/* Estados de Operaciones - Donut */}
        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-1">
            <FaFileContract className="text-blue-500" />
            <h3 className="font-semibold dark:text-gray-100">Estados</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Distribución actual</p>
          <Chart options={estadosDonutOptions} series={estadosDonutSeries} type="donut" height={240} />
        </div>

        {/* Comisiones por Agente - Bar */}
        <div className={`xl:col-span-2 ${cardBase}`}>
          <div className="flex items-center gap-2 mb-1">
            <FaDollarSign className="text-violet-500" />
            <h3 className="font-semibold dark:text-gray-100">Comisiones por Agente</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Distribución este mes</p>
          <Chart options={comisionesBarOptions} series={comisionesBarSeries} type="bar" height={200} />
        </div>
      </div>

      {/* Gráfico de Tendencias - Full Width */}
      <div className="mb-8">
        <div className={cardBase}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <FaChartLine className="text-emerald-500" />
                <h3 className="font-semibold dark:text-gray-100">Tendencias de Operaciones</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ventas vs Alquileres (últimos 6 meses)</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Ventas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Alquileres</span>
              </div>
            </div>
          </div>
          <Chart options={tendenciasAreaOptions} series={tendenciasAreaSeries} type="area" height={260} />
          <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t dark:border-gray-700">
            <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">${((sk.ventasMes?.value || 0) / 1000).toFixed(0)}K</p>
              <p className="text-xs text-gray-500">Ventas Mes</p>
            </div>
            <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{tend.totalAlquileres ?? 0}</p>
              <p className="text-xs text-gray-500">Alquileres</p>
            </div>
            <div className="text-center p-2 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
              <p className="text-xl font-bold text-violet-600 dark:text-violet-400">${((tend.totalComisiones || 0) / 1000).toFixed(1)}K</p>
              <p className="text-xs text-gray-500">Comisiones</p>
            </div>
            <div className="text-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{tend.trendVsAnterior || '0%'}</p>
              <p className="text-xs text-gray-500">vs Mes Ant.</p>
            </div>
          </div>
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
            {agCom.map((ag, i) => {
              const maxCom = Math.max(...agCom.map(a => a.comision), 1);
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
                    ></div>
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
              <button onClick={() => setShowModalVenta(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
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
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Propiedad *</label>
                    <input type="text" name="propiedad" value={nuevaVenta.propiedad} onChange={handleVentaChange} required placeholder="Depto 2amb Palermo" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Cliente *</label>
                    <input type="text" name="cliente" value={nuevaVenta.cliente} onChange={handleVentaChange} required placeholder="Juan Pérez" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Monto *</label>
                    <input type="number" name="monto" value={nuevaVenta.monto} onChange={handleVentaChange} required placeholder="150000" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Moneda *</label>
                    <select name="moneda" value={nuevaVenta.moneda} onChange={handleVentaChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100">
                      <option value="USD">USD - Dólares</option>
                      <option value="ARS">ARS - Pesos</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Agente *</label>
                    <select name="agente" value={nuevaVenta.agente} onChange={handleVentaChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100">
                      <option value="">Seleccionar agente</option>
                      <option value="Ana López">Ana López</option>
                      <option value="Carlos Ruiz">Carlos Ruiz</option>
                      <option value="Laura Fernández">Laura Fernández</option>
                      <option value="Sofía Torres">Sofía Torres</option>
                      <option value="Marcos Silva">Marcos Silva</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Fecha de Cierre *</label>
                    <input type="date" name="fechaCierre" value={nuevaVenta.fechaCierre} onChange={handleVentaChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Comisión (%)</label>
                    <input type="number" name="comision" value={nuevaVenta.comision} onChange={handleVentaChange} step="0.1" placeholder="3.5" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Forma de Pago</label>
                    <select name="formaPago" value={nuevaVenta.formaPago} onChange={handleVentaChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100">
                      <option value="Contado">Contado</option>
                      <option value="Financiado">Financiado</option>
                      <option value="Hipoteca">Hipoteca</option>
                      <option value="Mixto">Mixto</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">Observaciones</label>
                <textarea name="observaciones" value={nuevaVenta.observaciones} onChange={handleVentaChange} rows="3" placeholder="Detalles adicionales de la operación..." className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100" />
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
              <button onClick={() => setShowModalAlquiler(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
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
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Propiedad *</label>
                    <input type="text" name="propiedad" value={nuevoAlquiler.propiedad} onChange={handleAlquilerChange} required placeholder="Casa 3amb Belgrano" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Cliente *</label>
                    <input type="text" name="cliente" value={nuevoAlquiler.cliente} onChange={handleAlquilerChange} required placeholder="María González" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Monto Mensual *</label>
                    <input type="number" name="montoMensual" value={nuevoAlquiler.montoMensual} onChange={handleAlquilerChange} required placeholder="1200" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Moneda *</label>
                    <select name="moneda" value={nuevoAlquiler.moneda} onChange={handleAlquilerChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100">
                      <option value="USD">USD - Dólares</option>
                      <option value="ARS">ARS - Pesos</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Agente *</label>
                    <select name="agente" value={nuevoAlquiler.agente} onChange={handleAlquilerChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100">
                      <option value="">Seleccionar agente</option>
                      <option value="Ana López">Ana López</option>
                      <option value="Carlos Ruiz">Carlos Ruiz</option>
                      <option value="Laura Fernández">Laura Fernández</option>
                      <option value="Sofía Torres">Sofía Torres</option>
                      <option value="Marcos Silva">Marcos Silva</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Fecha de Inicio *</label>
                    <input type="date" name="fechaInicio" value={nuevoAlquiler.fechaInicio} onChange={handleAlquilerChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Duración (meses)</label>
                    <input type="number" name="duracion" value={nuevoAlquiler.duracion} onChange={handleAlquilerChange} placeholder="12" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Depósito</label>
                    <input type="number" name="deposito" value={nuevoAlquiler.deposito} onChange={handleAlquilerChange} placeholder="2400" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Comisión (meses)</label>
                    <input type="number" name="comision" value={nuevoAlquiler.comision} onChange={handleAlquilerChange} step="0.5" placeholder="1" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">Observaciones</label>
                <textarea name="observaciones" value={nuevoAlquiler.observaciones} onChange={handleAlquilerChange} rows="3" placeholder="Detalles adicionales del alquiler..." className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
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
              <button onClick={() => setShowModalSeguimiento(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
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
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Operación *</label>
                    <select name="operacion" value={nuevoSeguimiento.operacion} onChange={handleSeguimientoChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-gray-100">
                      <option value="">Seleccionar operación</option>
                      {operaciones.map(op => (
                        <option key={op.id} value={op.id}>{op.propiedad} - {op.cliente}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Tipo de Seguimiento *</label>
                    <select name="tipo" value={nuevoSeguimiento.tipo} onChange={handleSeguimientoChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-gray-100">
                      <option value="Llamada">Llamada</option>
                      <option value="Email">Email</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Reunión">Reunión</option>
                      <option value="Visita">Visita</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Prioridad *</label>
                    <select name="prioridad" value={nuevoSeguimiento.prioridad} onChange={handleSeguimientoChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-gray-100">
                      <option value="Baja">Baja</option>
                      <option value="Media">Media</option>
                      <option value="Alta">Alta</option>
                      <option value="Urgente">Urgente</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Fecha *</label>
                    <input type="date" name="fecha" value={nuevoSeguimiento.fecha} onChange={handleSeguimientoChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Hora *</label>
                    <input type="time" name="hora" value={nuevoSeguimiento.hora} onChange={handleSeguimientoChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-gray-100" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">Descripción *</label>
                <textarea name="descripcion" value={nuevoSeguimiento.descripcion} onChange={handleSeguimientoChange} required rows="4" placeholder="Detalles del seguimiento a realizar..." className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-gray-100" />
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
                  ${operaciones.filter(o => o.tipo === 'Venta' && o.estado === 'Cerrada').reduce((sum, o) => sum + o.monto, 0).toLocaleString()} en ventas cerradas
                </p>
              </div>
              <button onClick={() => setShowModalVentasMes(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {operaciones
                  .filter(o => o.tipo === 'Venta' && o.estado === 'Cerrada')
                  .sort((a, b) => b.monto - a.monto)
                  .map((operacion, index) => (
                    <div key={operacion.id} className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 border ${currentMode === 'Dark' ? 'border-gray-700' : 'border-gray-200'} hover:shadow-md transition-shadow`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                            index === 0 ? 'bg-yellow-400 text-yellow-900' :
                            index === 1 ? 'bg-gray-300 text-gray-700' :
                            index === 2 ? 'bg-orange-400 text-orange-900' :
                            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          }`}>
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
                      ${operaciones.filter(o => o.tipo === 'Venta' && o.estado === 'Cerrada').reduce((sum, o) => sum + o.monto, 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Cantidad</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {operaciones.filter(o => o.tipo === 'Venta' && o.estado === 'Cerrada').length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Promedio</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${Math.round(operaciones.filter(o => o.tipo === 'Venta' && o.estado === 'Cerrada').reduce((sum, o) => sum + o.monto, 0) / operaciones.filter(o => o.tipo === 'Venta' && o.estado === 'Cerrada').length).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Comisiones</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      ${operaciones.filter(o => o.tipo === 'Venta' && o.estado === 'Cerrada').reduce((sum, o) => sum + o.comision, 0).toLocaleString()}
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
                  {operaciones.filter(o => o.estado !== 'Cerrada').length} operaciones en proceso
                </p>
              </div>
              <button onClick={() => setShowModalOperacionesActivas(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {operaciones
                  .filter(o => o.estado !== 'Cerrada')
                  .sort((a, b) => {
                    const estadoOrder = { 'Reservada': 1, 'En Proceso': 2, 'Pendiente': 3 };
                    return (estadoOrder[a.estado] || 4) - (estadoOrder[b.estado] || 4);
                  })
                  .map((operacion) => (
                    <div key={operacion.id} className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 border-2 ${currentMode === 'Dark' ? 'border-blue-700' : 'border-blue-200'} hover:shadow-md transition-shadow`}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-lg dark:text-gray-100">{operacion.propiedad}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              operacion.estado === 'Reservada' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                              operacion.estado === 'En Proceso' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                              'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                            }`}>
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
              
              {operaciones.filter(o => o.estado !== 'Cerrada').length === 0 && (
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
              <button onClick={() => setShowModalComisiones(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
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
                          <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                            index === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                            index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700' :
                            index === 2 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                            'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                          }`}>
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
                                operacion.estado === 'Cerrada' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              }`}>
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
                      ${operaciones.filter(o => o.estado === 'Cerrada').reduce((sum, o) => sum + o.comision, 0).toLocaleString()}
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
                      ${Math.max(...operaciones.map(o => o.comision)).toLocaleString()}
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
              <button onClick={() => setShowModalTasaCierre(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
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
                    { estado: 'En Proceso', count: operaciones.filter(o => o.estado === 'En Proceso').length, color: 'yellow', width: '75%' },
                    { estado: 'Reservadas', count: operaciones.filter(o => o.estado === 'Reservada').length, color: 'orange', width: '50%' },
                    { estado: 'Cerradas', count: operaciones.filter(o => o.estado === 'Cerrada').length, color: 'green', width: `${(operaciones.filter(o => o.estado === 'Cerrada').length / operaciones.length * 100).toFixed(0)}%` },
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
                      {Math.round((operaciones.filter(o => o.estado === 'Cerrada').length / operaciones.length) * 100)}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {operaciones.filter(o => o.estado === 'Cerrada').length} de {operaciones.length} operaciones
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">En Proceso → Cerrada</p>
                    <p className="text-4xl font-bold text-orange-600 dark:text-orange-400 my-2">
                      {operaciones.filter(o => o.estado === 'En Proceso').length > 0 
                        ? Math.round((operaciones.filter(o => o.estado === 'Cerrada').length / (operaciones.filter(o => o.estado === 'En Proceso').length + operaciones.filter(o => o.estado === 'Cerrada').length)) * 100)
                        : 0}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Conversión efectiva</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Operaciones Activas</p>
                    <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 my-2">
                      {operaciones.filter(o => o.estado !== 'Cerrada').length}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Potencial de cierre</p>
                  </div>
                </div>
              </div>

              {/* Operaciones por Estado */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { estado: 'Pendiente', color: 'yellow', icon: '📋', count: operaciones.filter(o => o.estado === 'Pendiente').length },
                  { estado: 'En Proceso', color: 'blue', icon: '⚙️', count: operaciones.filter(o => o.estado === 'En Proceso').length },
                  { estado: 'Reservada', color: 'orange', icon: '🔒', count: operaciones.filter(o => o.estado === 'Reservada').length },
                  { estado: 'Cerrada', color: 'green', icon: '✅', count: operaciones.filter(o => o.estado === 'Cerrada').length },
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
