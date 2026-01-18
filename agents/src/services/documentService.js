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
};

export default documentService;
