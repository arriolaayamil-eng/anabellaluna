import { api, isApiUnavailableError } from '../config/api';

export const authService = {
  // Login — returns { token } or { requiresTwoFactor, twoFactorToken }
  login: async (username, password) => {
    const response = await api.post('/auth/login', { username, password });

    // 2FA required — return early, don't store token yet
    if (response.requiresTwoFactor) {
      return response;
    }

    if (response.token) {
      await authService._completeLogin(response.token);
    }
    return response;
  },

  // Complete login after 2FA verification
  verify2FALogin: async (twoFactorToken, code) => {
    const response = await api.post('/auth/2fa/verify-login', { twoFactorToken, code });
    if (response.token) {
      await authService._completeLogin(response.token);
    }
    return response;
  },

  // Use recovery code during login
  useRecoveryCode: async (twoFactorToken, recoveryCode) => {
    const response = await api.post('/auth/2fa/recovery/use', { twoFactorToken, recoveryCode });
    if (response.token) {
      await authService._completeLogin(response.token);
    }
    return response;
  },

  // Internal: store token, fetch profile, set online status
  _completeLogin: async (token) => {
    localStorage.setItem('authToken', token);
    try {
      const me = await api.get('/auth/me');
      if (me && me.user) {
        localStorage.setItem('user', JSON.stringify(me.user));
        window.dispatchEvent(new CustomEvent('userUpdated', { detail: me.user }));

        if (me.user.role === 'agent') {
          try {
            await api.put('/crm/messages/status/online', { online: true });
          } catch (err) {
            if (isApiUnavailableError(err)) return;
            console.error('Error setting online status:', err);
          }
        }
      }
    } catch (e) {
      if (isApiUnavailableError(e)) return;
      console.error('Error fetching user profile:', e);
    }
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

  // ─── 2FA Management ──────────────────────────────────────────────────────────
  get2FAStatus: () => api.get('/auth/2fa/status'),

  init2FASetup: () => api.post('/auth/2fa/setup/init'),

  verify2FASetup: (code) => api.post('/auth/2fa/setup/verify', { code }),

  disable2FA: (password, code, recoveryCode) => {
    const body = { password };
    if (code) body.code = code;
    if (recoveryCode) body.recoveryCode = recoveryCode;
    return api.post('/auth/2fa/disable', body);
  },

  regenerateRecoveryCodes: (password, code) =>
    api.post('/auth/2fa/recovery/regenerate', { password, code }),
};
