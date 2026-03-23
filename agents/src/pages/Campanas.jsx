import React, { useState } from 'react';
import { FaPlus, FaPlay, FaPause, FaEdit, FaTrash, FaChartLine, FaUsers, FaEye, FaMousePointer, FaBullhorn } from 'react-icons/fa';
import { MdOutlineEmail } from 'react-icons/md';
import { useStateContext } from '../contexts/ContextProvider';

const Campanas = () => {
  const { currentMode, currentColor } = useStateContext();
  const [, setShowModal] = useState(false);

  const campanas = [
    {
      id: 1,
      nombre: 'Lanzamiento Nuevas Propiedades',
      tipo: 'Email',
      estado: 'activa',
      audiencia: 1250,
      enviados: 1250,
      abiertos: 687,
      clicks: 234,
      conversiones: 45,
      tasaApertura: 55,
      tasaClick: 18.7,
      tasaConversion: 3.6,
      fechaInicio: '01/10/2025',
      fechaFin: '15/10/2025',
      color: 'blue',
    },
    {
      id: 2,
      nombre: 'Promoción Fin de Mes',
      tipo: 'Email + SMS',
      estado: 'activa',
      audiencia: 890,
      enviados: 890,
      abiertos: 534,
      clicks: 178,
      conversiones: 32,
      tasaApertura: 60,
      tasaClick: 20,
      tasaConversion: 3.6,
      fechaInicio: '10/10/2025',
      fechaFin: '31/10/2025',
      color: 'green',
    },
    {
      id: 3,
      nombre: 'Reactivación Clientes Inactivos',
      tipo: 'Email',
      estado: 'programada',
      audiencia: 456,
      enviados: 0,
      abiertos: 0,
      clicks: 0,
      conversiones: 0,
      tasaApertura: 0,
      tasaClick: 0,
      tasaConversion: 0,
      fechaInicio: '20/10/2025',
      fechaFin: '30/10/2025',
      color: 'orange',
    },
    {
      id: 4,
      nombre: 'Newsletter Mensual',
      tipo: 'Email',
      estado: 'completada',
      audiencia: 2100,
      enviados: 2100,
      abiertos: 1260,
      clicks: 420,
      conversiones: 67,
      tasaApertura: 60,
      tasaClick: 20,
      tasaConversion: 3.2,
      fechaInicio: '01/09/2025',
      fechaFin: '30/09/2025',
      color: 'purple',
    },
  ];

  const isDark = currentMode === 'Dark';
  const cardBase = `rounded-2xl p-6 border transition-shadow ${isDark ? 'bg-secondary-dark-bg border-gray-700/50 hover:border-indigo-500/30' : 'bg-white border-gray-100 shadow-md hover:shadow-lg'}`;

  const getEstadoColor = (estado) => {
    const colors = {
      activa: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
      programada: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
      completada: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
      pausada: 'bg-gray-100 text-gray-700 dark:bg-gray-900/40 dark:text-gray-300',
    };
    return colors[estado] || colors.activa;
  };

  return (
    <div className={`min-h-screen px-6 lg:px-8 pt-4 pb-6 ${currentMode === 'Dark' ? 'bg-main-dark-bg' : 'bg-gray-50'}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className={`text-lg font-semibold flex items-center gap-2 ${currentMode === 'Dark' ? 'text-white' : 'text-gray-900'}`}>
            <FaBullhorn className="text-purple-500" /> Campañas de Marketing
          </h2>
          <p className={`text-sm mt-1 ${currentMode === 'Dark' ? 'text-gray-400' : 'text-gray-500'}`}>Gestión de campañas activas</p>
        </div>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium shadow-lg hover:shadow-xl transition-all"
          style={{ background: `linear-gradient(to right, ${currentColor}, ${currentColor}dd)` }}
        >
          <FaPlus /> Nueva Campaña
        </button>
      </div>

      {/* Estadísticas Generales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Campañas Activas', value: 2, color: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: <MdOutlineEmail /> },
          { label: 'Tasa Apertura Prom.', value: '57.5%', color: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: <FaEye /> },
          { label: 'Tasa Click Prom.', value: '19.4%', color: '#8b5cf6', bg: 'bg-purple-50 dark:bg-purple-900/20', icon: <FaMousePointer /> },
          { label: 'Conversiones', value: 144, color: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: <FaChartLine /> },
        ].map((m) => (
          <div
            key={m.label}
            className={`rounded-2xl p-5 border shadow-sm ${isDark ? 'bg-secondary-dark-bg border-gray-700/50' : 'bg-white border-gray-100'}`}
            style={{ borderLeft: `4px solid ${m.color}` }}
          >
            <div className={`w-9 h-9 rounded-xl ${m.bg} flex items-center justify-center mb-3`} style={{ color: m.color }}>
              {m.icon}
            </div>
            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{m.value}</p>
            <p className={`text-sm font-semibold mt-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{m.label}</p>
          </div>
        ))}
      </div>

      {/* Lista de Campañas */}
      <div className="space-y-4">
        {campanas.map((campana) => (
          <div key={campana.id} className={cardBase}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <MdOutlineEmail className="text-3xl" style={{ color: currentColor }} />
                  <div>
                    <h3 className="text-xl font-bold dark:text-gray-200">{campana.nombre}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{campana.tipo}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(campana.estado)}`}>
                    {campana.estado === 'activa' && '● '}
                    {campana.estado === 'programada' && '⏰ '}
                    {campana.estado === 'completada' && '✓ '}
                    {campana.estado.toUpperCase()}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <span>📅 {campana.fechaInicio} - {campana.fechaFin}</span>
                  <span className="flex items-center gap-1">
                    <FaUsers /> {campana.audiencia.toLocaleString()} contactos
                  </span>
                </div>

                {/* Métricas */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Enviados</p>
                    <p className="text-xl font-bold dark:text-gray-200">{campana.enviados.toLocaleString()}</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Abiertos</p>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{campana.abiertos.toLocaleString()}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">{campana.tasaApertura}%</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Clicks</p>
                    <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{campana.clicks.toLocaleString()}</p>
                    <p className="text-xs text-purple-600 dark:text-purple-400">{campana.tasaClick}%</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Conversiones</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">{campana.conversiones}</p>
                    <p className="text-xs text-green-600 dark:text-green-400">{campana.tasaConversion}%</p>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">ROI</p>
                    <p className="text-xl font-bold text-orange-600 dark:text-orange-400">+{(campana.conversiones * 3.2).toFixed(0)}%</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 ml-4">
                {campana.estado === 'activa' && (
                  <button
                    type="button"
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Pausar"
                  >
                    <FaPause className="text-orange-500" />
                  </button>
                )}
                {campana.estado === 'programada' && (
                  <button
                    type="button"
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Iniciar"
                  >
                    <FaPlay className="text-green-500" />
                  </button>
                )}
                <button
                  type="button"
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Editar"
                >
                  <FaEdit className="text-blue-500" />
                </button>
                <button
                  type="button"
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Ver Estadísticas"
                >
                  <FaChartLine className="text-purple-500" />
                </button>
                <button
                  type="button"
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  title="Eliminar"
                >
                  <FaTrash className="text-red-500" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Plantillas de Campaña */}
      <div className={`${cardBase} mt-8 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-200 dark:border-indigo-800`}>
        <div className="flex items-start gap-4">
          <span className="text-6xl">📧</span>
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-2 text-indigo-900 dark:text-indigo-100">
              Plantillas de Campaña Prediseñadas
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Utiliza nuestras plantillas profesionales para crear campañas efectivas en minutos
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg hover:shadow-lg transition-shadow cursor-pointer">
                <div className="text-3xl mb-2">🏠</div>
                <h4 className="font-bold mb-2 dark:text-gray-200">Nuevas Propiedades</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Anuncia nuevos listings a tu base de datos</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg hover:shadow-lg transition-shadow cursor-pointer">
                <div className="text-3xl mb-2">💰</div>
                <h4 className="font-bold mb-2 dark:text-gray-200">Ofertas Especiales</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Promociona descuentos y ofertas limitadas</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg hover:shadow-lg transition-shadow cursor-pointer">
                <div className="text-3xl mb-2">📰</div>
                <h4 className="font-bold mb-2 dark:text-gray-200">Newsletter</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Mantén informados a tus clientes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Campanas;
