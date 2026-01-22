import { api } from '../config/api';

const automationService = {
  // Get all automation rules
  getAutomations: async (activo) => {
    const query = activo !== undefined ? `?activo=${activo}` : '';
    const response = await api.get(`/crm/automations${query}`);
    return response;
  },

  // Get default templates
  getTemplates: async () => {
    const response = await api.get('/crm/automations/templates');
    return response;
  },

  // Get statistics
  getStats: async () => {
    const response = await api.get('/crm/automations/stats');
    return response;
  },

  // Get single automation
  getAutomation: async (id) => {
    const response = await api.get(`/crm/automations/${id}`);
    return response;
  },

  // Create automation (optionally from template)
  createAutomation: async (data) => {
    const response = await api.post('/crm/automations', data);
    return response;
  },

  // Update automation
  updateAutomation: async (id, data) => {
    const response = await api.put(`/crm/automations/${id}`, data);
    return response;
  },

  // Toggle automation active status
  toggleAutomation: async (id) => {
    const response = await api.put(`/crm/automations/${id}/toggle`);
    return response;
  },

  // Delete automation
  deleteAutomation: async (id) => {
    const response = await api.delete(`/crm/automations/${id}`);
    return response;
  },

  // Execute automation manually (for testing)
  executeAutomation: async (id) => {
    const response = await api.post(`/crm/automations/${id}/execute`);
    return response;
  },

  // Initialize default automations for agent
  initializeDefaults: async () => {
    const response = await api.post('/crm/automations/initialize-defaults');
    return response;
  },
};

export default automationService;
