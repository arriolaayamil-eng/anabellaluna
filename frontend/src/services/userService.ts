import { api } from '../config/api';

export interface RegisterPayload {
  username: string;
  password: string;
  nombre?: string;
  role?: 'admin' | 'agent' | 'user';
}

export interface User {
  id: string;
  sub?: string;
  username: string;
  role: string;
  nombre?: string;
  email?: string;
  telefono?: string;
  avatar?: string;
  direccion?: string;
  bio?: string;
  createdAt?: string;
}

export interface ProfileUpdatePayload {
  nombre?: string;
  email?: string;
  telefono?: string;
  avatar?: string;
  direccion?: string;
  bio?: string;
}

export const userService = {
  setSession: async (token: string) => {
    localStorage.setItem('authToken', token);
    const meResponse = await api.get('/auth/me');
    const payload = meResponse?.user;
    if (payload) {
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: payload.sub,
          username: payload.username,
          role: payload.role,
          agenteId: payload.agenteId,
          nombre: payload.nombre || '',
          email: payload.email || payload.username || '',
          telefono: payload.telefono || '',
          avatar: payload.avatar || '',
          direccion: payload.direccion || '',
          bio: payload.bio || '',
        })
      );
    }
    return payload;
  },

  // Registrar un nuevo usuario (para CRM)
  register: async (payload: RegisterPayload): Promise<User> => {
    const response = await api.post('/auth/register', payload);
    return response;
  },

  // Registro público para usuarios del sitio web
  registerPublic: async (payload: RegisterPayload) => {
    const response = await api.post('/auth/public-register', {
      username: payload.username,
      password: payload.password,
      nombre: payload.nombre || '',
    });
    if (response.token) {
      await userService.setSession(response.token);
    }
    return response;
  },

  // Login
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.token) {
      await userService.setSession(response.token);
    }
    return response;
  },

  // Obtener el usuario actual desde localStorage
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Refrescar datos del usuario desde el servidor
  refreshUserData: async (): Promise<User | null> => {
    try {
      const meResponse = await api.get('/auth/me');
      const payload = meResponse?.user;
      if (payload) {
        const userData = {
          id: payload.sub,
          username: payload.username,
          role: payload.role,
          agenteId: payload.agenteId,
          nombre: payload.nombre || '',
          email: payload.email || payload.username || '',
          telefono: payload.telefono || '',
          avatar: payload.avatar || '',
          direccion: payload.direccion || '',
          bio: payload.bio || '',
        };
        localStorage.setItem('user', JSON.stringify(userData));
        return userData;
      }
    } catch (e) {
      console.error('Error refreshing user data:', e);
    }
    return null;
  },

  // Actualizar perfil del usuario
  updateProfile: async (data: ProfileUpdatePayload): Promise<User> => {
    const response = await api.put('/auth/profile', data);
    // Actualizar localStorage con los nuevos datos
    const currentUser = userService.getCurrentUser();
    const updatedUser = { ...currentUser, ...response };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    return updatedUser;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  // Verificar si está autenticado
  isAuthenticated: () => !!localStorage.getItem('authToken'),
};

export default userService;
