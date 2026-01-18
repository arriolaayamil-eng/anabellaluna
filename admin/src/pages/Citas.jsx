import React, { useState } from 'react';
import { ScheduleComponent, Day, Week, WorkWeek, Month, Agenda, Inject } from '@syncfusion/ej2-react-schedule';
import { FaCalendarPlus, FaSync, FaClock, FaUsers, FaMapMarkerAlt, FaPhoneAlt, FaBell, FaCheckCircle, FaTimes, FaSave, FaList, FaGripVertical, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import { Header } from '../components';
import { useStateContext } from '../contexts/ContextProvider';

// Syncfusion Components
import { GridComponent, ColumnsDirective, ColumnDirective, Page, Sort, Filter, Inject as GridInject } from '@syncfusion/ej2-react-grids';
import { AccumulationChartComponent, AccumulationSeriesCollectionDirective, AccumulationSeriesDirective, Inject as AccInject, AccumulationLegend, PieSeries, AccumulationTooltip, AccumulationDataLabel } from '@syncfusion/ej2-react-charts';
import { ChartComponent, SeriesCollectionDirective, SeriesDirective, Inject as ChartInject, Legend, Category, Tooltip, ColumnSeries, DataLabel } from '@syncfusion/ej2-react-charts';

const Citas = () => {
  const { currentMode, currentColor } = useStateContext();
  
  // Estados para modales
  const [showModalCita, setShowModalCita] = useState(false);
  const [showModalRecordatorios, setShowModalRecordatorios] = useState(false);
  const [showModalKanban, setShowModalKanban] = useState(false);
  
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
    propiedad: '',
    agente: '',
    fecha: '',
    horaInicio: '',
    horaFin: '',
    ubicacion: '',
    descripcion: '',
    recordatorio: '24h',
  });
  
  // Estado para recordatorios
  const [recordatorios, setRecordatorios] = useState([
    { id: 1, tipo: 'Email + SMS', tiempo: '24h', activo: true },
    { id: 2, tipo: 'WhatsApp', tiempo: '2h', activo: true },
    { id: 3, tipo: 'Ubicación', tiempo: 'Al confirmar', activo: true },
  ]);
  
  // Estado para Kanban (Todo List)
  const [columnas, setColumnas] = useState([
    { id: 'pendiente', nombre: 'Pendiente', color: '#F59E0B' },
    { id: 'enProgreso', nombre: 'En Progreso', color: '#3B82F6' },
    { id: 'completado', nombre: 'Completado', color: '#10B981' },
  ]);
  
  const [tareas, setTareas] = useState({
    pendiente: [
      { id: 1, titulo: 'Preparar documentación Depto Palermo', prioridad: 'Alta', fecha: '2025-10-11' },
      { id: 2, titulo: 'Llamar a cliente Juan Pérez', prioridad: 'Media', fecha: '2025-10-11' },
    ],
    enProgreso: [
      { id: 3, titulo: 'Coordinar visita Casa Belgrano', prioridad: 'Alta', fecha: '2025-10-12' },
      { id: 4, titulo: 'Revisar contrato alquiler', prioridad: 'Baja', fecha: '2025-10-13' },
    ],
    completado: [
      { id: 5, titulo: 'Enviar propuestas a cliente', prioridad: 'Media', fecha: '2025-10-10' },
    ],
  });
  
  const [nuevaTarea, setNuevaTarea] = useState({
    titulo: '',
    prioridad: 'Media',
    fecha: '',
    columna: 'pendiente',
  });
  
  const [nuevaColumna, setNuevaColumna] = useState({
    nombre: '',
    color: '#8B5CF6',
  });
  
  const [draggedTask, setDraggedTask] = useState(null);

  // Datos de ejemplo para el calendario
  const citasData = [
    {
      Id: 1,
      Subject: 'Visita - Depto Palermo',
      StartTime: new Date(2025, 9, 10, 10, 0),
      EndTime: new Date(2025, 9, 10, 11, 0),
      Description: 'Cliente: Juan Pérez - Propiedad: Depto 2amb Palermo',
      IsAllDay: false,
      tipo: 'Visita',
      cliente: 'Juan Pérez',
      agente: 'Ana López',
      estado: 'Confirmada'
    },
    {
      Id: 2,
      Subject: 'Reunión con Propietario',
      StartTime: new Date(2025, 9, 10, 14, 0),
      EndTime: new Date(2025, 9, 10, 15, 0),
      Description: 'Tasación de propiedad en Recoleta',
      IsAllDay: false,
      tipo: 'Reunión',
      cliente: 'María González',
      agente: 'Carlos Ruiz',
      estado: 'Pendiente'
    },
    {
      Id: 3,
      Subject: 'Firma de Contrato',
      StartTime: new Date(2025, 9, 11, 16, 0),
      EndTime: new Date(2025, 9, 11, 17, 30),
      Description: 'Cliente: María González - Venta Casa Belgrano',
      IsAllDay: false,
      tipo: 'Firma',
      cliente: 'María González',
      agente: 'Laura Fernández',
      estado: 'Confirmada'
    },
    {
      Id: 4,
      Subject: 'Llamada Seguimiento',
      StartTime: new Date(2025, 9, 12, 9, 0),
      EndTime: new Date(2025, 9, 12, 9, 30),
      Description: 'Seguimiento post-visita',
      IsAllDay: false,
      tipo: 'Llamada',
      cliente: 'Carlos Rodríguez',
      agente: 'Sofía Torres',
      estado: 'Programada'
    },
  ];

  // KPIs de Citas
  const kpisCitas = [
    { title: 'Citas Hoy', value: citasData.filter(c => c.StartTime.toDateString() === new Date().toDateString()).length, desc: '2 confirmadas', icon: <FaClock />, color: 'from-blue-500 to-blue-600' },
    { title: 'Esta Semana', value: citasData.length, desc: '3 visitas programadas', icon: <FaCalendarPlus />, color: 'from-green-500 to-green-600' },
    { title: 'Tasa Asistencia', value: '85%', desc: 'Últimos 30 días', icon: <FaCheckCircle />, color: 'from-purple-500 to-purple-600' },
    { title: 'Recordatorios', value: '12', desc: 'Enviados automáticamente', icon: <FaBell />, color: 'from-orange-500 to-orange-600' },
  ];

  // Datos para gráficos
  const tiposCitasData = [
    { tipo: 'Visita', cantidad: citasData.filter(c => c.tipo === 'Visita').length, fill: '#3B82F6' },
    { tipo: 'Reunión', cantidad: citasData.filter(c => c.tipo === 'Reunión').length, fill: '#10B981' },
    { tipo: 'Firma', cantidad: citasData.filter(c => c.tipo === 'Firma').length, fill: '#F59E0B' },
    { tipo: 'Llamada', cantidad: citasData.filter(c => c.tipo === 'Llamada').length, fill: '#8B5CF6' },
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

  const cardBase = 'rounded-xl shadow-md p-6 bg-white dark:bg-secondary-dark-bg transition transform hover:scale-105';

  // Funciones de manejo para Cita
  const handleCitaChange = (e) => {
    const { name, value } = e.target;
    setNuevaCita(prev => ({ ...prev, [name]: value }));
  };

  const handleCitaSubmit = (e) => {
    e.preventDefault();
    console.log('Nueva cita:', nuevaCita);
    alert('¡Cita agendada exitosamente!');
    setShowModalCita(false);
    setNuevaCita({
      tipo: 'Visita',
      titulo: '',
      cliente: '',
      propiedad: '',
      agente: '',
      fecha: '',
      horaInicio: '',
      horaFin: '',
      ubicacion: '',
      descripcion: '',
      recordatorio: '24h',
    });
  };

  // Funciones para Recordatorios
  const toggleRecordatorio = (id) => {
    setRecordatorios(prev => prev.map(r => 
      r.id === id ? { ...r, activo: !r.activo } : r
    ));
  };

  // Funciones para Kanban
  const handleTareaChange = (e) => {
    const { name, value } = e.target;
    setNuevaTarea(prev => ({ ...prev, [name]: value }));
  };

  const agregarTarea = (e) => {
    e.preventDefault();
    const tarea = {
      id: Date.now(),
      titulo: nuevaTarea.titulo,
      prioridad: nuevaTarea.prioridad,
      fecha: nuevaTarea.fecha,
    };
    
    setTareas(prev => ({
      ...prev,
      [nuevaTarea.columna]: [...(prev[nuevaTarea.columna] || []), tarea]
    }));
    
    setNuevaTarea({
      titulo: '',
      prioridad: 'Media',
      fecha: '',
      columna: columnas[0]?.id || 'pendiente',
    });
  };

  const eliminarTarea = (columna, id) => {
    setTareas(prev => ({
      ...prev,
      [columna]: prev[columna].filter(t => t.id !== id)
    }));
  };

  // Funciones Drag and Drop
  const handleDragStart = (e, tarea, columnaId) => {
    setDraggedTask({ tarea, columnaOrigen: columnaId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, columnaDestino) => {
    e.preventDefault();
    if (!draggedTask) return;

    const { tarea, columnaOrigen } = draggedTask;
    
    if (columnaOrigen !== columnaDestino) {
      setTareas(prev => ({
        ...prev,
        [columnaOrigen]: prev[columnaOrigen].filter(t => t.id !== tarea.id),
        [columnaDestino]: [...(prev[columnaDestino] || []), tarea]
      }));
    }
    
    setDraggedTask(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  // Funciones para gestión de columnas
  const agregarColumna = (e) => {
    e.preventDefault();
    const nuevaCol = {
      id: `col_${Date.now()}`,
      nombre: nuevaColumna.nombre,
      color: nuevaColumna.color,
    };
    
    setColumnas(prev => [...prev, nuevaCol]);
    setTareas(prev => ({ ...prev, [nuevaCol.id]: [] }));
    setNuevaColumna({ nombre: '', color: '#8B5CF6' });
  };

  const eliminarColumna = (columnaId) => {
    if (columnas.length <= 1) {
      alert('Debe haber al menos una columna');
      return;
    }
    
    const tareasEnColumna = tareas[columnaId]?.length || 0;
    if (tareasEnColumna > 0) {
      if (!window.confirm(`Esta columna tiene ${tareasEnColumna} tarea(s). ¿Desea eliminarla de todas formas?`)) {
        return;
      }
    }
    
    setColumnas(prev => prev.filter(col => col.id !== columnaId));
    const newTareas = { ...tareas };
    delete newTareas[columnaId];
    setTareas(newTareas);
  };

  return (
    <div className="m-2 md:m-10 mt-24 p-2 md:p-10 bg-main-bg dark:bg-main-dark-bg rounded-3xl">
      <Header category="Agenda" title="📅 Agenda y Citas" />
      
      {/* Botones de Acción */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button 
          onClick={() => setShowModalCita(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md"
        >
          <FaCalendarPlus /> Nueva Cita
        </button>
        <button 
          onClick={() => setShowModalRecordatorios(true)}
          className="flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors shadow-md"
        >
          <FaBell /> Recordatorios
        </button>
        <button 
          onClick={() => setShowModalKanban(true)}
          className="flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors shadow-md"
        >
          <FaList /> Todo List (Kanban)
        </button>
      </div>

      {/* KPIs de Citas - Clickeables */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
        {kpisCitas.map((kpi, i) => (
          <div 
            key={i} 
            onClick={() => {
              if (i === 0) setShowModalCitasHoy(true);
              else if (i === 1) setShowModalEstaSemana(true);
              else if (i === 2) setShowModalTasaAsistencia(true);
              else if (i === 3) setShowModalPendientes(true);
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

      {/* Calendario y Gráficos */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* Calendario Principal */}
        <div className={`xl:col-span-2 ${cardBase}`}>
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">📅 Calendario Completo</h3>
          <ScheduleComponent
            height="650px"
            eventSettings={{ dataSource: citasData }}
            selectedDate={new Date(2025, 9, 10)}
            startHour="09:00"
            endHour="21:00"
            firstDayOfWeek={1}
            workDays={[0, 1, 2, 3, 4, 5, 6]}
            cssClass={currentMode === 'Dark' ? 'e-schedule-dark' : 'e-schedule-light'}
          >
            <Inject services={[Day, Week, WorkWeek, Month, Agenda]} />
          </ScheduleComponent>
        </div>

        {/* Panel de Análisis */}
        <div className="space-y-6">
          {/* Gráfico de Tipos de Citas */}
          <div className={cardBase}>
            <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">📊 Tipos de Citas</h3>
            <AccumulationChartComponent
              id="tipos-citas-chart"
              tooltip={{ enable: true }}
              legendSettings={{ visible: true }}
              height="250px"
            >
              <AccInject services={[PieSeries, AccumulationLegend, AccumulationDataLabel, AccumulationTooltip]} />
              <AccumulationSeriesCollectionDirective>
                <AccumulationSeriesDirective
                  type="Pie"
                  dataSource={tiposCitasData}
                  xName="tipo"
                  yName="cantidad"
                  name="Citas"
                  dataLabel={{ visible: true, name: 'tipo', position: 'Outside' }}
                />
              </AccumulationSeriesCollectionDirective>
            </AccumulationChartComponent>
          </div>

          {/* Citas por Día */}
          <div className={cardBase}>
            <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">📈 Citas por Día</h3>
            <ChartComponent
              id="citas-dia-chart"
              primaryXAxis={{ valueType: 'Category' }}
              primaryYAxis={{ title: 'Cantidad' }}
              tooltip={{ enable: true }}
              legendSettings={{ visible: false }}
              height="200px"
            >
              <ChartInject services={[ColumnSeries, Category, Tooltip]} />
              <SeriesCollectionDirective>
                <SeriesDirective
                  type="Column"
                  dataSource={citasPorDia}
                  xName="dia"
                  yName="cantidad"
                  name="Citas"
                  fill={currentColor || '#3B82F6'}
                />
              </SeriesCollectionDirective>
            </ChartComponent>
          </div>
        </div>
      </div>

      {/* Grid de Próximas Citas y Panel de Recordatorios */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Grid de Próximas Citas */}
        <div className={cardBase}>
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">🕒 Próximas Citas</h3>
          <GridComponent
            dataSource={citasData}
            allowPaging
            pageSettings={{ pageSize: 5 }}
            allowSorting
          >
            <GridInject services={[Page, Sort]} />
            <ColumnsDirective>
              <ColumnDirective field="Subject" headerText="Cita" width="200" />
              <ColumnDirective field="tipo" headerText="Tipo" width="100" />
              <ColumnDirective field="cliente" headerText="Cliente" width="150" />
              <ColumnDirective field="agente" headerText="Agente" width="130" />
              <ColumnDirective field="estado" headerText="Estado" width="100" />
            </ColumnsDirective>
          </GridComponent>
        </div>

        {/* Panel de Recordatorios */}
        <div className={cardBase}>
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">🔔 Recordatorios Automáticos</h3>
          <div className="space-y-4">
            <div className="border dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <FaBell className="text-blue-500" />
                <h4 className="font-bold dark:text-gray-200">24h Antes</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Email + SMS automático</p>
              <p className="text-xs text-green-600 mt-1">✅ Activo</p>
            </div>

            <div className="border dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <FaPhoneAlt className="text-green-500" />
                <h4 className="font-bold dark:text-gray-200">2h Antes</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">WhatsApp recordatorio</p>
              <p className="text-xs text-green-600 mt-1">✅ Activo</p>
            </div>

            <div className="border dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <FaMapMarkerAlt className="text-purple-500" />
                <h4 className="font-bold dark:text-gray-200">Ubicación</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Compartir ubicación automática</p>
              <p className="text-xs text-green-600 mt-1">✅ Activo</p>
            </div>
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
              <button onClick={() => setShowModalCita(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
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
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Título *</label>
                    <input type="text" name="titulo" value={nuevaCita.titulo} onChange={handleCitaChange} required placeholder="Ej: Visita Depto Palermo" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Cliente *</label>
                    <input type="text" name="cliente" value={nuevaCita.cliente} onChange={handleCitaChange} required placeholder="Juan Pérez" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Propiedad</label>
                    <input type="text" name="propiedad" value={nuevaCita.propiedad} onChange={handleCitaChange} placeholder="Depto 2amb Palermo" className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Agente *</label>
                    <select name="agente" value={nuevaCita.agente} onChange={handleCitaChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100">
                      <option value="">Seleccionar agente</option>
                      <option value="Ana López">Ana López</option>
                      <option value="Carlos Ruiz">Carlos Ruiz</option>
                      <option value="Laura Fernández">Laura Fernández</option>
                      <option value="Sofía Torres">Sofía Torres</option>
                      <option value="Marcos Silva">Marcos Silva</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Fecha *</label>
                    <input type="date" name="fecha" value={nuevaCita.fecha} onChange={handleCitaChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Hora Inicio *</label>
                    <input type="time" name="horaInicio" value={nuevaCita.horaInicio} onChange={handleCitaChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Hora Fin *</label>
                    <input type="time" name="horaFin" value={nuevaCita.horaFin} onChange={handleCitaChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100" />
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
              </div>              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Recordatorios */}
      {showModalRecordatorios && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaBell /> Configuración de Recordatorios
                </h2>
                <p className="text-orange-100 text-sm mt-1">Gestionar recordatorios automáticos</p>
              </div>
              <button onClick={() => setShowModalRecordatorios(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">Recordatorios Activos</h3>
                <div className="space-y-4">
                  {recordatorios.map((recordatorio) => (
                    <div key={recordatorio.id} className={`border-2 ${recordatorio.activo ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 dark:border-gray-600'} rounded-lg p-4 transition-all`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${recordatorio.activo ? 'bg-green-500' : 'bg-gray-400'}`}>
                            <FaBell className="text-white text-xl" />
                          </div>
                          <div>
                            <h4 className="font-bold dark:text-gray-200">{recordatorio.tipo}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{recordatorio.tiempo}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleRecordatorio(recordatorio.id)}
                          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                            recordatorio.activo 
                              ? 'bg-green-500 text-white hover:bg-green-600' 
                              : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-400'
                          }`}
                        >
                          {recordatorio.activo ? '✓ Activo' : 'Inactivo'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-2">💡 Información</h4>
                <ul className="text-sm text-blue-800 dark:text-blue-400 space-y-1">
                  <li>• Los recordatorios se envían automáticamente según la configuración</li>
                  <li>• Email + SMS: Notificación por correo y mensaje de texto</li>
                  <li>• WhatsApp: Mensaje directo al cliente</li>
                  <li>• Ubicación: Comparte la dirección de la propiedad</li>
                </ul>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t dark:border-gray-700">
                <button onClick={() => setShowModalRecordatorios(false)} className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium flex items-center gap-2">
                  <FaCheckCircle /> Guardar Configuración
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Kanban (Todo List) - Diseño Minimalista */}
      {showModalKanban && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-xl shadow-2xl max-w-[95vw] w-full max-h-[95vh] overflow-hidden flex flex-col`}>
            {/* Header Minimalista */}
            <div className={`${currentMode === 'Dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-6 py-4 flex justify-between items-center`}>
              <div className="flex items-center gap-3">
                <FaList className="text-purple-500 text-xl" />
                <h2 className="text-xl font-semibold dark:text-gray-100">Tablero Kanban</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {Object.values(tareas).flat().length} tareas
                </span>
              </div>
              <button onClick={() => setShowModalKanban(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ backgroundColor: currentMode === 'Dark' ? '#1a1a1a' : '#f8f9fa' }}>
              {/* Formulario Minimalista para Nueva Tarea */}
              <form onSubmit={agregarTarea} className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 shadow-sm`}>
                <div className="flex gap-3 items-center">
                  <input
                    type="text"
                    name="titulo"
                    value={nuevaTarea.titulo}
                    onChange={handleTareaChange}
                    required
                    placeholder="+ Nueva tarea..."
                    className={`flex-1 px-3 py-2 text-sm border-0 focus:ring-1 focus:ring-purple-500 rounded ${currentMode === 'Dark' ? 'bg-gray-700 text-gray-100' : 'bg-gray-50'}`}
                  />
                  <select name="prioridad" value={nuevaTarea.prioridad} onChange={handleTareaChange} className={`px-3 py-2 text-sm border-0 focus:ring-1 focus:ring-purple-500 rounded ${currentMode === 'Dark' ? 'bg-gray-700 text-gray-100' : 'bg-gray-50'}`}>
                    <option value="Baja">🟢 Baja</option>
                    <option value="Media">🟡 Media</option>
                    <option value="Alta">🔴 Alta</option>
                  </select>
                  <input
                    type="date"
                    name="fecha"
                    value={nuevaTarea.fecha}
                    onChange={handleTareaChange}
                    required
                    className={`px-3 py-2 text-sm border-0 focus:ring-1 focus:ring-purple-500 rounded ${currentMode === 'Dark' ? 'bg-gray-700 text-gray-100' : 'bg-gray-50'}`}
                  />
                  <select name="columna" value={nuevaTarea.columna} onChange={handleTareaChange} className={`px-3 py-2 text-sm border-0 focus:ring-1 focus:ring-purple-500 rounded ${currentMode === 'Dark' ? 'bg-gray-700 text-gray-100' : 'bg-gray-50'}`}>
                    {columnas.map(col => (
                      <option key={col.id} value={col.id}>{col.nombre}</option>
                    ))}
                  </select>
                  <button type="submit" className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors text-sm font-medium">
                    Agregar
                  </button>
                </div>
              </form>

              {/* Formulario para Nueva Columna */}
              <form onSubmit={agregarColumna} className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 shadow-sm`}>
                <div className="flex gap-3 items-center">
                  <FaPlus className="text-gray-400" />
                  <input
                    type="text"
                    value={nuevaColumna.nombre}
                    onChange={(e) => setNuevaColumna(prev => ({ ...prev, nombre: e.target.value }))}
                    required
                    placeholder="Nueva columna..."
                    className={`flex-1 px-3 py-2 text-sm border-0 focus:ring-1 focus:ring-purple-500 rounded ${currentMode === 'Dark' ? 'bg-gray-700 text-gray-100' : 'bg-gray-50'}`}
                  />
                  <input
                    type="color"
                    value={nuevaColumna.color}
                    onChange={(e) => setNuevaColumna(prev => ({ ...prev, color: e.target.value }))}
                    className="w-12 h-9 rounded cursor-pointer"
                  />
                  <button type="submit" className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors text-sm font-medium">
                    + Columna
                  </button>
                </div>
              </form>

              {/* Tablero Kanban con Drag and Drop */}
              <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '500px' }}>
                {columnas.map((columna) => (
                  <div 
                    key={columna.id}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, columna.id)}
                    className={`flex-shrink-0 w-80 ${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 shadow-sm`}
                    style={{ borderTop: `3px solid ${columna.color}` }}
                  >
                    {/* Header de Columna */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: columna.color }}></div>
                        <h3 className="font-semibold dark:text-gray-100">{columna.nombre}</h3>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {(tareas[columna.id] || []).length}
                        </span>
                      </div>
                      <button
                        onClick={() => eliminarColumna(columna.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        title="Eliminar columna"
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    </div>

                    {/* Tareas con Drag and Drop */}
                    <div className="space-y-2 min-h-[400px]">
                      {(tareas[columna.id] || []).map((tarea) => (
                        <div
                          key={tarea.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, tarea, columna.id)}
                          onDragEnd={handleDragEnd}
                          className={`${currentMode === 'Dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3 cursor-move hover:shadow-md transition-shadow border ${currentMode === 'Dark' ? 'border-gray-600' : 'border-gray-200'}`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-sm font-medium dark:text-gray-100 flex-1">{tarea.titulo}</h4>
                            <button 
                              onClick={() => eliminarTarea(columna.id, tarea.id)} 
                              className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <FaTrash className="text-xs" />
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`text-xs px-2 py-1 rounded ${
                              tarea.prioridad === 'Alta' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                              tarea.prioridad === 'Media' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                              'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            }`}>
                              {tarea.prioridad === 'Alta' ? '🔴' : tarea.prioridad === 'Media' ? '🟡' : '🟢'} {tarea.prioridad}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{tarea.fecha}</span>
                          </div>
                        </div>
                      ))}
                      {(tareas[columna.id] || []).length === 0 && (
                        <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                          Arrastra tareas aquí
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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
                  {citasData.filter(c => c.StartTime.toDateString() === new Date().toDateString()).length} citas programadas
                </p>
              </div>
              <button onClick={() => setShowModalCitasHoy(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {citasData
                  .filter(c => c.StartTime.toDateString() === new Date().toDateString())
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
                                cita.CategoryColor === '#10B981' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                cita.CategoryColor === '#F59E0B' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              }`}>
                                Confirmada
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              
              {citasData.filter(c => c.StartTime.toDateString() === new Date().toDateString()).length === 0 && (
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
              <button onClick={() => setShowModalEstaSemana(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
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
                  }, {})
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
              <button onClick={() => setShowModalTasaAsistencia(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
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
                            item.porcentaje >= 90 ? 'bg-green-500' :
                            item.porcentaje >= 75 ? 'bg-blue-500' :
                            'bg-orange-500'
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
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaBell /> Tareas Pendientes
                </h2>
                <p className="text-orange-100 text-sm mt-1">
                  {(tareas.pendiente || []).length + (tareas.enProgreso || []).length} tareas activas
                </p>
              </div>
              <button onClick={() => setShowModalPendientes(false)} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors">
                <FaTimes className="text-2xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Tareas Pendientes */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
                  Pendientes ({(tareas.pendiente || []).length})
                </h3>
                <div className="space-y-2">
                  {(tareas.pendiente || []).map((tarea) => (
                    <div key={tarea.id} className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 border-l-4 border-yellow-500 hover:shadow-md transition-shadow`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold dark:text-gray-100">{tarea.titulo}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{tarea.descripcion}</p>
                          {tarea.fecha && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              📅 {tarea.fecha}
                            </p>
                          )}
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                          Pendiente
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tareas En Progreso */}
              <div>
                <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  En Progreso ({(tareas.enProgreso || []).length})
                </h3>
                <div className="space-y-2">
                  {(tareas.enProgreso || []).map((tarea) => (
                    <div key={tarea.id} className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 border-l-4 border-blue-500 hover:shadow-md transition-shadow`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold dark:text-gray-100">{tarea.titulo}</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{tarea.descripcion}</p>
                          {tarea.fecha && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              📅 {tarea.fecha}
                            </p>
                          )}
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          En Progreso
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumen */}
              <div className={`mt-6 p-4 ${currentMode === 'Dark' ? 'bg-orange-900/20' : 'bg-orange-50'} rounded-lg border-2 border-orange-500`}>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pendientes</p>
                    <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                      {(tareas.pendiente || []).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">En Progreso</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {(tareas.enProgreso || []).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Completadas</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {(tareas.completado || []).length}
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

export default Citas;
