import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { FaUserPlus, FaUser, FaStar, FaUsers, FaDollarSign, FaHome, FaMapMarkerAlt, FaShieldAlt, FaTimes, FaSave, FaArrowLeft, FaThLarge, FaEdit, FaTrash, FaPhone, FaEnvelope, FaCalendar, FaChartLine, FaTrophy, FaBriefcase, FaArrowUp, FaArrowDown, FaPercentage } from 'react-icons/fa';
import { Header } from '../components';
import { useStateContext } from '../contexts/ContextProvider';
import Chart from 'react-apexcharts';

// Syncfusion Components
import { ChartComponent, SeriesCollectionDirective, SeriesDirective, Inject, LineSeries, Category, Tooltip, Legend, DataLabel, ColumnSeries } from '@syncfusion/ej2-react-charts';
import { GridComponent, ColumnsDirective, ColumnDirective, Page, Sort, Inject as GridInject } from '@syncfusion/ej2-react-grids';

const Agentes = () => {
  const { currentMode, currentColor } = useStateContext();
  
  // Estado para el modal
  const [showModal, setShowModal] = useState(false);
  
  // Estados para modales de estadísticas
  const [showModalTotalAgentes, setShowModalTotalAgentes] = useState(false);
  const [showModalPropiedadesGestionadas, setShowModalPropiedadesGestionadas] = useState(false);
  const [showModalComisionesTotales, setShowModalComisionesTotales] = useState(false);
  const [showModalRatingPromedio, setShowModalRatingPromedio] = useState(false);
  
  // Estados para las vistas
  const [vistaActual, setVistaActual] = useState('dashboard'); // 'dashboard', 'lista', 'detalle'
  const [agenteSeleccionado, setAgenteSeleccionado] = useState(null);
  
  // Estado para el formulario de nuevo agente
  const [nuevoAgente, setNuevoAgente] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    telefonoAlternativo: '',
    rol: 'Agente',
    especialidad: 'Ventas',
    zonas: [],
    comision: '3',
    direccion: '',
    ciudad: 'Buenos Aires',
    provincia: 'Buenos Aires',
    fechaIngreso: '',
    licencia: '',
    experiencia: '',
    idiomas: [],
    notas: '',
  });

  const agentes = [
    { 
      id: 1, 
      nombre: 'Ana López', 
      rol: 'Agente Senior', 
      especialidad: 'Ventas',
      propiedades: 12, 
      clientes: 28, 
      ventas: 8, 
      comisiones: 15400, 
      rating: 4.8, 
      zona: 'Palermo, Belgrano', 
      color: '#FF6B6B',
      email: 'ana.lopez@inmobiliaria.com',
      telefono: '+54 11 1234-5678',
      telefonoAlternativo: '+54 11 1234-5679',
      direccion: 'Av. Santa Fe 1234',
      ciudad: 'Buenos Aires',
      provincia: 'Buenos Aires',
      fechaIngreso: '2022-01-15',
      licencia: 'CPI-12345',
      experiencia: '8 años',
      idiomas: ['Español', 'Inglés', 'Portugués'],
      notas: 'Especialista en propiedades de lujo en Palermo y Belgrano. Excelente relación con clientes VIP.',
      metaMensual: 10,
      citas: 45,
      propiedadesVendidas: 8,
      satisfaccionCliente: 95
    },
    { 
      id: 2, 
      nombre: 'Carlos Ruiz', 
      rol: 'Agente', 
      especialidad: 'Alquileres',
      propiedades: 8, 
      clientes: 15, 
      ventas: 5, 
      comisiones: 9200, 
      rating: 4.5, 
      zona: 'Recoleta', 
      color: '#4ECDC4',
      email: 'carlos.ruiz@inmobiliaria.com',
      telefono: '+54 11 8765-4321',
      telefonoAlternativo: '',
      direccion: 'Av. Callao 567',
      ciudad: 'Buenos Aires',
      provincia: 'Buenos Aires',
      fechaIngreso: '2023-03-20',
      licencia: 'CPI-67890',
      experiencia: '4 años',
      idiomas: ['Español', 'Inglés'],
      notas: 'Enfocado en alquileres temporarios y tradicionales en Recoleta.',
      metaMensual: 6,
      citas: 32,
      propiedadesVendidas: 5,
      satisfaccionCliente: 88
    },
    { 
      id: 3, 
      nombre: 'Laura Fernández', 
      rol: 'Supervisor', 
      especialidad: 'Comercial',
      propiedades: 15, 
      clientes: 42, 
      ventas: 12, 
      comisiones: 22100, 
      rating: 4.9, 
      zona: 'Microcentro, Puerto Madero', 
      color: '#45B7D1',
      email: 'laura.fernandez@inmobiliaria.com',
      telefono: '+54 11 5555-1234',
      telefonoAlternativo: '+54 11 5555-1235',
      direccion: 'Av. Corrientes 890',
      ciudad: 'Buenos Aires',
      provincia: 'Buenos Aires',
      fechaIngreso: '2020-06-10',
      licencia: 'CPI-11111',
      experiencia: '12 años',
      idiomas: ['Español', 'Inglés', 'Francés', 'Italiano'],
      notas: 'Supervisora de equipo. Especialista en propiedades comerciales y oficinas premium.',
      metaMensual: 15,
      citas: 68,
      propiedadesVendidas: 12,
      satisfaccionCliente: 98
    },
    { 
      id: 4, 
      nombre: 'Marcos Silva', 
      rol: 'Agente', 
      especialidad: 'Ventas',
      propiedades: 6, 
      clientes: 18, 
      ventas: 4, 
      comisiones: 7800, 
      rating: 4.2, 
      zona: 'Colegiales', 
      color: '#96CEB4',
      email: 'marcos.silva@inmobiliaria.com',
      telefono: '+54 11 7777-6666',
      telefonoAlternativo: '',
      direccion: 'Av. Cabildo 2345',
      ciudad: 'Buenos Aires',
      provincia: 'Buenos Aires',
      fechaIngreso: '2023-08-01',
      licencia: 'CPI-22222',
      experiencia: '2 años',
      idiomas: ['Español'],
      notas: 'Agente junior en desarrollo. Buen potencial en zona norte.',
      metaMensual: 5,
      citas: 28,
      propiedadesVendidas: 4,
      satisfaccionCliente: 82
    },
    { 
      id: 5, 
      nombre: 'Sofía Torres', 
      rol: 'Agente Senior', 
      especialidad: 'Ventas',
      propiedades: 10, 
      clientes: 25, 
      ventas: 7, 
      comisiones: 13200, 
      rating: 4.7, 
      zona: 'Villa Crespo', 
      color: '#FFEAA7',
      email: 'sofia.torres@inmobiliaria.com',
      telefono: '+54 11 9999-8888',
      telefonoAlternativo: '+54 11 9999-8889',
      direccion: 'Av. Corrientes 4567',
      ciudad: 'Buenos Aires',
      provincia: 'Buenos Aires',
      fechaIngreso: '2021-11-05',
      licencia: 'CPI-33333',
      experiencia: '6 años',
      idiomas: ['Español', 'Inglés'],
      notas: 'Especialista en propiedades familiares y departamentos de 2-3 ambientes.',
      metaMensual: 8,
      citas: 38,
      propiedadesVendidas: 7,
      satisfaccionCliente: 92
    },
  ];

  // Datos para gráfico de rendimiento (últimos 6 meses)
  const rendimientoData = [
    { mes: 'May', Ana: 6, Carlos: 3, Laura: 9, Marcos: 2, Sofia: 5 },
    { mes: 'Jun', Ana: 7, Carlos: 4, Laura: 10, Marcos: 3, Sofia: 6 },
    { mes: 'Jul', Ana: 5, Carlos: 6, Laura: 8, Marcos: 4, Sofia: 7 },
    { mes: 'Ago', Ana: 9, Carlos: 5, Laura: 12, Marcos: 3, Sofia: 8 },
    { mes: 'Sep', Ana: 8, Carlos: 7, Laura: 11, Marcos: 5, Sofia: 6 },
    { mes: 'Oct', Ana: 8, Carlos: 5, Laura: 12, Marcos: 4, Sofia: 7 },
  ];

  // ApexCharts - Rendimiento del Equipo (Area)
  const rendimientoEquipoOptions = {
    chart: { type: 'area', height: 260, background: 'transparent', toolbar: { show: false }, zoom: { enabled: false } },
    colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.05, stops: [0, 100] } },
    xaxis: { categories: rendimientoData.map(r => r.mes), labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '10px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '10px' } } },
    grid: { borderColor: currentMode === 'Dark' ? '#374151' : '#E5E7EB', strokeDashArray: 4 },
    legend: { show: true, position: 'top', horizontalAlign: 'right', fontSize: '10px', labels: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' } },
    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light' },
  };
  const rendimientoEquipoSeries = [
    { name: 'Ana', data: rendimientoData.map(r => r.Ana) },
    { name: 'Carlos', data: rendimientoData.map(r => r.Carlos) },
    { name: 'Laura', data: rendimientoData.map(r => r.Laura) },
    { name: 'Marcos', data: rendimientoData.map(r => r.Marcos) },
    { name: 'Sofía', data: rendimientoData.map(r => r.Sofia) },
  ];

  // ApexCharts - Distribución por Especialidad (Donut)
  const especialidadDonutOptions = {
    chart: { type: 'donut', height: 220, background: 'transparent' },
    labels: ['Ventas', 'Alquileres', 'Comercial'],
    colors: ['#8B5CF6', '#10B981', '#F59E0B'],
    plotOptions: { pie: { donut: { size: '65%', labels: { show: true, name: { fontSize: '11px', color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' }, value: { fontSize: '18px', fontWeight: 700, color: currentMode === 'Dark' ? '#F3F4F6' : '#1F2937' }, total: { show: true, label: 'Agentes', fontSize: '10px', color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', formatter: () => agentes.length } } } } },
    dataLabels: { enabled: false },
    legend: { show: true, position: 'bottom', fontSize: '10px', labels: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' } },
    stroke: { show: false },
    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light' },
  };
  const especialidadDonutSeries = [
    agentes.filter(a => a.especialidad === 'Ventas').length,
    agentes.filter(a => a.especialidad === 'Alquileres').length,
    agentes.filter(a => a.especialidad === 'Comercial').length,
  ];

  // ApexCharts - Comisiones por Agente (Bar)
  const comisionesBarOptions = {
    chart: { type: 'bar', height: 200, background: 'transparent', toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 6, horizontal: true, distributed: true, barHeight: '60%' } },
    colors: agentes.map(a => a.color),
    dataLabels: { enabled: true, textAnchor: 'start', style: { colors: ['#fff'], fontSize: '10px', fontWeight: 600 }, formatter: (val) => `$${(val/1000).toFixed(1)}K`, offsetX: 5 },
    xaxis: { categories: agentes.map(a => a.nombre.split(' ')[0]), labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '10px' } } },
    grid: { show: false },
    legend: { show: false },
    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light', y: { formatter: (val) => `$${val.toLocaleString()}` } },
  };
  const comisionesBarSeries = [{ name: 'Comisiones', data: agentes.map(a => a.comisiones) }];

  // ApexCharts - Satisfacción Promedio (Gauge)
  const satisfaccionOptions = {
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
    labels: ['Satisfacción'],
  };
  const satisfaccionSeries = [Math.round(agentes.reduce((sum, a) => sum + a.satisfaccionCliente, 0) / agentes.length)];

  // KPIs del equipo
  const kpisEquipo = [
    { title: 'Total Agentes', value: agentes.length, desc: '2 nuevos este mes', icon: <FaUsers />, color: 'from-blue-500 to-blue-600' },
    { title: 'Propiedades Gestionadas', value: agentes.reduce((sum, a) => sum + a.propiedades, 0), desc: 'Todas las zonas', icon: <FaHome />, color: 'from-green-500 to-green-600' },
    { title: 'Comisiones Totales', value: `$${(agentes.reduce((sum, a) => sum + a.comisiones, 0) / 1000).toFixed(0)}K`, desc: 'Este mes', icon: <FaDollarSign />, color: 'from-purple-500 to-purple-600' },
    { title: 'Rating Promedio', value: (agentes.reduce((sum, a) => sum + a.rating, 0) / agentes.length).toFixed(1), desc: 'Excelente equipo', icon: <FaStar />, color: 'from-orange-500 to-orange-600' },
  ];

  const isDark = currentMode === 'Dark';
  const cardBase = `rounded-2xl p-6 border transition-shadow ${isDark ? 'bg-secondary-dark-bg border-gray-700/50 hover:border-indigo-500/30' : 'bg-white border-gray-100 shadow-md hover:shadow-lg'}`;

  // Función para manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevoAgente(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Función para manejar el envío del formulario
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Nuevo agente:', nuevoAgente);
    toast.success('Agente guardado exitosamente!');
    setShowModal(false);
    // Resetear formulario
    setNuevoAgente({
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      telefonoAlternativo: '',
      rol: 'Agente',
      especialidad: 'Ventas',
      zonas: [],
      comision: '3',
      direccion: '',
      ciudad: 'Buenos Aires',
      provincia: 'Buenos Aires',
      fechaIngreso: '',
      licencia: '',
      experiencia: '',
      idiomas: [],
      notas: '',
    });
  };

  // Función para ver detalle de agente
  const verDetalle = (agente) => {
    setAgenteSeleccionado(agente);
    setVistaActual('detalle');
  };

  // Función para volver al dashboard
  const volverAlDashboard = () => {
    setVistaActual('dashboard');
    setAgenteSeleccionado(null);
  };

  // Zonas disponibles
  const zonasDisponibles = [
    'Palermo', 'Belgrano', 'Recoleta', 'Puerto Madero', 'Microcentro',
    'Villa Crespo', 'Colegiales', 'Caballito', 'Núñez', 'Almagro'
  ];

  // Idiomas disponibles
  const idiomasDisponibles = ['Español', 'Inglés', 'Portugués', 'Francés', 'Italiano', 'Alemán'];

  return (
    <div className={`min-h-screen px-6 lg:px-8 pt-4 pb-6 ${isDark ? 'bg-main-dark-bg' : 'bg-gray-50'}`}>
      <div className="mb-6">
        <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <FaUsers className="text-indigo-500" /> Gestión de Agentes
        </h2>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Equipo comercial y rendimiento</p>
      </div>
      
      {/* Botones de Acción */}
      <div className="flex flex-wrap gap-3 mb-6">
        {vistaActual !== 'dashboard' && (
          <button 
            onClick={volverAlDashboard}
            className="flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors"
          >
            <FaArrowLeft /> Volver
          </button>
        )}
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md"
        >
          <FaUserPlus /> Nuevo Agente
        </button>
        {vistaActual === 'dashboard' && (
          <button 
            onClick={() => setVistaActual('lista')}
            className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-md"
          >
            <FaThLarge /> Ver Todos los Agentes
          </button>
        )}
      </div>

      {/* Vista Dashboard */}
      {vistaActual === 'dashboard' && (
        <>
      {/* KPIs del Equipo - Clickeables */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
        {kpisEquipo.map((kpi, i) => (
          <div 
            key={i} 
            onClick={() => {
              if (i === 0) setShowModalTotalAgentes(true);
              else if (i === 1) setShowModalPropiedadesGestionadas(true);
              else if (i === 2) setShowModalComisionesTotales(true);
              else if (i === 3) setShowModalRatingPromedio(true);
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

      {/* Gráficos ApexCharts - Métricas del Equipo */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">
        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-1">
            <FaStar className="text-yellow-500" />
            <h3 className="font-semibold dark:text-gray-100 text-sm">Satisfacción</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Promedio del equipo</p>
          <Chart options={satisfaccionOptions} series={satisfaccionSeries} type="radialBar" height={160} />
          <div className="space-y-2 mt-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600 dark:text-gray-400">Promedio sector</span>
              <span className="font-bold text-gray-500">85%</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-600 dark:text-gray-400">Tu equipo</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <FaArrowUp className="text-xs" /> +6%
              </span>
            </div>
          </div>
        </div>

        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-1">
            <FaUsers className="text-blue-500" />
            <h3 className="font-semibold dark:text-gray-100 text-sm">Especialidades</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Distribución del equipo</p>
          <Chart options={especialidadDonutOptions} series={especialidadDonutSeries} type="donut" height={200} />
        </div>

        <div className={`${cardBase} xl:col-span-2`}>
          <div className="flex items-center gap-2 mb-1">
            <FaDollarSign className="text-emerald-500" />
            <h3 className="font-semibold dark:text-gray-100 text-sm">Comisiones por Agente</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Ranking de este mes</p>
          <Chart options={comisionesBarOptions} series={comisionesBarSeries} type="bar" height={180} />
        </div>
      </div>

      {/* Gráfico de Rendimiento Amplio */}
      <div className="mb-6">
        <div className={cardBase}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <FaChartLine className="text-purple-500" />
                <h3 className="font-semibold dark:text-gray-100">Rendimiento del Equipo</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Operaciones por agente - últimos 6 meses</p>
            </div>
          </div>
          <Chart options={rendimientoEquipoOptions} series={rendimientoEquipoSeries} type="area" height={240} />
          <div className="grid grid-cols-5 gap-3 mt-4 pt-4 border-t dark:border-gray-700">
            {agentes.map((a, i) => (
              <div key={a.id} className="text-center p-2 rounded-lg" style={{ backgroundColor: `${a.color}20` }}>
                <p className="text-sm font-bold" style={{ color: a.color }}>{a.ventas}</p>
                <p className="text-xs text-gray-500">{a.nombre.split(' ')[0]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gráfico de Rendimiento y Listado de Agentes */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Gráfico de Rendimiento por Agente */}
        <div className={cardBase}>
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">📈 Rendimiento por Agente (Últimos 6 meses)</h3>
          <ChartComponent
            id="rendimiento-chart"
            primaryXAxis={{ valueType: 'Category', title: 'Meses' }}
            primaryYAxis={{ title: 'Ventas' }}
            tooltip={{ enable: true }}
            legendSettings={{ visible: true }}
            height="350px"
          >
            <Inject services={[LineSeries, Category, Tooltip, Legend, DataLabel]} />
            <SeriesCollectionDirective>
              <SeriesDirective
                type="Line"
                dataSource={rendimientoData}
                xName="mes"
                yName="Ana"
                name="Ana"
                marker={{ visible: true }}
                fill="#FF6B6B"
              />
              <SeriesDirective
                type="Line"
                dataSource={rendimientoData}
                xName="mes"
                yName="Carlos"
                name="Carlos"
                marker={{ visible: true }}
                fill="#4ECDC4"
              />
              <SeriesDirective
                type="Line"
                dataSource={rendimientoData}
                xName="mes"
                yName="Laura"
                name="Laura"
                marker={{ visible: true }}
                fill="#45B7D1"
              />
              <SeriesDirective
                type="Line"
                dataSource={rendimientoData}
                xName="mes"
                yName="Marcos"
                name="Marcos"
                marker={{ visible: true }}
                fill="#96CEB4"
              />
              <SeriesDirective
                type="Line"
                dataSource={rendimientoData}
                xName="mes"
                yName="Sofia"
                name="Sofía"
                marker={{ visible: true }}
                fill="#FFEAA7"
              />
            </SeriesCollectionDirective>
          </ChartComponent>
        </div>

        {/* Listado de Agentes */}
        <div className={cardBase}>
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">👥 Equipo de Agentes</h3>
          <div className="space-y-4">
            {agentes.map((agente) => (
              <div key={agente.id} className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold"
                    style={{ backgroundColor: agente.color }}
                  >
                    {agente.nombre.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold dark:text-gray-200">{agente.nombre}</h4>
                      <div className="flex items-center gap-1">
                        <FaStar className="text-yellow-500 text-sm" />
                        <span className="text-sm font-bold dark:text-gray-200">{agente.rating}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{agente.rol}</p>
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div className="text-center">
                        <p className="font-bold text-blue-600 dark:text-blue-400">{agente.propiedades}</p>
                        <p className="text-gray-500">Propiedades</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-green-600 dark:text-green-400">{agente.ventas}</p>
                        <p className="text-gray-500">Ventas</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-purple-600 dark:text-purple-400">${(agente.comisiones/1000).toFixed(0)}K</p>
                        <p className="text-gray-500">Comisiones</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabla de Comisiones y Zonas Asignadas */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Tabla de Comisiones */}
        <div className={`xl:col-span-2 ${cardBase}`}>
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">💰 Comisiones y Asignaciones</h3>
          <GridComponent
            dataSource={agentes}
            allowPaging
            pageSettings={{ pageSize: 10 }}
            allowSorting
          >
            <GridInject services={[Page, Sort]} />
            <ColumnsDirective>
              <ColumnDirective field="nombre" headerText="Agente" width="150" />
              <ColumnDirective field="propiedades" headerText="Propiedades" textAlign="Center" width="100" />
              <ColumnDirective field="clientes" headerText="Clientes" textAlign="Center" width="100" />
              <ColumnDirective field="ventas" headerText="Ventas" textAlign="Center" width="80" />
              <ColumnDirective field="comisiones" headerText="Comisiones" textAlign="Right" width="120" format="C0" />
              <ColumnDirective field="zona" headerText="Zonas" width="200" />
            </ColumnsDirective>
          </GridComponent>
        </div>

        {/* Roles y Permisos */}
        <div className={cardBase}>
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">🛡️ Roles y Permisos</h3>
          <div className="space-y-4">
            <div className="border dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FaShieldAlt className="text-red-500" />
                <h4 className="font-bold dark:text-gray-200">Admin</h4>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Acceso completo al sistema</p>
              <div className="flex flex-wrap gap-1">
                {['Todas las propiedades', 'Todos los clientes', 'Reportes', 'Configuración'].map((perm, i) => (
                  <span key={i} className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs">
                    {perm}
                  </span>
                ))}
              </div>
            </div>

            <div className="border dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FaShieldAlt className="text-blue-500" />
                <h4 className="font-bold dark:text-gray-200">Supervisor</h4>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Gestión de equipo</p>
              <div className="flex flex-wrap gap-1">
                {['Ver equipo', 'Asignar propiedades', 'Reportes de equipo'].map((perm, i) => (
                  <span key={i} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs">
                    {perm}
                  </span>
                ))}
              </div>
            </div>

            <div className="border dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <FaShieldAlt className="text-green-500" />
                <h4 className="font-bold dark:text-gray-200">Agente</h4>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Acceso limitado</p>
              <div className="flex flex-wrap gap-1">
                {['Propiedades asignadas', 'Clientes asignados', 'Agenda personal'].map((perm, i) => (
                  <span key={i} className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs">
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mapa de Zonas */}
      <div className={cardBase}>
        <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">🗺️ Distribución por Zonas</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {agentes.map((agente) => (
            <div key={agente.id} className="text-center">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-2"
                style={{ backgroundColor: agente.color }}
              >
                {agente.nombre.charAt(0)}
              </div>
              <h4 className="font-bold text-sm dark:text-gray-200">{agente.nombre.split(' ')[0]}</h4>
              <div className="flex flex-wrap justify-center gap-1 mt-2">
                {agente.zona.split(', ').map((zona, i) => (
                  <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs">
                    <FaMapMarkerAlt className="inline mr-1" />{zona}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
        </>
      )}

      {/* Vista Lista de Agentes */}
      {vistaActual === 'lista' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agentes.map((agente) => (
            <div key={agente.id} className={`${cardBase} hover:shadow-xl cursor-pointer`} onClick={() => verDetalle(agente)}>
              {/* Header con avatar y rating */}
              <div className="flex items-center gap-4 mb-4 pb-4 border-b dark:border-gray-700">
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                  style={{ backgroundColor: agente.color }}
                >
                  {agente.nombre.charAt(0)}{agente.nombre.split(' ')[1]?.charAt(0) || ''}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold dark:text-gray-100 truncate">{agente.nombre}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{agente.rol}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <FaStar key={i} className={`text-sm ${i < Math.floor(agente.rating) ? 'text-yellow-500' : 'text-gray-300'}`} />
                    ))}
                    <span className="text-sm font-bold ml-1" style={{ color: currentColor }}>{agente.rating}</span>
                  </div>
                </div>
              </div>

              {/* Información de contacto */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <FaEnvelope className="text-blue-500" />
                  <span className="dark:text-gray-300 truncate">{agente.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FaPhone className="text-green-500" />
                  <span className="dark:text-gray-300">{agente.telefono}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FaMapMarkerAlt className="text-red-500" />
                  <span className="dark:text-gray-300 truncate">{agente.zona}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FaBriefcase className="text-purple-500" />
                  <span className="dark:text-gray-300">{agente.especialidad}</span>
                </div>
              </div>

              {/* Estadísticas */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t dark:border-gray-700">
                <div className="text-center">
                  <FaHome className="text-blue-500 mx-auto mb-1 text-sm" />
                  <p className="text-xs font-semibold dark:text-gray-200">{agente.propiedades}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Propiedades</p>
                </div>
                <div className="text-center">
                  <FaTrophy className="text-green-500 mx-auto mb-1 text-sm" />
                  <p className="text-xs font-semibold dark:text-gray-200">{agente.ventas}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Ventas</p>
                </div>
                <div className="text-center">
                  <FaDollarSign className="text-purple-500 mx-auto mb-1 text-sm" />
                  <p className="text-xs font-semibold dark:text-gray-200">${(agente.comisiones/1000).toFixed(0)}K</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Comisiones</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Vista Detalle de Agente */}
      {vistaActual === 'detalle' && agenteSeleccionado && (
        <div className="space-y-6">
          {/* Header con información principal */}
          <div className="relative rounded-2xl p-8 text-white" style={{ background: `linear-gradient(135deg, ${agenteSeleccionado.color} 0%, ${agenteSeleccionado.color}dd 100%)` }}>
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div className="flex items-center gap-6">
                <div className="w-28 h-28 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-5xl font-bold">
                  {agenteSeleccionado.nombre.charAt(0)}{agenteSeleccionado.nombre.split(' ')[1]?.charAt(0) || ''}
                </div>
                <div>
                  <h1 className="text-4xl font-bold mb-2">{agenteSeleccionado.nombre}</h1>
                  <div className="flex items-center gap-4 text-sm mb-2 flex-wrap">
                    <span className="flex items-center gap-2">
                      <FaShieldAlt /> {agenteSeleccionado.rol}
                    </span>
                    <span className="flex items-center gap-2">
                      <FaBriefcase /> {agenteSeleccionado.especialidad}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {[...Array(5)].map((_, i) => (
                      <FaStar key={i} className={`text-lg ${i < Math.floor(agenteSeleccionado.rating) ? 'text-yellow-300' : 'text-white text-opacity-30'}`} />
                    ))}
                    <span className="text-xl font-bold ml-2">{agenteSeleccionado.rating}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-white text-gray-800 rounded-full hover:bg-opacity-90 transition-colors flex items-center gap-2 font-semibold">
                  <FaEdit /> Editar
                </button>
                <button className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center gap-2 font-semibold">
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
                      <p className="font-semibold dark:text-gray-200">{agenteSeleccionado.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-gray-800 rounded-lg">
                    <FaPhone className="text-2xl text-green-500" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Teléfono Principal</p>
                      <p className="font-semibold dark:text-gray-200">{agenteSeleccionado.telefono}</p>
                    </div>
                  </div>
                  {agenteSeleccionado.telefonoAlternativo && (
                    <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-gray-800 rounded-lg">
                      <FaPhone className="text-2xl text-green-500" />
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Teléfono Alternativo</p>
                        <p className="font-semibold dark:text-gray-200">{agenteSeleccionado.telefonoAlternativo}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-gray-800 rounded-lg">
                    <FaMapMarkerAlt className="text-2xl text-purple-500" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Ubicación</p>
                      <p className="font-semibold dark:text-gray-200">{agenteSeleccionado.ciudad}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rendimiento y Estadísticas */}
              <div className={cardBase}>
                <h3 className="text-xl font-bold mb-4 dark:text-gray-100 flex items-center gap-2">
                  <FaChartLine className="text-green-500" /> Rendimiento
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-gray-800 rounded-lg">
                    <FaHome className="text-3xl text-blue-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Propiedades</p>
                    <p className="text-2xl font-bold dark:text-gray-100">{agenteSeleccionado.propiedades}</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-gray-800 rounded-lg">
                    <FaUsers className="text-3xl text-green-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Clientes</p>
                    <p className="text-2xl font-bold dark:text-gray-100">{agenteSeleccionado.clientes}</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-gray-800 rounded-lg">
                    <FaTrophy className="text-3xl text-purple-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Ventas</p>
                    <p className="text-2xl font-bold dark:text-gray-100">{agenteSeleccionado.ventas}</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 dark:bg-gray-800 rounded-lg">
                    <FaDollarSign className="text-3xl text-orange-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">Comisiones</p>
                    <p className="text-2xl font-bold dark:text-gray-100">${(agenteSeleccionado.comisiones/1000).toFixed(1)}K</p>
                  </div>
                </div>

                {/* Barra de progreso de meta */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium dark:text-gray-200">Meta Mensual</span>
                    <span className="text-sm font-bold" style={{ color: currentColor }}>
                      {agenteSeleccionado.ventas}/{agenteSeleccionado.metaMensual}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className="h-3 rounded-full bg-gradient-to-r from-green-400 to-green-600"
                      style={{ width: `${(agenteSeleccionado.ventas / agenteSeleccionado.metaMensual) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Zonas Asignadas */}
              <div className={cardBase}>
                <h3 className="text-xl font-bold mb-4 dark:text-gray-100 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-red-500" /> Zonas Asignadas
                </h3>
                <div className="flex flex-wrap gap-2">
                  {agenteSeleccionado.zona.split(', ').map((zona, idx) => (
                    <span key={idx} className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg font-medium">
                      <FaMapMarkerAlt className="inline mr-2" />{zona}
                    </span>
                  ))}
                </div>
              </div>

              {/* Notas */}
              {agenteSeleccionado.notas && (
                <div className={cardBase}>
                  <h3 className="text-xl font-bold mb-4 dark:text-gray-100">📝 Notas</h3>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{agenteSeleccionado.notas}</p>
                </div>
              )}
            </div>

            {/* Columna Lateral */}
            <div className="space-y-6">
              {/* Información Profesional */}
              <div className={cardBase}>
                <h3 className="text-lg font-bold mb-4 dark:text-gray-100 flex items-center gap-2">
                  <FaBriefcase className="text-purple-500" /> Información Profesional
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Licencia</p>
                    <p className="font-semibold dark:text-gray-200">{agenteSeleccionado.licencia}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Experiencia</p>
                    <p className="font-semibold dark:text-gray-200">{agenteSeleccionado.experiencia}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Fecha de Ingreso</p>
                    <p className="font-semibold dark:text-gray-200">{agenteSeleccionado.fechaIngreso}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Idiomas</p>
                    <div className="flex flex-wrap gap-2">
                      {agenteSeleccionado.idiomas.map((idioma, idx) => (
                        <span key={idx} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded text-xs">
                          {idioma}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Métricas Adicionales */}
              <div className={cardBase}>
                <h3 className="text-lg font-bold mb-4 dark:text-gray-100">📊 Métricas</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FaCalendar className="text-blue-500" />
                      <span className="text-sm dark:text-gray-200">Citas</span>
                    </div>
                    <span className="font-bold dark:text-gray-100">{agenteSeleccionado.citas}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FaTrophy className="text-green-500" />
                      <span className="text-sm dark:text-gray-200">Propiedades Vendidas</span>
                    </div>
                    <span className="font-bold dark:text-gray-100">{agenteSeleccionado.propiedadesVendidas}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FaStar className="text-purple-500" />
                      <span className="text-sm dark:text-gray-200">Satisfacción</span>
                    </div>
                    <span className="font-bold dark:text-gray-100">{agenteSeleccionado.satisfaccionCliente}%</span>
                  </div>
                </div>
              </div>

              {/* Ubicación */}
              <div className={cardBase}>
                <h3 className="text-lg font-bold mb-4 dark:text-gray-100 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-red-500" /> Ubicación
                </h3>
                <div className="space-y-2">
                  <p className="text-sm dark:text-gray-300">{agenteSeleccionado.direccion}</p>
                  <p className="text-sm dark:text-gray-300">{agenteSeleccionado.ciudad}, {agenteSeleccionado.provincia}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nuevo Agente */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            {/* Header del Modal */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaUserPlus /> Nuevo Agente
                </h2>
                <p className="text-blue-100 text-sm mt-1">Complete los datos del agente</p>
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
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Nombre *</label>
                    <input
                      type="text"
                      name="nombre"
                      value={nuevoAgente.nombre}
                      onChange={handleInputChange}
                      required
                      placeholder="Juan"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Apellido *</label>
                    <input
                      type="text"
                      name="apellido"
                      value={nuevoAgente.apellido}
                      onChange={handleInputChange}
                      required
                      placeholder="Pérez"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={nuevoAgente.email}
                      onChange={handleInputChange}
                      required
                      placeholder="juan@inmobiliaria.com"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Teléfono *</label>
                    <input
                      type="tel"
                      name="telefono"
                      value={nuevoAgente.telefono}
                      onChange={handleInputChange}
                      required
                      placeholder="+54 11 1234-5678"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Teléfono Alternativo</label>
                    <input
                      type="tel"
                      name="telefonoAlternativo"
                      value={nuevoAgente.telefonoAlternativo}
                      onChange={handleInputChange}
                      placeholder="+54 11 8765-4321"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Dirección</label>
                    <input
                      type="text"
                      name="direccion"
                      value={nuevoAgente.direccion}
                      onChange={handleInputChange}
                      placeholder="Av. Corrientes 1234"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Información Profesional */}
              <div>
                <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 flex items-center gap-2">
                  <FaBriefcase className="text-purple-500" /> Información Profesional
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Rol *</label>
                    <select
                      name="rol"
                      value={nuevoAgente.rol}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    >
                      <option value="Agente">Agente</option>
                      <option value="Agente Senior">Agente Senior</option>
                      <option value="Supervisor">Supervisor</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Especialidad *</label>
                    <select
                      name="especialidad"
                      value={nuevoAgente.especialidad}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    >
                      <option value="Ventas">Ventas</option>
                      <option value="Alquileres">Alquileres</option>
                      <option value="Comercial">Comercial</option>
                      <option value="Tasaciones">Tasaciones</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Licencia</label>
                    <input
                      type="text"
                      name="licencia"
                      value={nuevoAgente.licencia}
                      onChange={handleInputChange}
                      placeholder="CPI-12345"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Experiencia</label>
                    <input
                      type="text"
                      name="experiencia"
                      value={nuevoAgente.experiencia}
                      onChange={handleInputChange}
                      placeholder="5 años"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Fecha de Ingreso</label>
                    <input
                      type="date"
                      name="fechaIngreso"
                      value={nuevoAgente.fechaIngreso}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Comisión (%)</label>
                    <input
                      type="number"
                      name="comision"
                      value={nuevoAgente.comision}
                      onChange={handleInputChange}
                      placeholder="3"
                      min="0"
                      max="100"
                      step="0.5"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>

              {/* Notas */}
              <div>
                <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">📝 Notas Adicionales</h3>
                <textarea
                  name="notas"
                  value={nuevoAgente.notas}
                  onChange={handleInputChange}
                  rows="4"
                  placeholder="Observaciones, especialidades, preferencias..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 justify-end pt-4 border-t dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2"
                >
                  <FaSave /> Guardar Agente
                </button>
              </div>              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Total Agentes */}
      {showModalTotalAgentes && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaUsers /> Total Agentes
                </h2>
                <p className="text-blue-100 text-sm mt-1">{agentes.length} agentes en el equipo</p>
              </div>
              <button onClick={() => setShowModalTotalAgentes(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {agentes.map((agente) => (
                  <div key={agente.id} className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 border ${currentMode === 'Dark' ? 'border-gray-700' : 'border-gray-200'} hover:shadow-lg transition-shadow`}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                        {agente.nombre.split(' ').map(n => n.charAt(0)).join('').substring(0, 2)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg dark:text-gray-100">{agente.nombre}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{agente.email}</p>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <FaStar key={i} className={i < agente.rating ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'} />
                          ))}
                          <span className="text-sm font-bold ml-1 dark:text-gray-200">{agente.rating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Propiedades:</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400">{agente.propiedades}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Comisiones:</span>
                        <span className="font-bold text-green-600 dark:text-green-400">${agente.comisiones.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Especialidad:</span>
                        <span className="font-medium dark:text-gray-200">{agente.especialidad}</span>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t dark:border-gray-700">
                        <p>{agente.telefono}</p>
                        <p>Zona: {agente.zona}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Propiedades Gestionadas */}
      {showModalPropiedadesGestionadas && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className="sticky top-0 bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaHome /> Propiedades Gestionadas
                </h2>
                <p className="text-green-100 text-sm mt-1">
                  {agentes.reduce((sum, a) => sum + a.propiedades, 0)} propiedades en total
                </p>
              </div>
              <button onClick={() => setShowModalPropiedadesGestionadas(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {agentes.sort((a, b) => b.propiedades - a.propiedades).map((agente, index) => (
                  <div key={agente.id} className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 border ${currentMode === 'Dark' ? 'border-gray-700' : 'border-gray-200'} hover:shadow-md transition-shadow`}>
                    <div className="flex items-center gap-4">
                      <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                        index === 0 ? 'bg-yellow-400 text-yellow-900' :
                        index === 1 ? 'bg-gray-300 text-gray-700' :
                        index === 2 ? 'bg-orange-400 text-orange-900' :
                        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                      }`}>
                        #{index + 1}
                      </div>
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-xl">
                        {agente.nombre.split(' ').map(n => n.charAt(0)).join('').substring(0, 2)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg dark:text-gray-100">{agente.nombre}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{agente.especialidad} • {agente.zona}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <FaStar key={i} className={`text-xs ${i < agente.rating ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'}`} />
                            ))}
                            <span className="text-xs ml-1 dark:text-gray-400">{agente.rating}</span>
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{agente.email}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <FaHome className="text-4xl text-green-500 mx-auto mb-1" />
                        <p className="text-3xl font-bold text-green-600 dark:text-green-400">{agente.propiedades}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">propiedades</p>
                        <div className="mt-2 w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${(agente.propiedades / Math.max(...agentes.map(a => a.propiedades))) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className={`mt-6 p-4 ${currentMode === 'Dark' ? 'bg-green-900/20' : 'bg-green-50'} rounded-lg border-2 border-green-500`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Propiedades</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {agentes.reduce((sum, a) => sum + a.propiedades, 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Promedio por Agente</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {Math.round(agentes.reduce((sum, a) => sum + a.propiedades, 0) / agentes.length)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Agente Top</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {Math.max(...agentes.map(a => a.propiedades))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Comisiones Totales */}
      {showModalComisionesTotales && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaDollarSign /> Comisiones Totales
                </h2>
                <p className="text-purple-100 text-sm mt-1">
                  ${agentes.reduce((sum, a) => sum + a.comisiones, 0).toLocaleString()} este mes
                </p>
              </div>
              <button onClick={() => setShowModalComisionesTotales(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {agentes.sort((a, b) => b.comisiones - a.comisiones).map((agente, index) => (
                  <div key={agente.id} className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 border ${currentMode === 'Dark' ? 'border-gray-700' : 'border-gray-200'} hover:shadow-md transition-shadow`}>
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
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                          {agente.nombre.split(' ').map(n => n.charAt(0)).join('').substring(0, 2)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg dark:text-gray-100">{agente.nombre}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{agente.especialidad}</p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-600 dark:text-gray-400">
                            <span>{agente.propiedades} propiedades</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <FaStar className="text-yellow-500" /> {agente.rating}
                            </span>
                            <span>•</span>
                            <span>{agente.zona}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">${agente.comisiones.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          ${Math.round(agente.comisiones / agente.propiedades).toLocaleString()} por propiedad
                        </p>
                        <div className="mt-2 w-40 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ width: `${(agente.comisiones / Math.max(...agentes.map(a => a.comisiones))) * 100}%` }}
                          />
                        </div>
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
                      ${agentes.reduce((sum, a) => sum + a.comisiones, 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Promedio por Agente</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      ${Math.round(agentes.reduce((sum, a) => sum + a.comisiones, 0) / agentes.length).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Top Performer</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      ${Math.max(...agentes.map(a => a.comisiones)).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Comisión/Propiedad</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      ${Math.round(agentes.reduce((sum, a) => sum + a.comisiones, 0) / agentes.reduce((sum, a) => sum + a.propiedades, 0)).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rating Promedio */}
      {showModalRatingPromedio && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaStar /> Rating Promedio del Equipo
                </h2>
                <p className="text-orange-100 text-sm mt-1">
                  {(agentes.reduce((sum, a) => sum + a.rating, 0) / agentes.length).toFixed(1)} ⭐ promedio
                </p>
              </div>
              <button onClick={() => setShowModalRatingPromedio(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {agentes.sort((a, b) => b.rating - a.rating).map((agente, index) => (
                  <div key={agente.id} className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 border ${currentMode === 'Dark' ? 'border-gray-700' : 'border-gray-200'} hover:shadow-md transition-shadow`}>
                    <div className="flex items-center gap-4">
                      <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl ${
                        agente.rating === 5 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' :
                        agente.rating >= 4.5 ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' :
                        'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                      }`}>
                        {agente.rating}
                      </div>
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-xl">
                        {agente.nombre.split(' ').map(n => n.charAt(0)).join('').substring(0, 2)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg dark:text-gray-100">{agente.nombre}</h3>
                          {agente.rating === 5 && <FaTrophy className="text-yellow-500" />}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{agente.especialidad} • {agente.zona}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <FaStar key={i} className={i < Math.floor(agente.rating) ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'} />
                            ))}
                          </div>
                          <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{agente.rating} / 5.0</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="grid grid-cols-2 gap-3 text-center">
                          <div>
                            <FaHome className="text-2xl text-blue-500 mx-auto mb-1" />
                            <p className="text-lg font-bold dark:text-gray-200">{agente.propiedades}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">props</p>
                          </div>
                          <div>
                            <FaDollarSign className="text-2xl text-green-500 mx-auto mb-1" />
                            <p className="text-lg font-bold dark:text-gray-200">${(agente.comisiones / 1000).toFixed(0)}K</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">comis</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className={`mt-6 p-4 ${currentMode === 'Dark' ? 'bg-orange-900/20' : 'bg-orange-50'} rounded-lg border-2 border-orange-500`}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Rating Promedio</p>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                      {(agentes.reduce((sum, a) => sum + a.rating, 0) / agentes.length).toFixed(1)} ⭐
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Agentes 5 Estrellas</p>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                      {agentes.filter(a => a.rating === 5).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Rating Más Alto</p>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                      {Math.max(...agentes.map(a => a.rating))} ⭐
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Agentes +4.5</p>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                      {agentes.filter(a => a.rating >= 4.5).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agentes;
