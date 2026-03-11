import { api, isApiUnavailableError } from '../config/api';

export const authService = {
  // Login
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });
    if (response.token) {
      localStorage.setItem('authToken', response.token);
      // Fetch full user profile data
      try {
        const me = await api.get('/auth/me');
        if (me && me.user) {
          localStorage.setItem('user', JSON.stringify(me.user));
          // Dispatch custom event to notify components of user update
          window.dispatchEvent(new CustomEvent('userUpdated', { detail: me.user }));

          // Set agent online status
          if (me.user.role === 'agent') {
            try {
              await api.put('/crm/messages/status/online', { online: true });
            } catch (err) {
              if (isApiUnavailableError(err)) return response;
              console.error('Error setting online status:', err);
            }
          }
        }
      } catch (e) {
        if (isApiUnavailableError(e)) return response;
        console.error('Error fetching user profile:', e);
      }
    }
    return response;
  },

  // Register
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response;
  },

  // Logout
  logout: async () => {
    // Set offline status before logging out
    try {
      const user = authService.getCurrentUser();
      if (user && user.role === 'agent') {
        await api.put('/crm/messages/status/online', { online: false });
      }
    } catch (err) {
      if (isApiUnavailableError(err)) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        return;
      }
      console.error('Error setting offline status:', err);
    }

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
        // Dispatch custom event to notify components of user update
        window.dispatchEvent(new CustomEvent('userUpdated', { detail: me.user }));
        return me.user;
      }
    } catch (e) {
      if (isApiUnavailableError(e)) return null;
      console.error('Error refreshing user data:', e);
    }
    return null;
  },

  // Update user in localStorage (after profile save)
  updateLocalUser: (userData) => {
    const current = authService.getCurrentUser();
    const updated = { ...current, ...userData };
    localStorage.setItem('user', JSON.stringify(updated));
    return updated;
  },

  // Check if user is authenticated
  isAuthenticated: () => !!localStorage.getItem('authToken'),
};
