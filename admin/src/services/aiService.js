import { api } from '../config/api';

const BASE = '/marketing-ai';

export const aiService = {
  // ── Conversations ──────────────────────────────────────────────────────────

  getConversations: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`${BASE}/conversations${qs ? `?${qs}` : ''}`);
  },

  createConversation: (data = {}) =>
    api.post(`${BASE}/conversations`, data),

  getConversation: (id) => api.get(`${BASE}/conversations/${id}`),

  updateConversation: (id, data) => api.patch(`${BASE}/conversations/${id}`, data),

  getMessages: (conversationId) =>
    api.get(`${BASE}/conversations/${conversationId}/messages`),

  sendMessage: (conversationId, message, clientMessageId) =>
    api.post(`${BASE}/conversations/${conversationId}/messages`, { message, clientMessageId }),

  // ── Campaigns ─────────────────────────────────────────────────────────────

  getCampaigns: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`${BASE}/campaigns${qs ? `?${qs}` : ''}`);
  },

  syncCampaigns: () => api.post(`${BASE}/campaigns/sync`, {}),

  // ── Metrics ───────────────────────────────────────────────────────────────

  getOverviewMetrics: (days = 30) =>
    api.get(`${BASE}/metrics/overview?days=${days}`),

  getCampaignMetrics: (campaignId, days = 30) =>
    api.get(`${BASE}/metrics/${campaignId}?days=${days}`),

  // ── Recommendations ───────────────────────────────────────────────────────

  getRecommendations: (status = 'pending', limit = 20) =>
    api.get(`${BASE}/recommendations?status=${status}&limit=${limit}`),

  markRecommendationViewed: (id) =>
    api.patch(`${BASE}/recommendations/${id}/viewed`),

  resolveRecommendation: (id, data) =>
    api.patch(`${BASE}/recommendations/${id}/resolve`, data),

  // ── Tool Executions ───────────────────────────────────────────────────────

  listTools: () => api.get(`${BASE}/tools`),

  getExecutions: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return api.get(`${BASE}/tools/executions${qs ? `?${qs}` : ''}`);
  },

  approveTool: (executionId) =>
    api.post(`${BASE}/tools/executions/${executionId}/approve`, {}),

  rejectTool: (executionId, reason = '') =>
    api.post(`${BASE}/tools/executions/${executionId}/reject`, { reason }),

  rollbackExecution: (executionId) =>
    api.post(`${BASE}/tools/executions/${executionId}/rollback`, {}),

  // ── Admin — AI Config ─────────────────────────────────────────────────────

  getProviders: () => api.get('/admin/config/ai/providers'),

  updateProviders: (data) => api.put('/admin/config/ai/providers', data),

  getMetaAdsConfig: () => api.get('/admin/config/ai/meta-ads'),

  updateMetaAdsConfig: (data) => api.put('/admin/config/ai/meta-ads', data),

  deleteMetaAdsConfig: () => api.delete('/admin/config/ai/meta-ads'),

  getUsageStats: (days = 30) => api.get(`/admin/config/ai/usage?days=${days}`),
};

export default aiService;
