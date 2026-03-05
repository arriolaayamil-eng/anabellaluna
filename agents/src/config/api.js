// Configuración de la API
const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:4000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

// Helper para obtener el token de autenticación
export const getAuthToken = () => {
  const raw = localStorage.getItem('authToken');
  if (!raw) return null;

  const token = String(raw).trim().replace(/^"|"$/g, '').replace(/^\'|\'$/g, '');
  return token.replace(/^Bearer\s+/i, '');
};

// Helper para configurar headers con autenticación
export const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    ...API_CONFIG.headers,
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Helper para hacer peticiones HTTP
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_CONFIG.baseURL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  };

  const isFormData = (typeof FormData !== 'undefined') && (options && options.body instanceof FormData);
  if (isFormData) {
    const headers = { ...(config.headers || {}) };
    delete headers['Content-Type'];
    delete headers['content-type'];
    config.headers = headers;
  }

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const msg = error.error || error.message || `HTTP error! status: ${response.status}`;

      if (response.status === 401) {
        const ep = String(endpoint || '');
        const isAuthFlow = ep.startsWith('/auth/login') || ep.startsWith('/auth/register');
        if (!isAuthFlow) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          try {
            if (typeof window !== 'undefined' && window.location) {
              setTimeout(() => window.location.reload(), 0);
            }
          } catch (e) {
            // ignore
          }
        }
      }
      throw new Error(msg);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};

// Métodos HTTP específicos
export const api = {
  get: (endpoint) => apiRequest(endpoint, { method: 'GET' }),
  
  post: (endpoint, data) => apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  put: (endpoint, data) => apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  patch: (endpoint, data) => apiRequest(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  }),
  
  delete: (endpoint) => apiRequest(endpoint, { method: 'DELETE' }),
  
  // Upload a single Blob (e.g. PDF) with metadata fields via FormData
  uploadBlob: async (endpoint, blob, filename, fields = {}) => {
    const formData = new FormData();
    formData.append('pdf', blob, filename);
    Object.entries(fields).forEach(([k, v]) => {
      if (v !== undefined && v !== null) formData.append(k, String(v));
    });
    const token = getAuthToken();
    const url = `${API_CONFIG.baseURL}${endpoint}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || err.message || `HTTP ${response.status}`);
    }
    return response.json();
  },

  // Para upload de archivos
  uploadFiles: async (endpoint, files, options = {}) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const fields = options && options.fields ? options.fields : null;
    if (fields && typeof fields === 'object') {
      Object.keys(fields).forEach((k) => {
        const v = fields[k];
        if (v === undefined || v === null) return;
        formData.append(k, String(v));
      });
    }

    return apiRequest(endpoint, {
      method: 'POST',
      body: formData,
      headers: options && options.headers ? options.headers : {},
    });
  },
};

export default API_CONFIG;
