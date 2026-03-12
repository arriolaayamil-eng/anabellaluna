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
    const response = await api.get(`/crm/notifications?${query.toString()}`);
    return response;
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await api.get('/crm/notifications/unread-count');
    return response;
  },

  // Get single notification
  getNotification: async (id) => {
    const response = await api.get(`/crm/notifications/${id}`);
    return response;
  },

  // Mark notification as read
  markAsRead: async (id) => {
    const response = await api.put(`/crm/notifications/${id}/read`);
    return response;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await api.put('/crm/notifications/mark-all-read');
    return response;
  },

  // Create notification
  createNotification: async (data) => {
    const response = await api.post('/crm/notifications', data);
    return response;
  },

  // Delete notification
  deleteNotification: async (id) => {
    const response = await api.delete(`/crm/notifications/${id}`);
    return response;
  },

  // Clear all read notifications
  clearReadNotifications: async () => {
    const response = await api.delete('/crm/notifications/clear-read');
    return response;
  },

  // Trigger notification generation from real business events
  generateNotifications: async () => {
    const response = await api.post('/crm/notifications/generate', {});
    return response;
  },
};

export default notificationService;
