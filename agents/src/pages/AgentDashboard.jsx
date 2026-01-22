import React from 'react';
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
import Chart from 'react-apexcharts';

const AgentDashboard = () => {
  const { currentColor, currentMode } = useStateContext();

  // Vista inicial del agente: resumen simple de su actividad
  const kpis = [
    {
      title: 'Leads activos',
      value: 12,
      desc: 'En seguimiento',
      icon: <FaUserFriends />,
      color: 'from-blue-500 to-blue-600',
      trend: '+8%',
    },
    {
      title: 'Visitas hoy',
      value: 3,
      desc: 'Agendadas en tu calendario',
      icon: <FaRegCalendarAlt />,
      color: 'from-emerald-500 to-emerald-600',
      trend: '+12%',
    },
    {
      title: 'Propiedades asignadas',
      value: 18,
      desc: 'Activas en tu cartera',
      icon: <FaHome />,
      color: 'from-indigo-500 to-indigo-600',
      trend: '+5%',
    },
    {
      title: 'Tareas pendientes',
      value: 7,
      desc: 'Por completar hoy',
      icon: <FaTasks />,
      color: 'from-orange-500 to-orange-600',
      trend: '+3%',
    },
  ];

  const proximasCitas = [
    {
      hora: '10:00',
      cliente: 'Juan Pérez',
      propiedad: 'Depto 2 ambientes - Palermo',
      estado: 'Confirmada',
    },
    {
      hora: '14:30',
      cliente: 'María Gómez',
      propiedad: 'Casa 3 dormitorios - Belgrano',
      estado: 'Pendiente de confirmación',
    },
  ];

  const tareas = [
    'Llamar a leads nuevos de ayer',
    'Actualizar estado de oferta en Propiedad #1243',
    'Enviar resumen de visitas al cliente López',
  ];

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
  const metaSeries = [60];

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
            total: { show: true, label: 'Total', fontSize: '11px', color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', formatter: () => '48' },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    legend: { show: true, position: 'bottom', fontSize: '11px', labels: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' } },
    stroke: { show: false },
    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light' },
  };
  const leadsDonutSeries = [12, 8, 4, 24];

  // ApexCharts - Ingresos por Comisiones (Area)
  const ingresosOptions = {
    chart: { type: 'area', height: 280, background: 'transparent', toolbar: { show: false }, zoom: { enabled: false } },
    colors: ['#8B5CF6', '#10B981'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2.5 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] } },
    xaxis: {
      categories: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
      labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '10px' } },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '10px' }, formatter: (val) => `$${val}K` } },
    grid: { borderColor: currentMode === 'Dark' ? '#374151' : '#E5E7EB', strokeDashArray: 4 },
    legend: { show: true, position: 'top', horizontalAlign: 'right', fontSize: '11px', labels: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' } },
    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light', y: { formatter: (val) => `$${val}K` } },
  };
  const ingresosSeries = [
    { name: 'Comisiones', data: [8, 6, 12, 15, 11, 18, 14, 20, 22, 25, 28, 32] },
    { name: 'Objetivo', data: [10, 10, 15, 15, 15, 20, 20, 20, 25, 25, 30, 30] },
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
  const funnelSeries = [{ name: 'Leads', data: [48, 36, 18, 12] }];

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
  const conversionSeries = [25];

  const cardBase = 'rounded-xl shadow-md p-6 bg-white dark:bg-secondary-dark-bg transition-all duration-300 hover:scale-[1.01] hover:shadow-lg';

  return (
    <div className="p-6 bg-main-bg dark:bg-main-dark-bg min-h-screen">
      <Header category="Agente" title="Panel del Agente" />

      {/* KPIs principales del agente (misma estructura que DashboardEjecutivo) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi) => (
          <div
            key={kpi.title}
            className={`${cardBase} overflow-hidden relative cursor-pointer`}
          >
            {/* Barra de color superior */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${kpi.color}`} />

            {/* Contenido principal */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`text-2xl text-white p-3 rounded-lg bg-gradient-to-br ${kpi.color} shadow-lg`}>
                    {kpi.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                      {kpi.title}
                    </p>
                    <p className="text-3xl font-bold dark:text-gray-100 mt-1">
                      {kpi.value}
                    </p>
                  </div>
                </div>

                {/* Descripción y tendencia */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {kpi.desc}
                  </p>
                  <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                    {kpi.trend}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
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
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">12</p>
              <p className="text-xs text-gray-500">Actual</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-500">20</p>
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
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">25%</p>
              <p className="text-xs text-gray-500">Cierre</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-center">
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">75%</p>
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
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <FaArrowUp className="text-xs" /> +7%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-1.5 rounded-full" style={{ width: '82%' }}></div>
            </div>
            <p className="text-xs text-center text-gray-500">Top 18% de agentes</p>
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
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">$211K</p>
              <p className="text-xs text-gray-500">Total Ganado</p>
            </div>
            <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">$32K</p>
              <p className="text-xs text-gray-500">Este Mes</p>
            </div>
            <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">$17.6K</p>
              <p className="text-xs text-gray-500">Promedio</p>
            </div>
            <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <p className="text-xl font-bold text-orange-600 dark:text-orange-400">+28%</p>
              <p className="text-xs text-gray-500">vs Año Ant.</p>
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
              <p className="text-2xl font-bold text-green-600 mt-1">18</p>
              <p className="text-xs text-gray-500">Esta semana</p>
            </div>
            <div className="text-center p-4 border-2 border-blue-500 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
              <FaUsers className="text-3xl text-blue-500 mx-auto mb-2" />
              <h4 className="font-bold dark:text-gray-200 text-sm">Interesados</h4>
              <p className="text-2xl font-bold text-blue-600 mt-1">12</p>
              <p className="text-xs text-gray-500">Seguimiento</p>
            </div>
            <div className="text-center p-4 border-2 border-yellow-500 rounded-lg hover:bg-yellow-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
              <FaClock className="text-3xl text-yellow-500 mx-auto mb-2" />
              <h4 className="font-bold dark:text-gray-200 text-sm">Reagendar</h4>
              <p className="text-2xl font-bold text-yellow-600 mt-1">3</p>
              <p className="text-xs text-gray-500">Pendientes</p>
            </div>
            <div className="text-center p-4 border-2 border-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-gray-800 cursor-pointer transition-colors">
              <FaPhoneAlt className="text-3xl text-red-500 mx-auto mb-2" />
              <h4 className="font-bold dark:text-gray-200 text-sm">No Contactados</h4>
              <p className="text-2xl font-bold text-red-600 mt-1">2</p>
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
              {tareas.map((tarea) => (
                <li
                  key={tarea}
                  className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/40 text-sm text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
                >
                  {tarea}
                </li>
              ))}
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
              <span className="font-semibold">12 / 20</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full" style={{ width: '60%' }} />
            </div>

            <div className="flex items-center justify-between mt-4">
              <span>Conversión de leads</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">24%</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Mantén una tasa de conversión por encima del 20% para cumplir tus metas mensuales.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;
