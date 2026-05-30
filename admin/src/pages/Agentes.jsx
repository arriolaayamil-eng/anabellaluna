import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FaUserPlus, FaUser, FaStar, FaUsers, FaDollarSign, FaHome, FaMapMarkerAlt, FaShieldAlt, FaTimes, FaSave, FaArrowLeft, FaThLarge, FaEdit, FaTrash, FaPhone, FaEnvelope, FaCalendar, FaChartLine, FaTrophy, FaBriefcase, FaExclamationTriangle, FaKey, FaCopy } from 'react-icons/fa';
import { Header } from '../components';
import { useStateContext } from '../contexts/ContextProvider';
import { api } from '../config/api';

// ApexCharts for modern visualizations
import Chart from 'react-apexcharts';


const Agentes = () => {
  const { currentMode, currentColor } = useStateContext();
  
  // Estado para el modal
  const [showModal, setShowModal] = useState(false);
  const [creatingAgente, setCreatingAgente] = useState(false);
  const [createMessage, setCreateMessage] = useState('');
  const [createdCredentials, setCreatedCredentials] = useState(null);
  
  // Estados para modales de estadísticas
  const [showModalTotalAgentes, setShowModalTotalAgentes] = useState(false);
  const [showModalPropiedadesGestionadas, setShowModalPropiedadesGestionadas] = useState(false);
  const [showModalComisionesTotales, setShowModalComisionesTotales] = useState(false);
  const [showModalRatingPromedio, setShowModalRatingPromedio] = useState(false);
  
  // Estados para las vistas
  const [vistaActual, setVistaActual] = useState('dashboard'); // 'dashboard', 'lista', 'detalle'
  const [agenteSeleccionado, setAgenteSeleccionado] = useState(null);
  
  // Estados para datos reales
  const [agentes, setAgentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  
  // Estados para editar agente
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAgente, setEditingAgente] = useState(null);
  const [savingAgente, setSavingAgente] = useState(false);
  const [editMessage, setEditMessage] = useState('');
  
  // Estados para eliminar agente
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAgente, setDeletingAgente] = useState(false);
  
  // Estado para confirmación de cierre del formulario
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [resetCredentials, setResetCredentials] = useState(null);
  const [customResetPassword, setCustomResetPassword] = useState('');
  
  // Estado para el formulario de nuevo agente
  const [nuevoAgente, setNuevoAgente] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    username: '',
    password: '',
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

  // Función para cargar agentes con métricas
  const loadAgentes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/crm/agentes/metrics/all');
      // Normalizar datos para compatibilidad con la UI existente
      const agentesNormalizados = (Array.isArray(data) ? data : []).map(a => ({
        id: a._id,
        _id: a._id,
        nombre: a.nombre || 'Sin nombre',
        email: a.email || '',
        telefono: a.telefono || '',
        cargo: a.cargo || 'Agente',
        rol: a.metadata?.rol || a.cargo || 'Agente',
        especialidad: a.especialidad || a.metadata?.especialidad || 'General',
        avatar: a.avatar || '',
        bio: a.bio || '',
        direccion: a.direccion || a.metadata?.direccion || '',
        ciudad: a.metadata?.ciudad || 'Buenos Aires',
        provincia: a.metadata?.provincia || 'Buenos Aires',
        zona: a.metadata?.zonas?.join(', ') || a.metadata?.zona || '',
        fechaIngreso: a.metadata?.fechaIngreso || a.createdAt?.split('T')[0] || '',
        licencia: a.metadata?.licencia || '',
        experiencia: a.metadata?.experiencia || '',
        idiomas: a.metadata?.idiomas || [],
        notas: a.metadata?.notas || a.bio || '',
        telefonoAlternativo: a.metadata?.telefonoAlternativo || '',
        // Métricas reales
        propiedades: a.metricas?.propiedades || 0,
        clientes: a.metricas?.clientes || 0,
        actividades: a.metricas?.actividades || 0,
        actividadesMes: a.metricas?.actividadesMes || 0,
        visitas: a.metricas?.visitas || 0,
        llamadas: a.metricas?.llamadas || 0,
        emails: a.metricas?.emails || 0,
        rating: parseFloat(a.metricas?.rating) || 4.5,
        satisfaccionCliente: a.metricas?.satisfaccion || 85,
        // Métricas reales de ventas/comisiones (desde Operaciones)
        ventas: a.metricas?.ventas || 0,
        alquileres: a.metricas?.alquileres || 0,
        comisiones: a.metricas?.comisiones || 0,
        valorCartera: a.metricas?.valorCartera || 0,
        tasaConversion: a.metricas?.tasaConversion || 0,
        diasPromCierre: a.metricas?.diasPromCierre || 0,
        ventasMensual: Array.isArray(a.metricas?.ventasMensual) ? a.metricas.ventasMensual : [0, 0, 0, 0, 0, 0],
        metaMensual: a.metricas?.metaMensual || a.metadata?.metaMensual || 0,
        citas: a.metricas?.actividades || 0,
        propiedadesVendidas: a.metricas?.propiedadesVendidas || 0,
        color: a.color || '#4ECDC4',
        online: a.metadata?.online || false,
        redesSociales: a.redesSociales || {},
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
      }));
      setAgentes(agentesNormalizados);
    } catch (err) {
      console.error('Error loading agents:', err);
      setAgentes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para cargar detalle de un agente
  const loadAgenteDetalle = useCallback(async (agenteId) => {
    setLoadingDetalle(true);
    try {
      const data = await api.get(`/crm/agentes/metrics/${agenteId}`);
      // Normalizar para la UI
      const agenteDetalle = {
        id: data._id,
        _id: data._id,
        nombre: data.nombre || 'Sin nombre',
        email: data.email || '',
        telefono: data.telefono || '',
        cargo: data.cargo || 'Agente',
        rol: data.metadata?.rol || data.cargo || 'Agente',
        especialidad: data.especialidad || data.metadata?.especialidad || 'General',
        avatar: data.avatar || '',
        bio: data.bio || '',
        direccion: data.direccion || data.metadata?.direccion || '',
        ciudad: data.metadata?.ciudad || 'Buenos Aires',
        provincia: data.metadata?.provincia || 'Buenos Aires',
        zona: data.metadata?.zonas?.join(', ') || data.metadata?.zona || '',
        fechaIngreso: data.metadata?.fechaIngreso || data.createdAt?.split('T')[0] || '',
        licencia: data.metadata?.licencia || '',
        experiencia: data.metadata?.experiencia || '',
        idiomas: data.metadata?.idiomas || [],
        notas: data.metadata?.notas || data.bio || '',
        telefonoAlternativo: data.metadata?.telefonoAlternativo || '',
        propiedades: data.metricas?.propiedades || 0,
        clientes: data.metricas?.clientes || 0,
        actividades: data.metricas?.actividades || 0,
        rating: parseFloat(data.metricas?.rating) || 4.5,
        satisfaccionCliente: data.metricas?.satisfaccion || 85,
        ventas: data.metricas?.ventas || 0,
        alquileres: data.metricas?.alquileres || 0,
        comisiones: data.metricas?.comisiones || 0,
        valorCartera: data.metricas?.valorCartera || 0,
        tasaConversion: data.metricas?.tasaConversion || 0,
        diasPromCierre: data.metricas?.diasPromCierre || 0,
        metaMensual: data.metricas?.metaMensual || data.metadata?.metaMensual || 0,
        citas: data.metricas?.actividades || 0,
        propiedadesVendidas: data.metricas?.propiedadesVendidas || 0,
        color: data.color || '#4ECDC4',
        redesSociales: data.redesSociales || {},
        // Detalle adicional
        detalle: data.detalle || {},
      };
      setAgenteSeleccionado(agenteDetalle);
    } catch (err) {
      console.error('Error loading agent details:', err);
    } finally {
      setLoadingDetalle(false);
    }
  }, []);

  // Cargar agentes al montar
  useEffect(() => {
    loadAgentes();
  }, [loadAgentes]);

  // KPIs del equipo
  const totalComisiones = agentes.reduce((sum, a) => sum + a.comisiones, 0);
  const totalPropiedades = agentes.reduce((sum, a) => sum + a.propiedades, 0);
  const avgRating = agentes.length > 0 ? (agentes.reduce((sum, a) => sum + a.rating, 0) / agentes.length).toFixed(1) : 0;
  const totalVentas = agentes.reduce((sum, a) => sum + a.ventas, 0);

  const kpisEquipo = [
    { title: 'Total Agentes', value: agentes.length, desc: `${agentes.filter(a => a.rol === 'Agente Senior').length} seniors`, icon: <FaUsers />, color: 'from-blue-500 to-blue-600', trend: '+2' },
    { title: 'Propiedades', value: totalPropiedades, desc: 'En gestión activa', icon: <FaHome />, color: 'from-emerald-500 to-emerald-600', trend: '+12%' },
    { title: 'Comisiones', value: `$${(totalComisiones / 1000).toFixed(0)}K`, desc: 'Este mes', icon: <FaDollarSign />, color: 'from-violet-500 to-violet-600', trend: '+18%' },
    { title: 'Rating Promedio', value: avgRating, desc: 'Excelente equipo', icon: <FaStar />, color: 'from-amber-500 to-amber-600', trend: '+0.2' },
  ];

  // ApexCharts configurations
  const last6Months = (() => {
    const arr = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      arr.push(d.toLocaleDateString('es-AR', { month: 'short' }));
    }
    return arr;
  })();
  const rendimientoAreaOptions = {
    chart: { type: 'area', height: 300, background: 'transparent', toolbar: { show: false }, zoom: { enabled: false } },
    colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 2.5 },
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.3, opacityTo: 0.05, stops: [0, 100] } },
    xaxis: {
      categories: last6Months,
      labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '10px' } },
      axisBorder: { show: false }, axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '10px' } } },
    grid: { borderColor: currentMode === 'Dark' ? '#374151' : '#E5E7EB', strokeDashArray: 4 },
    legend: { show: true, position: 'top', horizontalAlign: 'right', fontSize: '11px', labels: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' } },
    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light' },
  };
  const rendimientoAreaSeries = agentes.slice(0, 5).map((a) => ({
    name: a.nombre.split(' ')[0],
    data: Array.isArray(a.ventasMensual) && a.ventasMensual.length === 6 ? a.ventasMensual : [0, 0, 0, 0, 0, 0],
  }));

  const comisionesBarOptions = {
    chart: { type: 'bar', height: 260, background: 'transparent', toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 8, horizontal: true, distributed: true, barHeight: '70%' } },
    colors: agentes.map(a => a.color),
    dataLabels: { enabled: true, style: { colors: ['#fff'], fontSize: '11px', fontWeight: 600 }, formatter: (val) => `$${(val/1000).toFixed(0)}K` },
    xaxis: { categories: agentes.map(a => a.nombre.split(' ')[0]), labels: { show: false }, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', fontSize: '11px' } } },
    grid: { show: false },
    legend: { show: false },
    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light', y: { formatter: (val) => `$${val.toLocaleString()}` } },
  };
  const comisionesBarSeries = [{ name: 'Comisiones', data: agentes.map(a => a.comisiones) }];

  const metaRadialOptions = {
    chart: { type: 'radialBar', height: 220, background: 'transparent' },
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
    labels: ['Meta Equipo'],
  };
  const metaTotalVentas = agentes.reduce((s, a) => s + a.metaMensual, 0);
  const metaPct = metaTotalVentas > 0 ? Math.round((totalVentas / metaTotalVentas) * 100) : 0;
  const metaRadialSeries = [metaPct];

  const satisfaccionDonutOptions = {
    chart: { type: 'donut', height: 260, background: 'transparent' },
    labels: agentes.map(a => a.nombre.split(' ')[0]),
    colors: agentes.map(a => a.color),
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: {
            show: true,
            name: { show: true, fontSize: '12px', fontWeight: 600, color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' },
            value: { show: true, fontSize: '18px', fontWeight: 700, color: currentMode === 'Dark' ? '#F3F4F6' : '#1F2937', formatter: (val) => `${val}%` },
            total: { show: true, label: 'Promedio', fontSize: '11px', color: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280', formatter: () => `${Math.round(agentes.reduce((s, a) => s + a.satisfaccionCliente, 0) / agentes.length)}%` },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    legend: { show: true, position: 'bottom', fontSize: '10px', labels: { colors: currentMode === 'Dark' ? '#9CA3AF' : '#6B7280' } },
    stroke: { show: false },
    tooltip: { theme: currentMode === 'Dark' ? 'dark' : 'light' },
  };
  const satisfaccionDonutSeries = agentes.map(a => a.satisfaccionCliente);

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
  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreatingAgente(true);
    setCreateMessage('');
    setCreatedCredentials(null);
    try {
      const resp = await api.post('/crm/agentes/create-with-user', {
        nombre: `${nuevoAgente.nombre} ${nuevoAgente.apellido}`.trim(),
        email: nuevoAgente.email,
        telefono: nuevoAgente.telefono,
        username: nuevoAgente.username || undefined,
        password: nuevoAgente.password || undefined,
        metadata: {
          telefonoAlternativo: nuevoAgente.telefonoAlternativo,
          rol: nuevoAgente.rol,
          especialidad: nuevoAgente.especialidad,
          zonas: nuevoAgente.zonas,
          comision: nuevoAgente.comision,
          direccion: nuevoAgente.direccion,
          ciudad: nuevoAgente.ciudad,
          provincia: nuevoAgente.provincia,
          fechaIngreso: nuevoAgente.fechaIngreso,
          licencia: nuevoAgente.licencia,
          experiencia: nuevoAgente.experiencia,
          idiomas: nuevoAgente.idiomas,
          notas: nuevoAgente.notas,
        },
      });

      setCreatedCredentials({ username: resp?.user?.username, password: resp?.password });
      setCreateMessage('Agente creado. Guardá estas credenciales (se muestran una sola vez).');
      // Recargar lista de agentes
      loadAgentes();
      setNuevoAgente({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        username: '',
        password: '',
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
    } catch (err) {
      setCreateMessage(err?.message || 'Error al crear el agente');
    } finally {
      setCreatingAgente(false);
    }
  };

  // Función para ver detalle de agente
  const verDetalle = (agente) => {
    setVistaActual('detalle');
    loadAgenteDetalle(agente._id || agente.id);
  };

  // Función para volver al dashboard
  const volverAlDashboard = () => {
    setVistaActual('dashboard');
    setAgenteSeleccionado(null);
  };

  // Función para abrir modal de edición
  const handleEditAgente = () => {
    if (!agenteSeleccionado) return;
    setEditingAgente({
      _id: agenteSeleccionado._id || agenteSeleccionado.id,
      nombre: agenteSeleccionado.nombre || '',
      email: agenteSeleccionado.email || '',
      telefono: agenteSeleccionado.telefono || '',
      cargo: agenteSeleccionado.cargo || 'Agente',
      especialidad: agenteSeleccionado.especialidad || '',
      bio: agenteSeleccionado.bio || agenteSeleccionado.notas || '',
      direccion: agenteSeleccionado.direccion || '',
      avatar: agenteSeleccionado.avatar || '',
      rol: agenteSeleccionado.rol || 'Agente',
      zonas: agenteSeleccionado.zona ? agenteSeleccionado.zona.split(', ') : [],
      ciudad: agenteSeleccionado.ciudad || 'Buenos Aires',
      provincia: agenteSeleccionado.provincia || 'Buenos Aires',
      licencia: agenteSeleccionado.licencia || '',
      experiencia: agenteSeleccionado.experiencia || '',
      idiomas: agenteSeleccionado.idiomas || [],
      telefonoAlternativo: agenteSeleccionado.telefonoAlternativo || '',
    });
    setEditMessage('');
    setShowEditModal(true);
  };

  // Función para guardar cambios del agente
  const handleSaveAgente = async (e) => {
    e.preventDefault();
    if (!editingAgente?._id) return;
    
    setSavingAgente(true);
    setEditMessage('');
    try {
      await api.put(`/crm/agentes/${editingAgente._id}`, {
        nombre: editingAgente.nombre,
        email: editingAgente.email,
        telefono: editingAgente.telefono,
        cargo: editingAgente.cargo,
        especialidad: editingAgente.especialidad,
        bio: editingAgente.bio,
        direccion: editingAgente.direccion,
        avatar: editingAgente.avatar,
        metadata: {
          rol: editingAgente.rol,
          zonas: editingAgente.zonas,
          ciudad: editingAgente.ciudad,
          provincia: editingAgente.provincia,
          licencia: editingAgente.licencia,
          experiencia: editingAgente.experiencia,
          idiomas: editingAgente.idiomas,
          telefonoAlternativo: editingAgente.telefonoAlternativo,
          notas: editingAgente.bio,
        },
      });
      
      setEditMessage('Agente actualizado correctamente');
      // Recargar datos
      loadAgentes();
      loadAgenteDetalle(editingAgente._id);
      
      setTimeout(() => {
        setShowEditModal(false);
        setEditMessage('');
      }, 1500);
    } catch (err) {
      setEditMessage(err?.message || 'Error al actualizar el agente');
    } finally {
      setSavingAgente(false);
    }
  };

  // Función para eliminar agente
  const handleDeleteAgente = async () => {
    if (!agenteSeleccionado?._id && !agenteSeleccionado?.id) return;
    
    setDeletingAgente(true);
    try {
      await api.delete(`/crm/agentes/${agenteSeleccionado._id || agenteSeleccionado.id}`);
      
      setShowDeleteConfirm(false);
      setAgenteSeleccionado(null);
      setVistaActual('lista');
      loadAgentes();
    } catch (err) {
      console.error('Error deleting agent:', err);
      toast.error(err?.message || 'Error al eliminar el agente');
    } finally {
      setDeletingAgente(false);
    }
  };

  // Handler para cambios en el formulario de edición
  const handleResetPassword = async (useCustom = false) => {
    const agenteId = agenteSeleccionado?._id || agenteSeleccionado?.id;
    if (!agenteId) return;
    setResettingPassword(true);
    try {
      const body = useCustom && customResetPassword.trim().length >= 6
        ? { password: customResetPassword.trim() }
        : {};
      const result = await api.post(`/crm/agentes/${agenteId}/reset-password`, body);
      setResetCredentials({ username: result.username, password: result.password });
      toast.success('Contraseña reseteada correctamente');
    } catch (err) {
      toast.error(err?.message || 'Error al resetear la contraseña');
    } finally {
      setResettingPassword(false);
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingAgente(prev => ({ ...prev, [name]: value }));
  };

  // Verificar si el formulario tiene datos
  const formHasData = () => {
    return nuevoAgente.nombre.trim() !== '' || 
           nuevoAgente.apellido.trim() !== '' || 
           nuevoAgente.email.trim() !== '' || 
           nuevoAgente.telefono.trim() !== '' ||
           nuevoAgente.username.trim() !== '' ||
           nuevoAgente.password.trim() !== '' ||
           nuevoAgente.direccion.trim() !== '' ||
           nuevoAgente.notas.trim() !== '';
  };

  // Manejar cierre del modal con confirmación
  const handleCloseModal = () => {
    if (formHasData()) {
      setShowCloseConfirm(true);
    } else {
      setShowModal(false);
    }
  };

  // Confirmar cierre y limpiar formulario
  const confirmCloseModal = () => {
    setShowCloseConfirm(false);
    setShowModal(false);
    setNuevoAgente({
      nombre: '',
      apellido: '',
      email: '',
      telefono: '',
      username: '',
      password: '',
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
      
      {/* Botones de Navegación */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button 
          onClick={volverAlDashboard}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-md ${vistaActual === 'dashboard' ? 'bg-blue-500 text-white' : isDark ? 'border border-gray-600 text-gray-200 hover:bg-gray-700' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
        >
          <FaChartLine /> Métricas de Agentes
        </button>
        <button 
          onClick={() => setVistaActual('lista')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm hover:shadow-md ${vistaActual === 'lista' ? 'bg-emerald-500 text-white' : isDark ? 'border border-gray-600 text-gray-200 hover:bg-gray-700' : 'border border-gray-200 text-gray-700 hover:bg-gray-50'}`}
        >
          <FaThLarge /> Ver Todos los Agentes
        </button>
        <button 
          onClick={() => {
            setShowModal(true);
            setCreateMessage('');
            setCreatedCredentials(null);
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-medium bg-indigo-500 hover:bg-indigo-600 transition-all shadow-sm hover:shadow-md"
        >
          <FaUserPlus /> Crear Cuenta
        </button>
      </div>

      {/* Vista Dashboard */}
      {vistaActual === 'dashboard' && (
        <>
      {/* KPIs del Equipo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpisEquipo.map((kpi, i) => {
          const colorMap = { 'from-blue-500 to-blue-600': '#3b82f6', 'from-emerald-500 to-emerald-600': '#10b981', 'from-violet-500 to-violet-600': '#8b5cf6', 'from-amber-500 to-amber-600': '#f59e0b' };
          const accentColor = colorMap[kpi.color] || '#6366f1';
          const bgMap = { 'from-blue-500 to-blue-600': 'bg-blue-50 dark:bg-blue-900/20', 'from-emerald-500 to-emerald-600': 'bg-emerald-50 dark:bg-emerald-900/20', 'from-violet-500 to-violet-600': 'bg-purple-50 dark:bg-purple-900/20', 'from-amber-500 to-amber-600': 'bg-amber-50 dark:bg-amber-900/20' };
          const bgColor = bgMap[kpi.color] || 'bg-indigo-50 dark:bg-indigo-900/20';
          return (
            <div 
              key={i} 
              onClick={() => {
                if (i === 0) setShowModalTotalAgentes(true);
                else if (i === 1) setShowModalPropiedadesGestionadas(true);
                else if (i === 2) setShowModalComisionesTotales(true);
                else if (i === 3) setShowModalRatingPromedio(true);
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
        {/* Meta del Equipo */}
        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-1">
            <FaTrophy className="text-emerald-500" />
            <h3 className="font-semibold dark:text-gray-100">Meta Equipo</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Progreso mensual</p>
          <Chart options={metaRadialOptions} series={metaRadialSeries} type="radialBar" height={200} />
          <div className="flex justify-between items-center pt-3 border-t dark:border-gray-700">
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{totalVentas}</p>
              <p className="text-xs text-gray-500">Actual</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-500">{metaTotalVentas}</p>
              <p className="text-xs text-gray-500">Meta</p>
            </div>
          </div>
        </div>

        {/* Satisfacción Cliente - Donut */}
        <div className={cardBase}>
          <div className="flex items-center gap-2 mb-1">
            <FaStar className="text-amber-500" />
            <h3 className="font-semibold dark:text-gray-100">Satisfacción</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Por agente</p>
          <Chart options={satisfaccionDonutOptions} series={satisfaccionDonutSeries} type="donut" height={240} />
        </div>

        {/* Comisiones por Agente - Bar */}
        <div className={`xl:col-span-2 ${cardBase}`}>
          <div className="flex items-center gap-2 mb-1">
            <FaDollarSign className="text-violet-500" />
            <h3 className="font-semibold dark:text-gray-100">Comisiones por Agente</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Ranking este mes</p>
          <Chart options={comisionesBarOptions} series={comisionesBarSeries} type="bar" height={240} />
        </div>
      </div>

      {/* Gráfico de Rendimiento - Full Width */}
      <div className="mb-8">
        <div className={cardBase}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <FaChartLine className="text-blue-500" />
                <h3 className="font-semibold dark:text-gray-100">Rendimiento del Equipo</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Ventas por agente (últimos 6 meses)</p>
            </div>
          </div>
          <Chart options={rendimientoAreaOptions} series={rendimientoAreaSeries} type="area" height={280} />
          <div className="grid grid-cols-5 gap-4 mt-4 pt-4 border-t dark:border-gray-700">
            {agentes.map((agente) => (
              <div key={agente.id} className="text-center p-2 rounded-lg" style={{ backgroundColor: `${agente.color}15` }}>
                <p className="text-lg font-bold" style={{ color: agente.color }}>{agente.ventas}</p>
                <p className="text-xs text-gray-500">{agente.nombre.split(' ')[0]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Listado de Agentes */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <div className={cardBase}>
          <h3 className="text-lg font-semibold mb-4 dark:text-gray-100">👥 Equipo de Agentes</h3>
          <div className="space-y-4">
            {agentes.map((agente) => (
              <div key={agente.id} className="border dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer" onClick={() => verDetalle(agente)}>
                <div className="flex items-center gap-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-lg"
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <th className="text-left py-3 px-3 font-semibold dark:text-gray-300">Agente</th>
                  <th className="text-center py-3 px-3 font-semibold dark:text-gray-300">Propiedades</th>
                  <th className="text-center py-3 px-3 font-semibold dark:text-gray-300">Clientes</th>
                  <th className="text-center py-3 px-3 font-semibold dark:text-gray-300">Ventas</th>
                  <th className="text-right py-3 px-3 font-semibold dark:text-gray-300">Comisiones</th>
                  <th className="text-left py-3 px-3 font-semibold dark:text-gray-300">Zonas</th>
                </tr>
              </thead>
              <tbody>
                {agentes.slice(0, 10).map((ag, idx) => (
                  <tr key={idx} className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-100 hover:bg-gray-50'} cursor-pointer`} onClick={() => verDetalle(ag)}>
                    <td className="py-2.5 px-3 font-medium dark:text-gray-200">{ag.nombre}</td>
                    <td className="py-2.5 px-3 text-center dark:text-gray-300">{ag.propiedades}</td>
                    <td className="py-2.5 px-3 text-center dark:text-gray-300">{ag.clientes}</td>
                    <td className="py-2.5 px-3 text-center dark:text-gray-300">{ag.ventas}</td>
                    <td className="py-2.5 px-3 text-right dark:text-gray-300">${Number(ag.comisiones || 0).toLocaleString()}</td>
                    <td className="py-2.5 px-3 dark:text-gray-300">{ag.zona}</td>
                  </tr>
                ))}
                {!agentes.length && (
                  <tr><td colSpan={6} className="py-8 text-center text-gray-400">No hay agentes registrados</td></tr>
                )}
              </tbody>
            </table>
          </div>
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
        <>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400">Cargando agentes...</p>
              </div>
            </div>
          ) : agentes.length === 0 ? (
            <div className="text-center py-20">
              <FaUsers className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-500 dark:text-gray-400 mb-2">No hay agentes registrados</h3>
              <p className="text-gray-400 dark:text-gray-500 mb-4">Creá un nuevo agente para comenzar</p>
              <button 
                onClick={() => setShowModal(true)}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <FaUserPlus className="inline mr-2" /> Crear Agente
              </button>
            </div>
          ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agentes.map((agente) => (
            <div key={agente.id || agente._id} className={`${cardBase} hover:shadow-xl cursor-pointer`} onClick={() => verDetalle(agente)}>
              {/* Header con avatar y rating */}
              <div className="flex items-center gap-4 mb-4 pb-4 border-b dark:border-gray-700">
                {agente.avatar ? (
                  <img 
                    src={agente.avatar} 
                    alt={agente.nombre}
                    className="w-20 h-20 rounded-full object-cover border-4 border-white dark:border-gray-700 shadow-lg"
                  />
                ) : (
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                  style={{ backgroundColor: agente.color }}
                >
                  {agente.nombre.charAt(0)}{agente.nombre.split(' ')[1]?.charAt(0) || ''}
                </div>
                )}
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
        </>
      )}

      {/* Vista Detalle de Agente */}
      {vistaActual === 'detalle' && (loadingDetalle ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">Cargando información del agente...</p>
          </div>
        </div>
      ) : agenteSeleccionado && (
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
                <button 
                  onClick={handleEditAgente}
                  className="px-4 py-2 bg-white text-gray-800 rounded-full hover:bg-opacity-90 transition-colors flex items-center gap-2 font-semibold"
                >
                  <FaEdit /> Editar
                </button>
                <button
                  onClick={() => { setShowResetPasswordModal(true); setResetCredentials(null); setCustomResetPassword(''); }}
                  className="px-4 py-2 bg-amber-500 text-white rounded-full hover:bg-amber-600 transition-colors flex items-center gap-2 font-semibold"
                >
                  <FaKey /> Resetear Clave
                </button>
                <button 
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center gap-2 font-semibold"
                >
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
                      style={{ width: `${agenteSeleccionado.metaMensual > 0 ? Math.min(100, (agenteSeleccionado.ventas / agenteSeleccionado.metaMensual) * 100) : 0}%` }}
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
      ))}

      {/* Modal de Crear Cuenta */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            {/* Header del Modal */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaUserPlus /> Crear Cuenta
                </h2>
                <p className="text-blue-100 text-sm mt-1">Complete los datos del nuevo agente</p>
              </div>
              <button
                onClick={handleCloseModal}
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
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Usuario</label>
                    <input
                      type="text"
                      name="username"
                      value={nuevoAgente.username}
                      onChange={handleInputChange}
                      placeholder="(opcional)"
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
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Password</label>
                    <input
                      type="text"
                      name="password"
                      value={nuevoAgente.password}
                      onChange={handleInputChange}
                      placeholder="(opcional: si lo dejás vacío se genera automáticamente)"
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

              {createMessage && (
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 px-4 py-3 text-sm dark:text-gray-200">
                  {createMessage}
                </div>
              )}

              {createdCredentials?.username && createdCredentials?.password && (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm">
                  <div className="font-semibold">Credenciales</div>
                  <div><strong>Usuario:</strong> {createdCredentials.username}</div>
                  <div><strong>Password:</strong> {createdCredentials.password}</div>
                </div>
              )}

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
                  disabled={creatingAgente}
                  className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2 disabled:opacity-60"
                >
                  <FaSave /> {creatingAgente ? 'Guardando...' : 'Guardar Agente'}
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

      {/* Modal de Editar Agente */}
      {showEditModal && editingAgente && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-green-500 to-teal-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-3">
                  <FaEdit /> Editar Agente
                </h2>
                <p className="text-green-100 text-sm mt-1">{editingAgente.nombre}</p>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
              >
                <FaTimes className="text-2xl" />
              </button>
            </div>

            {/* Formulario */}
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleSaveAgente} className="space-y-4">
                {editMessage && (
                  <div className={`p-3 rounded-lg text-center ${editMessage.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {editMessage}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Nombre Completo *</label>
                    <input
                      type="text"
                      name="nombre"
                      value={editingAgente.nombre}
                      onChange={handleEditInputChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={editingAgente.email}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Teléfono</label>
                    <input
                      type="tel"
                      name="telefono"
                      value={editingAgente.telefono}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Cargo</label>
                    <select
                      name="cargo"
                      value={editingAgente.cargo}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100"
                    >
                      <option value="Agente">Agente</option>
                      <option value="Agente Senior">Agente Senior</option>
                      <option value="Supervisor">Supervisor</option>
                      <option value="Gerente">Gerente</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Especialidad</label>
                    <select
                      name="especialidad"
                      value={editingAgente.especialidad}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100"
                    >
                      <option value="Ventas">Ventas</option>
                      <option value="Alquileres">Alquileres</option>
                      <option value="Comercial">Comercial</option>
                      <option value="Residencial">Residencial</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Experiencia</label>
                    <input
                      type="text"
                      name="experiencia"
                      value={editingAgente.experiencia}
                      onChange={handleEditInputChange}
                      placeholder="Ej: 5 años"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Licencia</label>
                    <input
                      type="text"
                      name="licencia"
                      value={editingAgente.licencia}
                      onChange={handleEditInputChange}
                      placeholder="Ej: CPI-12345"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-200">Ciudad</label>
                    <input
                      type="text"
                      name="ciudad"
                      value={editingAgente.ciudad}
                      onChange={handleEditInputChange}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-200">Dirección</label>
                  <input
                    type="text"
                    name="direccion"
                    value={editingAgente.direccion}
                    onChange={handleEditInputChange}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-200">Bio / Notas</label>
                  <textarea
                    name="bio"
                    value={editingAgente.bio}
                    onChange={handleEditInputChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingAgente}
                    className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {savingAgente ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <FaSave /> Guardar Cambios
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteConfirm && agenteSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-md w-full p-6`}>
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaTrash className="text-3xl text-red-500" />
              </div>
              <h3 className="text-xl font-bold dark:text-gray-100 mb-2">¿Eliminar Agente?</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                ¿Estás seguro de que deseas eliminar a <strong>{agenteSeleccionado.nombre}</strong>? 
                Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteAgente}
                  disabled={deletingAgente}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {deletingAgente ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Eliminando...
                    </>
                  ) : (
                    <>
                      <FaTrash /> Eliminar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Resetear Contraseña */}
      {showResetPasswordModal && agenteSeleccionado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-md w-full p-6`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold dark:text-gray-100 flex items-center gap-2">
                <FaKey className="text-amber-500" /> Resetear Contraseña
              </h3>
              <button onClick={() => setShowResetPasswordModal(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <FaTimes className="text-xl" />
              </button>
            </div>

            <p className={`text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Resetear la contraseña de <strong>{agenteSeleccionado.nombre}</strong>
            </p>

            {!resetCredentials ? (
              <>
                <div className="mb-4">
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>Nueva contraseña (opcional, mín. 6 caracteres)</label>
                  <input
                    type="text"
                    value={customResetPassword}
                    onChange={(e) => setCustomResetPassword(e.target.value)}
                    placeholder="Dejar vacío para generar automáticamente"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 ${isDark ? 'bg-gray-800 border-gray-600 text-gray-100' : 'border-gray-300'}`}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowResetPasswordModal(false)}
                    className={`flex-1 py-2.5 rounded-xl border-2 font-medium ${isDark ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'}`}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleResetPassword(customResetPassword.trim().length >= 6)}
                    disabled={resettingPassword || (customResetPassword.trim().length > 0 && customResetPassword.trim().length < 6)}
                    className="flex-1 py-2.5 rounded-xl text-white font-medium bg-amber-500 hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {resettingPassword ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Reseteando...</> : <><FaKey /> Resetear</>}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={`p-4 rounded-xl border-2 border-dashed mb-4 ${isDark ? 'border-amber-500/50 bg-amber-900/20' : 'border-amber-300 bg-amber-50'}`}>
                  <p className={`text-xs font-medium mb-3 ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>Nuevas credenciales (se muestran una sola vez)</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Usuario:</span>
                      <div className="flex items-center gap-2">
                        <code className={`text-sm font-bold px-2 py-1 rounded ${isDark ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}>{resetCredentials.username}</code>
                        <button onClick={() => { navigator.clipboard.writeText(resetCredentials.username); toast.info('Usuario copiado'); }} className="text-gray-400 hover:text-gray-600"><FaCopy /></button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Contraseña:</span>
                      <div className="flex items-center gap-2">
                        <code className={`text-sm font-bold px-2 py-1 rounded ${isDark ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`}>{resetCredentials.password}</code>
                        <button onClick={() => { navigator.clipboard.writeText(resetCredentials.password); toast.info('Contraseña copiada'); }} className="text-gray-400 hover:text-gray-600"><FaCopy /></button>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowResetPasswordModal(false)}
                  className="w-full py-2.5 rounded-xl text-white font-medium transition-all"
                  style={{ backgroundColor: currentColor }}
                >
                  Cerrar
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Cierre */}
      {showCloseConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-md w-full p-6`}>
            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaExclamationTriangle className="text-3xl text-yellow-500" />
              </div>
              <h3 className="text-xl font-bold dark:text-gray-100 mb-2">¿Cerrar formulario?</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Si cierra el formulario perderá los cambios ingresados.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowCloseConfirm(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200 transition-colors"
                >
                  Continuar editando
                </button>
                <button
                  onClick={confirmCloseModal}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Cerrar y descartar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agentes;
