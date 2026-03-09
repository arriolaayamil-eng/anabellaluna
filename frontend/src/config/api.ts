// Configuración de la API para el ERP
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const getAuthToken = () => localStorage.getItem('authToken');

const VISITOR_ID_STORAGE_KEY = 'anabella_visitor_id';

const generateVisitorId = () => {
  const g = globalThis as any;
  if (g.crypto && typeof g.crypto.randomUUID === 'function') return g.crypto.randomUUID();
  if (g.crypto && typeof g.crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    g.crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b: number) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const getVisitorId = () => {
  const existing = localStorage.getItem(VISITOR_ID_STORAGE_KEY);
  if (existing) return existing;
  const id = generateVisitorId();
  localStorage.setItem(VISITOR_ID_STORAGE_KEY, id);
  return id;
};

export const getAuthHeaders = () => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-visitor-id': getVisitorId(),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    ...options,
    headers: { ...getAuthHeaders(), ...options.headers },
  };

  const response = await fetch(url, config);
  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: 'Error en la petición' }));
    throw new Error(
      error.message || error.error || `HTTP error! status: ${response.status}`
    );
  }
  return await response.json();
};

export const api = {
  get: (endpoint: string) => apiRequest(endpoint, { method: 'GET' }),
  post: (endpoint: string, data: any) => apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  put: (endpoint: string, data: any) => apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (endpoint: string) => apiRequest(endpoint, { method: 'DELETE' }),
};

export default api;
