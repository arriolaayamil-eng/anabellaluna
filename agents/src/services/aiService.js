import { api } from '../config/api';

const BASE = '/marketing-ai';

export const aiService = {
  getConversations: () => api.get(`${BASE}/conversations`),
  createConversation: (data = {}) => api.post(`${BASE}/conversations`, data),
  getMessages: (conversationId) => api.get(`${BASE}/conversations/${conversationId}/messages`),
  sendMessage: (conversationId, message) =>
    api.post(`${BASE}/conversations/${conversationId}/messages`, { message }),

  getCampaigns: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`${BASE}/campaigns${qs ? `?${qs}` : ''}`);
  },

  getOverviewMetrics: (days = 30) => api.get(`${BASE}/metrics/overview?days=${days}`),

  getRecommendations: (status = 'pending', limit = 20) =>
    api.get(`${BASE}/recommendations?status=${status}&limit=${limit}`),

  markRecommendationViewed: (id) => api.patch(`${BASE}/recommendations/${id}/viewed`),

  resolveRecommendation: (id, data) => api.patch(`${BASE}/recommendations/${id}/resolve`, data),

  approveTool: (executionId) =>
    api.post(`${BASE}/tools/executions/${executionId}/approve`, {}),

  rejectTool: (executionId, reason = '') =>
    api.post(`${BASE}/tools/executions/${executionId}/reject`, { reason }),
};

export default aiService;
