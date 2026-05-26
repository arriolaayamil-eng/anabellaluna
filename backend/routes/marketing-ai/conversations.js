const express = require('express');
const router  = express.Router();

const AIConversation = require('../../models/AIConversation');
const AIMessage      = require('../../models/AIMessage');
const { chat }               = require('../../services/ai/mcpChatService');
const { agentScope, resolvePermissions } = require('../../middlewares/rbac');

// GET /marketing-ai/conversations
router.get('/', async (req, res) => {
  try {
    const scopeId = agentScope(req);
    const filter  = { status: { $ne: 'deleted' } };

    if (scopeId) {
      filter.agenteId = scopeId;
    } else {
      filter.userId = String(req.user.sub || req.user.id || req.user._id || '');
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

// POST /marketing-ai/conversations
router.post('/', async (req, res) => {
  try {
    const scopeId = agentScope(req);
    const userId  = String(req.user.sub || req.user.id || req.user._id || '');

    const conversation = await AIConversation.create({
      userId,
      agenteId:    scopeId || req.user.agenteId || '',
      title:       req.body.title || 'Nueva conversación',
      contextType: req.body.contextType || 'marketing',
    });

    res.status(201).json(conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /marketing-ai/conversations/:id
router.get('/:id', async (req, res) => {
  try {
    const conversation = await AIConversation.findById(req.params.id).lean();
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /marketing-ai/conversations/:id
router.patch('/:id', async (req, res) => {
  try {
    const { title, status } = req.body;
    const update = {};
    if (title)  update.title  = title;
    if (status) update.status = status;

    const updated = await AIConversation.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /marketing-ai/conversations/:id/messages
router.get('/:id/messages', async (req, res) => {
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

// POST /marketing-ai/conversations/:id/messages — enviar mensaje al AI
router.post('/:id/messages', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }

    const userId      = String(req.user.sub || req.user.id || req.user._id || '');
    const permissions = resolvePermissions(req.user);

    const result = await chat({
      conversationId: req.params.id,
      userMessage:    message.trim(),
      userId,
      agenteId:    req.user.agenteId   || '',
      agenteName:  req.user.username   || req.user.nombre || '',
      permissions,
    });

    res.json({ ...result, content: result.content || result.response || '' });
  } catch (err) {
    console.error('[AI] processMessage error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
