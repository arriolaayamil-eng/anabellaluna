import React, { useEffect, useState, useCallback } from 'react';
import { MdOutlineCancel } from 'react-icons/md';
import { FaUserPlus, FaBell, FaCalendar, FaTasks, FaEnvelope, FaStar, FaCheckDouble } from 'react-icons/fa';

import { Button } from '.';
import { useStateContext } from '../contexts/ContextProvider';
import notificationService from '../services/notificationService';

const tipoIcons = {
  asignacion_cliente: <FaUserPlus className="text-blue-500" />,
  cita: <FaCalendar className="text-green-500" />,
  tarea: <FaTasks className="text-purple-500" />,
  consulta_web: <FaEnvelope className="text-orange-500" />,
  meta_cumplida: <FaStar className="text-yellow-500" />,
};

const timeAgo = (date) => {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
};

const Notification = () => {
  const { currentColor } = useStateContext();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    try {
      const data = await notificationService.getNotifications({ limite: 20 });
      const items = Array.isArray(data) ? data : (data?.notifications || data?.items || []);
      setNotifications(items);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, leida: true })));
    } catch { /* ignore */ }
  };

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, leida: true } : n));
    } catch { /* ignore */ }
  };

  const unreadCount = notifications.filter(n => !n.leida).length;

  return (
    <div className="nav-item absolute right-5 md:right-40 top-16 bg-white dark:bg-[#42464D] p-6 rounded-xl w-96 shadow-2xl border border-gray-200 dark:border-gray-600 max-h-[80vh] flex flex-col z-50">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-3 items-center">
          <p className="font-semibold text-lg dark:text-gray-200">Notificaciones</p>
          {unreadCount > 0 && (
            <span className="text-white text-xs rounded-full px-2 py-0.5 font-bold" style={{ backgroundColor: currentColor }}>{unreadCount} nueva{unreadCount > 1 ? 's' : ''}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button onClick={handleMarkAllRead} title="Marcar todas como leídas" className="text-gray-400 hover:text-blue-500 transition-colors">
              <FaCheckDouble size={16} />
            </button>
          )}
          <Button icon={<MdOutlineCancel />} color="rgb(153, 171, 180)" bgHoverColor="light-gray" size="2xl" borderRadius="50%" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1">
        {loading && <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">Cargando...</p>}
        {!loading && notifications.length === 0 && (
          <div className="text-center py-10">
            <FaBell className="text-4xl text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Sin notificaciones</p>
          </div>
        )}
        {notifications.map((notif) => (
          <div
            key={notif._id}
            onClick={() => !notif.leida && handleMarkRead(notif._id)}
            className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${notif.leida ? 'opacity-60' : 'bg-blue-50/50 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
          >
            <div className="flex-shrink-0 mt-0.5 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              {tipoIcons[notif.tipo] || <FaBell className="text-gray-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm leading-snug ${notif.leida ? 'text-gray-500 dark:text-gray-400' : 'font-semibold dark:text-gray-200'}`}>
                {notif.titulo}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{notif.mensaje}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{timeAgo(notif.createdAt)}</p>
            </div>
            {!notif.leida && (
              <div className="flex-shrink-0 mt-1">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: currentColor }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notification;
