import { api } from '../config/api';

const buildQuery = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
};

export const templateService = {
  list: (params = {}) => api.get(`/contract-templates${buildQuery(params)}`),
  getById: (id) => api.get(`/contract-templates/${id}`),
  create: (data) => api.post('/contract-templates', data),
  update: (id, data) => api.put(`/contract-templates/${id}`, data),
  remove: (id) => api.delete(`/contract-templates/${id}`),
  placeholders: () => api.get('/contract-templates/placeholders'),
  searchClients: (q = '', limit = 12) => api.get(`/contract-templates/clients/search${buildQuery({ q, limit })}`),
  searchProperties: (q = '', options = {}) => api.get(`/contract-templates/properties/search${buildQuery({ q, clientId: options.clientId, limit: options.limit || 12 })}`),
  preview: (payload) => api.post('/contract-templates/preview', payload),
  generate: (payload) => api.post('/contract-templates/generate', payload),
};

export default templateService;
