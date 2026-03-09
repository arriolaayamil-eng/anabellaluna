import { api } from '../config/api';

const notificationService = {
  // Get all notifications with pagination and filters
  getNotifications: async (params = {}) => {
    const { leida, tipo, limite = 50, pagina = 1, prioridad } = params;
    const query = new URLSearchParams();
    if (leida !== undefined) query.append('leida', leida);
    if (tipo) query.append('tipo', tipo);
    if (limite) query.append('limite', limite);
    if (pagina) query.append('pagina', pagina);
    if (prioridad) query.append('prioridad', prioridad);

    const response = await api.get(`/admin/notifications?${query.toString()}`);
    return response;
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await api.get('/admin/notifications/unread-count');
    return response;
  },

  // Mark notification as read
  markAsRead: async (id) => {
    const response = await api.put(`/admin/notifications/${id}/read`);
    return response;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await api.put('/admin/notifications/mark-all-read');
    return response;
  },

  // Delete notification
  deleteNotification: async (id) => {
    const response = await api.delete(`/admin/notifications/${id}`);
    return response;
  },

  // Clear all read notifications
  clearReadNotifications: async () => {
    const response = await api.delete('/admin/notifications/clear-read');
    return response;
  },

  // Trigger notification generation from real business events
  generateNotifications: async () => {
    const response = await api.post('/admin/notifications/generate');
    return response;
  },

  // Get navbar summary (badges)
  getNavbarSummary: async () => {
    const response = await api.get('/admin/notifications/navbar-summary');
    return response;
  },
};

export default notificationService;
