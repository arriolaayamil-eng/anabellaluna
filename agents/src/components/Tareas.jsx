import React, { useState, useEffect, useCallback } from 'react';
import { MdOutlineCancel } from 'react-icons/md';
import { FaTasks, FaCheckCircle, FaClock, FaSync, FaCalendarAlt, FaHome } from 'react-icons/fa';
import { useStateContext } from '../contexts/ContextProvider';
import { Button } from '.';
import { crmService } from '../services/crmService';

const Tareas = () => {
  const { currentColor, setIsClicked, initialState } = useStateContext();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pendientes: 0, hoy: 0, citas: 0, citasHoy: 0 });

  const getPrioridadStyle = (prioridad) => {
    const styles = {
      alta: { color: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-500', badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
      media: { color: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-500', badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
      baja: { color: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-500', badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
      urgente: { color: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-600', badge: 'bg-red-200 text-red-800 dark:bg-red-900/50 dark:text-red-200' },
    };
    return styles[prioridad?.toLowerCase()] || styles.media;
  };

  const getItemIcon = (tipo, source) => {
    if (source === 'cita') return '📅';
    if (source === 'visit') return '🏠';
    const icons = {
      llamada: '📞',
      reunion: '👥',
      seguimiento: '🔄',
      documentacion: '📄',
      visita: '🏠',
      otro: '📋',
    };
    return icons[tipo?.toLowerCase()] || '📋';
  };

  const formatVencimiento = (fecha) => {
    if (!fecha) return 'Sin fecha';
    const d = new Date(fecha);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 86400000);
    const itemDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    
    if (itemDate.getTime() === today.getTime()) {
      return `Hoy ${d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (itemDate.getTime() === tomorrow.getTime()) {
      return `Mañana ${d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (itemDate < today) {
      return `Vencido - ${d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}`;
    }
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const loadTareas = useCallback(async () => {
    setLoading(true);
    try {
      const [tareas, citas, activities, summary] = await Promise.all([
        crmService.tareas.getAll(),
        crmService.citas.getAll(),
        crmService.activities.getAll({ type: 'visit_scheduled' }),
        crmService.navbar.getSummary()
      ]);

      const now = new Date();
      const allItems = [];

      // Add kanban tasks (pending only)
      (Array.isArray(tareas) ? tareas : [])
        .filter(t => t.kanbanColumn !== 'done')
        .forEach(t => {
          allItems.push({
            id: t._id,
            titulo: t.titulo || t.nombre || 'Sin título',
            descripcion: t.descripcion || '',
            prioridad: t.prioridad || 'media',
            vencimiento: t.fechaVencimiento,
            completada: t.kanbanColumn === 'done',
            source: 'tarea',
            tipo: t.tipo,
            url: '/crm/citas',
          });
        });

      // Add upcoming citas
      (Array.isArray(citas) ? citas : [])
        .filter(c => new Date(c.fecha) >= now && c.estado !== 'cancelada')
        .forEach(c => {
          allItems.push({
            id: c._id,
            titulo: c.titulo || 'Cita',
            descripcion: c.notas || c.clienteNombre || '',
            prioridad: 'alta',
            vencimiento: c.fecha,
            completada: c.estado === 'completada',
            source: 'cita',
            tipo: 'cita',
            url: '/crm/citas',
          });
        });

      // Add visit requests from website
      (Array.isArray(activities) ? activities : [])
        .filter(a => a.type === 'visit_scheduled' && !a.metadata?.read)
        .forEach(a => {
          const contact = a.metadata?.contact || {};
          const property = a.metadata?.property || {};
          allItems.push({
            id: a._id,
            titulo: `Solicitud de visita - ${contact.fullName || 'Cliente'}`,
            descripcion: property.title || 'Propiedad',
            prioridad: 'alta',
            vencimiento: a.createdAt,
            completada: false,
            source: 'visit',
            tipo: 'visita',
            url: '/crm/citas',
          });
        });

      // Sort by date (closest first)
      allItems.sort((a, b) => {
        const dateA = a.vencimiento ? new Date(a.vencimiento) : new Date(9999, 0);
        const dateB = b.vencimiento ? new Date(b.vencimiento) : new Date(9999, 0);
        return dateA - dateB;
      });

      setItems(allItems.slice(0, 10));
      setStats({
        pendientes: summary?.tareas?.pendientes || 0,
        hoy: summary?.tareas?.hoy || 0,
        citas: summary?.tareas?.citas || 0,
        citasHoy: summary?.tareas?.citasHoy || 0,
      });
    } catch (err) {
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTareas();
  }, [loadTareas]);

  const totalPendientes = stats.pendientes + stats.citas;
  const capitalize = (str) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

  return (
    <div className="nav-item absolute right-5 md:right-40 top-16 bg-white dark:bg-[#42464D] p-6 rounded-lg w-96 shadow-xl z-50">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <FaTasks className="text-2xl" style={{ color: currentColor }} />
            {totalPendientes > 0 && (
              <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {totalPendientes > 9 ? '9+' : totalPendientes}
              </span>
            )}
          </div>
          <div>
            <p className="font-semibold text-lg dark:text-gray-200">Tareas y Citas</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {stats.pendientes} tareas · {stats.citas} citas pendientes
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadTareas}
            disabled={loading}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Actualizar"
          >
            <FaSync className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Button
            icon={<MdOutlineCancel />}
            color="rgb(153, 171, 180)"
            bgHoverColor="light-gray"
            size="2xl"
            borderRadius="50%"
            onClick={() => setIsClicked(initialState)}
          />
        </div>
      </div>

      {/* Quick stats */}
      {(stats.hoy > 0 || stats.citasHoy > 0) && (
        <div className="flex gap-2 mb-3">
          {stats.hoy > 0 && (
            <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
              📋 {stats.hoy} tareas hoy
            </span>
          )}
          {stats.citasHoy > 0 && (
            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              📅 {stats.citasHoy} citas hoy
            </span>
          )}
        </div>
      )}

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: currentColor }}></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8">
            <FaTasks className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No hay tareas pendientes</p>
            <p className="text-xs text-gray-400 mt-1">¡Buen trabajo!</p>
          </div>
        ) : (
          items.map((item) => {
            const style = getPrioridadStyle(item.prioridad);
            const isOverdue = item.vencimiento && new Date(item.vencimiento) < new Date() && !item.completada;
            return (
              <div
                key={`${item.source}-${item.id}`}
                className={`${style.color} border-l-4 ${style.border} p-4 rounded-lg hover:shadow-md transition-all cursor-pointer ${
                  item.completada ? 'opacity-60' : ''
                } ${isOverdue ? 'ring-2 ring-red-300' : ''}`}
                onClick={() => {
                  setIsClicked(initialState);
                  window.location.href = item.url;
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{getItemIcon(item.tipo, item.source)}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className={`font-bold text-sm dark:text-gray-200 ${item.completada ? 'line-through' : ''}`}>
                        {item.titulo}
                      </h4>
                      {item.completada && <FaCheckCircle className="text-green-500 text-lg flex-shrink-0" />}
                    </div>
                    {item.descripcion && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 truncate">
                        {item.descripcion}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <FaClock className={isOverdue ? 'text-red-500' : 'text-gray-400'} />
                        <span className={isOverdue ? 'text-red-500 font-medium' : ''}>
                          {formatVencimiento(item.vencimiento)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>
                          {capitalize(item.prioridad)}
                        </span>
                        {item.source === 'cita' && (
                          <FaCalendarAlt className="text-blue-500 text-xs" title="Cita" />
                        )}
                        {item.source === 'visit' && (
                          <FaHome className="text-green-500 text-xs" title="Solicitud web" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 pt-4 border-t dark:border-gray-600 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            className="py-2 px-3 rounded-lg font-medium transition-colors text-sm border"
            style={{ borderColor: currentColor, color: currentColor }}
            onClick={() => {
              setIsClicked(initialState);
              window.location.href = '/crm/citas';
            }}
          >
            📋 Kanban
          </button>
          <button
            className="py-2 px-3 rounded-lg font-medium transition-colors text-sm border"
            style={{ borderColor: currentColor, color: currentColor }}
            onClick={() => {
              setIsClicked(initialState);
              window.location.href = '/crm/citas';
            }}
          >
            📅 Citas
          </button>
        </div>
        <button
          className="w-full py-2 rounded-lg font-medium transition-colors"
          style={{ backgroundColor: currentColor, color: 'white' }}
          onClick={() => {
            setIsClicked(initialState);
            window.location.href = '/crm/citas';
          }}
        >
          Ver Agenda Completa →
        </button>
      </div>
    </div>
  );
};

export default Tareas;
