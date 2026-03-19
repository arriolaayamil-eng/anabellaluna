import { api } from '../config/api';

export const tasacionesService = {
  // ── Market Studies ──
  marketStudies: {
    getAll: () => api.get('/crm/tasaciones/market-studies'),
    getById: (id) => api.get(`/crm/tasaciones/market-studies/${id}`),
    create: (data) => api.post('/crm/tasaciones/market-studies', data),
    update: (id, data) => api.put(`/crm/tasaciones/market-studies/${id}`, data),
    delete: (id) => api.delete(`/crm/tasaciones/market-studies/${id}`),
    generatePdf: (id) => api.post(`/crm/tasaciones/market-studies/${id}/pdf`),
    duplicate: (id) => api.post(`/crm/tasaciones/market-studies/${id}/duplicate`),
    getPdfDownloadUrl: (id) => `/crm/tasaciones/market-studies/${id}/pdf/download`,
  },

  // ── Appraisals ──
  appraisals: {
    getAll: () => api.get('/crm/tasaciones/appraisals'),
    getById: (id) => api.get(`/crm/tasaciones/appraisals/${id}`),
    create: (data) => api.post('/crm/tasaciones/appraisals', data),
    update: (id, data) => api.put(`/crm/tasaciones/appraisals/${id}`, data),
    delete: (id) => api.delete(`/crm/tasaciones/appraisals/${id}`),
    generatePdf: (id) => api.post(`/crm/tasaciones/appraisals/${id}/pdf`),
    duplicate: (id) => api.post(`/crm/tasaciones/appraisals/${id}/duplicate`),
    getPdfDownloadUrl: (id) => `/crm/tasaciones/appraisals/${id}/pdf/download`,
  },
};

export default tasacionesService;
