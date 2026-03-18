import { api } from '../config/api';

export const crmService = {
  // ============ LINKS (DOCUMENTOS <-> ENTIDADES CRM) ============
  links: {
    getByEntity: (entityType, entityId) => api.get(`/crm/links?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`),
    link: ({ documentId, entityType, entityId }) => api.post('/crm/link', { documentId, entityType, entityId }),
    unlink: ({ documentId, entityType, entityId }) => api.post('/crm/unlink', { documentId, entityType, entityId }),
  },

  // ============ PROPIEDADES ============
  propiedades: {
    getAll: () => api.get('/crm/propiedades'),
    getById: (id) => api.get(`/crm/propiedades/${id}`),
    create: (data) => api.post('/crm/propiedades', data),
    update: (id, data) => api.put(`/crm/propiedades/${id}`, data),
    delete: (id) => api.delete(`/crm/propiedades/${id}`),
  },

  // ============ CLIENTES ============
  clientes: {
    getAll: () => api.get('/crm/clientes'),
    getById: (id) => api.get(`/crm/clientes/${id}`),
    create: (data) => api.post('/crm/clientes', data),
    update: (id, data) => api.put(`/crm/clientes/${id}`, data),
    delete: (id) => api.delete(`/crm/clientes/${id}`),
  },

  // ============ AGENTES ============
  agentes: {
    getAll: () => api.get('/crm/agentes'),
    getById: (id) => api.get(`/crm/agentes/${id}`),
    create: (data) => api.post('/crm/agentes', data),
    update: (id, data) => api.put(`/crm/agentes/${id}`, data),
    delete: (id) => api.delete(`/crm/agentes/${id}`),
    getAdmins: () => api.get('/crm/agentes/admins'),
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
    getAll: () => api.get('/crm/tareas'),
    getById: (id) => api.get(`/crm/tareas/${id}`),
    create: (data) => api.post('/crm/tareas', data),
    update: (id, data) => api.put(`/crm/tareas/${id}`, data),
    delete: (id) => api.delete(`/crm/tareas/${id}`),
    // Kanban endpoints
    getKanban: () => api.get('/crm/tareas/kanban'),
    getKanbanColumns: () => api.get('/crm/tareas/kanban/columns'),
    saveKanbanColumns: (columns) => api.put('/crm/tareas/kanban/columns', { columns }),
    moveTask: (id, kanbanColumn, position) => api.put(`/crm/tareas/kanban/move/${id}`, { kanbanColumn, position }),
  },

  // ============ NAVBAR ============
  navbar: {
    getSummary: () => api.get('/admin/notifications/navbar-summary'),
  },

  // ============ ACTIVIDADES ============
  activities: {
    getAll: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return api.get(`/crm/activities${qs ? `?${qs}` : ''}`);
    },
  },

  // ============ ESTADÍSTICAS ============
  stats: {
    getDashboard: () => api.get('/crm/stats/dashboard'),
    getAdminDashboard: () => api.get('/admin/stats/dashboard'),
    getOperacionesStats: () => api.get('/crm/stats/operaciones'),
    getPropiedadesStats: () => api.get('/crm/stats/propiedades'),
    getVentasStats: () => api.get('/crm/stats/ventas'),
    getAgentesStats: () => api.get('/crm/stats/agentes'),
  },

  // ============ RECOMPENSAS V2 ============
  rewards: {
    // Legacy (kept for backward compat)
    getSummary: () => api.get('/crm/rewards/summary'),
    getAgentRewards: (agenteId) => api.get(`/crm/rewards/agent/${agenteId}`),
    // V2
    getLeaderboard: (year, quarter) => api.get(`/crm/rewards-v2/leaderboard?year=${year}&quarter=${quarter}`),
    getConfig: () => api.get('/crm/rewards-v2/config'),
    updateConfig: (data) => api.put('/crm/rewards-v2/config', data),
    recalculate: (data) => api.post('/crm/rewards-v2/recalculate', data),
    getAgentDashboard: (id) => api.get(`/crm/rewards-v2/agent/${id}/dashboard`),
    getQuarterlyAwards: (year, quarter) => api.get(`/crm/rewards-v2/quarterly-awards?year=${year}&quarter=${quarter}`),
    getPreListingAll: () => api.get('/crm/rewards-v2/pre-listing/all'),
    getLoyalty: (year) => api.get(`/crm/rewards-v2/loyalty?year=${year}`),
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
    generatePdf: (data) => api.postForBlob('/crm/reports/generate-pdf', data),
    sendToERP: (reportId) => api.post('/crm/reports/send-to-erp', { reportId }),
    getHistory: () => api.get('/crm/reports/history'),
    getReceived: () => api.get('/crm/reports/received'),
  },
};

export default crmService;
