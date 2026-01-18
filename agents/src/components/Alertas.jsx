import React, { useState, useEffect, useCallback } from 'react';
import { MdOutlineCancel } from 'react-icons/md';
import { FaBell, FaExclamationTriangle, FaInfoCircle, FaCheckCircle, FaTimesCircle, FaBirthdayCake, FaUserPlus, FaHandshake, FaFileAlt, FaClock, FaStar, FaCalendarAlt } from 'react-icons/fa';
import { useStateContext } from '../contexts/ContextProvider';
import { Button } from '.';
import notificationService from '../services/notificationService';

const Alertas = () => {
  const { currentColor, setIsClicked, initialState } = useStateContext();
  const [alertas, setAlertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Map notification types to icons and styles
  const getNotificationStyle = (tipo, prioridad) => {
    const styles = {
      bienvenida: { icon: <FaUserPlus />, color: 'bg-green-50 dark:bg-green-900/20', borderColor: 'border-green-500', textColor: 'text-green-600 dark:text-green-400' },
      seguimiento_contacto: { icon: <FaClock />, color: 'bg-blue-50 dark:bg-blue-900/20', borderColor: 'border-blue-500', textColor: 'text-blue-600 dark:text-blue-400' },
      cumpleanos: { icon: <FaBirthdayCake />, color: 'bg-pink-50 dark:bg-pink-900/20', borderColor: 'border-pink-500', textColor: 'text-pink-600 dark:text-pink-400' },
      seguimiento_propuesta: { icon: <FaFileAlt />, color: 'bg-purple-50 dark:bg-purple-900/20', borderColor: 'border-purple-500', textColor: 'text-purple-600 dark:text-purple-400' },
      renovacion: { icon: <FaHandshake />, color: 'bg-orange-50 dark:bg-orange-900/20', borderColor: 'border-orange-500', textColor: 'text-orange-600 dark:text-orange-400' },
      evento_especial: { icon: <FaStar />, color: 'bg-yellow-50 dark:bg-yellow-900/20', borderColor: 'border-yellow-500', textColor: 'text-yellow-600 dark:text-yellow-400' },
      feedback: { icon: <FaCheckCircle />, color: 'bg-teal-50 dark:bg-teal-900/20', borderColor: 'border-teal-500', textColor: 'text-teal-600 dark:text-teal-400' },
      inactividad: { icon: <FaExclamationTriangle />, color: 'bg-red-50 dark:bg-red-900/20', borderColor: 'border-red-500', textColor: 'text-red-600 dark:text-red-400' },
      cumpleanos_contacto: { icon: <FaBirthdayCake />, color: 'bg-pink-50 dark:bg-pink-900/20', borderColor: 'border-pink-500', textColor: 'text-pink-600 dark:text-pink-400' },
      objetivo: { icon: <FaCalendarAlt />, color: 'bg-indigo-50 dark:bg-indigo-900/20', borderColor: 'border-indigo-500', textColor: 'text-indigo-600 dark:text-indigo-400' },
      vencimiento_documento: { icon: <FaTimesCircle />, color: 'bg-orange-50 dark:bg-orange-900/20', borderColor: 'border-orange-500', textColor: 'text-orange-600 dark:text-orange-400' },
      hito: { icon: <FaStar />, color: 'bg-amber-50 dark:bg-amber-900/20', borderColor: 'border-amber-500', textColor: 'text-amber-600 dark:text-amber-400' },
      sistema: { icon: <FaInfoCircle />, color: 'bg-gray-50 dark:bg-gray-900/20', borderColor: 'border-gray-500', textColor: 'text-gray-600 dark:text-gray-400' },
      tarea: { icon: <FaClock />, color: 'bg-blue-50 dark:bg-blue-900/20', borderColor: 'border-blue-500', textColor: 'text-blue-600 dark:text-blue-400' },
      cita: { icon: <FaCalendarAlt />, color: 'bg-violet-50 dark:bg-violet-900/20', borderColor: 'border-violet-500', textColor: 'text-violet-600 dark:text-violet-400' },
    };
    
    // Override colors for urgent priority
    if (prioridad === 'urgente') {
      return { ...styles[tipo] || styles.sistema, color: 'bg-red-50 dark:bg-red-900/20', borderColor: 'border-red-500', textColor: 'text-red-600 dark:text-red-400' };
    }
    
    return styles[tipo] || styles.sistema;
  };

  const formatTime = (date) => {
    if (!date) return '';
    const now = new Date();
    const d = new Date(date);
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
  };

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const [response, countResponse] = await Promise.all([
        notificationService.getNotifications({ limite: 20 }),
        notificationService.getUnreadCount()
      ]);
      setAlertas(response?.items || []);
      setUnreadCount(countResponse?.count || 0);
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setAlertas(prev => prev.map(a => a._id === id ? { ...a, leida: true } : a));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setAlertas(prev => prev.map(a => ({ ...a, leida: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const alertasNoLeidas = unreadCount;

  return (
    <div className="nav-item absolute right-5 md:right-40 top-16 bg-white dark:bg-[#42464D] p-6 rounded-lg w-96 shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <FaBell className="text-2xl" style={{ color: currentColor }} />
            {alertasNoLeidas > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {alertasNoLeidas}
              </span>
            )}
          </div>
          <div>
            <p className="font-semibold text-lg dark:text-gray-200">Alertas del Sistema</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {alertasNoLeidas} sin leer
            </p>
          </div>
        </div>
        <Button
          icon={<MdOutlineCancel />}
          color="rgb(153, 171, 180)"
          bgHoverColor="light-gray"
          size="2xl"
          borderRadius="50%"
          onClick={() => setIsClicked(initialState)}
        />
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: currentColor }}></div>
          </div>
        ) : alertas.length === 0 ? (
          <div className="text-center py-8">
            <FaBell className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No hay notificaciones</p>
          </div>
        ) : (
          alertas.map((alerta) => {
            const style = getNotificationStyle(alerta.tipo, alerta.prioridad);
            return (
              <div
                key={alerta._id}
                onClick={() => !alerta.leida && handleMarkAsRead(alerta._id)}
                className={`${style.color} border-l-4 ${style.borderColor} p-4 rounded-lg hover:shadow-md transition-all cursor-pointer ${
                  alerta.leida ? 'opacity-70' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`text-xl ${style.textColor}`}>
                    {style.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-bold text-sm dark:text-gray-200">
                        {alerta.titulo}
                      </h4>
                      {!alerta.leida && (
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {alerta.mensaje}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTime(alerta.createdAt)}
                      </span>
                      {alerta.accionUrl && (
                        <button
                          className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${style.textColor} hover:bg-opacity-20`}
                          style={{ backgroundColor: 'rgba(0,0,0,0.05)' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = alerta.accionUrl;
                          }}
                        >
                          Ver más
                        </button>
                      )}
                    </div>
                    {alerta.calendarSynced && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                        <FaCalendarAlt className="text-xs" />
                        <span>Sincronizado con Calendar</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 pt-4 border-t dark:border-gray-600 space-y-2">
        <div className="flex items-center justify-between">
          <button 
            onClick={handleMarkAllAsRead}
            disabled={alertasNoLeidas === 0}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
          >
            Marcar todas como leídas
          </button>
          <button 
            className="text-sm font-medium" 
            style={{ color: currentColor }}
            onClick={() => {
              setIsClicked(initialState);
              window.location.href = '/crm/automatizacion';
            }}
          >
            Configurar alertas
          </button>
        </div>
        <button
          className="w-full py-2 rounded-lg font-medium transition-colors"
          style={{ backgroundColor: currentColor, color: 'white' }}
          onClick={() => {
            setIsClicked(initialState);
            window.location.href = '/crm/automatizacion';
          }}
        >
          Ver Centro de Automatización →
        </button>
      </div>
    </div>
  );
};

export default Alertas;
