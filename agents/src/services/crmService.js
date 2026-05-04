import { api } from '../config/api';

export const crmService = {
  // ============ LINKS (DOCUMENTOS <-> ENTIDADES CRM) ============
  links: {
    getByEntity: (entityType, entityId) => api.get(`/crm/links?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`),
    link: ({ documentId, entityType, entityId }) => api.post('/crm/link', { documentId, entityType, entityId }),
    unlink: ({ documentId, entityType, entityId }) => api.post('/crm/unlink', { documentId, entityType, entityId }),
    reorder: (ids) => api.patch('/crm/links/reorder', { ids }),
  },

  // ============ PROPIEDADES ============
  propiedades: {
    getAll: () => api.get('/crm/propiedades'),
    getById: (id) => api.get(`/crm/propiedades/${id}`),
    create: (data) => api.post('/crm/propiedades', data),
    update: (id, data) => api.put(`/crm/propiedades/${id}`, data),
    delete: (id) => api.delete(`/crm/propiedades/${id}`),
    togglePublish: (id, published) => api.patch(`/crm/propiedades/${id}/publish`, { published }),
    generatePrivateLink: (id) => api.post(`/crm/propiedades/${id}/private-link`),
    revokePrivateLink: (id) => api.delete(`/crm/propiedades/${id}/private-link`),
  },

  // ============ CLIENTES ============
  clientes: {
    getAll: (q) => api.get(q ? `/crm/clientes?q=${encodeURIComponent(q)}` : '/crm/clientes'),
    getById: (id) => api.get(`/crm/clientes/${id}`),
    create: (data) => api.post('/crm/clientes', data),
    update: (id, data) => api.put(`/crm/clientes/${id}`, data),
    delete: (id) => api.delete(`/crm/clientes/${id}`),
  },

  // ============ CLIENT INTERACTIONS ============
  clientInteractions: {
    list: (clienteId) => api.get(`/crm/client-interactions/${clienteId}`),
    create: (clienteId, data) => api.post(`/crm/client-interactions/${clienteId}`, data),
    lifebar: (clienteId) => api.get(`/crm/client-interactions/${clienteId}/lifebar`),
    bulkLifebars: () => api.get('/crm/client-interactions/bulk/lifebars'),
    bulkCounts: () => api.get('/crm/client-interactions/bulk-counts'),
    propertyMetrics: (propiedadId) => api.get(`/crm/client-interactions/property/${propiedadId}/metrics`),
    clientMetrics: (clienteId) => api.get(`/crm/client-interactions/client-metrics/${clienteId}`),
    ownerReport: (propiedadId, days = 30) => api.get(`/crm/client-interactions/owner-report/${propiedadId}?days=${days}`),
  },

  // ============ AGENTES ============
  agentes: {
    getAll: () => api.get('/crm/agentes'),
    getById: (id) => api.get(`/crm/agentes/${id}`),
    create: (data) => api.post('/crm/agentes', data),
    update: (id, data) => api.put(`/crm/agentes/${id}`, data),
    delete: (id) => api.delete(`/crm/agentes/${id}`),
    getAdmins: () => api.get('/crm/agentes/admins'),
    forAssignment: () => api.get('/crm/agentes/for-assignment'),
  },

  // ============ INMOBILIARIAS ============
  inmobiliarias: {
    getAll: () => api.get('/crm/inmobiliarias'),
    create: (data) => api.post('/crm/inmobiliarias', data),
  },

  // ============ OPERACIONES/VENTAS ============
  operaciones: {
    getAll: () => api.get('/crm/operaciones'),
    getById: (id) => api.get(`/crm/operaciones/${id}`),
    create: (data) => api.post('/crm/operaciones', data),
    update: (id, data) => api.put(`/crm/operaciones/${id}`, data),
    delete: (id) => api.delete(`/crm/operaciones/${id}`),
  },

  // ============ CITAS ============
  citas: {
    getAll: () => api.get('/crm/citas'),
    getById: (id) => api.get(`/crm/citas/${id}`),
    create: (data) => api.post('/crm/citas', data),
    update: (id, data) => api.put(`/crm/citas/${id}`, data),
    delete: (id) => api.delete(`/crm/citas/${id}`),
  },

  // ============ TAREAS ============
  tareas: {
    getAll: (params) => api.get('/crm/tareas', { params }),
    getById: (id) => api.get(`/crm/tareas/${id}`),
    create: (data) => api.post('/crm/tareas', data),
    update: (id, data) => api.put(`/crm/tareas/${id}`, data),
    delete: (id) => api.delete(`/crm/tareas/${id}`),
    getStats: () => api.get('/crm/tareas/stats'),
    getKanban: () => api.get('/crm/tareas/kanban'),
    getKanbanColumns: () => api.get('/crm/tareas/kanban/columns'),
    moveTask: (id, kanbanColumn, position) => api.put(`/crm/tareas/kanban/move/${id}`, { kanbanColumn, position }),
    delegate: (id, data) => api.post(`/crm/tareas/${id}/delegate`, data),
    getActivity: (id) => api.get(`/crm/tareas/${id}/activity`),
    addComment: (id, text) => api.post(`/crm/tareas/${id}/comment`, { text }),
    toggleChecklist: (id, itemId) => api.patch(`/crm/tareas/${id}/checklist/${itemId}`),
  },

  // ============ EQUIPOS ============
  teams: {
    getAll: () => api.get('/crm/teams'),
    getById: (id) => api.get(`/crm/teams/${id}`),
    create: (data) => api.post('/crm/teams', data),
    update: (id, data) => api.put(`/crm/teams/${id}`, data),
    delete: (id) => api.delete(`/crm/teams/${id}`),
    addMember: (id, data) => api.post(`/crm/teams/${id}/members`, data),
    removeMember: (id, userId) => api.delete(`/crm/teams/${id}/members/${userId}`),
  },

  // ============ ESTADÍSTICAS ============
  stats: {
    getDashboard: () => api.get('/crm/stats/dashboard'),
    getOperacionesStats: () => api.get('/crm/stats/operaciones'),
    getPropiedadesStats: () => api.get('/crm/stats/propiedades'),
    getVentasStats: () => api.get('/crm/stats/ventas'),
    getAgentesStats: () => api.get('/crm/stats/agentes'),
  },

  // ============ NAVBAR SUMMARY ============
  navbar: {
    getSummary: () => api.get('/crm/navbar-summary'),
  },

  // ============ ACTIVIDADES (CONSULTAS / EVENTOS) ============
  activities: {
    getAll: (params = {}) => {
      const q = params.q ? `q=${encodeURIComponent(params.q)}` : '';
      const clientId = params.clientId ? `clientId=${encodeURIComponent(params.clientId)}` : '';
      const propertyId = params.propertyId ? `propertyId=${encodeURIComponent(params.propertyId)}` : '';
      const type = params.type ? `type=${encodeURIComponent(params.type)}` : '';
      const parts = [q, clientId, propertyId, type].filter(Boolean);
      const qs = parts.length ? `?${parts.join('&')}` : '';
      return api.get(`/crm/activities${qs}`);
    },
    getById: (id) => api.get(`/crm/activities/${encodeURIComponent(id)}`),
    create: (data) => api.post('/crm/activities', data),
    update: (id, data) => api.put(`/crm/activities/${encodeURIComponent(id)}`, data),
    delete: (id) => api.delete(`/crm/activities/${encodeURIComponent(id)}`),
  },

  // ============ INTEGRACIONES ============
  integrations: {
    googleCalendar: {
      // OAuth credentials management (per-agent)
      getCredentials: () => api.get('/crm/integrations/google-calendar/credentials'),
      saveCredentials: (clientId, clientSecret) => api.put('/crm/integrations/google-calendar/credentials', { clientId, clientSecret }),
      deleteCredentials: () => api.delete('/crm/integrations/google-calendar/credentials'),
      // Calendar connection
      status: () => api.get('/crm/integrations/google-calendar/status'),
      getAuthUrl: () => api.get('/crm/integrations/google-calendar/auth-url'),
      disconnect: () => api.post('/crm/integrations/google-calendar/disconnect', {}),
    },
    googleMaps: {
      getConfig: () => api.get('/crm/integrations/google-maps/config'),
      saveConfig: (data) => api.put('/crm/integrations/google-maps/config', data),
      deleteConfig: () => api.delete('/crm/integrations/google-maps/config'),
    },
    googleCloud: {
      getConfig: () => api.get('/crm/integrations/google-cloud/config'),
      saveConfig: (data) => api.put('/crm/integrations/google-cloud/config', data),
    },
  },

  // ============ RECOMPENSAS ============
  rewards: {
    // Legacy V1 (kept for backward compat – milestones, celebrations)
    getMy: () => api.get('/crm/rewards/my'),
    getUnseen: () => api.get('/crm/rewards/unseen'),
    markCelebrated: (rewardIds) => api.post('/crm/rewards/mark-celebrated', { rewardIds }),
    getMetrics: (period = 'monthly') => api.get(`/crm/rewards/metrics?period=${period}`),
    recordLogin: () => api.post('/crm/rewards/record-login', {}),
    calculate: () => api.post('/crm/rewards/calculate', {}),
    checkMilestones: (hint) => api.post('/crm/rewards/check-milestones', { hint }),
    // V2
    getDashboard: () => api.get('/crm/rewards-v2/dashboard'),
    getLeaderboard: (year, quarter) => api.get(`/crm/rewards-v2/leaderboard?year=${year}&quarter=${quarter}`),
    getQuarterlyAwards: (year, quarter) => api.get(`/crm/rewards-v2/quarterly-awards?year=${year}&quarter=${quarter}`),
    createPreListing: (data) => api.post('/crm/rewards-v2/pre-listing', data),
    getPreListings: (limit) => api.get(`/crm/rewards-v2/pre-listing?limit=${limit || 50}`),
    getBadgeHistory: () => api.get('/crm/rewards-v2/badge-history'),
    getTierHistory: () => api.get('/crm/rewards-v2/tier-history'),
  },

  // ============ REPORTES ============
  reports: {
    getTypes: () => api.get('/crm/reports/types'),
    getConfig: () => api.get('/crm/reports/config'),
    updateConfig: (data) => api.put('/crm/reports/config', data),
    getData: (reportId, params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return api.get(`/crm/reports/data/${reportId}${qs ? `?${qs}` : ''}`);
    },
    getAllData: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return api.get(`/crm/reports/all-data${qs ? `?${qs}` : ''}`);
    },
    generate: (data) => api.post('/crm/reports/generate', data),
    sendToERP: (reportId) => api.post('/crm/reports/send-to-erp', { reportId }),
    sendPdf: (blob, filename, fields = {}) => api.uploadBlob('/crm/reports/send-pdf', blob, filename, fields),
    getHistory: () => api.get('/crm/reports/history'),
  },

  // ============ CHAT INTERNO ============
  chat: {
    // Get list of agents for chat
    getAgents: () => api.get('/crm/messages/agents'),

    // Get all conversations for current user
    getConversations: () => api.get('/crm/messages/conversations'),

    // Get message history with a specific user
    getHistory: (partnerId, options = {}) => {
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit);
      if (options.before) params.append('before', options.before);
      const qs = params.toString();
      return api.get(`/crm/messages/history/${partnerId}${qs ? `?${qs}` : ''}`);
    },

    // Send a message
    send: (receiverId, content, options = {}) => api.post('/crm/messages/send', {
      receiverId,
      content,
      contentType: options.contentType || 'text',
      attachment: options.attachment,
      receiverType: options.receiverType || 'agent',
    }),

    // Mark messages as read
    markAsRead: (partnerId) => api.put(`/crm/messages/read/${partnerId}`),

    // Get unread count
    getUnreadCount: () => api.get('/crm/messages/unread'),

    // Delete a message
    delete: (messageId) => api.delete(`/crm/messages/${messageId}`),

    // Update online status
    setOnlineStatus: (online) => api.put('/crm/messages/status/online', { online }),

    // Search messages
    search: (query, limit = 20) => api.get(`/crm/messages/search?q=${encodeURIComponent(query)}&limit=${limit}`),

    // Typing indicator
    sendTyping: (partnerId, isTyping) => api.post('/crm/messages/typing', { partnerId, isTyping }),

    // Group chat
    createGroup: (name, participantIds) => api.post('/crm/messages/group/create', { name, participantIds }),
    sendToGroup: (groupId, content, contentType = 'text') => api.post(`/crm/messages/group/${groupId}/send`, { content, contentType }),
    getGroupHistory: (groupId, options = {}) => {
      const params = new URLSearchParams();
      if (options.limit) params.append('limit', options.limit);
      if (options.before) params.append('before', options.before);
      const qs = params.toString();
      return api.get(`/crm/messages/group/${groupId}/history${qs ? `?${qs}` : ''}`);
    },

    // Broadcast (admin only)
    broadcast: (content, contentType = 'text') => api.post('/crm/messages/broadcast', { content, contentType }),
  },
};

export default crmService;
