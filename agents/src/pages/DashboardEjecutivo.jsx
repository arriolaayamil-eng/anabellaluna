import React, { useState, useEffect } from 'react';

import Chart from 'react-apexcharts';
import { FaHome, FaUserFriends, FaDollarSign, FaKey, FaExclamationTriangle, FaCheckCircle, FaBell, FaMapMarkerAlt, FaTasks, FaTimes, FaChartLine, FaCalendarAlt, FaTrophy, FaChartPie, FaChartBar, FaArrowUp, FaPercentage, FaFunnelDollar } from 'react-icons/fa';

import { useStateContext } from '../contexts/ContextProvider';

const DashboardEjecutivo = () => {
  const { currentMode, currentColor } = useStateContext();

  // Estados para modales
  const [showModalPropiedades, setShowModalPropiedades] = useState(false);
  const [showModalClientes, setShowModalClientes] = useState(false);
  const [showModalVentas, setShowModalVentas] = useState(false);
  const [showModalAlquileres, setShowModalAlquileres] = useState(false);

  // Nuevos modales informativos
  const [showModalRendimiento, setShowModalRendimiento] = useState(false);
  const [showModalActividades, setShowModalActividades] = useState(false);
  const [showModalMetas, setShowModalMetas] = useState(false);

  // Estado para controlar si el componente está montado
  const [, setIsMounted] = useState(true);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
    };
  }, []);

  // Mock data para métricas en tiempo real
  const kpis = [
    {
      title: 'Propiedades activas',
      value: 87,
      desc: '+12 esta semana',
      icon: <FaHome />,
      color: 'from-blue-500 to-blue-600',
      trend: '+15%',
    },
    {
      title: 'Clientes registrados',
      value: 156,
      desc: '23 nuevos este mes',
      icon: <FaUserFriends />,
      color: 'from-indigo-500 to-indigo-600',
      trend: '+8%',
    },
    {
      title: 'Ventas del mes',
      value: '$850K',
      desc: '+15% vs anterior',
      icon: <FaDollarSign />,
      color: 'from-emerald-500 to-emerald-600',
      trend: '+22%',
    },
    {
      title: 'Alquileres vigentes',
      value: 34,
      desc: 'Ingresos $45K/mes',
      icon: <FaKey />,
      color: 'from-orange-500 to-orange-600',
      trend: '+5%',
    },
  ];

  // Datos de actividad de agentes con ranking
  const agentesOps = [
    { agente: 'Laura Fernández', ops: 22, ventas: 15, alquileres: 7, ranking: 1 },
    { agente: 'Ana López', ops: 18, ventas: 12, alquileres: 6, ranking: 2 },
    { agente: 'Sofía Torres', ops: 14, ventas: 9, alquileres: 5, ranking: 3 },
    { agente: 'Carlos Ruiz', ops: 11, ventas: 8, alquileres: 3, ranking: 4 },
    { agente: 'Marcos Silva', ops: 9, ventas: 6, alquileres: 3, ranking: 5 },
  ];

  // Propiedades más vistas con datos expandidos
  const propiedadesVistas = [
    { id: 1, propiedad: 'Depto 2amb Palermo', visitas: 1248, agente: 'Ana López', estado: 'Disponible', precio: '$150,000', zona: 'Palermo' },
    { id: 2, propiedad: 'Casa 3amb Belgrano', visitas: 932, agente: 'Carlos Ruiz', estado: 'Reservada', precio: '$280,000', zona: 'Belgrano' },
    { id: 3, propiedad: 'Oficina Microcentro', visitas: 678, agente: 'Laura Fernández', estado: 'Vendida', precio: '$95,000', zona: 'Microcentro' },
    { id: 4, propiedad: 'PH 4amb Colegiales', visitas: 544, agente: 'Sofía Torres', estado: 'Disponible', precio: '$320,000', zona: 'Colegiales' },
    { id: 5, propiedad: 'Local Recoleta', visitas: 423, agente: 'Marcos Silva', estado: 'Alquilada', precio: '$2,500/mes', zona: 'Recoleta' },
  ];

  // Datos para el mapa de propiedades
  const propiedadesMapa = [
    { latitude: -34.5875, longitude: -58.3974, name: 'Depto Palermo', estado: 'Disponible', precio: '$150,000' },
    { latitude: -34.5627, longitude: -58.4558, name: 'Casa Belgrano', estado: 'Reservada', precio: '$280,000' },
    { latitude: -34.6037, longitude: -58.3816, name: 'Oficina Microcentro', estado: 'Vendida', precio: '$95,000' },
    { latitude: -34.5735, longitude: -58.4378, name: 'PH Colegiales', estado: 'Disponible', precio: '$320,000' },
    { latitude: -34.5889, longitude: -58.3960, name: 'Local Recoleta', estado: 'Alquilada', precio: '$2,500/mes' },
  ];

  // Tareas del día con más detalle
  const tareas = [
    { id: 1, texto: 'Llamar a cliente Juan Pérez - Seguimiento propuesta', prioridad: 'alta', hora: '10:00', completada: false },
    { id: 2, texto: 'Enviar contrato a María González', prioridad: 'alta', hora: '11:30', completada: false },
    { id: 3, texto: 'Programar visita - Casa Belgrano', prioridad: 'media', hora: '14:00', completada: true },
    { id: 4, texto: 'Revisar documentación PH Colegiales', prioridad: 'media', hora: '16:00', completada: false },
    { id: 5, texto: 'Actualizar fotos propiedad Palermo', prioridad: 'baja', hora: '17:00', completada: false },
  ];

  // Alertas inteligentes expandidas
  const alertas = [
    { id: 1, tipo: 'peligro', texto: '3 leads sin respuesta hace más de 48h', icono: <FaExclamationTriangle />, urgencia: 'alta' },
    { id: 2, tipo: 'aviso', texto: '2 contratos por vencer esta semana', icono: <FaBell />, urgencia: 'media' },
    { id: 3, tipo: 'info', texto: '5 visitas programadas para mañana', icono: <FaMapMarkerAlt />, urgencia: 'baja' },
    { id: 4, tipo: 'peligro', texto: 'Propiedad sin fotos hace 7 días', icono: <FaExclamationTriangle />, urgencia: 'media' },
  ];

  // Datos para gráfico de tendencia de ingresos mensual
  const ingresosMensuales = [
    { mes: 'Ene', ingresos: 420, ventas: 8, alquileres: 12 },
    { mes: 'Feb', ingresos: 380, ventas: 6, alquileres: 14 },
    { mes: 'Mar', ingresos: 520, ventas: 10, alquileres: 15 },
    { mes: 'Abr', ingresos: 610, ventas: 12, alquileres: 18 },
    { mes: 'May', ingresos: 580, ventas: 11, alquileres: 16 },
    { mes: 'Jun', ingresos: 720, ventas: 14, alquileres: 20 },
    { mes: 'Jul', ingresos: 680, ventas: 13, alquileres: 19 },
    { mes: 'Ago', ingresos: 750, ventas: 15, alquileres: 22 },
    { mes: 'Sep', ingresos: 820, ventas: 16, alquileres: 24 },
    { mes: 'Oct', ingresos: 850, ventas: 18, alquileres: 26 },
    { mes: 'Nov', ingresos: 920, ventas: 20, alquileres: 28 },
    { mes: 'Dic', ingresos: 980, ventas: 22, alquileres: 30 },
  ];

  // Datos para gráfico de distribución de propiedades (pie)
  const distribucionPropiedades = [
    { tipo: 'Departamentos', cantidad: 42, color: '#3B82F6' },
    { tipo: 'Casas', cantidad: 28, color: '#10B981' },
    { tipo: 'PH', cantidad: 12, color: '#8B5CF6' },
    { tipo: 'Locales', cantidad: 8, color: '#F59E0B' },
    { tipo: 'Oficinas', cantidad: 5, color: '#EF4444' },
    { tipo: 'Terrenos', cantidad: 5, color: '#6B7280' },
  ];

  // Datos para comparativa ventas vs alquileres
  const comparativaOperaciones = [
    { mes: 'Jul', ventas: 520, alquileres: 180 },
    { mes: 'Ago', ventas: 580, alquileres: 210 },
    { mes: 'Sep', ventas: 650, alquileres: 190 },
    { mes: 'Oct', ventas: 720, alquileres: 230 },
    { mes: 'Nov', ventas: 780, alquileres: 250 },
    { mes: 'Dic', ventas: 850, alquileres: 280 },
  ];

  // Datos para rendimiento por zona
  const rendimientoZonas = [
    { zona: 'Palermo', operaciones: 28, ingresos: 420, tendencia: '+15%' },
    { zona: 'Belgrano', operaciones: 22, ingresos: 380, tendencia: '+8%' },
    { zona: 'Recoleta', operaciones: 18, ingresos: 520, tendencia: '+22%' },
    { zona: 'Microcentro', operaciones: 15, ingresos: 180, tendencia: '-5%' },
    { zona: 'Caballito', operaciones: 12, ingresos: 150, tendencia: '+12%' },
  ];

  // ApexCharts - Progreso Financiero (Radial Bar)
  const progresoFinancieroOptions = {
    chart: {
      type: 'radialBar',
      height: 280,
      sparkline: { enabled: false },
      background: 'transparent',
    },
    plotOptions: {
      radialBar: {
        startAngle: -135,
        endAngle: 135,
        hollow: {
          size: '65%',
          background: 'transparent',
        },
        track: {
          background: currentMode === 'Dark' ? '#374151' : '#E5E7EB',
          strokeWidth: '100%',
        },
        dataLabels: {
          name: {
            show: true,
            fontSize: '14px',
            fontWeight: 600,
            color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280',
            offsetY: -10,
          },
          value: {
            show: true,
            fontSize: '32px',
            fontWeight: 700,
            color: currentMode === 'Dark' ? '#F3F4F6' : '#1F2937',
            offsetY: 5,
            formatter: (val) => `${val}%`,
          },
        },
      },
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        type: 'horizontal',
        colorStops: [
          { offset: 0, color: '#10B981', opacity: 1 },
          { offset: 100, color: '#059669', opacity: 1 },
        ],
      },
    },
    stroke: { lineCap: 'round' },
    labels: ['Meta Anual'],
  };
  const progresoFinancieroSeries = [87];

  // ApexCharts - Coeficiente de Cierre de Leads (Donut)
  const cierreLeadsOptions = {
    chart: {
      type: 'donut',
      height: 280,
      background: 'transparent',
    },
    labels: ['Cerrados', 'En Negociación', 'Perdidos', 'Nuevos'],
    colors: ['#10B981', '#F59E0B', '#EF4444', '#3B82F6'],
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px',
              fontWeight: 600,
              color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280',
            },
            value: {
              show: true,
              fontSize: '24px',
              fontWeight: 700,
              color: currentMode === 'Dark' ? '#F3F4F6' : '#1F2937',
            },
            total: {
              show: true,
              label: 'Total Leads',
              fontSize: '12px',
              fontWeight: 500,
              color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280',
              formatter: () => '248',
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    legend: {
      show: true,
      position: 'bottom',
      labels: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' },
    },
    stroke: { show: false },
    tooltip: {
      theme: currentMode === 'Dark' ? 'dark' : 'light',
    },
  };
  const cierreLeadsSeries = [58, 42, 28, 120];

  // ApexCharts - Ingresos vs Gastos (Area Gradient)
  const ingresosGastosOptions = {
    chart: {
      type: 'area',
      height: 300,
      background: 'transparent',
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    colors: ['#10B981', '#EF4444'],
    dataLabels: { enabled: false },
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.45,
        opacityTo: 0.05,
        stops: [0, 100],
      },
    },
    xaxis: {
      categories: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
      labels: {
        style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '11px' },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '11px' },
        formatter: (val) => `$${val}K`,
      },
    },
    grid: {
      borderColor: currentMode === 'Dark' ? '#374151' : '#E5E7EB',
      strokeDashArray: 4,
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      labels: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' },
    },
    tooltip: {
      theme: currentMode === 'Dark' ? 'dark' : 'light',
      y: { formatter: (val) => `$${val}K` },
    },
  };
  const ingresosGastosSeries = [
    { name: 'Ingresos', data: [420, 380, 520, 610, 580, 720, 680, 750, 820, 850, 920, 980] },
    { name: 'Gastos', data: [180, 165, 210, 245, 220, 290, 275, 310, 340, 355, 380, 405] },
  ];

  // ApexCharts - Funnel de Conversión de Leads
  const funnelLeadsOptions = {
    chart: {
      type: 'bar',
      height: 280,
      background: 'transparent',
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        borderRadius: 8,
        horizontal: true,
        distributed: true,
        barHeight: '70%',
        dataLabels: { position: 'bottom' },
      },
    },
    colors: ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981'],
    dataLabels: {
      enabled: true,
      textAnchor: 'start',
      style: { colors: ['#fff'], fontSize: '12px', fontWeight: 600 },
      formatter: (val, opt) => `${opt.w.globals.labels[opt.dataPointIndex]}: ${val}`,
      offsetX: 10,
    },
    xaxis: {
      categories: ['Leads Captados', 'Contactados', 'En Negociación', 'Cerrados'],
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: { show: false } },
    grid: { show: false },
    legend: { show: false },
    tooltip: {
      theme: currentMode === 'Dark' ? 'dark' : 'light',
      y: { formatter: (val) => `${val} leads` },
    },
  };
  const funnelLeadsSeries = [{ name: 'Leads', data: [248, 186, 98, 58] }];

  // ApexCharts - Tasa de Conversión (Gauge)
  const tasaConversionOptions = {
    chart: {
      type: 'radialBar',
      height: 200,
      background: 'transparent',
      sparkline: { enabled: true },
    },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 90,
        hollow: { size: '60%' },
        track: {
          background: currentMode === 'Dark' ? '#374151' : '#E5E7EB',
          strokeWidth: '100%',
        },
        dataLabels: {
          name: {
            show: true,
            fontSize: '12px',
            color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280',
            offsetY: 20,
          },
          value: {
            show: true,
            fontSize: '28px',
            fontWeight: 700,
            color: currentMode === 'Dark' ? '#F3F4F6' : '#1F2937',
            offsetY: -15,
            formatter: (val) => `${val}%`,
          },
        },
      },
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'dark',
        colorStops: [
          { offset: 0, color: '#8B5CF6', opacity: 1 },
          { offset: 100, color: '#6366F1', opacity: 1 },
        ],
      },
    },
    stroke: { lineCap: 'round' },
    labels: ['Tasa de Cierre'],
  };
  const tasaConversionSeries = [23.4];

  const isDark = currentMode === 'Dark';
  const cardBase = `rounded-2xl p-6 border transition-shadow ${isDark ? 'bg-secondary-dark-bg border-gray-700/50 hover:border-indigo-500/30' : 'bg-white border-gray-100 shadow-md hover:shadow-lg'}`;

  return (
    <div className={`min-h-screen px-6 lg:px-8 pt-4 pb-6 ${isDark ? 'bg-main-dark-bg' : 'bg-gray-50'}`}>
      <div className="mb-6">
        <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <FaChartLine className="text-indigo-500" /> Dashboard Ejecutivo
        </h2>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Resumen en tiempo real</p>
      </div>

      {/* KPIs en tiempo real - Métricas principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi, i) => {
          const colorMap = {
            'from-blue-500 to-blue-600': '#3b82f6',
            'from-emerald-500 to-emerald-600': '#10b981',
            'from-violet-500 to-violet-600': '#8b5cf6',
            'from-amber-500 to-amber-600': '#f59e0b',
            'from-green-500 to-green-600': '#10b981',
            'from-red-500 to-red-600': '#ef4444',
            'from-purple-500 to-purple-600': '#8b5cf6',
            'from-orange-500 to-orange-600': '#f59e0b',
          };
          const accentColor = colorMap[kpi.color] || '#6366f1';
          const bgMap = {
            'from-blue-500 to-blue-600': 'bg-blue-50 dark:bg-blue-900/20',
            'from-emerald-500 to-emerald-600': 'bg-emerald-50 dark:bg-emerald-900/20',
            'from-violet-500 to-violet-600': 'bg-purple-50 dark:bg-purple-900/20',
            'from-amber-500 to-amber-600': 'bg-amber-50 dark:bg-amber-900/20',
            'from-green-500 to-green-600': 'bg-emerald-50 dark:bg-emerald-900/20',
            'from-red-500 to-red-600': 'bg-red-50 dark:bg-red-900/20',
            'from-purple-500 to-purple-600': 'bg-purple-50 dark:bg-purple-900/20',
            'from-orange-500 to-orange-600': 'bg-amber-50 dark:bg-amber-900/20',
          };
          const bgColor = bgMap[kpi.color] || 'bg-indigo-50 dark:bg-indigo-900/20';
          return (
            <div
              key={i}
              onClick={() => {
                if (i === 0) setShowModalPropiedades(true);
                else if (i === 1) setShowModalClientes(true);
                else if (i === 2) setShowModalVentas(true);
                else if (i === 3) setShowModalAlquileres(true);
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

      {/* Gráficos Principales - Tendencias y Distribución */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        {/* Gráfico de Ingresos Mensuales - Área Spline */}
        <div className={`${cardBase} xl:col-span-2`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold dark:text-gray-100 flex items-center gap-2">
              <FaChartLine className="text-emerald-500" />
              Tendencia de Ingresos Anual
            </h3>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-full">
                <FaArrowUp /> +18% YoY
              </span>
            </div>
          </div>

          <Chart
            options={{
              chart: { type: 'area', toolbar: { show: false }, background: 'transparent', zoom: { enabled: false } },
              colors: ['#10B981', '#EF4444'],
              dataLabels: { enabled: false },
              stroke: { curve: 'smooth', width: 3 },
              fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [0, 100] } },
              xaxis: { categories: ingresosMensuales.map((d) => d.mes), labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '11px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
              yaxis: { labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '11px' }, formatter: (v) => `$${v}K` } },
              grid: { borderColor: currentMode === 'Dark' ? '#374151' : '#E5E7EB', strokeDashArray: 4 },
              legend: { show: true, position: 'top', horizontalAlign: 'right', labels: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' } },
              tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light', y: { formatter: (v) => `$${v}K` } },
            }}
            series={[
              { name: 'Ingresos', data: ingresosMensuales.map((d) => d.ingresos) },
              { name: 'Gastos', data: ingresosMensuales.map((d) => Math.round(d.ingresos * 0.41)) },
            ]}
            type="area"
            height={280}
          />

          {/* Resumen rápido debajo del gráfico */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t dark:border-gray-700">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">$7.8M</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Anual</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">$980K</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Mejor Mes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">$650K</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Promedio</p>
            </div>
          </div>
        </div>

        {/* Gráfico de Distribución de Propiedades - Pie */}
        <div className={cardBase}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold dark:text-gray-100 flex items-center gap-2">
              <FaChartPie className="text-blue-500" />
              Tipos de Propiedades
            </h3>
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
              100 total
            </span>
          </div>

          <Chart
            options={{
              chart: { type: 'donut', background: 'transparent' },
              colors: distribucionPropiedades.map((d) => d.color),
              labels: distribucionPropiedades.map((d) => d.tipo),
              plotOptions: { pie: { donut: { size: '60%', labels: { show: true, name: { fontSize: '12px', color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' }, value: { fontSize: '20px', fontWeight: 700, color: currentMode === 'Dark' ? '#F3F4F6' : '#1F2937' }, total: { show: true, label: 'Total', fontSize: '11px', color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', formatter: () => String(distribucionPropiedades.reduce((s, d) => s + d.cantidad, 0)) } } } } },
              dataLabels: { enabled: false },
              legend: { show: true, position: 'bottom', fontSize: '11px', labels: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' } },
              stroke: { show: false },
              tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light' },
            }}
            series={distribucionPropiedades.map((d) => d.cantidad)}
            type="donut"
            height={320}
          />
        </div>
      </div>

      {/* Gráficos Secundarios - Comparativas */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* Gráfico Comparativo Ventas vs Alquileres */}
        <div className={cardBase}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold dark:text-gray-100 flex items-center gap-2">
              <FaChartBar className="text-purple-500" />
              Ventas vs Alquileres
            </h3>
            <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-full">
              Últimos 6 meses
            </span>
          </div>

          <Chart
            options={{
              chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
              colors: ['#8B5CF6', '#10B981'],
              plotOptions: { bar: { horizontal: false, columnWidth: '60%', borderRadius: 4 } },
              dataLabels: { enabled: false },
              stroke: { show: true, width: 2, colors: ['transparent'] },
              xaxis: { categories: comparativaOperaciones.map((d) => d.mes), labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '11px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
              yaxis: { labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '11px' }, formatter: (v) => `$${v}K` } },
              grid: { borderColor: currentMode === 'Dark' ? '#374151' : '#E5E7EB', strokeDashArray: 4 },
              legend: { show: true, position: 'top', horizontalAlign: 'right', labels: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' } },
              tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light' },
            }}
            series={[
              { name: 'Ventas', data: comparativaOperaciones.map((d) => d.ventas) },
              { name: 'Alquileres', data: comparativaOperaciones.map((d) => d.alquileres) },
            ]}
            type="bar"
            height={280}
          />
        </div>

        {/* Rendimiento por Zona */}
        <div className={cardBase}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold dark:text-gray-100 flex items-center gap-2">
              <FaMapMarkerAlt className="text-red-500" />
              Rendimiento por Zona
            </h3>
            <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded-full">
              Top 5 zonas
            </span>
          </div>

          <div className="space-y-4">
            {rendimientoZonas.map((zona, i) => (
              <div key={zona.zona} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-600' : 'bg-blue-500'
                    }`}
                    >
                      {i + 1}
                    </span>
                    <span className="font-medium dark:text-gray-200">{zona.zona}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{zona.operaciones} ops</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      zona.tendencia.startsWith('+')
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}
                    >
                      {zona.tendencia}
                    </span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${(zona.operaciones / 28) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>${zona.ingresos}K ingresos</span>
                  <span>{((zona.operaciones / 95) * 100).toFixed(1)}% del total</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Métricas Financieras y Conversión - ApexCharts Premium */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-8">
        {/* Progreso Meta Anual - Radial */}
        <div className={cardBase}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold dark:text-gray-100 flex items-center gap-2">
              <FaDollarSign className="text-emerald-500" />
              Meta Financiera
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Progreso hacia objetivo anual</p>
          <Chart
            options={progresoFinancieroOptions}
            series={progresoFinancieroSeries}
            type="radialBar"
            height={240}
          />
          <div className="flex justify-between items-center mt-2 pt-3 border-t dark:border-gray-700">
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">$13.1M</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Actual</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-600 dark:text-gray-300">$15M</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Meta</p>
            </div>
          </div>
        </div>

        {/* Estado de Leads - Donut */}
        <div className={cardBase}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold dark:text-gray-100 flex items-center gap-2">
              <FaUserFriends className="text-blue-500" />
              Estado de Leads
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Distribución actual de leads</p>
          <Chart
            options={cierreLeadsOptions}
            series={cierreLeadsSeries}
            type="donut"
            height={280}
          />
        </div>

        {/* Funnel de Conversión */}
        <div className={cardBase}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold dark:text-gray-100 flex items-center gap-2">
              <FaFunnelDollar className="text-purple-500" />
              Funnel de Conversión
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Proceso de captación a cierre</p>
          <Chart
            options={funnelLeadsOptions}
            series={funnelLeadsSeries}
            type="bar"
            height={260}
          />
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t dark:border-gray-700">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg text-center">
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">23.4%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tasa Cierre</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg text-center">
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">75%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Contactados</p>
            </div>
          </div>
        </div>

        {/* Tasa de Conversión - Gauge */}
        <div className={cardBase}>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold dark:text-gray-100 flex items-center gap-2">
              <FaPercentage className="text-indigo-500" />
              Coef. de Cierre
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Ratio leads cerrados vs totales</p>
          <Chart
            options={tasaConversionOptions}
            series={tasaConversionSeries}
            type="radialBar"
            height={200}
          />
          <div className="space-y-3 mt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Promedio industria</span>
              <span className="text-sm font-bold text-gray-500">18%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Tu rendimiento</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <FaArrowUp className="text-xs" /> +5.4%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full" style={{ width: '78%' }} />
            </div>
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">Por encima del 78% de competidores</p>
          </div>
        </div>
      </div>

      {/* Gráfico Amplio - Ingresos vs Gastos */}
      <div className="grid grid-cols-1 gap-6 mb-8">
        <div className={cardBase}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold dark:text-gray-100 flex items-center gap-2">
                <FaChartLine className="text-emerald-500" />
                Balance Financiero Anual
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Comparativa de ingresos vs gastos operativos</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Ingresos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Gastos</span>
              </div>
            </div>
          </div>
          <Chart
            options={ingresosGastosOptions}
            series={ingresosGastosSeries}
            type="area"
            height={300}
          />
          <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t dark:border-gray-700">
            <div className="text-center p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">$7.8M</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Ingresos Totales</p>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">$3.2M</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Gastos Totales</p>
            </div>
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">$4.6M</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Utilidad Neta</p>
            </div>
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">59%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Margen de Ganancia</p>
            </div>
          </div>
        </div>
      </div>

      {/* Accesos Rápidos a Información Relevante */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Botón Rendimiento Mensual */}
        <button
          type="button"
          onClick={() => setShowModalRendimiento(true)}
          className="group relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <FaChartLine className="text-3xl" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold">Rendimiento Mensual</h3>
              <p className="text-sm text-purple-100">Ver análisis completo</p>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full -mr-10 -mt-10" />
        </button>

        {/* Botón Actividades Recientes */}
        <button
          type="button"
          onClick={() => setShowModalActividades(true)}
          className="group relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <FaCalendarAlt className="text-3xl" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold">Actividades Recientes</h3>
              <p className="text-sm text-orange-100">Últimas 24 horas</p>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full -mr-10 -mt-10" />
        </button>

        {/* Botón Metas y Objetivos */}
        <button
          type="button"
          onClick={() => setShowModalMetas(true)}
          className="group relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white bg-opacity-20 rounded-lg">
              <FaTrophy className="text-3xl" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold">Metas y Objetivos</h3>
              <p className="text-sm text-teal-100">Progreso del equipo</p>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full -mr-10 -mt-10" />
        </button>
      </div>

      {/* Actividad de agentes y propiedades destacadas */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        {/* Gráfico de rendimiento de agentes con ranking */}
        <div className={cardBase}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold dark:text-gray-100 flex items-center gap-2">
              <FaUserFriends className="text-blue-500" />
              Ranking de Agentes - Operaciones
            </h3>
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
              Este mes
            </span>
          </div>

          <Chart
            options={{
              chart: { type: 'bar', toolbar: { show: false }, background: 'transparent' },
              colors: [currentColor || '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'],
              plotOptions: { bar: { horizontal: false, columnWidth: '55%', borderRadius: 6, distributed: true } },
              dataLabels: { enabled: false },
              xaxis: { categories: agentesOps.map((a) => a.agente.split(' ')[0]), labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '11px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
              yaxis: { labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '11px' } } },
              grid: { borderColor: currentMode === 'Dark' ? '#374151' : '#E5E7EB', strokeDashArray: 4 },
              legend: { show: false },
              tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light', y: { formatter: (v) => `${v} operaciones` } },
            }}
            series={[{ name: 'Operaciones', data: agentesOps.map((a) => a.ops) }]}
            type="bar"
            height={260}
          />

          {/* Mini ranking visual */}
          <div className="mt-4 space-y-2">
            {agentesOps.slice(0, 3).map((agente, index) => (
              <div key={agente.agente} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-600'
                  }`}
                  >
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium dark:text-gray-200">{agente.agente.split(' ')[0]}</span>
                </div>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{agente.ops} ops</span>
              </div>
            ))}
          </div>
        </div>

        {/* Grid de propiedades más vistas */}
        <div className={cardBase}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold dark:text-gray-100 flex items-center gap-2">
              <FaHome className="text-green-500" />
              Propiedades Más Vistas
            </h3>
            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-1 rounded-full">
              Top 5
            </span>
          </div>

          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
                  <th className={`text-left py-2 px-3 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Propiedad</th>
                  <th className={`text-center py-2 px-3 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Visitas</th>
                  <th className={`text-left py-2 px-3 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Estado</th>
                  <th className={`text-right py-2 px-3 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Precio</th>
                </tr>
              </thead>
              <tbody>
                {propiedadesVistas.map((p) => (
                  <tr key={p.id} className={`border-b last:border-0 ${isDark ? 'border-gray-700/50 hover:bg-gray-800/30' : 'border-gray-50 hover:bg-gray-50'}`}>
                    <td className="py-3 px-3">
                      <p className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{p.propiedad}</p>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{p.zona}</p>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="font-bold text-blue-600 dark:text-blue-400">{p.visitas.toLocaleString()}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        p.estado === 'Disponible' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : p.estado === 'Reservada' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                            : p.estado === 'Vendida' ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      }`}>{p.estado}</span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">{p.precio}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Mapa, Tareas y Alertas - Sección inferior */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

        {/* Mapa interactivo con propiedades activas */}
        <div className={cardBase}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold dark:text-gray-100 flex items-center gap-2">
              <FaMapMarkerAlt className="text-red-500" />
              Mapa de Propiedades
            </h3>
            <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-1 rounded-full">
              {propiedadesMapa.length} activas
            </span>
          </div>

          {/* Mapa simplificado para evitar problemas de estado */}
          <div className="h-80 rounded-lg overflow-hidden border dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <div className="text-center p-8">
              <FaMapMarkerAlt className="text-6xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                Mapa Interactivo
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                {propiedadesMapa.length} propiedades ubicadas estratégicamente
              </p>

              {/* Indicadores de ubicación simplificados */}
              <div className="mt-6 grid grid-cols-2 gap-3 max-w-xs mx-auto">
                {propiedadesMapa.slice(0, 4).map((prop, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-white dark:bg-gray-700 rounded-lg">
                    <div className={`w-3 h-3 rounded-full ${
                      prop.estado === 'Disponible' ? 'bg-green-500'
                        : prop.estado === 'Reservada' ? 'bg-yellow-500'
                          : prop.estado === 'Vendida' ? 'bg-gray-500' : 'bg-blue-500'
                    }`}
                    />
                    <div className="text-xs">
                      <p className="font-medium dark:text-gray-200">{prop.name.split(' ')[0]}</p>
                      <p className="text-gray-500 dark:text-gray-400">{prop.estado}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Leyenda del mapa */}
          <div className="mt-3 flex flex-wrap gap-2">
            <div className="flex items-center gap-1 text-xs">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="dark:text-gray-300">Disponible</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="dark:text-gray-300">Reservada</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <div className="w-3 h-3 rounded-full bg-gray-500" />
              <span className="dark:text-gray-300">Vendida</span>
            </div>
            <div className="flex items-center gap-1 text-xs">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="dark:text-gray-300">Alquilada</span>
            </div>
          </div>
        </div>

        {/* Panel de tareas pendientes y recordatorios */}
        <div className={cardBase}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold dark:text-gray-100 flex items-center gap-2">
              <FaTasks className="text-blue-500" />
              Tareas del Día
            </h3>
            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
              {tareas.filter((t) => !t.completada).length} pendientes
            </span>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
            {tareas.map((tarea) => (
              <div
                key={tarea.id}
                className={`p-3 rounded-lg border transition-all duration-200 ${
                  tarea.completada
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 opacity-60'
                    : 'bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={tarea.completada}
                    className="w-4 h-4 mt-1 text-blue-600 rounded focus:ring-blue-500"
                    readOnly
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${
                      tarea.completada
                        ? 'line-through text-gray-500 dark:text-gray-400'
                        : 'dark:text-gray-200'
                    }`}
                    >
                      {tarea.texto}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <FaBell className="w-3 h-3" />
                        {tarea.hora}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        tarea.prioridad === 'alta' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                          : tarea.prioridad === 'media' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                      }`}
                      >
                        {tarea.prioridad}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t dark:border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <FaCheckCircle className="text-green-500" />
                Recordatorios automáticos activos
              </span>
              <span>{tareas.filter((t) => t.completada).length}/{tareas.length} completadas</span>
            </div>
          </div>
        </div>

        {/* Panel de alertas inteligentes */}
        <div className={cardBase}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold dark:text-gray-100 flex items-center gap-2">
              <FaExclamationTriangle className="text-orange-500" />
              Alertas Inteligentes
            </h3>
            <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-full">
              {alertas.filter((a) => a.urgencia === 'alta').length} urgentes
            </span>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto scrollbar-hide">
            {alertas.map((alerta) => (
              <div
                key={alerta.id}
                className={`p-4 rounded-lg border-l-4 transition-all duration-200 hover:shadow-md ${
                  alerta.tipo === 'peligro'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                    : alerta.tipo === 'aviso'
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`text-lg ${
                    alerta.tipo === 'peligro' ? 'text-red-600 dark:text-red-400'
                      : alerta.tipo === 'aviso' ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-blue-600 dark:text-blue-400'
                  }`}
                  >
                    {alerta.icono}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium dark:text-gray-200 mb-1">
                      {alerta.texto}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        alerta.urgencia === 'alta' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                          : alerta.urgencia === 'media' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                      }`}
                      >
                        {alerta.urgencia}
                      </span>
                      <button type="button" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                        Ver detalles
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t dark:border-gray-700">
            <button type="button" className="w-full text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors">
              Ver todas las alertas →
            </button>
          </div>
        </div>
      </div>

      {/* Nuevos Widgets Ejecutivos - Información Clave para CEO */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">

        {/* Widget 1: Estado de Propiedades por Categoría */}
        <div className={cardBase}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold dark:text-gray-100 flex items-center gap-2">
              <FaHome className="text-indigo-500" />
              Estado de Propiedades
            </h3>
            <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-full">
              87 total
            </span>
          </div>

          {/* Gráfico de dona con estadísticas */}
          <div className="space-y-4">
            {[
              { estado: 'Disponibles', cantidad: 52, porcentaje: 60, color: 'bg-green-500', textColor: 'text-green-600 dark:text-green-400' },
              { estado: 'Reservadas', cantidad: 18, porcentaje: 21, color: 'bg-yellow-500', textColor: 'text-yellow-600 dark:text-yellow-400' },
              { estado: 'En Negociación', cantidad: 12, porcentaje: 14, color: 'bg-blue-500', textColor: 'text-blue-600 dark:text-blue-400' },
              { estado: 'Vendidas/Alquiladas', cantidad: 5, porcentaje: 5, color: 'bg-gray-500', textColor: 'text-gray-600 dark:text-gray-400' },
            ].map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className="text-sm font-medium dark:text-gray-200">{item.estado}</span>
                  </div>
                  <span className={`text-sm font-bold ${item.textColor}`}>{item.cantidad}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className={`${item.color} h-2 rounded-full transition-all duration-500`} style={{ width: `${item.porcentaje}%` }} />
                </div>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{item.porcentaje}% del total</span>
                  <span>${(item.cantidad * 185).toFixed(0)}K valor aprox.</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t dark:border-gray-700">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-3 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">Tasa de Ocupación</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">94%</p>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-3 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">Tiempo Prom. Venta</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">45 días</p>
              </div>
            </div>
          </div>
        </div>

        {/* Widget 2: Top Propiedades Premium */}
        <div className={cardBase}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold dark:text-gray-100 flex items-center gap-2">
              <FaDollarSign className="text-yellow-500" />
              Propiedades Premium
            </h3>
            <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded-full">
              Top 5
            </span>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-hide">
            {[
              { nombre: 'Penthouse Recoleta', precio: '$850K', zona: 'Recoleta', tipo: 'Venta', visitas: 234, interes: 'Alto' },
              { nombre: 'Casa Nordelta', precio: '$720K', zona: 'Nordelta', tipo: 'Venta', visitas: 189, interes: 'Alto' },
              { nombre: 'Loft Palermo Soho', precio: '$420K', zona: 'Palermo', tipo: 'Venta', visitas: 156, interes: 'Medio' },
              { nombre: 'Depto Puerto Madero', precio: '$380K', zona: 'Pto. Madero', tipo: 'Venta', visitas: 142, interes: 'Alto' },
              { nombre: 'Casa Belgrano R', precio: '$650K', zona: 'Belgrano', tipo: 'Venta', visitas: 128, interes: 'Medio' },
            ].map((prop, i) => (
              <div key={i} className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-3 hover:shadow-md transition-all cursor-pointer`}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-orange-600' : 'bg-blue-500'
                      }`}
                      >
                        {i + 1}
                      </span>
                      <h4 className="font-bold text-sm dark:text-gray-200">{prop.nombre}</h4>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 ml-8">📍 {prop.zona}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">{prop.precio}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between ml-8 mt-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">👁️ {prop.visitas} visitas</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    prop.interes === 'Alto'
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300'
                  }`}
                  >
                    🔥 {prop.interes}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t dark:border-gray-700">
            <button type="button" className="w-full text-sm text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-300 font-medium transition-colors">
              Ver todas las propiedades premium →
            </button>
          </div>
        </div>

        {/* Widget 3: Indicadores Financieros Clave */}
        <div className={cardBase}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold dark:text-gray-100 flex items-center gap-2">
              <FaChartLine className="text-emerald-500" />
              Indicadores Financieros
            </h3>
            <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-1 rounded-full">
              Octubre
            </span>
          </div>

          <div className="space-y-4">
            {/* Ingresos Totales */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-4 rounded-lg border-2 border-emerald-200 dark:border-emerald-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">💰 Ingresos Totales</span>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">+22% ↗</span>
              </div>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">$1.2M</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">vs $980K mes anterior</p>
            </div>

            {/* Comisiones Generadas */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">💵 Comisiones</span>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-bold">+18% ↗</span>
              </div>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">$156K</p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">13% del total de ventas</p>
            </div>

            {/* ROI y Rentabilidad */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} p-3 rounded-lg`}>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">📊 ROI Promedio</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">18.5%</p>
              </div>
              <div className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} p-3 rounded-lg`}>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">⚡ Conversión</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">23%</p>
              </div>
            </div>

            {/* Proyección Anual */}
            <div className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} p-3 rounded-lg`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">🎯 Proyección Anual</span>
                <span className="text-xs text-green-600 dark:text-green-400">En camino</span>
              </div>
              <div className="flex items-end gap-2">
                <p className="text-xl font-bold dark:text-gray-200">$14.4M</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-0.5">de $15M meta</p>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full" style={{ width: '96%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Propiedades Activas */}
      {showModalPropiedades && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaHome /> Propiedades Activas
                </h2>
                <p className="text-blue-100 text-sm mt-1">87 propiedades disponibles (+12 esta semana)</p>
              </div>
              <button type="button" onClick={() => setShowModalPropiedades(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {propiedadesVistas.map((prop) => (
                  <div key={prop.id} className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 border ${currentMode === 'Dark' ? 'border-gray-700' : 'border-gray-200'} hover:shadow-lg transition-shadow`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg dark:text-gray-100">{prop.propiedad}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">📍 {prop.zona}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        prop.estado === 'Disponible' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : prop.estado === 'Reservada' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                            : prop.estado === 'Vendida' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                      }`}
                      >
                        {prop.estado}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Precio:</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">{prop.precio}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Visitas:</span>
                        <span className="font-bold dark:text-gray-200">{prop.visitas}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Agente:</span>
                        <span className="font-medium dark:text-gray-200">{prop.agente}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Clientes Registrados */}
      {showModalClientes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className="sticky top-0 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaUserFriends /> Clientes Registrados
                </h2>
                <p className="text-indigo-100 text-sm mt-1">156 clientes totales (23 nuevos este mes)</p>
              </div>
              <button type="button" onClick={() => setShowModalClientes(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {[
                  { nombre: 'Juan Pérez', email: 'juan@example.com', telefono: '+54 11 1234-5678', interes: 'Compra', presupuesto: '$200K', estado: 'Activo' },
                  { nombre: 'María González', email: 'maria@example.com', telefono: '+54 11 8765-4321', interes: 'Alquiler', presupuesto: '$1,500/mes', estado: 'Nuevo' },
                  { nombre: 'Carlos Rodríguez', email: 'carlos@example.com', telefono: '+54 11 5555-6666', interes: 'Compra', presupuesto: '$350K', estado: 'Activo' },
                  { nombre: 'Ana Martínez', email: 'ana@example.com', telefono: '+54 11 7777-8888', interes: 'Compra', presupuesto: '$180K', estado: 'Nuevo' },
                ].map((cliente, idx) => (
                  <div key={idx} className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 border ${currentMode === 'Dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg dark:text-gray-100">{cliente.nombre}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">📧 {cliente.email}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">📱 {cliente.telefono}</p>
                        <div className="flex gap-3 mt-2">
                          <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            {cliente.interes}
                          </span>
                          <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            {cliente.presupuesto}
                          </span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        cliente.estado === 'Activo' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                      }`}
                      >
                        {cliente.estado}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ventas del Mes */}
      {showModalVentas && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className="sticky top-0 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaDollarSign /> Ventas del Mes
                </h2>
                <p className="text-emerald-100 text-sm mt-1">$850K en ventas (+15% vs mes anterior)</p>
              </div>
              <button type="button" onClick={() => setShowModalVentas(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {[
                  { propiedad: 'Casa Belgrano', cliente: 'Carlos Rodríguez', monto: '$280,000', fecha: '15/10/2025', agente: 'Carlos Ruiz', comision: '$9,800' },
                  { propiedad: 'PH Colegiales', cliente: 'Laura Díaz', monto: '$320,000', fecha: '12/10/2025', agente: 'Sofía Torres', comision: '$11,200' },
                  { propiedad: 'Depto Palermo', cliente: 'Juan Pérez', monto: '$150,000', fecha: '08/10/2025', agente: 'Ana López', comision: '$5,250' },
                  { propiedad: 'Oficina Microcentro', cliente: 'María González', monto: '$95,000', fecha: '05/10/2025', agente: 'Laura Fernández', comision: '$3,325' },
                ].map((venta, idx) => (
                  <div key={idx} className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 border ${currentMode === 'Dark' ? 'border-gray-700' : 'border-gray-200'} hover:shadow-md transition-shadow`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg dark:text-gray-100">{venta.propiedad}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Cliente: {venta.cliente}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">📅 {venta.fecha} • 👤 {venta.agente}</p>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">Comisión: {venta.comision}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{venta.monto}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rendimiento Mensual */}
      {showModalRendimiento && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FaChartLine className="text-3xl" />
                  <div>
                    <h3 className="text-2xl font-bold">Rendimiento Mensual</h3>
                    <p className="text-purple-100 text-sm mt-1">Análisis completo de métricas clave</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowModalRendimiento(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                  <FaTimes className="text-2xl" />
                </button>
              </div>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Métricas Principales */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border-2 border-blue-200 dark:border-blue-700">
                  <div className="flex items-center gap-3 mb-2">
                    <FaDollarSign className="text-2xl text-blue-600 dark:text-blue-400" />
                    <h4 className="font-bold text-gray-800 dark:text-gray-200">Ingresos</h4>
                  </div>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">$1.2M</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">+18% vs mes anterior</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border-2 border-green-200 dark:border-green-700">
                  <div className="flex items-center gap-3 mb-2">
                    <FaCheckCircle className="text-2xl text-green-600 dark:text-green-400" />
                    <h4 className="font-bold text-gray-800 dark:text-gray-200">Operaciones</h4>
                  </div>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">47</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">+12 este mes</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4 rounded-lg border-2 border-orange-200 dark:border-orange-700">
                  <div className="flex items-center gap-3 mb-2">
                    <FaUserFriends className="text-2xl text-orange-600 dark:text-orange-400" />
                    <h4 className="font-bold text-gray-800 dark:text-gray-200">Clientes Nuevos</h4>
                  </div>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">89</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">+23% de conversión</p>
                </div>
              </div>

              {/* Comparativa Trimestral */}
              <div className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 mb-4`}>
                <h4 className="font-bold text-lg mb-3 dark:text-gray-200">📊 Comparativa Trimestral</h4>
                <div className="space-y-3">
                  {[
                    { mes: 'Octubre 2025', ventas: 15, ingresos: '$850K', color: 'bg-purple-500' },
                    { mes: 'Septiembre 2025', ventas: 12, ingresos: '$720K', color: 'bg-purple-400' },
                    { mes: 'Agosto 2025', ventas: 10, ingresos: '$650K', color: 'bg-purple-300' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        <span className="font-medium dark:text-gray-200">{item.mes}</span>
                      </div>
                      <div className="flex gap-6">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{item.ventas} ventas</span>
                        <span className="font-bold text-green-600 dark:text-green-400">{item.ingresos}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Productos */}
              <div className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4`}>
                <h4 className="font-bold text-lg mb-3 dark:text-gray-200">🏆 Propiedades Más Vendidas</h4>
                <div className="space-y-2">
                  {[
                    { tipo: 'Departamentos 2 amb', cantidad: 12, porcentaje: 35 },
                    { tipo: 'Casas en Zona Norte', cantidad: 8, porcentaje: 25 },
                    { tipo: 'PH en Capital', cantidad: 6, porcentaje: 18 },
                  ].map((item, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium dark:text-gray-200">{item.tipo}</span>
                        <span className="text-gray-600 dark:text-gray-400">{item.cantidad} unidades</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width: `${item.porcentaje}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t dark:border-gray-700 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModalRendimiento(false)}
                className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Actividades Recientes */}
      {showModalActividades && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FaCalendarAlt className="text-3xl" />
                  <div>
                    <h3 className="text-2xl font-bold">Actividades Recientes</h3>
                    <p className="text-orange-100 text-sm mt-1">Últimas 24 horas del sistema</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowModalActividades(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                  <FaTimes className="text-2xl" />
                </button>
              </div>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {[
                  {
                    hora: '10:30 AM',
                    tipo: 'venta',
                    titulo: 'Nueva venta registrada',
                    detalle: 'Depto 2 amb Palermo - $185,000',
                    agente: 'María González',
                    icon: <FaDollarSign />,
                    color: 'from-green-500 to-green-600',
                  },
                  {
                    hora: '09:15 AM',
                    tipo: 'cliente',
                    titulo: 'Cliente nuevo registrado',
                    detalle: 'Juan Pérez - Interesado en zona norte',
                    agente: 'Carlos Ruiz',
                    icon: <FaUserFriends />,
                    color: 'from-blue-500 to-blue-600',
                  },
                  {
                    hora: '08:45 AM',
                    tipo: 'propiedad',
                    titulo: 'Propiedad publicada',
                    detalle: 'Casa 3 amb Belgrano - $320,000',
                    agente: 'Ana Martínez',
                    icon: <FaHome />,
                    color: 'from-purple-500 to-purple-600',
                  },
                  {
                    hora: 'Ayer 6:20 PM',
                    tipo: 'visita',
                    titulo: 'Visita programada',
                    detalle: 'PH Colegiales - Mañana 11:00 AM',
                    agente: 'Luis Torres',
                    icon: <FaMapMarkerAlt />,
                    color: 'from-red-500 to-red-600',
                  },
                  {
                    hora: 'Ayer 4:10 PM',
                    tipo: 'tarea',
                    titulo: 'Tarea completada',
                    detalle: 'Seguimiento cliente - Documentación enviada',
                    agente: 'María González',
                    icon: <FaCheckCircle />,
                    color: 'from-teal-500 to-teal-600',
                  },
                  {
                    hora: 'Ayer 2:30 PM',
                    tipo: 'alerta',
                    titulo: 'Alerta generada',
                    detalle: 'Lead sin respuesta hace 48h',
                    agente: 'Sistema',
                    icon: <FaBell />,
                    color: 'from-yellow-500 to-yellow-600',
                  },
                ].map((actividad, i) => (
                  <div key={i} className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 hover:shadow-md transition-shadow`}>
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${actividad.color} text-white flex-shrink-0`}>
                        {actividad.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-1">
                          <h4 className="font-bold text-gray-800 dark:text-gray-200">{actividad.titulo}</h4>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{actividad.hora}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{actividad.detalle}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">👤 {actividad.agente}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t dark:border-gray-700 flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Mostrando últimas 6 actividades</span>
              <button
                type="button"
                onClick={() => setShowModalActividades(false)}
                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Metas y Objetivos */}
      {showModalMetas && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            {/* Header */}
            <div className="bg-gradient-to-r from-teal-500 to-teal-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FaTrophy className="text-3xl" />
                  <div>
                    <h3 className="text-2xl font-bold">Metas y Objetivos</h3>
                    <p className="text-teal-100 text-sm mt-1">Progreso del equipo - Octubre 2025</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowModalMetas(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                  <FaTimes className="text-2xl" />
                </button>
              </div>
            </div>

            {/* Contenido */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Progreso General */}
              <div className={`${currentMode === 'Dark' ? 'bg-gradient-to-br from-teal-900/30 to-teal-800/30' : 'bg-gradient-to-br from-teal-50 to-teal-100'} rounded-lg p-6 mb-6 border-2 border-teal-300 dark:border-teal-700`}>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-bold dark:text-gray-200">🎯 Meta Mensual General</h4>
                  <span className="text-3xl font-bold text-teal-600 dark:text-teal-400">78%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mb-2">
                  <div className="bg-gradient-to-r from-teal-500 to-teal-600 h-4 rounded-full transition-all" style={{ width: '78%' }} />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Faltan $220K para alcanzar la meta de $1M</p>
              </div>

              {/* Metas por Categoría */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {[
                  {
                    titulo: 'Ventas Totales',
                    meta: 20,
                    actual: 15,
                    porcentaje: 75,
                    icon: <FaDollarSign />,
                    color: 'text-green-600 dark:text-green-400',
                    bgColor: 'bg-green-500',
                  },
                  {
                    titulo: 'Nuevos Clientes',
                    meta: 100,
                    actual: 89,
                    porcentaje: 89,
                    icon: <FaUserFriends />,
                    color: 'text-blue-600 dark:text-blue-400',
                    bgColor: 'bg-blue-500',
                  },
                  {
                    titulo: 'Propiedades Publicadas',
                    meta: 50,
                    actual: 42,
                    porcentaje: 84,
                    icon: <FaHome />,
                    color: 'text-purple-600 dark:text-purple-400',
                    bgColor: 'bg-purple-500',
                  },
                  {
                    titulo: 'Visitas Realizadas',
                    meta: 150,
                    actual: 127,
                    porcentaje: 85,
                    icon: <FaMapMarkerAlt />,
                    color: 'text-orange-600 dark:text-orange-400',
                    bgColor: 'bg-orange-500',
                  },
                ].map((meta, i) => (
                  <div key={i} className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`text-2xl ${meta.color}`}>{meta.icon}</div>
                      <h5 className="font-bold dark:text-gray-200">{meta.titulo}</h5>
                    </div>
                    <div className="flex items-end justify-between mb-2">
                      <span className="text-2xl font-bold dark:text-gray-200">{meta.actual}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">de {meta.meta}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className={`${meta.bgColor} h-2 rounded-full transition-all`} style={{ width: `${meta.porcentaje}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{meta.porcentaje}% completado</p>
                  </div>
                ))}
              </div>

              {/* Ranking de Agentes por Meta */}
              <div className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4`}>
                <h4 className="font-bold text-lg mb-4 dark:text-gray-200">🏆 Top Agentes del Mes</h4>
                <div className="space-y-3">
                  {[
                    { nombre: 'María González', ventas: 8, meta: 10, porcentaje: 80, medalla: '🥇' },
                    { nombre: 'Carlos Ruiz', ventas: 6, meta: 10, porcentaje: 60, medalla: '🥈' },
                    { nombre: 'Ana Martínez', ventas: 5, meta: 10, porcentaje: 50, medalla: '🥉' },
                    { nombre: 'Luis Torres', ventas: 4, meta: 10, porcentaje: 40, medalla: '⭐' },
                  ].map((agente, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-2xl">{agente.medalla}</span>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium dark:text-gray-200">{agente.nombre}</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">{agente.ventas}/{agente.meta} ventas</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div className="bg-teal-500 h-2 rounded-full transition-all" style={{ width: `${agente.porcentaje}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t dark:border-gray-700 flex justify-end">
              <button
                type="button"
                onClick={() => setShowModalMetas(false)}
                className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Alquileres Vigentes */}
      {showModalAlquileres && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaKey /> Alquileres Vigentes
                </h2>
                <p className="text-orange-100 text-sm mt-1">34 contratos activos (Ingresos: $45K/mes)</p>
              </div>
              <button type="button" onClick={() => setShowModalAlquileres(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {[
                  { propiedad: 'Local Recoleta', inquilino: 'Comercio SA', monto: '$2,500/mes', vencimiento: '15/12/2025', estado: 'Al día' },
                  { propiedad: 'Depto 1amb Centro', inquilino: 'Pedro Gómez', monto: '$800/mes', vencimiento: '20/11/2025', estado: 'Al día' },
                  { propiedad: 'Oficina Palermo', inquilino: 'Tech Corp', monto: '$3,200/mes', vencimiento: '10/01/2026', estado: 'Al día' },
                  { propiedad: 'Casa Belgrano', inquilino: 'Familia Martínez', monto: '$1,800/mes', vencimiento: '05/11/2025', estado: 'Próximo venc.' },
                ].map((alquiler, idx) => (
                  <div key={idx} className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 border ${currentMode === 'Dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg dark:text-gray-100">{alquiler.propiedad}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Inquilino: {alquiler.inquilino}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">📅 Vence: {alquiler.vencimiento}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{alquiler.monto}</p>
                        <span className={`text-xs px-2 py-1 rounded mt-1 inline-block ${
                          alquiler.estado === 'Al día' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                        }`}
                        >
                          {alquiler.estado}
                        </span>
                      </div>
                    </div>
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

export default DashboardEjecutivo;
