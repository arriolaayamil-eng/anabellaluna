import React, { useState, useEffect, useCallback } from 'react';
import { FaBuilding, FaUsers, FaDollarSign, FaKey, FaArrowUp, FaArrowDown, FaChartLine, FaPercent, FaCalendarAlt, FaTrophy, FaMedal, FaAward, FaReceipt, FaBalanceScale, FaSeedling, FaClock, FaBullseye, FaUserPlus, FaHome, FaAddressBook } from 'react-icons/fa';
import { HiOutlineDotsHorizontal, HiTrendingUp } from 'react-icons/hi';
import Chart from 'react-apexcharts';
import { useStateContext } from '../contexts/ContextProvider';
import { crmService } from '../services/crmService';

const DashboardEjecutivo = () => {
  const { currentMode } = useStateContext();
  const isDark = currentMode === 'Dark';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const result = await crmService.stats.getAdminDashboard();
      setData(result);
    } catch (err) {
      console.error('Error loading admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 120000);
    return () => clearInterval(interval);
  }, [loadDashboard]);

  // Colores base para gráficos
  const chartColors = {
    primary: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6',
    pink: '#ec4899',
    cyan: '#06b6d4',
    text: isDark ? '#e5e7eb' : '#374151',
    grid: isDark ? '#374151' : '#e5e7eb',
  };

  // Safely extract data with fallbacks
  const dk = data?.kpis || {};
  const fm = data?.financialMetrics || {};
  const rev = data?.revenueMonthly || {};
  const inc = data?.incomeBreakdown || {};
  const quarters = data?.quarters || [];
  const opsMo = data?.opsMonthly || {};
  const propTypes = data?.propertyTypes || {};
  const agentes = data?.agentes || [];
  const teamMetrics = data?.teamMetrics || {};
  const actividades = data?.actividades || [];
  const footer = data?.footerStats || {};
  const mktMetrics = data?.marketingMetrics || {};

  function fmtMoney(val) {
    if (!val && val !== 0) return '$0';
    if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`;
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
    return `$${val}`;
  }

  // KPIs principales
  const kpis = [
    { title: 'Ingresos Totales', value: dk.ingresosTotales?.value || '$0', change: dk.ingresosTotales?.change || '+0%', trend: 'up', icon: FaDollarSign, color: '#10b981', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20', subtitle: `Meta anual: ${fmtMoney(dk.ingresosTotales?.yearGoal)} (${dk.ingresosTotales?.yearProgress || '0%'})` },
    { title: 'Comisiones', value: dk.comisiones?.value || '$0', change: dk.comisiones?.change || '+0%', trend: 'up', icon: FaPercent, color: '#6366f1', bgColor: 'bg-indigo-50 dark:bg-indigo-900/20', subtitle: `${dk.comisiones?.rate || '6%'} promedio` },
    { title: 'Operaciones', value: String(dk.operaciones?.value ?? 0), change: `+${dk.operaciones?.change || 0}`, trend: 'up', icon: FaChartLine, color: '#f59e0b', bgColor: 'bg-amber-50 dark:bg-amber-900/20', subtitle: `${dk.operaciones?.ventas ?? 0} ventas + ${dk.operaciones?.alquileres ?? 0} alquileres` },
    { title: 'Tasa Conversión', value: dk.tasaConversion?.value || '0%', change: dk.tasaConversion?.change || '+0pp', trend: 'up', icon: HiTrendingUp, color: '#8b5cf6', bgColor: 'bg-purple-50 dark:bg-purple-900/20', subtitle: `vs ${dk.tasaConversion?.prev || '0%'} mes anterior` },
  ];

  // Gráfico de ingresos con proyección (Area)
  const revenueChart = {
    options: {
      chart: { type: 'area', toolbar: { show: false }, background: 'transparent' },
      colors: [chartColors.primary, chartColors.success, chartColors.warning],
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1, stops: [0, 90, 100] } },
      stroke: { curve: 'smooth', width: 3 },
      dataLabels: { enabled: false },
      xaxis: { 
        categories: rev.meses || ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'], 
        labels: { style: { colors: chartColors.text, fontSize: '11px' } }, 
        axisBorder: { show: false }, 
        axisTicks: { show: false } 
      },
      yaxis: { labels: { style: { colors: chartColors.text, fontSize: '11px' }, formatter: (val) => `$${(val/1000).toFixed(0)}K` } },
      grid: { borderColor: chartColors.grid, strokeDashArray: 4, padding: { left: 10, right: 10 } },
      legend: { show: true, position: 'top', horizontalAlign: 'right', labels: { colors: chartColors.text }, markers: { width: 8, height: 8, radius: 8 } },
      tooltip: { theme: isDark ? 'dark' : 'light', y: { formatter: (val) => `$${val.toLocaleString()}` } },
      annotations: {
        yaxis: [{ y: 1000000, borderColor: chartColors.danger, strokeDashArray: 5, label: { text: 'Meta Mensual', style: { color: '#fff', background: chartColors.danger } } }]
      }
    },
    series: [
      { name: 'Ventas', data: rev.ventas || [0] },
      { name: 'Alquileres', data: rev.alquileres || [0] },
      { name: 'Comisiones', data: rev.comisiones || [0] },
    ],
  };

  // Gráfico de proyección trimestral vs meta
  const projectionChart = {
    options: {
      chart: { type: 'bar', toolbar: { show: false }, background: 'transparent', stacked: false },
      colors: [chartColors.primary, chartColors.success, chartColors.grid],
      plotOptions: { bar: { horizontal: false, columnWidth: '70%', borderRadius: 4 } },
      dataLabels: { enabled: false },
      stroke: { show: true, width: 2, colors: ['transparent'] },
      xaxis: { categories: quarters.map(q => `${q.quarter} ${new Date().getFullYear()}`), labels: { style: { colors: chartColors.text, fontSize: '11px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { labels: { style: { colors: chartColors.text, fontSize: '11px' }, formatter: (val) => `$${(val/1000000).toFixed(1)}M` } },
      grid: { borderColor: chartColors.grid, strokeDashArray: 4 },
      legend: { show: true, position: 'top', horizontalAlign: 'right', labels: { colors: chartColors.text }, markers: { width: 8, height: 8, radius: 8 } },
      tooltip: { theme: isDark ? 'dark' : 'light', y: { formatter: (val) => val ? `$${(val/1000000).toFixed(2)}M` : 'Pendiente' } },
    },
    series: [
      { name: 'Real', data: quarters.map(q => q.actual) },
      { name: 'Proyectado', data: quarters.map(q => q.projected) },
      { name: 'Meta', data: quarters.map(q => q.goal) },
    ],
  };

  // Gráfico donut propiedades
  const propertyTypeChart = {
    options: {
      chart: { type: 'donut', background: 'transparent' },
      colors: [chartColors.primary, chartColors.success, chartColors.warning, chartColors.purple, chartColors.pink],
      labels: propTypes.labels || ['Sin datos'],
      legend: { show: false },
      dataLabels: { enabled: false },
      stroke: { width: 0 },
      plotOptions: { 
        pie: { 
          donut: { 
            size: '75%', 
            labels: { 
              show: true, 
              name: { show: true, fontSize: '14px', color: chartColors.text }, 
              value: { show: true, fontSize: '24px', fontWeight: 700, color: chartColors.text }, 
              total: { show: true, label: 'Total', fontSize: '12px', color: chartColors.text, formatter: () => `${propTypes.total || 0}` } 
            } 
          } 
        } 
      },
      tooltip: { theme: isDark ? 'dark' : 'light' },
    },
    series: propTypes.series || [0],
  };

  // Gráfico radial conversión
  const conversionChart = {
    options: {
      chart: { type: 'radialBar', background: 'transparent' },
      colors: [chartColors.success],
      plotOptions: { 
        radialBar: { 
          hollow: { size: '70%' }, 
          track: { background: isDark ? '#374151' : '#e5e7eb' }, 
          dataLabels: { 
            name: { show: true, fontSize: '12px', color: chartColors.text, offsetY: -5 }, 
            value: { show: true, fontSize: '28px', fontWeight: 700, color: chartColors.text, offsetY: 5, formatter: (val) => `${val}%` } 
          } 
        } 
      },
      labels: ['Conversión'],
    },
    series: [data?.conversionRate || 0],
  };

  // Gráfico de operaciones (Bar)
  const operationsChart = {
    options: {
      chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
      colors: [chartColors.primary, chartColors.warning],
      plotOptions: { bar: { horizontal: false, columnWidth: '60%', borderRadius: 6 } },
      dataLabels: { enabled: false },
      stroke: { show: true, width: 2, colors: ['transparent'] },
      xaxis: { 
        categories: opsMo.meses || [''], 
        labels: { style: { colors: chartColors.text, fontSize: '11px' } }, 
        axisBorder: { show: false }, 
        axisTicks: { show: false } 
      },
      yaxis: { labels: { style: { colors: chartColors.text, fontSize: '11px' } } },
      grid: { borderColor: chartColors.grid, strokeDashArray: 4 },
      legend: { show: true, position: 'top', horizontalAlign: 'right', labels: { colors: chartColors.text }, markers: { width: 8, height: 8, radius: 8 } },
      tooltip: { theme: isDark ? 'dark' : 'light' },
    },
    series: [
      { name: 'Ventas', data: opsMo.ventas || [0] },
      { name: 'Alquileres', data: opsMo.alquileres || [0] },
    ],
  };

  // Gráfico rendimiento agentes (Horizontal Bar) - Cumplimiento de meta
  const agentPerformanceChart = {
    options: {
      chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
      plotOptions: { bar: { horizontal: true, barHeight: '70%', borderRadius: 4, distributed: true } },
      dataLabels: { enabled: true, textAnchor: 'start', style: { colors: ['#fff'], fontSize: '11px', fontWeight: 600 }, formatter: (val) => `${val}%`, offsetX: 5 },
      xaxis: { 
        categories: agentes.map(a => a.nombre.split(' ')[0]), 
        labels: { style: { colors: chartColors.text, fontSize: '11px' } }, 
        axisBorder: { show: false }, 
        axisTicks: { show: false }, 
        max: 100 
      },
      yaxis: { labels: { style: { colors: chartColors.text, fontSize: '11px' } } },
      grid: { borderColor: chartColors.grid, strokeDashArray: 4, xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
      legend: { show: false },
      tooltip: { theme: isDark ? 'dark' : 'light', y: { formatter: (val) => `${val}% de meta` } },
      colors: agentes.map(a => a.color),
    },
    series: [{ name: 'Cumplimiento Meta', data: agentes.map(a => a.metaMensual > 0 ? Math.min(100, Math.round((a.comision / a.metaMensual) * 100)) : 0) }],
  };

  // Gráfico de comisiones por agente (Grouped Bar)
  const agentCommissionsChart = {
    options: {
      chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
      colors: [chartColors.primary, chartColors.success],
      plotOptions: { bar: { horizontal: false, columnWidth: '65%', borderRadius: 4 } },
      dataLabels: { enabled: false },
      xaxis: { categories: agentes.map(a => a.nombre.split(' ')[0]), labels: { style: { colors: chartColors.text, fontSize: '11px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { labels: { style: { colors: chartColors.text, fontSize: '11px' }, formatter: (val) => `$${(val/1000).toFixed(0)}K` } },
      grid: { borderColor: chartColors.grid, strokeDashArray: 4 },
      legend: { show: true, position: 'top', horizontalAlign: 'right', labels: { colors: chartColors.text }, markers: { width: 8, height: 8, radius: 8 } },
      tooltip: { theme: isDark ? 'dark' : 'light', y: { formatter: (val) => `$${val.toLocaleString()}` } },
    },
    series: [
      { name: 'Comisión Real', data: agentes.map(a => a.comision) },
      { name: 'Meta Mensual', data: agentes.map(a => a.metaMensual) },
    ],
  };

  // Gráfico radar de métricas de agentes (top 2 + promedio)
  const topAgents = agentes.slice(0, 2);
  const avgVentas = agentes.length > 0 ? Math.round(agentes.reduce((s, a) => s + a.ventas, 0) / agentes.length) : 0;
  const avgConv = agentes.length > 0 ? Math.round(agentes.reduce((s, a) => s + a.tasaConversion, 0) / agentes.length) : 0;
  const avgSpeed = agentes.length > 0 ? Math.round(100 - agentes.reduce((s, a) => s + a.diasPromCierre, 0) / agentes.length) : 0;
  const avgCartera = agentes.length > 0 ? Math.round(agentes.reduce((s, a) => s + (a.valorCartera || 0), 0) / agentes.length / 10000) : 0;
  const avgCal = agentes.length > 0 ? Math.round(agentes.reduce((s, a) => s + (parseFloat(a.calificacion) || 0), 0) / agentes.length * 20) : 0;
  const agentRadarChart = {
    options: {
      chart: { type: 'radar', toolbar: { show: false }, background: 'transparent' },
      colors: [chartColors.primary, chartColors.success, chartColors.warning],
      xaxis: { categories: ['Ventas', 'Conversión', 'Velocidad', 'Cartera', 'Calificación'] },
      yaxis: { show: false },
      markers: { size: 4 },
      stroke: { width: 2 },
      fill: { opacity: 0.2 },
      legend: { show: true, position: 'bottom', labels: { colors: chartColors.text }, markers: { width: 8, height: 8, radius: 8 } },
      tooltip: { theme: isDark ? 'dark' : 'light' },
    },
    series: [
      ...(topAgents.map(a => ({
        name: a.nombre.split(' ').map(w => w[0] ? `${w[0]}.` : '').join('').replace(/\.$/, '') || a.nombre.split(' ')[0],
        data: [a.ventas, a.tasaConversion, Math.max(0, 100 - a.diasPromCierre), Math.round((a.valorCartera || 0) / 10000), Math.round((parseFloat(a.calificacion) || 0) * 20)],
      }))),
      { name: 'Promedio', data: [avgVentas, avgConv, avgSpeed, avgCartera, avgCal] },
    ],
  };

  // Gráfico de ingresos por tipo (Donut detallado)
  const incomeSourceChart = {
    options: {
      chart: { type: 'donut', background: 'transparent' },
      colors: [chartColors.primary, chartColors.purple, chartColors.success, chartColors.warning],
      labels: ['Venta Residencial', 'Venta Comercial', 'Alquileres', 'Servicios'],
      legend: { show: true, position: 'bottom', labels: { colors: chartColors.text }, markers: { width: 8, height: 8, radius: 8 } },
      dataLabels: { enabled: true, formatter: (val) => `${val.toFixed(1)}%` },
      stroke: { width: 0 },
      plotOptions: { 
        pie: { 
          donut: { 
            size: '65%', 
            labels: { 
              show: true, 
              name: { show: true, fontSize: '12px', color: chartColors.text }, 
              value: { show: true, fontSize: '18px', fontWeight: 700, color: chartColors.text, formatter: (val) => `$${(val/1000).toFixed(0)}K` }, 
              total: { show: true, label: 'Total Ingresos', fontSize: '11px', color: chartColors.text, formatter: () => inc.total || '$0' } 
            } 
          } 
        } 
      },
      tooltip: { theme: isDark ? 'dark' : 'light', y: { formatter: (val) => `$${(val/1000).toFixed(0)}K` } },
    },
    series: inc.series || [0],
  };

  // Card base style con sombra en claro y color sutil en oscuro
  const cardClass = `rounded-2xl p-6 border transition-shadow ${isDark ? 'bg-secondary-dark-bg border-gray-700/50 hover:border-indigo-500/30' : 'bg-white border-gray-100 shadow-md hover:shadow-lg'}`;

  return (
    <div className={`min-h-screen px-6 lg:px-8 pt-4 pb-6 ${isDark ? 'bg-main-dark-bg' : 'bg-gray-50'}`}>

      {/* KPIs principales con color de acento */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className={`rounded-2xl p-6 border shadow-sm ${isDark ? 'bg-secondary-dark-bg border-gray-700/50' : 'bg-white border-gray-100'}`} style={{ borderLeft: `4px solid ${kpi.color}` }}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl ${kpi.bgColor} flex items-center justify-center`}>
                  <Icon className="text-lg" style={{ color: kpi.color }} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-medium ${kpi.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {kpi.trend === 'up' ? <FaArrowUp className="text-[10px]" /> : <FaArrowDown className="text-[10px]" />}
                  {kpi.change}
                </div>
              </div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{kpi.value}</p>
              <p className={`text-sm font-semibold mt-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{kpi.title}</p>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{kpi.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* ==================== SECCIÓN FINANCIERA ==================== */}
      <div className="mb-6">
        <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <FaDollarSign className="text-emerald-500" /> Indicadores Financieros
        </h2>
      </div>

      {/* Métricas financieras detalladas con iconos */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        {[
          { label: 'Ticket Promedio', value: `$${((fm.ticketPromedio?.value || 0)/1000).toFixed(0)}K`, change: fm.ticketPromedio?.change || '+0%', up: true, icon: FaReceipt, color: '#6366f1', bgColor: 'bg-indigo-500/10' },
          { label: 'Margen Operativo', value: `${fm.margenOperativo?.value || 0}%`, change: fm.margenOperativo?.change || '+0pp', up: true, icon: FaBalanceScale, color: '#10b981', bgColor: 'bg-emerald-500/10' },
          { label: 'ROI', value: `${mktMetrics.roi || fm.roi?.raw || 0}%`, change: mktMetrics.roiChange || fm.roi?.change || '+0%', up: (mktMetrics.roi || 0) >= 0, icon: FaSeedling, color: '#22c55e', bgColor: 'bg-green-500/10' },
          { label: 'ROAS', value: `${(mktMetrics.roas || fm.roas?.raw || 0).toFixed(1)}x`, change: mktMetrics.roasChange || fm.roas?.change || '+0%', up: (mktMetrics.roas || 0) >= 1, icon: FaChartLine, color: '#f59e0b', bgColor: 'bg-amber-500/10' },
          { label: 'CAC', value: `$${(mktMetrics.cac || fm.cac?.value || 0).toLocaleString()}`, change: '', up: false, icon: FaBullseye, color: '#ef4444', bgColor: 'bg-red-500/10' },
          { label: 'Propiedades', value: String(fm.propiedades || 0), change: `${fm.propiedadesDisponibles || 0} disp.`, up: true, icon: FaHome, color: '#06b6d4', bgColor: 'bg-cyan-500/10' },
          { label: 'Leads Totales', value: String(fm.leadsTotales || 0), change: `+${fm.clientesNuevosMes || 0}`, up: true, icon: FaUserPlus, color: '#8b5cf6', bgColor: 'bg-purple-500/10' },
          { label: 'Clientes Activos', value: String(fm.clientesActivos || 0), change: `+${fm.clientesNuevosMes || 0}`, up: true, icon: FaAddressBook, color: '#ec4899', bgColor: 'bg-pink-500/10' },
        ].map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className={`rounded-2xl p-4 border transition-all ${isDark ? 'bg-secondary-dark-bg border-gray-700/50 hover:border-indigo-500/30' : 'bg-white border-gray-100 shadow-md hover:shadow-lg'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg ${m.bgColor} flex items-center justify-center`}>
                  <Icon className="text-xs" style={{ color: m.color }} />
                </div>
                <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{m.label}</p>
              </div>
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{m.value}</p>
              <span className={`text-xs font-medium ${m.up ? 'text-emerald-500' : 'text-red-500'}`}>{m.change}</span>
            </div>
          );
        })}
      </div>

      {/* Gráficos financieros principales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Ingresos Anuales con Comisiones */}
        <div className={`${cardClass} lg:col-span-2`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Evolución de Ingresos 2025</h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Ventas, Alquileres y Comisiones</p>
            </div>
            <div className="text-right">
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{dk.ingresosTotales?.value || '$0'}</p>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Acumulado YTD</p>
            </div>
          </div>
          <Chart options={revenueChart.options} series={revenueChart.series} type="area" height={280} />
        </div>

        {/* Desglose de Ingresos */}
        <div className={cardClass}>
          <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Fuentes de Ingreso</h3>
          <Chart options={incomeSourceChart.options} series={incomeSourceChart.series} type="donut" height={260} />
        </div>
      </div>

      {/* Proyección trimestral */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Proyección Trimestral vs Meta</h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Real vs Proyectado vs Meta $12M anual</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>
              {dk.ingresosTotales?.yearProgress || '0%'} de meta anual
            </div>
          </div>
          <Chart options={projectionChart.options} series={projectionChart.series} type="bar" height={240} />
        </div>

        {/* Operaciones mensuales */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Operaciones por Mes</h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Ventas y Alquileres cerrados</p>
            </div>
            <div className="text-right">
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{opsMo.totalYTD ?? 0}</p>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>operaciones YTD</p>
            </div>
          </div>
          <Chart options={operationsChart.options} series={operationsChart.series} type="bar" height={240} />
        </div>
      </div>

      {/* ==================== SECCIÓN RENDIMIENTO DEL EQUIPO ==================== */}
      <div className="mb-6">
        <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <FaTrophy className="text-amber-500" /> Rendimiento del Equipo
        </h2>
      </div>

      {/* Métricas de equipo agregadas */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Total Agentes', value: teamMetrics.totalAgentes ?? 0, icon: FaUsers, color: 'text-indigo-500' },
          { label: 'Ventas Totales', value: teamMetrics.totalVentas ?? 0, icon: FaChartLine, color: 'text-emerald-500' },
          { label: 'Alquileres', value: teamMetrics.totalAlquileres ?? 0, icon: FaKey, color: 'text-purple-500' },
          { label: 'Comisiones Equipo', value: `$${((teamMetrics.totalComisiones || 0)/1000).toFixed(0)}K`, icon: FaDollarSign, color: 'text-amber-500' },
          { label: 'Conv. Promedio', value: `${teamMetrics.promedioConversion ?? 0}%`, icon: HiTrendingUp, color: 'text-cyan-500' },
          { label: 'Días Prom. Cierre', value: teamMetrics.promedioDiasCierre ?? 0, icon: FaCalendarAlt, color: 'text-pink-500' },
        ].map((m, i) => (
          <div key={i} className={`${cardClass} !p-4`}>
            <div className="flex items-center gap-2 mb-2">
              <m.icon className={`text-sm ${m.color}`} />
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{m.label}</p>
            </div>
            <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Gráficos de rendimiento de agentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Comisiones vs Meta por Agente */}
        <div className={`${cardClass} lg:col-span-2`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Comisiones vs Meta por Agente</h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Comparativa de rendimiento individual</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${isDark ? 'bg-amber-900/30 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
              Meta equipo: ${fmtMoney(agentes.reduce((s, a) => s + (a.metaMensual || 0), 0))}
            </div>
          </div>
          <Chart options={agentCommissionsChart.options} series={agentCommissionsChart.series} type="bar" height={260} />
        </div>

        {/* Radar de rendimiento */}
        <div className={cardClass}>
          <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Comparativa Top Agentes</h3>
          <p className={`text-xs mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Métricas normalizadas</p>
          <Chart options={agentRadarChart.options} series={agentRadarChart.series} type="radar" height={240} />
        </div>
      </div>

      {/* Cumplimiento de meta + Tabla detallada de agentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Cumplimiento de Meta - Horizontal Bar */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Cumplimiento de Meta</h3>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>% de meta mensual alcanzada</p>
            </div>
          </div>
          <Chart options={agentPerformanceChart.options} series={agentPerformanceChart.series} type="bar" height={240} />
        </div>

        {/* Ranking detallado de agentes */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Ranking de Agentes</h3>
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Este mes</span>
          </div>
          <div className="space-y-3">
            {agentes.map((agente, i) => (
              <div key={i} className={`p-3 rounded-xl ${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} flex items-center gap-3`}>
                <div className="flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-bold" style={{ backgroundColor: agente.color }}>
                  {i === 0 ? <FaTrophy className="text-amber-300" /> : i === 1 ? <FaMedal className="text-gray-300" /> : i === 2 ? <FaAward className="text-amber-600" /> : agente.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{agente.nombre}</p>
                    <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>${(agente.comision/1000).toFixed(1)}K</p>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{agente.ventas} ventas</span>
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{agente.tasaConversion}% conv.</span>
                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{agente.diasPromCierre}d cierre</span>
                    <span className={`text-xs font-medium text-emerald-500`}>{agente.tendencia}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actividad reciente con comisiones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actividad Reciente Detallada */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Actividad Reciente</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>Últimas 24h</span>
          </div>
          <div className="space-y-3">
            {actividades.map((act, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-xl ${isDark ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  act.tipo === 'venta' ? 'bg-emerald-500' : 
                  act.tipo === 'alquiler' ? 'bg-purple-500' : 
                  act.tipo === 'reserva' ? 'bg-blue-500' :
                  act.tipo === 'visita' ? 'bg-cyan-500' : 'bg-amber-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{act.texto}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{act.agente}</span>
                    <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>•</span>
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{act.tiempo}</span>
                  </div>
                </div>
                <div className="text-right">
                  {act.monto && <p className={`text-sm font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>{act.monto}</p>}
                  {act.comision && <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Com: {act.comision}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resumen de propiedades por tipo */}
        <div className={cardClass}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Inventario por Tipo</h3>
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{propTypes.total || 0} propiedades activas</span>
          </div>
          <Chart options={propertyTypeChart.options} series={propertyTypeChart.series} type="donut" height={200} />
          <div className="grid grid-cols-5 gap-2 mt-4">
            {(propTypes.labels || []).slice(0, 5).map((label, i) => {
              const colors = [chartColors.primary, chartColors.success, chartColors.warning, chartColors.purple, chartColors.pink];
              return (
                <div key={i} className="text-center">
                  <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: colors[i % colors.length] }} />
                  <p className={`text-xs font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{(propTypes.series || [])[i] || 0}</p>
                  <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-6">
        {[
          { label: 'Consultas', value: String(footer.consultasTotal ?? 0), change: '', up: true },
          { label: 'Tiempo Resp.', value: footer.tiempoRespuesta || '0h', change: '', up: true },
          { label: 'Satisfacción', value: footer.satisfaccion || '0%', change: '', up: true },
          { label: 'Retención', value: footer.retencion || '0%', change: '', up: true },
          { label: 'Leads Nuevos/Mes', value: String(fm.clientesNuevosMes ?? 0), change: '', up: true },
          { label: 'Props. Disp.', value: String(fm.propiedadesDisponibles ?? 0), change: '', up: true },
        ].map((stat, i) => (
          <div key={i} className={`${cardClass} !p-4`}>
            <div className="flex items-center justify-between">
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{stat.label}</p>
              <span className={`text-xs font-medium ${stat.up ? 'text-emerald-500' : 'text-red-500'}`}>{stat.change}</span>
            </div>
            <p className={`text-lg font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardEjecutivo;
