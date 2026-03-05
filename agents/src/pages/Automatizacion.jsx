import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { confirmToast } from '../utils/confirmToast';
import { Header } from '../components';
import { useStateContext } from '../contexts/ContextProvider';
import { FaRobot, FaPlus, FaCog, FaChartLine, FaBolt, FaEnvelope, FaSms, FaBell, FaUserPlus, FaClock, FaBirthdayCake, FaFileAlt, FaHandshake, FaStar, FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaCalendarAlt, FaPlay, FaPause, FaTrash, FaTimes, FaSave, FaSync } from 'react-icons/fa';
import automationService from '../services/automationService';

const Automatizacion = () => {
  const { currentMode, currentColor } = useStateContext();
  const [automatizaciones, setAutomatizaciones] = useState([]);
  const [stats, setStats] = useState({ activas: 0, totalEjecuciones: 0, tasaExito: 0, disparosHoy: 0 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [templates, setTemplates] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [saving, setSaving] = useState(false);

  // Icons for automation types
  const typeIcons = {
    bienvenida: <FaUserPlus />,
    seguimiento_contacto: <FaClock />,
    cumpleanos: <FaBirthdayCake />,
    seguimiento_propuesta: <FaFileAlt />,
    renovacion: <FaHandshake />,
    evento_especial: <FaStar />,
    feedback: <FaCheckCircle />,
    inactividad: <FaExclamationTriangle />,
    cumpleanos_contacto: <FaBirthdayCake />,
    objetivo: <FaCalendarAlt />,
    vencimiento_documento: <FaTimesCircle />,
    hito: <FaStar />,
    fecha_importante: <FaCalendarAlt />,
  };

  const typeColors = {
    bienvenida: 'green',
    seguimiento_contacto: 'blue',
    cumpleanos: 'pink',
    seguimiento_propuesta: 'purple',
    renovacion: 'orange',
    evento_especial: 'yellow',
    feedback: 'teal',
    inactividad: 'red',
    cumpleanos_contacto: 'pink',
    objetivo: 'indigo',
    vencimiento_documento: 'orange',
    hito: 'amber',
    fecha_importante: 'blue',
  };

  const typeLabels = {
    bienvenida: 'Bienvenida',
    seguimiento_contacto: 'Seguimiento',
    cumpleanos: 'Cumpleaños',
    seguimiento_propuesta: 'Propuestas',
    renovacion: 'Renovación',
    evento_especial: 'Eventos',
    feedback: 'Feedback',
    inactividad: 'Inactividad',
    cumpleanos_contacto: 'Cumpleaños Contacto',
    objetivo: 'Objetivos',
    vencimiento_documento: 'Documentos',
    hito: 'Hitos',
    fecha_importante: 'Fechas Argentina',
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [rules, statsData, templatesData] = await Promise.all([
        automationService.getAutomations(),
        automationService.getStats(),
        automationService.getTemplates(),
      ]);
      setAutomatizaciones(Array.isArray(rules) ? rules : []);
      setStats(statsData || { activas: 0, totalEjecuciones: 0, tasaExito: 0, disparosHoy: 0 });
      setTemplates(templatesData || {});
    } catch (err) {
      console.error('Error loading automations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggle = async (id) => {
    try {
      const updated = await automationService.toggleAutomation(id);
      setAutomatizaciones(prev => prev.map(a => a._id === id ? updated : a));
      loadData(); // Refresh stats
    } catch (err) {
      console.error('Error toggling automation:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!(await confirmToast('¿Estás seguro de eliminar esta automatización?'))) return;
    try {
      await automationService.deleteAutomation(id);
      setAutomatizaciones(prev => prev.filter(a => a._id !== id));
      loadData(); // Refresh stats
    } catch (err) {
      console.error('Error deleting automation:', err);
    }
  };

  const handleExecute = async (id) => {
    try {
      await automationService.executeAutomation(id);
      toast.success('Automatización ejecutada correctamente. Se ha creado una notificación de prueba.');
      loadData();
    } catch (err) {
      console.error('Error executing automation:', err);
    }
  };

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate) return;
    try {
      setSaving(true);
      await automationService.createAutomation({ template: selectedTemplate });
      // Check milestones (non-blocking)
      try { const { crmService } = await import('../services/crmService'); crmService.rewards.checkMilestones('automation').catch(() => {}); } catch (_) {}
      setShowModal(false);
      setSelectedTemplate('');
      loadData();
    } catch (err) {
      console.error('Error creating automation:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleInitializeDefaults = async () => {
    try {
      setSaving(true);
      const result = await automationService.initializeDefaults();
      toast.success(`Se crearon ${result.created || 0} automatizaciones por defecto.`);
      loadData();
    } catch (err) {
      console.error('Error initializing defaults:', err);
    } finally {
      setSaving(false);
    }
  };

  const cardBase = `bg-white dark:bg-secondary-dark-bg rounded-2xl p-6 shadow-lg`;

  const getColorClasses = (color) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      orange: 'from-orange-500 to-orange-600',
      purple: 'from-purple-500 to-purple-600',
      pink: 'from-pink-500 to-pink-600',
      yellow: 'from-yellow-500 to-yellow-600',
      teal: 'from-teal-500 to-teal-600',
      red: 'from-red-500 to-red-600',
      indigo: 'from-indigo-500 to-indigo-600',
      amber: 'from-amber-500 to-amber-600',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className={`min-h-screen px-6 lg:px-8 pt-4 pb-6 ${currentMode === 'Dark' ? 'bg-main-dark-bg' : 'bg-gray-50'}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className={`text-lg font-semibold flex items-center gap-2 ${currentMode === 'Dark' ? 'text-white' : 'text-gray-900'}`}>
            <FaRobot className="text-indigo-500" /> Centro de Automatización
          </h2>
          <p className={`text-sm mt-1 ${currentMode === 'Dark' ? 'text-gray-400' : 'text-gray-500'}`}>Reglas y flujos automatizados</p>
        </div>
        <div className="flex gap-3">
          <a
            href="/crm/fechas-importantes"
            className="flex items-center gap-2 px-4 py-3 rounded-lg border-2 font-medium transition-all hover:shadow-md"
            style={{ borderColor: currentColor, color: currentColor }}
          >
            <FaCalendarAlt /> Fechas Argentina
          </a>
          {automatizaciones.length === 0 && (
            <button
              onClick={handleInitializeDefaults}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-3 rounded-lg border-2 font-medium transition-all hover:shadow-md disabled:opacity-50"
              style={{ borderColor: currentColor, color: currentColor }}
            >
              <FaSync className={saving ? 'animate-spin' : ''} /> Crear Predeterminadas
            </button>
          )}
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium shadow-lg hover:shadow-xl transition-all"
            style={{ backgroundColor: currentColor }}
          >
            <FaPlus /> Nueva Automatización
          </button>
        </div>
      </div>

      {/* Estadísticas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className={`${cardBase} bg-gradient-to-br from-blue-500 to-blue-600 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm mb-1">Automatizaciones Activas</p>
              <p className="text-4xl font-bold">{stats.activas}</p>
            </div>
            <FaRobot className="text-5xl opacity-30" />
          </div>
        </div>

        <div className={`${cardBase} bg-gradient-to-br from-green-500 to-green-600 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm mb-1">Disparos Hoy</p>
              <p className="text-4xl font-bold">{stats.disparosHoy}</p>
            </div>
            <FaBolt className="text-5xl opacity-30" />
          </div>
        </div>

        <div className={`${cardBase} bg-gradient-to-br from-purple-500 to-purple-600 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm mb-1">Tasa de Éxito</p>
              <p className="text-4xl font-bold">{stats.tasaExito}%</p>
            </div>
            <FaChartLine className="text-5xl opacity-30" />
          </div>
        </div>

        <div className={`${cardBase} bg-gradient-to-br from-orange-500 to-orange-600 text-white`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm mb-1">Total Ejecuciones</p>
              <p className="text-4xl font-bold">{stats.totalEjecuciones}</p>
            </div>
            <FaCog className="text-5xl opacity-30" />
          </div>
        </div>
      </div>

      {/* Grid de Automatizaciones */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: currentColor }}></div>
        </div>
      ) : automatizaciones.length === 0 ? (
        <div className={`${cardBase} text-center py-16`}>
          <FaRobot className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-600 dark:text-gray-400 mb-2">No hay automatizaciones configuradas</h3>
          <p className="text-gray-500 dark:text-gray-500 mb-6">Comienza creando tus primeras automatizaciones para mejorar la interacción con tus clientes.</p>
          <button
            onClick={handleInitializeDefaults}
            disabled={saving}
            className="px-6 py-3 rounded-lg text-white font-medium transition-all hover:shadow-lg disabled:opacity-50"
            style={{ backgroundColor: currentColor }}
          >
            {saving ? 'Creando...' : 'Crear Automatizaciones Predeterminadas'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {automatizaciones.map((auto) => {
            const color = typeColors[auto.tipo] || 'blue';
            const icon = typeIcons[auto.tipo] || <FaBell />;
            const label = typeLabels[auto.tipo] || auto.tipo;
            const ejecutadas = auto.estadisticas?.vecesEjecutada || 0;
            const exitosas = auto.estadisticas?.exitosas || 0;
            const tasa = ejecutadas > 0 ? Math.round((exitosas / ejecutadas) * 100) : 0;
            
            return (
              <div key={auto._id} className={cardBase}>
                <div className={`bg-gradient-to-br ${getColorClasses(color)} text-white p-4 rounded-lg mb-4`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{icon}</div>
                      <div>
                        <h3 className="text-lg font-bold">{auto.nombre}</h3>
                        <p className="text-sm opacity-90">{label}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${auto.activo ? 'bg-white bg-opacity-20' : 'bg-black bg-opacity-20'}`}>
                      ● {auto.activo ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </div>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-4">{auto.descripcion}</p>

                {auto.accion?.sincronizarCalendar && (
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 mb-4">
                    <FaCalendarAlt />
                    <span>Sincroniza con Google Calendar</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Ejecuciones</p>
                    <p className="text-2xl font-bold" style={{ color: currentColor }}>{ejecutadas}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tasa de Éxito</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{tasa}%</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleToggle(auto._id)}
                    className={`flex-1 py-2 rounded-lg border-2 font-medium transition-colors flex items-center justify-center gap-2 ${
                      auto.activo 
                        ? 'border-orange-500 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20' 
                        : 'border-green-500 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
                    }`}
                  >
                    {auto.activo ? <><FaPause /> Pausar</> : <><FaPlay /> Activar</>}
                  </button>
                  <button
                    onClick={() => handleExecute(auto._id)}
                    className="flex-1 py-2 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
                    style={{ backgroundColor: currentColor }}
                  >
                    <FaBolt /> Probar
                  </button>
                  <button
                    onClick={() => handleDelete(auto._id)}
                    className="px-4 py-2 rounded-lg border-2 border-red-500 text-red-500 font-medium transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sección de IA */}
      <div className={`${cardBase} mt-8 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-200 dark:border-indigo-800`}>
        <div className="flex items-start gap-4">
          <FaRobot className="text-6xl text-indigo-600 dark:text-indigo-400" />
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-2 text-indigo-900 dark:text-indigo-100">
              Automatización con Inteligencia Artificial
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Utiliza IA para predecir comportamiento de clientes, optimizar asignación de leads y personalizar comunicaciones automáticamente.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="font-bold mb-2 dark:text-gray-200">🎯 Scoring Predictivo</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Califica leads automáticamente según probabilidad de conversión</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="font-bold mb-2 dark:text-gray-200">💬 Respuestas Inteligentes</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Genera respuestas personalizadas usando procesamiento de lenguaje natural</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="font-bold mb-2 dark:text-gray-200">📊 Análisis Predictivo</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Predice tendencias y comportamientos futuros de clientes</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Nueva Automatización */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${cardBase} max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold dark:text-white">Nueva Automatización</h2>
              <button 
                onClick={() => { setShowModal(false); setSelectedTemplate(''); }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Selecciona un tipo de automatización para crear. Cada tipo tiene una plantilla predefinida que puedes personalizar después.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {Object.entries(typeLabels).map(([tipo, label]) => {
                const color = typeColors[tipo] || 'blue';
                const icon = typeIcons[tipo] || <FaBell />;
                const isSelected = selectedTemplate === tipo;
                
                return (
                  <button
                    key={tipo}
                    onClick={() => setSelectedTemplate(tipo)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      isSelected 
                        ? 'border-current shadow-lg scale-[1.02]' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                    style={isSelected ? { borderColor: currentColor, backgroundColor: `${currentColor}10` } : {}}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className={`p-3 rounded-lg bg-gradient-to-br ${getColorClasses(color)} text-white`}
                      >
                        {icon}
                      </div>
                      <div>
                        <h4 className="font-bold dark:text-white">{label}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {templates[tipo]?.descripcion || 'Automatización personalizada'}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => { setShowModal(false); setSelectedTemplate(''); }}
                className="px-6 py-3 rounded-lg border-2 font-medium transition-all hover:shadow-md"
                style={{ borderColor: currentColor, color: currentColor }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateFromTemplate}
                disabled={!selectedTemplate || saving}
                className="px-6 py-3 rounded-lg text-white font-medium transition-all hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                style={{ backgroundColor: currentColor }}
              >
                {saving ? (
                  <>
                    <FaSync className="animate-spin" /> Creando...
                  </>
                ) : (
                  <>
                    <FaSave /> Crear Automatización
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Automatizacion;
