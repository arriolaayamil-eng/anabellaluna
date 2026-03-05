import React, { useState, useEffect, useCallback } from 'react';
import {
  FaUserFriends,
  FaRegCalendarAlt,
  FaHome,
  FaTasks,
  FaTrophy,
  FaCheckCircle,
  FaUsers,
  FaClock,
  FaPhoneAlt,
  FaDollarSign,
  FaChartLine,
  FaPercentage,
  FaFunnelDollar,
  FaArrowUp,
  FaArrowDown,
} from 'react-icons/fa';
import { Header } from '../components';
import { useStateContext } from '../contexts/ContextProvider';
import { crmService } from '../services/crmService';
import Chart from 'react-apexcharts';

const AgentDashboard = () => {
  const { currentColor, currentMode } = useStateContext();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const result = await crmService.stats.getDashboard();
      setData(result);
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 60000);
    return () => clearInterval(interval);
  }, [loadDashboard]);

  // Safely extract values with fallbacks
  const k = data?.kpis || {};
  const leads = data?.leadsEstado || {};
  const funnel = data?.funnel || {};
  const meta = data?.metaMensual || {};
  const com = data?.comisiones || {};
  const seg = data?.seguimientoCitas || {};
  const rend = data?.rendimiento || {};

  const kpis = [
    {
      title: 'Leads activos',
      value: k.leadsActivos ?? 0,
      desc: 'En seguimiento',
      icon: <FaUserFriends />,
      color: 'from-blue-500 to-blue-600',
      trend: k.leadsActivosTrend || '+0%',
    },
    {
      title: 'Visitas hoy',
      value: k.visitasHoy ?? 0,
      desc: 'Agendadas en tu calendario',
      icon: <FaRegCalendarAlt />,
      color: 'from-emerald-500 to-emerald-600',
      trend: k.visitasTrend || '+0%',
    },
    {
      title: 'Propiedades asignadas',
      value: k.propiedadesAsignadas ?? 0,
      desc: 'Activas en tu cartera',
      icon: <FaHome />,
      color: 'from-indigo-500 to-indigo-600',
      trend: '',
    },
    {
      title: 'Tareas pendientes',
      value: k.tareasPendientes ?? 0,
      desc: 'Por completar',
      icon: <FaTasks />,
      color: 'from-orange-500 to-orange-600',
      trend: k.tareasTrend || '+0%',
    },
  ];

  const proximasCitas = data?.proximasCitas || [];
  const tareasRapidas = data?.tareasRapidas || [];
  const totalLeads = (leads.cerrados || 0) + (leads.enNegociacion || 0) + (leads.perdidos || 0) + (leads.nuevos || 0);
  const conversionRate = data?.conversionRate ?? 0;

  // Comisiones chart data
  const comMensual = com.mensual || [];
  const comMeses = comMensual.map(m => m.mes);
  const comData = comMensual.map(m => m.comisiones);
  const comObjetivo = comMensual.map(m => m.objetivo);

  // ApexCharts - Progreso Meta Mensual (Radial)
  const metaOptions = {
    chart: { type: 'radialBar', height: 220, background: 'transparent', sparkline: { enabled: false } },
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
    labels: ['Meta Mensual'],
  };
  const metaSeries = [meta.porcentaje || 0];

  // ApexCharts - Estado de Leads (Donut)
  const leadsDonutOptions = {
    chart: { type: 'donut', height: 260, background: 'transparent' },
    labels: ['Cerrados', 'En Negociación', 'Perdidos', 'Nuevos'],
    colors: ['#10B981', '#F59E0B', '#EF4444', '#3B82F6'],
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: { show: true, fontSize: '12px', fontWeight: 600, color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' },
            value: { show: true, fontSize: '20px', fontWeight: 700, color: currentMode === 'Dark' ? '#F3F4F6' : '#1F2937' },
            total: { show: true, label: 'Total', fontSize: '11px', color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', formatter: () => `${totalLeads}` },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    legend: { show: true, position: 'bottom', fontSize: '11px', labels: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' } },
    stroke: { show: false },
    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light' },
  };
  const leadsDonutSeries = [leads.cerrados || 0, leads.enNegociacion || 0, leads.perdidos || 0, leads.nuevos || 0];

  // ApexCharts - Ingresos por Comisiones (Area)
  const ingresosOptions = {
    chart: { type: 'area', height: 280, background: 'transparent', toolbar: { show: false }, zoom: { enabled: false } },
    colors: ['#8B5CF6', '#10B981'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2.5 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] } },
    xaxis: {
      categories: comMeses.length > 0 ? comMeses : ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
      labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '10px' } },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '10px' }, formatter: (val) => `$${val}K` } },
    grid: { borderColor: currentMode === 'Dark' ? '#374151' : '#E5E7EB', strokeDashArray: 4 },
    legend: { show: true, position: 'top', horizontalAlign: 'right', fontSize: '11px', labels: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' } },
    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light', y: { formatter: (val) => `$${val}K` } },
  };
  const ingresosSeries = [
    { name: 'Comisiones', data: comData.length > 0 ? comData : [0] },
    { name: 'Objetivo', data: comObjetivo.length > 0 ? comObjetivo : [0] },
  ];

  // ApexCharts - Funnel Conversión
  const funnelOptions = {
    chart: { type: 'bar', height: 200, background: 'transparent', toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 6, horizontal: true, distributed: true, barHeight: '65%' } },
    colors: ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981'],
    dataLabels: { enabled: true, textAnchor: 'start', style: { colors: ['#fff'], fontSize: '11px', fontWeight: 600 }, formatter: (val, opt) => `${opt.w.globals.labels[opt.dataPointIndex]}: ${val}`, offsetX: 5 },
    xaxis: { categories: ['Captados', 'Contactados', 'Negociación', 'Cerrados'], labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { show: false } },
    grid: { show: false },
    legend: { show: false },
    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light', y: { formatter: (val) => `${val} leads` } },
  };
  const funnelSeries = [{ name: 'Leads', data: [funnel.captados || 0, funnel.contactados || 0, funnel.negociacion || 0, funnel.cerrados || 0] }];

  // ApexCharts - Tasa de Conversión (Gauge)
  const conversionOptions = {
    chart: { type: 'radialBar', height: 180, background: 'transparent', sparkline: { enabled: true } },
    plotOptions: {
      radialBar: {
        startAngle: -90, endAngle: 90,
        hollow: { size: '60%' },
        track: { background: currentMode === 'Dark' ? '#374151' : '#E5E7EB', strokeWidth: '100%' },
        dataLabels: {
          name: { show: true, fontSize: '11px', color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', offsetY: 18 },
          value: { show: true, fontSize: '24px', fontWeight: 700, color: currentMode === 'Dark' ? '#F3F4F6' : '#1F2937', offsetY: -12, formatter: (val) => `${val}%` },
        },
      },
    },
    fill: { type: 'gradient', gradient: { shade: 'dark', colorStops: [{ offset: 0, color: '#8B5CF6', opacity: 1 }, { offset: 100, color: '#6366F1', opacity: 1 }] } },
    stroke: { lineCap: 'round' },
    labels: ['Conversión'],
  };
  const conversionSeries = [conversionRate || 0];

  const isDark = currentMode === 'Dark';
  const cardBase = `rounded-2xl p-6 border transition-shadow ${isDark ? 'bg-secondary-dark-bg border-gray-700/50 hover:border-indigo-500/30' : 'bg-white border-gray-100 shadow-md hover:shadow-lg'}`;

  return (
    <div className={`min-h-screen px-6 lg:px-8 pt-4 pb-6 ${isDark ? 'bg-main-dark-bg' : 'bg-gray-50'}`}>
      <div className="mb-6">
        <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <FaHome className="text-blue-500" /> Panel del Agente
        </h2>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Resumen de tu actividad</p>
      </div>

      {/* KPIs principales del agente (misma estructura que DashboardEjecutivo) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => {
          const colorMap = { 'from-blue-500 to-blue-600': '#3b82f6', 'from-emerald-500 to-emerald-600': '#10b981', 'from-violet-500 to-violet-600': '#8b5cf6', 'from-amber-500 to-amber-600': '#f59e0b', 'from-green-500 to-green-600': '#10b981', 'from-red-500 to-red-600': '#ef4444', 'from-purple-500 to-purple-600': '#8b5cf6', 'from-orange-500 to-orange-600': '#f59e0b' };
          const accentColor = colorMap[kpi.color] || '#6366f1';
          const bgMap = { 'from-blue-500 to-blue-600': 'bg-blue-50 dark:bg-blue-900/20', 'from-emerald-500 to-emerald-600': 'bg-emerald-50 dark:bg-emerald-900/20', 'from-violet-500 to-violet-600': 'bg-purple-50 dark:bg-purple-900/20', 'from-amber-500 to-amber-600': 'bg-amber-50 dark:bg-amber-900/20', 'from-green-500 to-green-600': 'bg-emerald-50 dark:bg-emerald-900/20', 'from-red-500 to-red-600': 'bg-red-50 dark:bg-red-900/20', 'from-purple-500 to-purple-600': 'bg-purple-50 dark:bg-purple-900/20', 'from-orange-500 to-orange-600': 'bg-amber-50 dark:bg-amber-900/20' };
          const bgColor = bgMap[kpi.color] || 'bg-indigo-50 dark:bg-indigo-900/20';
          return (
            <div key={kpi.title} className={`rounded-2xl p-6 border shadow-sm transition-all ${isDark ? 'bg-secondary-dark-bg border-gray-700/50 hover:border-indigo-500/30' : 'bg-white border-gray-100 hover:shadow-lg'}`} style={{ borderLeft: `4px solid ${accentColor}` }}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${bgColor} flex items-center justify-center`}>
                  <span className="text-lg" style={{ color: accentColor }}>{kpi.icon}</span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30">{kpi.trend}</span>
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{kpi.value}</p>
              <p className={`text-sm font-semibold mt-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{kpi.title}</p>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{kpi.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Gráficos Financieros y Conversión - ApexCharts */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-8">
        {/* Meta Mensual */}
        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-1">
            <FaDollarSign className="text-emerald-500" />
            <h3 className="font-semibold dark:text-gray-100">Meta Mensual</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Progreso de operaciones</p>
          <Chart options={metaOptions} series={metaSeries} type="radialBar" height={200} />
          <div className="flex justify-between items-center pt-3 border-t dark:border-gray-700">
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{meta.actual ?? 0}</p>
              <p className="text-xs text-gray-500">Actual</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-500">{meta.meta ?? 20}</p>
              <p className="text-xs text-gray-500">Meta</p>
            </div>
          </div>
        </div>

        {/* Estado de Leads - Donut */}
        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-1">
            <FaUserFriends className="text-blue-500" />
            <h3 className="font-semibold dark:text-gray-100">Estado de Leads</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Distribución actual</p>
          <Chart options={leadsDonutOptions} series={leadsDonutSeries} type="donut" height={240} />
        </div>

        {/* Funnel de Conversión */}
        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-1">
            <FaFunnelDollar className="text-purple-500" />
            <h3 className="font-semibold dark:text-gray-100">Funnel de Leads</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Proceso de conversión</p>
          <Chart options={funnelOptions} series={funnelSeries} type="bar" height={180} />
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t dark:border-gray-700">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded text-center">
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{funnel.captados > 0 ? Math.round((funnel.cerrados / funnel.captados) * 100) : 0}%</p>
              <p className="text-xs text-gray-500">Cierre</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-center">
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{funnel.captados > 0 ? Math.round((funnel.contactados / funnel.captados) * 100) : 0}%</p>
              <p className="text-xs text-gray-500">Contacto</p>
            </div>
          </div>
        </div>

        {/* Tasa de Conversión */}
        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-1">
            <FaPercentage className="text-indigo-500" />
            <h3 className="font-semibold dark:text-gray-100">Coef. de Cierre</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Ratio de conversión</p>
          <Chart options={conversionOptions} series={conversionSeries} type="radialBar" height={160} />
          <div className="space-y-2 mt-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">Promedio industria</span>
              <span className="font-bold text-gray-500">18%</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">Tu rendimiento</span>
              <span className={`font-bold flex items-center gap-1 ${conversionRate >= 18 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                {conversionRate >= 18 ? <FaArrowUp className="text-xs" /> : <FaArrowDown className="text-xs" />} {conversionRate > 18 ? '+' : ''}{conversionRate - 18}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, conversionRate * 4)}%` }}></div>
            </div>
            <p className="text-xs text-center text-gray-500">{conversionRate >= 18 ? 'Por encima del promedio' : 'Por debajo del promedio'}</p>
          </div>
        </div>
      </div>

      {/* Gráfico de Comisiones - Full Width */}
      <div className="mb-8">
        <div className={cardBase}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <FaChartLine className="text-purple-500" />
                <h3 className="font-semibold dark:text-gray-100">Comisiones Anuales</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Comparativa vs objetivo mensual</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Comisiones</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-xs text-gray-600 dark:text-gray-400">Objetivo</span>
              </div>
            </div>
          </div>
          <Chart options={ingresosOptions} series={ingresosSeries} type="area" height={260} />
          <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t dark:border-gray-700">
            <div className="text-center p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">${com.totalAnual ?? 0}K</p>
              <p className="text-xs text-gray-500">Total Ganado</p>
            </div>
            <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">${com.esteMes ?? 0}K</p>
              <p className="text-xs text-gray-500">Este Mes</p>
            </div>
            <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">${com.promedio ?? 0}K</p>
              <p className="text-xs text-gray-500">Promedio</p>
            </div>
            <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <p className="text-xl font-bold text-orange-600 dark:text-orange-400">{rend.totalOpsAllTime ?? 0}</p>
              <p className="text-xs text-gray-500">Ops. Totales</p>
            </div>
          </div>
        </div>
      </div>

      {/* Seguimiento post-cita */}
      <div className="mb-8">
        <div className={cardBase}>
          <h3 className="font-semibold dark:text-gray-100 mb-4 flex items-center gap-2">
            <FaCheckCircle className="text-green-500" /> Seguimiento de Citas
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border-2 border-green-500 rounded-lg hover:bg-green-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
              <FaCheckCircle className="text-3xl text-green-500 mx-auto mb-2" />
              <h4 className="font-bold dark:text-gray-200 text-sm">Completadas</h4>
              <p className="text-2xl font-bold text-green-600 mt-1">{seg.completadas ?? 0}</p>
              <p className="text-xs text-gray-500">Esta semana</p>
            </div>
            <div className="text-center p-4 border-2 border-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
              <FaUsers className="text-3xl text-blue-500 mx-auto mb-2" />
              <h4 className="font-bold dark:text-gray-200 text-sm">Interesados</h4>
              <p className="text-2xl font-bold text-blue-600 mt-1">{seg.interesados ?? 0}</p>
              <p className="text-xs text-gray-500">Seguimiento</p>
            </div>
            <div className="text-center p-4 border-2 border-yellow-500 rounded-lg hover:bg-yellow-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
              <FaClock className="text-3xl text-yellow-500 mx-auto mb-2" />
              <h4 className="font-bold dark:text-gray-200 text-sm">Reagendar</h4>
              <p className="text-2xl font-bold text-yellow-600 mt-1">{seg.reagendar ?? 0}</p>
              <p className="text-xs text-gray-500">Pendientes</p>
            </div>
            <div className="text-center p-4 border-2 border-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
              <FaPhoneAlt className="text-3xl text-red-500 mx-auto mb-2" />
              <h4 className="font-bold dark:text-gray-200 text-sm">Canceladas</h4>
              <p className="text-2xl font-bold text-red-600 mt-1">{seg.noContactados ?? 0}</p>
              <p className="text-xs text-gray-500">Atención</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Próximas citas */}
        <div className="lg:col-span-2">
          <div className={cardBase}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Próximas citas
              </h2>
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300">
                {proximasCitas.length} hoy
              </span>
            </div>

            <div className="space-y-3">
              {proximasCitas.map((cita, index) => (
                <div
                  key={`${cita.cliente}-${index}`}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/40"
                >
                  <div>
                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {cita.cliente}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {cita.propiedad}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {cita.hora}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {cita.estado}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tareas rápidas */}
        <div>
          <div className={cardBase}>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Tareas rápidas
            </h2>
            <ul className="space-y-2">
              {tareasRapidas.length > 0 ? tareasRapidas.map((tarea) => (
                <li
                  key={tarea.id}
                  className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/40 text-sm text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 flex items-center justify-between"
                >
                  <span>{tarea.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    tarea.priority === 'Alta' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' :
                    tarea.priority === 'Media' ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                  }`}>{tarea.priority}</span>
                </li>
              )) : (
                <li className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/40 text-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 text-center">
                  Sin tareas pendientes
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Widget adicional: rendimiento personal */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={cardBase}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <FaTrophy className="text-yellow-500" />
              Rendimiento personal
            </h2>
            <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
              Este mes
            </span>
          </div>

          <div className="space-y-3 text-sm text-gray-700 dark:text-gray-200">
            <div className="flex items-center justify-between">
              <span>Objetivo de operaciones</span>
              <span className="font-semibold">{rend.operacionesActual ?? 0} / {rend.operacionesMeta ?? 20}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full" style={{ width: `${meta.porcentaje ?? 0}%` }} />
            </div>

            <div className="flex items-center justify-between mt-4">
              <span>Conversión de leads</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{conversionRate}%</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {conversionRate >= 20 ? 'Excelente tasa de conversión. ¡Seguí así!' : 'Mantén una tasa de conversión por encima del 20% para cumplir tus metas mensuales.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
