import { api } from '../config/api';

export const authService = {
  // Login
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.token) {
      localStorage.setItem('authToken', response.token);
      // Fetch full user profile data and enforce admin role
      try {
        const me = await api.get('/auth/me');
        if (me && me.user) {
          if (String(me.user.role || '') !== 'admin') {
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');
            throw new Error('Acceso restringido: solo administradores pueden ingresar al panel.');
          }
          localStorage.setItem('user', JSON.stringify(me.user));
        }
      } catch (e) {
        if (e.message && e.message.includes('Acceso restringido')) throw e;
        console.error('Error fetching user profile:', e);
      }
    }
    return response;
  },

  // Register
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.token) {
      localStorage.setItem('authToken', response.token);
      if (response.user) localStorage.setItem('user', JSON.stringify(response.user));
    }
    return response;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Refresh user data from server and update localStorage
  refreshUserData: async () => {
    try {
      const me = await api.get('/auth/me');
      if (me && me.user) {
        localStorage.setItem('user', JSON.stringify(me.user));
        return me.user;
      }
    } catch (e) {
      console.error('Error refreshing user data:', e);
    }
    return null;
  },

  // Update current user in localStorage (local only, use updateProfile for persistence)
  updateCurrentUser: (userData) => {
    const current = authService.getCurrentUser() || {};
    const updated = { ...current, ...userData };
    localStorage.setItem('user', JSON.stringify(updated));
    return updated;
  },

  // Update user profile on server and sync to localStorage
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    if (response) {
      // Merge server response with current user and update localStorage
      const current = authService.getCurrentUser() || {};
      const updated = { ...current, ...response };
      localStorage.setItem('user', JSON.stringify(updated));
      // Dispatch custom event to notify components of user update
      window.dispatchEvent(new CustomEvent('userUpdated', { detail: updated }));
      return updated;
    }
    return response;
  },

  // Check if user is authenticated
  isAuthenticated: () => !!localStorage.getItem('authToken'),
};
