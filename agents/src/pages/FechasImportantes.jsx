import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaToggleOn, FaToggleOff, FaEdit, FaSave, FaTimes, FaPlus, FaBell, FaUsers, FaFilter, FaSearch, FaSyncAlt, FaBirthdayCake, FaHeart, FaFlag, FaGift, FaBriefcase, FaChild, FaLeaf, FaShoppingCart, FaArrowLeft } from 'react-icons/fa';
import { Header } from '../components';
import { useStateContext } from '../contexts/ContextProvider';
import { api } from '../config/api';

const FechasImportantes = () => {
  const navigate = useNavigate();
  const { currentMode, currentColor } = useStateContext();
  const [fechas, setFechas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('todos');
  const [editingFecha, setEditingFecha] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [selectedFecha, setSelectedFecha] = useState(null);
  const [automationConfig, setAutomationConfig] = useState({
    activo: true,
    plantillaTitulo: '',
    plantillaMensaje: '',
    prioridad: 'media',
    sincronizarCalendar: false,
    enviarAlCliente: false,
    canalCliente: 'preferencia',
  });

  const tipoIcons = {
    feriado_nacional: <FaFlag className="text-blue-500" />,
    dia_especial: <FaHeart className="text-pink-500" />,
    comercial: <FaShoppingCart className="text-green-500" />,
    conmemorativo: <FaCalendarAlt className="text-purple-500" />,
  };

  const tipoLabels = {
    feriado_nacional: 'Feriado Nacional',
    dia_especial: 'Día Especial',
    comercial: 'Comercial',
    conmemorativo: 'Conmemorativo',
  };

  const fetchFechas = useCallback(async () => {
    setLoading(true);
    try {
      const year = new Date().getFullYear();
      const data = await api.get(`/crm/fechas-importantes/calculadas/${year}`);
      setFechas(data || []);
    } catch (err) {
      console.error('Error fetching fechas:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFechas();
  }, [fetchFechas]);

  const handleToggleActivo = async (fecha) => {
    try {
      await api.patch(`/crm/fechas-importantes/${fecha.codigo}/toggle`);
      fetchFechas();
    } catch (err) {
      console.error('Error toggling fecha:', err);
    }
  };

  const handleSeedFechas = async () => {
    try {
      await api.post('/crm/fechas-importantes/seed', {});
      fetchFechas();
    } catch (err) {
      console.error('Error seeding fechas:', err);
    }
  };

  const handleOpenConfig = (fecha) => {
    setSelectedFecha(fecha);
    setAutomationConfig({
      activo: true,
      plantillaTitulo: fecha.plantillaTitulo || '',
      plantillaMensaje: fecha.plantillaMensaje || '',
      prioridad: fecha.prioridad || 'media',
      sincronizarCalendar: false,
      enviarAlCliente: false,
      canalCliente: 'preferencia',
    });
    setShowConfigModal(true);
  };

  const handleSaveConfig = async () => {
    if (!selectedFecha) return;
    try {
      await api.put(`/crm/fechas-importantes/${selectedFecha.codigo}`, {
        plantillaTitulo: automationConfig.plantillaTitulo,
        plantillaMensaje: automationConfig.plantillaMensaje,
        prioridad: automationConfig.prioridad,
      });
      setShowConfigModal(false);
      fetchFechas();
    } catch (err) {
      console.error('Error saving config:', err);
    }
  };

  const filteredFechas = fechas.filter(f => {
    const matchesSearch = f.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.descripcion?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = filterTipo === 'todos' || f.tipo === filterTipo;
    return matchesSearch && matchesTipo;
  });

  const cardBase = `rounded-xl p-4 shadow-md ${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-white'}`;

  const getSegmentacionBadges = (segmentacion) => {
    const badges = [];
    if (segmentacion?.genero === 'femenino') badges.push({ label: 'Mujeres', color: 'pink' });
    if (segmentacion?.genero === 'masculino') badges.push({ label: 'Hombres', color: 'blue' });
    if (segmentacion?.requierePadre) badges.push({ label: 'Padres', color: 'indigo' });
    if (segmentacion?.requiereMadre) badges.push({ label: 'Madres', color: 'purple' });
    if (segmentacion?.requiereHijos) badges.push({ label: 'Con hijos', color: 'green' });
    return badges;
  };

  return (
    <div className="m-2 md:m-10 mt-24 p-2 md:p-6 bg-gray-50 dark:bg-gray-900 rounded-3xl min-h-screen">
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => navigate('/crm/automatizacion')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 font-medium transition-all hover:shadow-md"
          style={{ borderColor: currentColor, color: currentColor }}
        >
          <FaArrowLeft /> Volver
        </button>
        <div className="flex-1">
          <Header category="CRM" title="Fechas Importantes de Argentina" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className={`${cardBase} flex items-center gap-4`}>
          <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
            <FaCalendarAlt className="text-2xl text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold dark:text-white">{fechas.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Fechas</p>
          </div>
        </div>
        <div className={`${cardBase} flex items-center gap-4`}>
          <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
            <FaToggleOn className="text-2xl text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold dark:text-white">{fechas.filter(f => f.activo).length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Activas</p>
          </div>
        </div>
        <div className={`${cardBase} flex items-center gap-4`}>
          <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
            <FaFlag className="text-2xl text-purple-500" />
          </div>
          <div>
            <p className="text-2xl font-bold dark:text-white">{fechas.filter(f => f.tipo === 'feriado_nacional').length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Feriados</p>
          </div>
        </div>
        <div className={`${cardBase} flex items-center gap-4`}>
          <div className="p-3 rounded-full bg-pink-100 dark:bg-pink-900">
            <FaHeart className="text-2xl text-pink-500" />
          </div>
          <div>
            <p className="text-2xl font-bold dark:text-white">{fechas.filter(f => f.tipo === 'dia_especial').length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Días Especiales</p>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className={`${cardBase} mb-6`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar fecha..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="todos">Todos los tipos</option>
              <option value="feriado_nacional">Feriados Nacionales</option>
              <option value="dia_especial">Días Especiales</option>
              <option value="comercial">Comerciales</option>
              <option value="conmemorativo">Conmemorativos</option>
            </select>
          </div>
          <button
            onClick={handleSeedFechas}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
          >
            <FaSyncAlt /> Sincronizar Fechas
          </button>
        </div>
      </div>

      {/* Fechas Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFechas.map((fecha) => (
            <div key={fecha.codigo} className={`${cardBase} hover:shadow-lg transition-shadow`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700">
                    {tipoIcons[fecha.tipo] || <FaCalendarAlt className="text-gray-500" />}
                  </div>
                  <div>
                    <h3 className="font-semibold dark:text-white">{fecha.nombre}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {fecha.fechaFormateada}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleActivo(fecha)}
                  className={`text-2xl ${fecha.activo ? 'text-green-500' : 'text-gray-400'}`}
                >
                  {fecha.activo ? <FaToggleOn /> : <FaToggleOff />}
                </button>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                {fecha.descripcion}
              </p>

              <div className="flex flex-wrap gap-1 mb-3">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  fecha.tipo === 'feriado_nacional' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                  fecha.tipo === 'dia_especial' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300' :
                  fecha.tipo === 'comercial' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                  'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                }`}>
                  {tipoLabels[fecha.tipo]}
                </span>
                {getSegmentacionBadges(fecha.segmentacion).map((badge, idx) => (
                  <span key={idx} className={`text-xs px-2 py-1 rounded-full bg-${badge.color}-100 text-${badge.color}-700 dark:bg-${badge.color}-900 dark:text-${badge.color}-300`}>
                    {badge.label}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 border-t dark:border-gray-700">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  fecha.prioridad === 'alta' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                  fecha.prioridad === 'media' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                  'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  Prioridad: {fecha.prioridad}
                </span>
                <button
                  onClick={() => handleOpenConfig(fecha)}
                  className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-700"
                >
                  <FaEdit /> Configurar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Configuration Modal */}
      {showConfigModal && selectedFecha && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className={`${currentMode === 'Dark' ? 'bg-gray-900' : 'bg-white'} rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col`}>
            <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <FaBell /> Configurar Automatización
                </h2>
                <p className="text-blue-100 text-sm mt-1">{selectedFecha.nombre}</p>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2"
              >
                <FaTimes className="text-xl" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  Título del Mensaje
                </label>
                <input
                  type="text"
                  value={automationConfig.plantillaTitulo}
                  onChange={(e) => setAutomationConfig({ ...automationConfig, plantillaTitulo: e.target.value })}
                  placeholder="Ej: ¡Feliz {{fecha.nombre}}, {{cliente.nombre}}!"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">Variables: {'{{cliente.nombre}}'}, {'{{empresa.nombre}}'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                  Mensaje
                </label>
                <textarea
                  value={automationConfig.plantillaMensaje}
                  onChange={(e) => setAutomationConfig({ ...automationConfig, plantillaMensaje: e.target.value })}
                  rows={4}
                  placeholder="Escribe el mensaje personalizado..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                    Prioridad
                  </label>
                  <select
                    value={automationConfig.prioridad}
                    onChange={(e) => setAutomationConfig({ ...automationConfig, prioridad: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                    <option value="urgente">Urgente</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-200">
                    Canal de Comunicación
                  </label>
                  <select
                    value={automationConfig.canalCliente}
                    onChange={(e) => setAutomationConfig({ ...automationConfig, canalCliente: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="preferencia">Preferencia del Cliente</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={automationConfig.sincronizarCalendar}
                    onChange={(e) => setAutomationConfig({ ...automationConfig, sincronizarCalendar: e.target.checked })}
                    className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
                  />
                  <span className="dark:text-gray-200">Sincronizar con Google Calendar</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={automationConfig.enviarAlCliente}
                    onChange={(e) => setAutomationConfig({ ...automationConfig, enviarAlCliente: e.target.checked })}
                    className="w-5 h-5 text-blue-500 rounded focus:ring-blue-500"
                  />
                  <span className="dark:text-gray-200">Enviar mensaje directo al cliente</span>
                </label>
              </div>

              <div className={`p-4 rounded-lg ${currentMode === 'Dark' ? 'bg-gray-800' : 'bg-blue-50'}`}>
                <h4 className="font-semibold mb-2 dark:text-gray-200 flex items-center gap-2">
                  <FaUsers /> Segmentación Automática
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Esta fecha se enviará automáticamente a clientes que cumplan con los criterios definidos:
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedFecha.segmentacion?.genero && selectedFecha.segmentacion.genero !== 'todos' && (
                    <span className="text-xs px-2 py-1 rounded-full bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300">
                      Género: {selectedFecha.segmentacion.genero}
                    </span>
                  )}
                  {selectedFecha.segmentacion?.requierePadre && (
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                      Solo Padres
                    </span>
                  )}
                  {selectedFecha.segmentacion?.requiereMadre && (
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                      Solo Madres
                    </span>
                  )}
                  {selectedFecha.segmentacion?.requiereHijos && (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                      Con Hijos
                    </span>
                  )}
                  {(!selectedFecha.segmentacion || 
                    (selectedFecha.segmentacion.genero === 'todos' && 
                     !selectedFecha.segmentacion.requierePadre && 
                     !selectedFecha.segmentacion.requiereMadre && 
                     !selectedFecha.segmentacion.requiereHijos)) && (
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      Todos los clientes
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 p-4 border-t dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveConfig}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:opacity-90"
              >
                <FaSave /> Guardar Configuración
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FechasImportantes;
