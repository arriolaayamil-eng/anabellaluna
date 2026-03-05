import { api } from '../config/api';

export const documentService = {
  // Obtener todos los documentos
  getAll: (searchQuery = '') => {
    const endpoint = searchQuery ? `/documents?q=${encodeURIComponent(searchQuery)}` : '/documents';
    return api.get(endpoint);
  },

  // Obtener un documento por ID
  getById: (id) => api.get(`/documents/${id}`),

  // Subir documentos
  upload: (files, options = {}) => api.uploadFiles('/documents', files, options),

  // Actualizar documento
  update: (id, data) => api.put(`/documents/${id}`, data),

  // Eliminar documento
  delete: (id) => api.delete(`/documents/${id}`),

  // Obtener versiones de un documento
  getVersions: (documentId) => api.get(`/documents/${documentId}/versions`),

  // Subir nueva versión
  uploadVersion: (documentId, file, options = {}) => api.uploadFiles(`/documents/${documentId}/versions`, [file], options),

  // Restaurar versión
  restoreVersion: (documentId, versionId) => 
    api.post(`/documents/${documentId}/versions/${versionId}/restore`),

  // ---- File Manager (Google Files) ----
  browse: (folderId = null, q = '') => {
    const params = new URLSearchParams();
    if (folderId) params.set('folder', folderId);
    if (q) params.set('q', q);
    return api.get(`/files/browse?${params.toString()}`);
  },
  search: (q) => api.get(`/files/search?q=${encodeURIComponent(q)}`),
  starred: () => api.get('/files/starred'),
  recent: () => api.get('/files/recent'),
  storage: () => api.get('/files/storage'),

  // Folders
  createFolder: (name, parent = null, color = '') =>
    api.post('/files', { name, parent, color }),
  renameFolder: (id, name) => api.patch(`/files/${id}/rename`, { name }),
  moveFolder: (id, parent) => api.patch(`/files/${id}/move`, { parent }),
  starFolder: (id) => api.patch(`/files/${id}/star`),
  deleteFolder: (id) => api.delete(`/files/${id}`),
  folderPath: (id) => api.get(`/files/${id}/path`),

  // Document extensions
  renameDoc: (id, nombre) => api.patch(`/files/documents/${id}/rename`, { nombre }),
  moveDoc: (id, folder) => api.patch(`/files/documents/${id}/move`, { folder }),
  starDoc: (id) => api.patch(`/files/documents/${id}/star`),
};

export default documentService;
