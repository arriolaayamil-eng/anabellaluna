import React, { useState } from 'react';
import { useStateContext } from '../contexts/ContextProvider';
import { FaRobot, FaPlus, FaCog, FaChartLine, FaBolt, FaEnvelope, FaSms, FaBell } from 'react-icons/fa';

const Automatizacion = () => {
  const { currentMode, currentColor } = useStateContext();

  const automatizaciones = [
    {
      id: 1,
      nombre: 'Auto-respuesta de Consultas Web',
      tipo: 'Email',
      icon: <FaEnvelope />,
      descripcion: 'Responde automáticamente a consultas desde el sitio web',
      estado: 'activo',
      disparos: 234,
      tasa: '95%',
      color: 'blue'
    },
    {
      id: 2,
      nombre: 'SMS de Confirmación de Visitas',
      tipo: 'SMS',
      icon: <FaSms />,
      descripcion: 'Envía SMS 24h antes de cada visita programada',
      estado: 'activo',
      disparos: 156,
      tasa: '98%',
      color: 'green'
    },
    {
      id: 3,
      nombre: 'Alertas de Leads Calientes',
      tipo: 'Notificación',
      icon: <FaBell />,
      descripcion: 'Notifica cuando un lead visita más de 3 propiedades',
      estado: 'activo',
      disparos: 89,
      tasa: '92%',
      color: 'orange'
    },
    {
      id: 4,
      nombre: 'Asignación Inteligente de Leads',
      tipo: 'IA',
      icon: <FaRobot />,
      descripcion: 'Asigna leads al agente más adecuado según perfil',
      estado: 'activo',
      disparos: 312,
      tasa: '88%',
      color: 'purple'
    }
  ];

  const isDark = currentMode === 'Dark';
  const cardBase = `rounded-2xl p-6 border transition-shadow ${isDark ? 'bg-secondary-dark-bg border-gray-700/50 hover:border-indigo-500/30' : 'bg-white border-gray-100 shadow-md hover:shadow-lg'}`;

  const getColorClasses = (color) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      orange: 'from-orange-500 to-orange-600',
      purple: 'from-purple-500 to-purple-600'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className={`min-h-screen px-6 lg:px-8 pt-4 pb-6 ${isDark ? 'bg-main-dark-bg' : 'bg-gray-50'}`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <FaRobot className="text-indigo-500" /> Centro de Automatización
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Reglas y flujos automatizados</p>
        </div>
        <button
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium shadow-lg hover:shadow-xl transition-all"
          style={{ background: `linear-gradient(to right, ${currentColor}, ${currentColor}dd)` }}
        >
          <FaPlus /> Nueva Automatización
        </button>
      </div>

      {/* Estadísticas Generales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Automatizaciones Activas', value: 4, color: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-900/20', icon: <FaRobot /> },
          { label: 'Disparos Hoy', value: 127, color: '#10b981', bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: <FaBolt /> },
          { label: 'Tasa de Éxito', value: '94%', color: '#8b5cf6', bg: 'bg-purple-50 dark:bg-purple-900/20', icon: <FaChartLine /> },
          { label: 'Tiempo Ahorrado', value: '45h', color: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/20', icon: <FaCog /> },
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

      {/* Grid de Automatizaciones */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {automatizaciones.map((auto) => (
          <div key={auto.id} className={cardBase}>
            <div className={`bg-gradient-to-br ${getColorClasses(auto.color)} text-white p-4 rounded-lg mb-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{auto.icon}</div>
                  <div>
                    <h3 className="text-lg font-bold">{auto.nombre}</h3>
                    <p className="text-sm opacity-90">{auto.tipo}</p>
                  </div>
                </div>
                <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-xs font-bold">
                  ● {auto.estado.toUpperCase()}
                </span>
              </div>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-4">{auto.descripcion}</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Disparos (30 días)</p>
                <p className="text-2xl font-bold" style={{ color: currentColor }}>{auto.disparos}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tasa de Éxito</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{auto.tasa}</p>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                className="flex-1 py-2 rounded-lg border-2 font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                style={{ borderColor: currentColor, color: currentColor }}
              >
                Configurar
              </button>
              <button
                className="flex-1 py-2 rounded-lg text-white font-medium transition-colors"
                style={{ backgroundColor: currentColor }}
              >
                Ver Estadísticas
              </button>
            </div>
          </div>
        ))}
      </div>

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
    </div>
  );
};

export default Automatizacion;
