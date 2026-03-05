import React, { useState } from 'react';
import { Header } from '../components';
import { useStateContext } from '../contexts/ContextProvider';
import { FaEnvelope, FaPlus, FaEdit, FaTrash, FaCopy, FaEye, FaPaperPlane, FaUsers, FaChartBar } from 'react-icons/fa';
import { MdOutlineEmail, MdDrafts } from 'react-icons/md';

const EmailMarketing = () => {
  const { currentMode, currentColor } = useStateContext();
  const [vistaActual, setVistaActual] = useState('plantillas'); // plantillas, borradores, enviados

  const plantillas = [
    {
      id: 1,
      nombre: 'Bienvenida Nuevo Cliente',
      categoria: 'Onboarding',
      descripcion: 'Email de bienvenida para nuevos clientes registrados',
      usos: 234,
      tasaApertura: 68,
      preview: '👋 ¡Bienvenido a [Empresa]! Estamos emocionados de...',
      color: 'blue'
    },
    {
      id: 2,
      nombre: 'Nueva Propiedad Disponible',
      categoria: 'Promocional',
      descripcion: 'Anuncia nuevas propiedades que coinciden con intereses',
      usos: 456,
      tasaApertura: 55,
      preview: '🏠 Nueva propiedad que te puede interesar en...',
      color: 'green'
    },
    {
      id: 3,
      nombre: 'Recordatorio de Visita',
      categoria: 'Transaccional',
      descripcion: 'Recordatorio 24h antes de visita programada',
      usos: 189,
      tasaApertura: 82,
      preview: '📅 Recordatorio: Tu visita está programada para...',
      color: 'orange'
    },
    {
      id: 4,
      nombre: 'Newsletter Mensual',
      categoria: 'Contenido',
      descripcion: 'Resumen mensual de propiedades y noticias',
      usos: 312,
      tasaApertura: 45,
      preview: '📰 Lo más destacado del mes en el mercado...',
      color: 'purple'
    },
    {
      id: 5,
      nombre: 'Solicitud de Feedback',
      categoria: 'Engagement',
      descripcion: 'Solicita opinión después de una operación',
      usos: 145,
      tasaApertura: 62,
      preview: '⭐ ¿Cómo fue tu experiencia con nosotros?...',
      color: 'pink'
    },
    {
      id: 6,
      nombre: 'Reactivación Cliente Inactivo',
      categoria: 'Retención',
      descripcion: 'Recupera clientes que no han interactuado',
      usos: 98,
      tasaApertura: 38,
      preview: '💡 Te extrañamos! Mira estas nuevas opciones...',
      color: 'red'
    }
  ];

  const borradores = [
    {
      id: 1,
      asunto: 'Promoción Especial - Descuento 10%',
      destinatarios: 850,
      ultimaEdicion: 'Hace 2 horas',
      progreso: 75
    },
    {
      id: 2,
      asunto: 'Invitación Open House - Palermo',
      destinatarios: 234,
      ultimaEdicion: 'Hace 1 día',
      progreso: 45
    }
  ];

  const enviados = [
    {
      id: 1,
      asunto: 'Nuevas Propiedades en Belgrano',
      destinatarios: 1250,
      enviados: 1250,
      abiertos: 687,
      clicks: 234,
      fecha: '10/10/2025',
      tasaApertura: 55,
      tasaClick: 18.7
    },
    {
      id: 2,
      asunto: 'Newsletter Octubre 2025',
      destinatarios: 2100,
      enviados: 2100,
      abiertos: 1260,
      clicks: 420,
      fecha: '01/10/2025',
      tasaApertura: 60,
      tasaClick: 20
    }
  ];

  const cardBase = `bg-white dark:bg-secondary-dark-bg rounded-2xl p-6 shadow-lg`;

  const getColorClasses = (color) => {
    const colors = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      orange: 'from-orange-500 to-orange-600',
      purple: 'from-purple-500 to-purple-600',
      pink: 'from-pink-500 to-pink-600',
      red: 'from-red-500 to-red-600'
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen px-6 lg:px-8 pt-4 pb-6 bg-gray-50 dark:bg-main-dark-bg">
      <div className="flex justify-between items-center mb-6">
        <Header category="Marketing" title="Email Marketing" />
        <button
          className="flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium shadow-lg hover:shadow-xl transition-all"
          style={{ backgroundColor: currentColor }}
        >
          <FaPlus /> Crear Email
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className={`${cardBase} border-l-4 border-blue-500`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Emails Enviados</p>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">3,350</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Este mes</p>
            </div>
            <FaPaperPlane className="text-4xl text-blue-500" />
          </div>
        </div>

        <div className={`${cardBase} border-l-4 border-green-500`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Tasa Apertura</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">57.5%</p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">+5% vs anterior</p>
            </div>
            <FaEye className="text-4xl text-green-500" />
          </div>
        </div>

        <div className={`${cardBase} border-l-4 border-purple-500`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Plantillas</p>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{plantillas.length}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Disponibles</p>
            </div>
            <MdOutlineEmail className="text-4xl text-purple-500" />
          </div>
        </div>

        <div className={`${cardBase} border-l-4 border-orange-500`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Suscriptores</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">4,567</p>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">+234 este mes</p>
            </div>
            <FaUsers className="text-4xl text-orange-500" />
          </div>
        </div>
      </div>

      {/* Tabs de Navegación */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setVistaActual('plantillas')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            vistaActual === 'plantillas'
              ? 'text-white shadow-lg'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          style={vistaActual === 'plantillas' ? { backgroundColor: currentColor } : {}}
        >
          📋 Plantillas ({plantillas.length})
        </button>
        <button
          onClick={() => setVistaActual('borradores')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            vistaActual === 'borradores'
              ? 'text-white shadow-lg'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          style={vistaActual === 'borradores' ? { backgroundColor: currentColor } : {}}
        >
          📝 Borradores ({borradores.length})
        </button>
        <button
          onClick={() => setVistaActual('enviados')}
          className={`px-6 py-3 rounded-lg font-medium transition-all ${
            vistaActual === 'enviados'
              ? 'text-white shadow-lg'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          style={vistaActual === 'enviados' ? { backgroundColor: currentColor } : {}}
        >
          ✉️ Enviados ({enviados.length})
        </button>
      </div>

      {/* Contenido según vista activa */}
      {vistaActual === 'plantillas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {plantillas.map((plantilla) => (
            <div key={plantilla.id} className={cardBase}>
              <div className={`bg-gradient-to-br ${getColorClasses(plantilla.color)} text-white p-4 rounded-lg mb-4`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl">📧</span>
                  <span className="bg-white bg-opacity-20 px-2 py-1 rounded text-xs font-bold">
                    {plantilla.categoria}
                  </span>
                </div>
                <h3 className="text-lg font-bold">{plantilla.nombre}</h3>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{plantilla.descripcion}</p>
              
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg mb-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Vista previa:</p>
                <p className="text-sm italic dark:text-gray-300">{plantilla.preview}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Usos</p>
                  <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{plantilla.usos}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Apertura</p>
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">{plantilla.tasaApertura}%</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  className="flex-1 py-2 rounded-lg border-2 font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-center gap-2"
                  style={{ borderColor: currentColor, color: currentColor }}
                >
                  <FaEye /> Vista Previa
                </button>
                <button
                  className="flex-1 py-2 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2"
                  style={{ backgroundColor: currentColor }}
                >
                  <FaCopy /> Usar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {vistaActual === 'borradores' && (
        <div className="space-y-4">
          {borradores.map((borrador) => (
            <div key={borrador.id} className={cardBase}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <MdDrafts className="text-3xl text-gray-400" />
                    <div>
                      <h3 className="text-xl font-bold dark:text-gray-200">{borrador.asunto}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {borrador.destinatarios} destinatarios • Editado {borrador.ultimaEdicion}
                      </p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Progreso</span>
                      <span className="text-sm font-bold" style={{ color: currentColor }}>{borrador.progreso}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ backgroundColor: currentColor, width: `${borrador.progreso}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <FaEdit className="text-blue-500" />
                  </button>
                  <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <FaTrash className="text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {vistaActual === 'enviados' && (
        <div className="space-y-4">
          {enviados.map((email) => (
            <div key={email.id} className={cardBase}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <FaPaperPlane className="text-3xl text-green-500" />
                    <div>
                      <h3 className="text-xl font-bold dark:text-gray-200">{email.asunto}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Enviado el {email.fecha} • {email.destinatarios} destinatarios
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Enviados</p>
                      <p className="text-xl font-bold dark:text-gray-200">{email.enviados.toLocaleString()}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Abiertos</p>
                      <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{email.abiertos.toLocaleString()}</p>
                      <p className="text-xs text-blue-600 dark:text-blue-400">{email.tasaApertura}%</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Clicks</p>
                      <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{email.clicks.toLocaleString()}</p>
                      <p className="text-xs text-purple-600 dark:text-purple-400">{email.tasaClick}%</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Engagement</p>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">
                        {((email.abiertos + email.clicks) / email.enviados * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                <button className="ml-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <FaChartBar className="text-purple-500 text-xl" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Visual */}
      <div className={`${cardBase} mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800`}>
        <div className="flex items-start gap-4">
          <span className="text-6xl">✨</span>
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-2 text-blue-900 dark:text-blue-100">
              Editor Visual de Emails
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Crea emails profesionales con nuestro editor drag-and-drop. Sin necesidad de código.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm font-bold mb-1 dark:text-gray-200">🎨 Diseño Visual</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Arrastra y suelta elementos</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm font-bold mb-1 dark:text-gray-200">📱 Responsive</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Optimizado para móviles</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm font-bold mb-1 dark:text-gray-200">🔧 Personalización</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Variables dinámicas</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-sm font-bold mb-1 dark:text-gray-200">📊 A/B Testing</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Prueba variantes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailMarketing;
