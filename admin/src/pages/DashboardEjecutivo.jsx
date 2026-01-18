import React from 'react';
import { FaBuilding, FaUsers, FaDollarSign, FaKey, FaArrowUp, FaArrowDown, FaChartLine, FaPercent, FaCalendarAlt, FaTrophy, FaMedal, FaAward, FaReceipt, FaBalanceScale, FaSeedling, FaClock, FaBullseye, FaUserPlus, FaHome, FaAddressBook } from 'react-icons/fa';
import { HiOutlineDotsHorizontal, HiTrendingUp } from 'react-icons/hi';
import Chart from 'react-apexcharts';
import { useStateContext } from '../contexts/ContextProvider';

const DashboardEjecutivo = () => {
  const { currentMode } = useStateContext();
  const isDark = currentMode === 'Dark';

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

  // ==================== INDICADORES FINANCIEROS ====================
  const financialMetrics = {
    ingresosTotales: { value: 8742500, prevMonth: 7125000, yearGoal: 12000000 },
    comisionesTotales: { value: 524550, prevMonth: 427500, rate: 6 },
    ticketPromedio: { value: 185000, prevMonth: 172000 },
    margenOperativo: { value: 23.5, prevMonth: 21.2 },
    roi: { value: 18.7, prevMonth: 15.3 },
    diasPromVenta: { value: 42, prevMonth: 48 },
    tasaConversion: { value: 68, prevMonth: 62 },
    costoPorLead: { value: 125, prevMonth: 145 },
  };

  // Desglose de ingresos
  const incomeBreakdown = {
    ventasResidencial: { value: 5245500, percent: 60 },
    ventasComercial: { value: 1748500, percent: 20 },
    alquileres: { value: 1311375, percent: 15 },
    serviciosAdicionales: { value: 437125, percent: 5 },
  };

  // Proyección financiera trimestral
  const quarterlyProjection = [
    { quarter: 'Q1', actual: 2450000, projected: 2400000, goal: 3000000 },
    { quarter: 'Q2', actual: 2890000, projected: 2800000, goal: 3000000 },
    { quarter: 'Q3', actual: 3402500, projected: 3200000, goal: 3000000 },
    { quarter: 'Q4', actual: null, projected: 3800000, goal: 3000000 },
  ];

  // ==================== RENDIMIENTO DEL EQUIPO ====================
  const agentes = [
    { 
      nombre: 'Laura Fernández', 
      avatar: 'LF', 
      color: '#6366f1',
      ventas: 22, 
      alquileres: 8,
      metaVentas: 25,
      comision: 89250,
      valorCartera: 1850000,
      leads: 45,
      leadsConvertidos: 32,
      tasaConversion: 71,
      diasPromCierre: 38,
      calificacion: 4.9,
      ranking: 1,
      tendencia: '+15%',
      metaMensual: 100000,
    },
    { 
      nombre: 'Carlos Ruiz', 
      avatar: 'CR', 
      color: '#10b981',
      ventas: 18, 
      alquileres: 6,
      metaVentas: 20,
      comision: 72100,
      valorCartera: 1420000,
      leads: 38,
      leadsConvertidos: 26,
      tasaConversion: 68,
      diasPromCierre: 41,
      calificacion: 4.7,
      ranking: 2,
      tendencia: '+12%',
      metaMensual: 85000,
    },
    { 
      nombre: 'Ana López', 
      avatar: 'AL', 
      color: '#f59e0b',
      ventas: 15, 
      alquileres: 5,
      metaVentas: 18,
      comision: 58400,
      valorCartera: 1180000,
      leads: 32,
      leadsConvertidos: 21,
      tasaConversion: 66,
      diasPromCierre: 44,
      calificacion: 4.6,
      ranking: 3,
      tendencia: '+8%',
      metaMensual: 70000,
    },
    { 
      nombre: 'Martín Silva', 
      avatar: 'MS', 
      color: '#8b5cf6',
      ventas: 12, 
      alquileres: 4,
      metaVentas: 15,
      comision: 48200,
      valorCartera: 920000,
      leads: 28,
      leadsConvertidos: 17,
      tasaConversion: 61,
      diasPromCierre: 47,
      calificacion: 4.5,
      ranking: 4,
      tendencia: '+5%',
      metaMensual: 60000,
    },
    { 
      nombre: 'Sofía Torres', 
      avatar: 'ST', 
      color: '#ec4899',
      ventas: 10, 
      alquileres: 3,
      metaVentas: 12,
      comision: 39650,
      valorCartera: 780000,
      leads: 24,
      leadsConvertidos: 14,
      tasaConversion: 58,
      diasPromCierre: 51,
      calificacion: 4.4,
      ranking: 5,
      tendencia: '+3%',
      metaMensual: 50000,
    },
  ];

  // Métricas de equipo agregadas
  const teamMetrics = {
    totalAgentes: 5,
    totalVentas: agentes.reduce((a, b) => a + b.ventas, 0),
    totalAlquileres: agentes.reduce((a, b) => a + b.alquileres, 0),
    totalComisiones: agentes.reduce((a, b) => a + b.comision, 0),
    promedioConversion: Math.round(agentes.reduce((a, b) => a + b.tasaConversion, 0) / agentes.length),
    promedioDiasCierre: Math.round(agentes.reduce((a, b) => a + b.diasPromCierre, 0) / agentes.length),
    metaEquipo: 450000,
    cumplimientoMeta: 69,
  };

  // Actividad reciente detallada
  const actividades = [
    { tipo: 'venta', texto: 'Depto 3amb vendido en Palermo', agente: 'Laura F.', tiempo: '2h', monto: '$185,000', comision: '$11,100' },
    { tipo: 'venta', texto: 'Casa 4amb cerrada en Belgrano', agente: 'Carlos R.', tiempo: '3h', monto: '$320,000', comision: '$19,200' },
    { tipo: 'alquiler', texto: 'PH alquilado en Colegiales', agente: 'Ana L.', tiempo: '4h', monto: '$2,200/mes', comision: '$2,200' },
    { tipo: 'reserva', texto: 'Reserva Oficina Microcentro', agente: 'Martín S.', tiempo: '5h', monto: '$95,000', comision: 'Pendiente' },
    { tipo: 'visita', texto: '5 visitas completadas hoy', agente: 'Sofía T.', tiempo: '6h', monto: null, comision: null },
    { tipo: 'lead', texto: '3 nuevos leads calificados', agente: 'Laura F.', tiempo: '7h', monto: null, comision: null },
  ];

  // KPIs principales expandidos
  const kpis = [
    { title: 'Ingresos Totales', value: '$8.74M', change: '+22.7%', trend: 'up', icon: FaDollarSign, color: '#10b981', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20', subtitle: 'Meta anual: $12M (73%)' },
    { title: 'Comisiones', value: '$524.5K', change: '+22.7%', trend: 'up', icon: FaPercent, color: '#6366f1', bgColor: 'bg-indigo-50 dark:bg-indigo-900/20', subtitle: '6% promedio' },
    { title: 'Operaciones', value: '103', change: '+18', trend: 'up', icon: FaChartLine, color: '#f59e0b', bgColor: 'bg-amber-50 dark:bg-amber-900/20', subtitle: '77 ventas + 26 alquileres' },
    { title: 'Tasa Conversión', value: '68%', change: '+6pp', trend: 'up', icon: HiTrendingUp, color: '#8b5cf6', bgColor: 'bg-purple-50 dark:bg-purple-900/20', subtitle: 'vs 62% mes anterior' },
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
        categories: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'], 
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
      { name: 'Ventas', data: [520000, 480000, 620000, 590000, 710000, 680000, 820000, 780000, 950000, 1020000, 980000, 1150000] },
      { name: 'Alquileres', data: [105000, 112000, 108000, 115000, 122000, 118000, 135000, 128000, 145000, 152000, 148000, 165000] },
      { name: 'Comisiones', data: [37500, 35500, 43700, 42300, 49900, 47900, 57300, 54500, 65700, 70300, 67700, 78900] },
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
      xaxis: { categories: ['Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025'], labels: { style: { colors: chartColors.text, fontSize: '11px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { labels: { style: { colors: chartColors.text, fontSize: '11px' }, formatter: (val) => `$${(val/1000000).toFixed(1)}M` } },
      grid: { borderColor: chartColors.grid, strokeDashArray: 4 },
      legend: { show: true, position: 'top', horizontalAlign: 'right', labels: { colors: chartColors.text }, markers: { width: 8, height: 8, radius: 8 } },
      tooltip: { theme: isDark ? 'dark' : 'light', y: { formatter: (val) => val ? `$${(val/1000000).toFixed(2)}M` : 'Pendiente' } },
    },
    series: [
      { name: 'Real', data: [2450000, 2890000, 3402500, null] },
      { name: 'Proyectado', data: [2400000, 2800000, 3200000, 3800000] },
      { name: 'Meta', data: [3000000, 3000000, 3000000, 3000000] },
    ],
  };

  // Gráfico donut propiedades
  const propertyTypeChart = {
    options: {
      chart: { type: 'donut', background: 'transparent' },
      colors: [chartColors.primary, chartColors.success, chartColors.warning, chartColors.purple, chartColors.pink],
      labels: ['Departamentos', 'Casas', 'PHs', 'Oficinas', 'Locales'],
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
              total: { show: true, label: 'Total', fontSize: '12px', color: chartColors.text, formatter: () => '127' } 
            } 
          } 
        } 
      },
      tooltip: { theme: isDark ? 'dark' : 'light' },
    },
    series: [52, 28, 22, 15, 10],
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
    series: [68],
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
        categories: ['Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'], 
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
      { name: 'Ventas', data: [12, 15, 14, 18, 16, 22] },
      { name: 'Alquileres', data: [8, 10, 9, 12, 11, 14] },
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
    series: [{ name: 'Cumplimiento Meta', data: agentes.map(a => Math.round((a.comision / a.metaMensual) * 100)) }],
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

  // Gráfico radar de métricas de agentes
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
      { name: 'Laura F.', data: [88, 71, 85, 92, 98] },
      { name: 'Carlos R.', data: [72, 68, 78, 71, 94] },
      { name: 'Promedio', data: [62, 65, 70, 65, 92] },
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
              total: { show: true, label: 'Total Ingresos', fontSize: '11px', color: chartColors.text, formatter: () => '$8.74M' } 
            } 
          } 
        } 
      },
      tooltip: { theme: isDark ? 'dark' : 'light', y: { formatter: (val) => `$${(val/1000).toFixed(0)}K` } },
    },
    series: [5245500, 1748500, 1311375, 437125],
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
          { label: 'Ticket Promedio', value: `$${(financialMetrics.ticketPromedio.value/1000).toFixed(0)}K`, change: '+7.6%', up: true, icon: FaReceipt, color: '#6366f1', bgColor: 'bg-indigo-500/10' },
          { label: 'Margen Operativo', value: `${financialMetrics.margenOperativo.value}%`, change: '+2.3pp', up: true, icon: FaBalanceScale, color: '#10b981', bgColor: 'bg-emerald-500/10' },
          { label: 'ROI', value: `${financialMetrics.roi.value}%`, change: '+3.4pp', up: true, icon: FaSeedling, color: '#22c55e', bgColor: 'bg-green-500/10' },
          { label: 'Días Prom. Venta', value: `${financialMetrics.diasPromVenta.value}`, change: '-6 días', up: true, icon: FaClock, color: '#f59e0b', bgColor: 'bg-amber-500/10' },
          { label: 'Costo por Lead', value: `$${financialMetrics.costoPorLead.value}`, change: '-$20', up: true, icon: FaBullseye, color: '#ef4444', bgColor: 'bg-red-500/10' },
          { label: 'Leads Totales', value: '167', change: '+23', up: true, icon: FaUserPlus, color: '#8b5cf6', bgColor: 'bg-purple-500/10' },
          { label: 'Propiedades', value: '127', change: '+12', up: true, icon: FaHome, color: '#06b6d4', bgColor: 'bg-cyan-500/10' },
          { label: 'Clientes Activos', value: '284', change: '+28', up: true, icon: FaAddressBook, color: '#ec4899', bgColor: 'bg-pink-500/10' },
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
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>$8.74M</p>
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
              73% de meta anual
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
              <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>103</p>
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
          { label: 'Total Agentes', value: teamMetrics.totalAgentes, icon: FaUsers, color: 'text-indigo-500' },
          { label: 'Ventas Totales', value: teamMetrics.totalVentas, icon: FaChartLine, color: 'text-emerald-500' },
          { label: 'Alquileres', value: teamMetrics.totalAlquileres, icon: FaKey, color: 'text-purple-500' },
          { label: 'Comisiones Equipo', value: `$${(teamMetrics.totalComisiones/1000).toFixed(0)}K`, icon: FaDollarSign, color: 'text-amber-500' },
          { label: 'Conv. Promedio', value: `${teamMetrics.promedioConversion}%`, icon: HiTrendingUp, color: 'text-cyan-500' },
          { label: 'Días Prom. Cierre', value: teamMetrics.promedioDiasCierre, icon: FaCalendarAlt, color: 'text-pink-500' },
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
              Meta equipo: $450K
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
            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>127 propiedades activas</span>
          </div>
          <Chart options={propertyTypeChart.options} series={propertyTypeChart.series} type="donut" height={200} />
          <div className="grid grid-cols-5 gap-2 mt-4">
            {[
              { label: 'Deptos', value: 52, color: chartColors.primary },
              { label: 'Casas', value: 28, color: chartColors.success },
              { label: 'PHs', value: 22, color: chartColors.warning },
              { label: 'Oficinas', value: 15, color: chartColors.purple },
              { label: 'Locales', value: 10, color: chartColors.pink },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: item.color }} />
                <p className={`text-xs font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{item.value}</p>
                <p className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-6">
        {[
          { label: 'Visitas Web', value: '12.4K', change: '+8%', up: true },
          { label: 'Consultas', value: '284', change: '+12%', up: true },
          { label: 'Tiempo Resp.', value: '2.4h', change: '-15%', up: true },
          { label: 'Satisfacción', value: '94%', change: '+2%', up: true },
          { label: 'NPS Score', value: '72', change: '+5', up: true },
          { label: 'Retención', value: '89%', change: '+3%', up: true },
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
