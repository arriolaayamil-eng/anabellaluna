import { api, apiRequest } from '../config/api';

export const editorService = {
  // Images (from existing document system)
  listImages: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.folder) qs.set('folder', params.folder);
    if (params.q) qs.set('q', params.q);
    if (params.page) qs.set('page', String(params.page));
    if (params.limit) qs.set('limit', String(params.limit));
    return api.get(`/editor/images?${qs.toString()}`);
  },

  getImageUrl: (id) => api.get(`/editor/images/${id}/url`),

  // Folders
  listFolders: (parent = null) => {
    const qs = parent ? `?parent=${parent}` : '';
    return api.get(`/editor/folders${qs}`);
  },

  // Watermarks
  listWatermarks: () => api.get('/editor/watermarks'),

  uploadWatermark: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest('/editor/watermarks', {
      method: 'POST',
      body: formData,
      headers: {},
    });
  },

  deleteWatermark: (key) => api.delete(`/editor/watermarks/${encodeURIComponent(key)}`),

  // Render
  render: (data) => api.post('/editor/render', data),

  // Edited images
  listEdited: () => api.get('/editor/edited'),
  deleteEdited: (id) => api.delete(`/editor/edited/${id}`),
};

export default editorService;
