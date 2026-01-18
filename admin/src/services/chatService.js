import { api } from '../config/api';

const chatService = {
  // Get list of agents for chat
  getAgents: () => api.get('/crm/messages/agents'),
  
  // Get all conversations for current user
  getConversations: () => api.get('/crm/messages/conversations'),
  
  // Get message history with a specific user
  getHistory: (partnerId, options = {}) => {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit);
    if (options.before) params.append('before', options.before);
    const qs = params.toString();
    return api.get(`/crm/messages/history/${partnerId}${qs ? `?${qs}` : ''}`);
  },
  
  // Send a message
  send: (receiverId, content, options = {}) => api.post('/crm/messages/send', {
    receiverId,
    content,
    contentType: options.contentType || 'text',
    attachment: options.attachment,
    receiverType: options.receiverType || 'agent'
  }),
  
  // Mark messages as read
  markAsRead: (partnerId) => api.put(`/crm/messages/read/${partnerId}`),
  
  // Get unread count
  getUnreadCount: () => api.get('/crm/messages/unread'),
  
  // Delete a message
  delete: (messageId) => api.delete(`/crm/messages/${messageId}`),
  
  // Update online status
  setOnlineStatus: (online) => api.put('/crm/messages/status/online', { online }),
  
  // Search messages
  search: (query, limit = 20) => api.get(`/crm/messages/search?q=${encodeURIComponent(query)}&limit=${limit}`),
  
  // Broadcast message to all agents (admin only)
  broadcast: (content, contentType = 'text') => api.post('/crm/messages/broadcast', { content, contentType }),
  
  // Group chat
  createGroup: (name, participantIds) => api.post('/crm/messages/group/create', { name, participantIds }),
  sendToGroup: (groupId, content, contentType = 'text') => api.post(`/crm/messages/group/${groupId}/send`, { content, contentType }),
  getGroupHistory: (groupId, options = {}) => {
    const params = new URLSearchParams();
    if (options.limit) params.append('limit', options.limit);
    if (options.before) params.append('before', options.before);
    const qs = params.toString();
    return api.get(`/crm/messages/group/${groupId}/history${qs ? `?${qs}` : ''}`);
  },
};

export default chatService;
