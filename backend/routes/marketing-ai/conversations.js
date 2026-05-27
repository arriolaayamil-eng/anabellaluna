const express = require('express');
const router  = express.Router();
const mongoose = require('mongoose');

const AIConversation = require('../../models/AIConversation');
const AIMessage      = require('../../models/AIMessage');
const { chat }               = require('../../services/ai/mcpChatService');
const { resolvePermissions } = require('../../middlewares/rbac');

function currentUserId(req) {
  return String(req.user.sub || req.user.id || req.user._id || '');
}

function contextTagFrom(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return `chat:${raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40)}`;
}

function conversationFilter(req) {
  const filter = {
    userId: currentUserId(req),
    status: { $ne: 'deleted' },
  };
  const tag = contextTagFrom(req.query.context || req.query.contextKey);
  if (tag) filter['metadata.tags'] = tag;
  return filter;
}

// GET /marketing-ai/conversations
router.get('/', async (req, res) => {
  try {
    const userId = currentUserId(req);
    const tag = contextTagFrom(req.query.context || req.query.contextKey);
    const filter = conversationFilter(req);

    let conversations = await AIConversation.find(filter)
      .sort({ lastMessageAt: -1 })
      .limit(50)
      .lean();

    if (conversations.length === 0 && req.query.autocreate === '1') {
      const created = await AIConversation.create({
        userId,
        agenteId:    req.user.agenteId || '',
        title:       'Copilot AI',
        contextType: 'general',
        status:      'active',
        metadata:    { tags: tag ? [tag] : [] },
      });
      conversations = [created.toObject()];
    }

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /marketing-ai/conversations
router.post('/', async (req, res) => {
  try {
    const userId = currentUserId(req);
    const tag = contextTagFrom(req.body.context || req.body.contextKey);

    const conversation = await AIConversation.create({
      userId,
      agenteId:    req.user.agenteId || '',
      title:       req.body.title || 'Nueva conversación',
      contextType: req.body.contextType || 'marketing',
      metadata:    { tags: tag ? [tag] : [] },
    });

    res.status(201).json(conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /marketing-ai/conversations/:id
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    const conversation = await AIConversation.findOne({
      _id: req.params.id,
      userId: currentUserId(req),
      status: { $ne: 'deleted' },
    }).lean();
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    res.json(conversation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /marketing-ai/conversations/:id
router.patch('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    const { title, status } = req.body;
    const update = {};
    if (title)  update.title  = title;
    if (status) update.status = status;

    const updated = await AIConversation.findOneAndUpdate(
      { _id: req.params.id, userId: currentUserId(req) },
      { $set: update },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Conversation not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /marketing-ai/conversations/:id/messages
router.get('/:id/messages', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    const conversation = await AIConversation.findOne({
      _id: req.params.id,
      userId: currentUserId(req),
      status: { $ne: 'deleted' },
    }).select('_id').lean();
    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });

    const messages = await AIMessage.find({
      conversationId: req.params.id,
      userId: currentUserId(req),
    })
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
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }

    const userId      = currentUserId(req);
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
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

module.exports = router;
