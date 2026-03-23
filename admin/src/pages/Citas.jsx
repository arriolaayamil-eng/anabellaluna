import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { confirmToast } from '../utils/confirmToast';
import { FaCalendarPlus, FaSync, FaClock, FaUsers, FaMapMarkerAlt, FaPhoneAlt, FaBell, FaCheckCircle, FaTimes, FaSave, FaList, FaGripVertical, FaPlus, FaEdit, FaTrash, FaChartLine, FaArrowUp, FaArrowDown, FaPercentage, FaCalendarAlt } from 'react-icons/fa';
import { useStateContext } from '../contexts/ContextProvider';
import { crmService } from '../services/crmService';
import Chart from 'react-apexcharts';


const Citas = () => {
  const { currentMode, currentColor } = useStateContext();
  
  // Estado para calendario nativo
  const [calDate, setCalDate] = useState(new Date());
  const [calSelectedDay, setCalSelectedDay] = useState(null);

  // Estados para modales
  const [showModalCita, setShowModalCita] = useState(false);
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
  
  // Estado para Kanban (Todo List) - Conectado al backend
  const [columnas, setColumnas] = useState([]);
  const [tareas, setTareas] = useState({});
  const [kanbanLoading, setKanbanLoading] = useState(false);
  const [kanbanSaving, setKanbanSaving] = useState(false);
  
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
  const [dropTargetColumn, setDropTargetColumn] = useState(null);

  // Cargar datos del Kanban desde el backend
  const loadKanbanData = async () => {
    setKanbanLoading(true);
    try {
      const [columnsData, tasksData] = await Promise.all([
        crmService.tareas.getKanbanColumns(),
        crmService.tareas.getKanban()
      ]);
      setColumnas(Array.isArray(columnsData) ? columnsData : [
        { id: 'pendiente', nombre: 'Pendiente', color: '#F59E0B' },
        { id: 'enProgreso', nombre: 'En Progreso', color: '#3B82F6' },
        { id: 'completado', nombre: 'Completado', color: '#10B981' },
      ]);
      setTareas(tasksData || {});
    } catch (e) {
      console.error('Error loading kanban:', e);
      setColumnas([
        { id: 'pendiente', nombre: 'Pendiente', color: '#F59E0B' },
        { id: 'enProgreso', nombre: 'En Progreso', color: '#3B82F6' },
        { id: 'completado', nombre: 'Completado', color: '#10B981' },
      ]);
    } finally {
      setKanbanLoading(false);
    }
  };

  // Cargar Kanban cuando se abre el modal
  useEffect(() => {
    if (showModalKanban) {
      loadKanbanData();
    }
  }, [showModalKanban]);

  // Estado para citas del backend
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

  const citasData = useMemo(() => {
    return (Array.isArray(citasItems) ? citasItems : []).map((c) => {
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
    });
  }, [citasItems]);

  // KPIs de Citas
  const kpisCitas = [
    { title: 'Citas Hoy', value: citasData.filter(c => c.StartTime.toDateString() === new Date().toDateString()).length, desc: '2 confirmadas', icon: <FaClock />, color: 'from-blue-500 to-blue-600' },
    { title: 'Esta Semana', value: citasData.length, desc: '3 visitas programadas', icon: <FaCalendarPlus />, color: 'from-green-500 to-green-600' },
    { title: 'Tasa Asistencia', value: '85%', desc: 'Últimos 30 días', icon: <FaCheckCircle />, color: 'from-purple-500 to-purple-600' },
    { title: 'Pendientes', value: citasData.filter(c => c.estado === 'Programada' || c.estado === 'Pendiente').length, desc: 'Por confirmar', icon: <FaBell />, color: 'from-orange-500 to-orange-600' },
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
  const citasDonutSeries = tiposCitasData.map(t => t.cantidad);

  // ApexCharts - Citas por Día (Bar)
  const citasDiaOptions = {
    chart: { type: 'bar', height: 200, background: 'transparent', toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 6, columnWidth: '50%', distributed: true } },
    colors: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6B7280', '#9CA3AF'],
    dataLabels: { enabled: false },
    xaxis: { categories: citasPorDia.map(c => c.dia), labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '10px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '10px' } } },
    grid: { borderColor: currentMode === 'Dark' ? '#374151' : '#E5E7EB', strokeDashArray: 4 },
    legend: { show: false },
    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light' },
  };
  const citasDiaSeries = [{ name: 'Citas', data: citasPorDia.map(c => c.cantidad) }];

  // ApexCharts - Tasa de Asistencia (Gauge)
  const asistenciaOptions = {
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
    setNuevaCita(prev => ({ ...prev, [name]: value }));
  };

  const handleCitaSubmit = async (e) => {
    e.preventDefault();
    setCitasError('');

    try {
      const startStr = `${nuevaCita.fecha}T${nuevaCita.horaInicio}`;
      const endStr = nuevaCita.horaFin ? `${nuevaCita.fecha}T${nuevaCita.horaFin}` : '';
      const start = new Date(startStr);
      const end = endStr ? new Date(endStr) : new Date(start.getTime() + 60 * 60 * 1000);
      if (Number.isNaN(start.getTime())) throw new Error('Fecha/hora inválida');

      await crmService.citas.create({
        fecha: start.toISOString(),
        fechaFin: end.toISOString(),
        titulo: nuevaCita.titulo,
        tipo: nuevaCita.tipo,
        ubicacion: nuevaCita.ubicacion,
        notas: nuevaCita.descripcion,
        estado: 'Programada',
        metadata: {
          clienteNombre: nuevaCita.cliente,
          propiedadNombre: nuevaCita.propiedad,
        },
      });

      await reloadCitas();
      toast.success('¡Cita agendada exitosamente!');
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
    } catch (err) {
      setCitasError(err?.message || 'No se pudo agendar la cita');
    }
  };

  // Funciones para Kanban - Conectadas al backend con auto-guardado
  const handleTareaChange = (e) => {
    const { name, value } = e.target;
    setNuevaTarea(prev => ({ ...prev, [name]: value }));
  };

  const agregarTarea = async (e) => {
    e.preventDefault();
    setKanbanSaving(true);
    try {
      const newTask = await crmService.tareas.create({
        title: nuevaTarea.titulo,
        priority: nuevaTarea.prioridad,
        dueDate: nuevaTarea.fecha ? new Date(nuevaTarea.fecha).toISOString() : null,
        kanbanColumn: nuevaTarea.columna,
        position: (tareas[nuevaTarea.columna]?.length || 0),
      });
      
      setTareas(prev => ({
        ...prev,
        [nuevaTarea.columna]: [...(prev[nuevaTarea.columna] || []), newTask]
      }));
      
      setNuevaTarea({
        titulo: '',
        prioridad: 'Media',
        fecha: '',
        columna: columnas[0]?.id || 'pendiente',
      });
    } catch (e) {
      console.error('Error creating task:', e);
      toast.error('Error al crear tarea');
    } finally {
      setKanbanSaving(false);
    }
  };

  const eliminarTarea = async (columna, id) => {
    setKanbanSaving(true);
    try {
      await crmService.tareas.delete(id);
      setTareas(prev => ({
        ...prev,
        [columna]: prev[columna].filter(t => (t._id || t.id) !== id)
      }));
    } catch (e) {
      console.error('Error deleting task:', e);
      toast.error('Error al eliminar tarea');
    } finally {
      setKanbanSaving(false);
    }
  };

  // Funciones Drag and Drop con auto-guardado
  const handleDragStart = (e, tarea, columnaId) => {
    setDraggedTask({ tarea, columnaOrigen: columnaId });
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
  };

  const handleDragOver = (e, columnaId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (columnaId !== dropTargetColumn) {
      setDropTargetColumn(columnaId);
    }
  };

  const handleDragLeave = (e, columnaId) => {
    if (dropTargetColumn === columnaId) {
      setDropTargetColumn(null);
    }
  };

  const handleDrop = async (e, columnaDestino) => {
    e.preventDefault();
    setDropTargetColumn(null);
    if (!draggedTask) return;

    const { tarea, columnaOrigen } = draggedTask;
    const tareaId = tarea._id || tarea.id;
    
    if (columnaOrigen !== columnaDestino) {
      setKanbanSaving(true);
      
      // Optimistic update
      setTareas(prev => ({
        ...prev,
        [columnaOrigen]: (prev[columnaOrigen] || []).filter(t => (t._id || t.id) !== tareaId),
        [columnaDestino]: [...(prev[columnaDestino] || []), { ...tarea, kanbanColumn: columnaDestino }]
      }));
      
      try {
        await crmService.tareas.moveTask(tareaId, columnaDestino, (tareas[columnaDestino]?.length || 0));
      } catch (err) {
        console.error('Error moving task:', err);
        toast.error('Error al mover tarea. Reintentando...');
        // Revert
        setTareas(prev => ({
          ...prev,
          [columnaDestino]: (prev[columnaDestino] || []).filter(t => (t._id || t.id) !== tareaId),
          [columnaOrigen]: [...(prev[columnaOrigen] || []), tarea]
        }));
      } finally {
        setKanbanSaving(false);
      }
    }
    
    setDraggedTask(null);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedTask(null);
    setDropTargetColumn(null);
  };

  // Funciones para gestión de columnas con auto-guardado
  const agregarColumna = async (e) => {
    e.preventDefault();
    if (!nuevaColumna.nombre.trim()) {
      toast.warn('Ingresa un nombre para la columna');
      return;
    }
    
    setKanbanSaving(true);
    const nuevaCol = {
      id: `col_${Date.now()}`,
      nombre: nuevaColumna.nombre.trim(),
      color: nuevaColumna.color,
    };
    
    const newColumnas = [...columnas, nuevaCol];
    setColumnas(newColumnas);
    setTareas(prev => ({ ...prev, [nuevaCol.id]: [] }));
    setNuevaColumna({ nombre: '', color: '#8B5CF6' });
    
    try {
      await crmService.tareas.saveKanbanColumns(newColumnas);
    } catch (err) {
      console.error('Error saving columns:', err);
      toast.error('Error al guardar la columna');
      setColumnas(columnas);
    } finally {
      setKanbanSaving(false);
    }
  };

  const eliminarColumna = async (columnaId) => {
    if (columnas.length <= 1) {
      toast.warn('Debe haber al menos una columna');
      return;
    }
    
    const columnaAEliminar = columnas.find(c => c.id === columnaId);
    const tareasEnColumna = tareas[columnaId]?.length || 0;
    if (tareasEnColumna > 0) {
      if (!(await confirmToast(`La columna "${columnaAEliminar?.nombre}" tiene ${tareasEnColumna} tarea(s). ¿Desea eliminarla?`))) {
        return;
      }
    }
    
    setKanbanSaving(true);
    
    if (tareasEnColumna > 0) {
      for (const tarea of tareas[columnaId]) {
        try {
          await crmService.tareas.delete(tarea._id || tarea.id);
        } catch (err) {
          console.error('Error deleting task:', err);
        }
      }
    }
    
    const newColumnas = columnas.filter(col => col.id !== columnaId);
    setColumnas(newColumnas);
    const newTareas = { ...tareas };
    delete newTareas[columnaId];
    setTareas(newTareas);
    
    try {
      await crmService.tareas.saveKanbanColumns(newColumnas);
    } catch (err) {
      console.error('Error saving columns:', err);
      toast.error('Error al eliminar la columna');
    } finally {
      setKanbanSaving(false);
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
      
      {/* Botones de Acción */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button 
          onClick={() => setShowModalCita(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium bg-blue-500 hover:bg-blue-600 transition-all shadow-sm hover:shadow-md"
        >
          <FaCalendarPlus /> Nueva Cita
        </button>
        <button 
          onClick={() => setShowModalKanban(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium bg-purple-500 hover:bg-purple-600 transition-all shadow-sm hover:shadow-md"
        >
          <FaList /> Todo List (Kanban)
        </button>
      </div>

      {/* KPIs de Citas - Clickeables */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpisCitas.map((kpi, i) => {
          const colorMap = { 'from-blue-500 to-blue-600': '#3b82f6', 'from-green-500 to-green-600': '#10b981', 'from-emerald-500 to-emerald-600': '#10b981', 'from-purple-500 to-purple-600': '#8b5cf6', 'from-orange-500 to-orange-600': '#f59e0b', 'from-amber-500 to-amber-600': '#f59e0b', 'from-red-500 to-red-600': '#ef4444', 'from-violet-500 to-violet-600': '#8b5cf6' };
          const accentColor = colorMap[kpi.color] || '#6366f1';
          const bgMap = { 'from-blue-500 to-blue-600': 'bg-blue-50 dark:bg-blue-900/20', 'from-green-500 to-green-600': 'bg-emerald-50 dark:bg-emerald-900/20', 'from-emerald-500 to-emerald-600': 'bg-emerald-50 dark:bg-emerald-900/20', 'from-purple-500 to-purple-600': 'bg-purple-50 dark:bg-purple-900/20', 'from-orange-500 to-orange-600': 'bg-amber-50 dark:bg-amber-900/20', 'from-amber-500 to-amber-600': 'bg-amber-50 dark:bg-amber-900/20', 'from-red-500 to-red-600': 'bg-red-50 dark:bg-red-900/20', 'from-violet-500 to-violet-600': 'bg-purple-50 dark:bg-purple-900/20' };
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
              <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{citasData.length}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded text-center">
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">+12%</p>
              <p className="text-xs text-gray-500">vs Ant.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendario Principal y Próximas Citas - Ancho completo */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className={`xl:col-span-2 ${cardBase}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold dark:text-gray-100">� Calendario Completo</h3>
            <button
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
            // Shift so week starts Monday (0=Mon)
            const startDow = (firstDay.getDay() + 6) % 7;
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const cells = [];
            for (let i = 0; i < startDow; i++) cells.push(null);
            for (let d = 1; d <= daysInMonth; d++) cells.push(d);
            while (cells.length % 7 !== 0) cells.push(null);
            const today = new Date();
            const typeColor = { 'Visita': '#3B82F6', 'Reunión': '#10B981', 'Firma': '#F59E0B', 'Llamada': '#8B5CF6' };
            return (
              <div style={{ minHeight: 520 }}>
                {/* Month navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button type="button" onClick={() => setCalDate(new Date(year, month - 1, 1))} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>‹ Ant.</button>
                  <span className={`font-semibold text-base ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{monthNames[month]} {year}</span>
                  <button type="button" onClick={() => setCalDate(new Date(year, month + 1, 1))} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Sig. ›</button>
                </div>
                {/* Day headers */}
                <div className="grid grid-cols-7 mb-1">
                  {dayNames.map(d => (
                    <div key={d} className={`text-center text-xs font-semibold py-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{d}</div>
                  ))}
                </div>
                {/* Calendar grid */}
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
                {/* Selected day detail */}
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

        {/* Próximas Citas - Panel lateral */}
        <div className={cardBase}>
          <h3 className="text-sm font-semibold mb-3 dark:text-gray-100 flex items-center gap-2">
            <FaClock className="text-blue-500" /> Próximas Citas
          </h3>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {citasData
              .filter(c => c.StartTime >= new Date())
              .sort((a, b) => a.StartTime - b.StartTime)
              .slice(0, 10)
              .map((cita, i) => (
              <div key={cita.Id || i} className={`p-3 rounded-lg border ${currentMode === 'Dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} hover:shadow-md transition-shadow`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                    cita.tipo === 'Visita' ? 'bg-blue-500' :
                    cita.tipo === 'Reunión' ? 'bg-green-500' :
                    cita.tipo === 'Firma' ? 'bg-yellow-500' : 'bg-purple-500'
                  }`}>
                    {cita.StartTime.getHours()}:{cita.StartTime.getMinutes().toString().padStart(2, '0')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium dark:text-gray-200 truncate">{cita.Subject}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{cita.cliente || cita.tipo}</p>
                  </div>
                  <span className="text-gray-400 flex-shrink-0 text-xs">{cita.StartTime.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}</span>
                </div>
              </div>
            ))}
            {citasData.length === 0 && (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">Sin citas próximas</p>
            )}
          </div>
        </div>
      </div>

      {/* Grid de Próximas Citas - Tabla */}
      <div className="mb-6">
        <div className={cardBase}>
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">🕒 Todas las Citas</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <th className="text-left py-3 px-3 font-semibold dark:text-gray-300">Cita</th>
                  <th className="text-left py-3 px-3 font-semibold dark:text-gray-300">Tipo</th>
                  <th className="text-left py-3 px-3 font-semibold dark:text-gray-300">Cliente</th>
                  <th className="text-left py-3 px-3 font-semibold dark:text-gray-300">Estado</th>
                </tr>
              </thead>
              <tbody>
                {citasData.slice(0, 10).map((cita, idx) => (
                  <tr key={idx} className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-100 hover:bg-gray-50'}`}>
                    <td className="py-2.5 px-3 dark:text-gray-200">{cita.Subject}</td>
                    <td className="py-2.5 px-3 dark:text-gray-300">{cita.tipo}</td>
                    <td className="py-2.5 px-3 dark:text-gray-300">{cita.cliente}</td>
                    <td className="py-2.5 px-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        cita.estado === 'Confirmada' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : cita.estado === 'Pendiente' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>{cita.estado}</span>
                    </td>
                  </tr>
                ))}
                {!citasData.length && (
                  <tr><td colSpan={4} className="py-8 text-center text-gray-400">No hay citas registradas</td></tr>
                )}
              </tbody>
            </table>
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
                {kanbanSaving && (
                  <span className="text-xs text-purple-500 flex items-center gap-1">
                    <FaSync className="animate-spin" /> Guardando...
                  </span>
                )}
                {kanbanLoading && (
                  <span className="text-xs text-blue-500 flex items-center gap-1">
                    <FaSync className="animate-spin" /> Cargando...
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={loadKanbanData} 
                  disabled={kanbanLoading}
                  className="text-gray-400 hover:text-purple-500 transition-colors p-2"
                  title="Recargar"
                >
                  <FaSync className={kanbanLoading ? 'animate-spin' : ''} />
                </button>
                <button onClick={() => setShowModalKanban(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                  <FaTimes className="text-xl" />
                </button>
              </div>
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
                    onDragOver={(e) => handleDragOver(e, columna.id)}
                    onDragLeave={(e) => handleDragLeave(e, columna.id)}
                    onDrop={(e) => handleDrop(e, columna.id)}
                    className={`flex-shrink-0 w-80 ${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 shadow-sm transition-all ${
                      dropTargetColumn === columna.id ? 'ring-2 ring-purple-400 bg-purple-50 dark:bg-purple-900/20' : ''
                    }`}
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
                      {(tareas[columna.id] || []).map((tarea) => {
                        const tareaId = tarea._id || tarea.id;
                        const prioridad = tarea.priority || tarea.prioridad || 'Media';
                        const titulo = tarea.title || tarea.titulo || 'Sin título';
                        const fecha = tarea.dueDate ? new Date(tarea.dueDate).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : (tarea.fecha || '');
                        return (
                          <div
                            key={tareaId}
                            draggable
                            onDragStart={(e) => handleDragStart(e, tarea, columna.id)}
                            onDragEnd={handleDragEnd}
                            className={`${currentMode === 'Dark' ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3 cursor-move hover:shadow-md transition-shadow border ${currentMode === 'Dark' ? 'border-gray-600' : 'border-gray-200'}`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-sm font-medium dark:text-gray-100 flex-1">{titulo}</h4>
                              <button 
                                onClick={() => eliminarTarea(columna.id, tareaId)} 
                                className="text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <FaTrash className="text-xs" />
                              </button>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className={`text-xs px-2 py-1 rounded ${
                                prioridad === 'Alta' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                prioridad === 'Media' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                              }`}>
                                {prioridad === 'Alta' ? '🔴' : prioridad === 'Media' ? '🟡' : '🟢'} {prioridad}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">{fecha}</span>
                            </div>
                          </div>
                        );
                      })}
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
                              <p className="text-sm text-gray-500 dark:text-gray-400">{cita.Description}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Cliente:</p>
                              <p className="font-medium dark:text-gray-200">{cita.cliente}</p>
                            </div>
                            <div>
                              <p className="text-gray-600 dark:text-gray-400">Tipo:</p>
                              <p className="font-medium dark:text-gray-200">{cita.tipo}</p>
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
                                cita.estado === 'Confirmada' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                cita.estado === 'Programada' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              }`}>
                                {cita.estado || 'Programada'}
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
                              <p className="text-sm text-gray-500 dark:text-gray-400">{cita.Description}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium dark:text-gray-200">{cita.cliente}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{cita.tipo}</p>
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
                  {(tareas.pendiente || []).map((tarea) => {
                    const id = tarea._id || tarea.id;
                    const titulo = tarea.title || tarea.titulo || 'Sin título';
                    const desc = tarea.summary || tarea.descripcion || '';
                    const fecha = tarea.dueDate ? new Date(tarea.dueDate).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : (tarea.fecha || '');
                    return (
                      <div key={id} className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 border-l-4 border-yellow-500 hover:shadow-md transition-shadow`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-bold dark:text-gray-100">{titulo}</h4>
                            {desc && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{desc}</p>}
                            {fecha && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                📅 {fecha}
                              </p>
                            )}
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                            Pendiente
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tareas En Progreso */}
              <div>
                <h3 className="text-lg font-semibold mb-4 dark:text-gray-100 flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                  En Progreso ({(tareas.enProgreso || []).length})
                </h3>
                <div className="space-y-2">
                  {(tareas.enProgreso || []).map((tarea) => {
                    const id = tarea._id || tarea.id;
                    const titulo = tarea.title || tarea.titulo || 'Sin título';
                    const desc = tarea.summary || tarea.descripcion || '';
                    const fecha = tarea.dueDate ? new Date(tarea.dueDate).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) : (tarea.fecha || '');
                    return (
                      <div key={id} className={`${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-gray-50'} rounded-lg p-4 border-l-4 border-blue-500 hover:shadow-md transition-shadow`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-bold dark:text-gray-100">{titulo}</h4>
                            {desc && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{desc}</p>}
                            {fecha && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                📅 {fecha}
                              </p>
                            )}
                          </div>
                          <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            En Progreso
                          </span>
                        </div>
                      </div>
                    );
                  })}
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
