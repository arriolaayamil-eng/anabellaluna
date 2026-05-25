/**
 * AI Chat Route — New MCP-based endpoint.
 * Replaces the old marketing-ai/conversations message flow.
 *
 * POST /ai/chat          — send message, get AI response
 * GET  /ai/conversations — list conversations
 * POST /ai/conversations — create conversation
 * GET  /ai/conversations/:id/messages — get messages
 */

const express = require('express');
const router = express.Router();

const { authenticateToken } = require('../auth');
const { resolvePermissions } = require('../middlewares/rbac');
const { aiRateLimit } = require('../middlewares/aiRateLimit');
const { chat } = require('../services/ai/mcpChatService');
const AIConversation = require('../models/AIConversation');
const AIMessage = require('../models/AIMessage');

router.use(authenticateToken);
router.use(aiRateLimit({ maxRequests: 30, windowSeconds: 60 }));

// Middleware: require crm:read or marketing:read
function requireAIAccess(req, res, next) {
  const perms = resolvePermissions(req.user);
  if (!perms.includes('crm:read') && !perms.includes('marketing:read')) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  req.permissions = perms;
  next();
}
router.use(requireAIAccess);

// POST /ai/chat — main endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, conversationId } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }

    const userId = String(req.user.sub || req.user.id || req.user._id || '');
    const agenteId = req.user.agenteId || '';

    const result = await chat({
      conversationId: conversationId || null,
      userMessage: message.trim(),
      userId,
      agenteId,
      agenteName: req.user.username || '',
    });

    res.json(result);
  } catch (err) {
    console.error('[AI/Chat] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /ai/conversations
router.get('/conversations', async (req, res) => {
  try {
    const userId = String(req.user.sub || req.user.id || req.user._id || '');
    const agenteId = req.user.agenteId || '';
    const filter = { status: { $ne: 'deleted' } };
    if (req.user.role === 'agent' && agenteId) {
      filter.agenteId = agenteId;
    } else {
      filter.userId = userId;
    }
    const conversations = await AIConversation.find(filter)
      .sort({ lastMessageAt: -1 })
      .limit(50)
      .lean();
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /ai/conversations
router.post('/conversations', async (req, res) => {
  try {
    const userId = String(req.user.sub || req.user.id || req.user._id || '');
    const conversation = await AIConversation.create({
      userId,
      agenteId: req.user.agenteId || '',
      title: req.body.title || 'Nueva conversación',
      contextType: 'general',
    });
    res.status(201).json(conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /ai/conversations/:id/messages
router.get('/conversations/:id/messages', async (req, res) => {
  try {
    const messages = await AIMessage.find({ conversationId: req.params.id })
      .sort({ createdAt: 1 })
      .limit(200)
      .lean();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /ai/conversations/:id
router.patch('/conversations/:id', async (req, res) => {
  try {
    const { title, status } = req.body;
    const update = {};
    if (title) update.title = title;
    if (status) update.status = status;
    const updated = await AIConversation.findByIdAndUpdate(req.params.id, { $set: update }, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
