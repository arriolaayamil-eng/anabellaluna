import { api } from '../config/api';

export interface AgentePayload {
  nombre: string;
  email?: string;
  telefono?: string;
  username?: string;
  password?: string;
  role?: 'agent' | 'admin' | 'user';
  metadata?: Record<string, any>;
}

export interface AgenteCreateWithUserResponse {
  agente: Agente;
  user: {
    id: string;
    username: string;
    role: string;
    agenteId: string;
  };
  password: string;
}

export interface Agente {
  _id: string;
  nombre: string;
  email: string;
  telefono: string;
  role: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export const agenteService = {
  // Crear agente (y usuario de auth asociado)
  create: async (payload: AgentePayload) => {
    const response = await api.post('/crm/agentes/create-with-user', {
      nombre: payload.nombre,
      email: payload.email,
      telefono: payload.telefono,
      username: payload.username,
      password: payload.password,
      metadata: payload.metadata,
    });
    return response as AgenteCreateWithUserResponse;
  },

  // Listar agentes
  getAll: () => api.get('/crm/agentes'),

  // Obtener agente por ID
  getById: (id: string) => api.get(`/crm/agentes/${id}`),

  // Actualizar agente
  update: (id: string, payload: Partial<AgentePayload>) => api.put(`/crm/agentes/${id}`, payload),

  // Eliminar agente
  delete: (id: string) => api.delete(`/crm/agentes/${id}`),
};

export default agenteService;
