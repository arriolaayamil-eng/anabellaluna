const express = require('express');
const Activity = require('../models/Activity');
const Cliente = require('../models/Cliente');
const { authenticateToken } = require('../auth');
const { triggerFollowUpAutomation } = require('../services/automationScheduler');

const router = express.Router();

function agentScopeId(req) {
  if (req.user && req.user.role === 'admin') return null;
  return req.user && req.user.agenteId ? String(req.user.agenteId) : null;
}

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { q, clientId, propertyId, type } = req.query;
    const scopeId = agentScopeId(req);
    const filter = {};

    if (q) filter.notes = { $regex: q, $options: 'i' };
    if (clientId) filter.clientId = String(clientId);
    if (propertyId) filter.propertyId = String(propertyId);
    if (type) filter.type = String(type);
    if (scopeId) filter.agenteId = scopeId;

    const items = await Activity.find(filter).sort({ createdAt: -1 }).limit(1000).lean();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const item = await Activity.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ error: 'Not found' });

    const scopeId = agentScopeId(req);
    if (scopeId && String(item.agenteId || '') !== scopeId) return res.status(403).json({ error: 'forbidden' });
    return res.json(item);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const body = { ...(req.body || {}) };
    if (scopeId) body.agenteId = scopeId;

    const agenteId = body.agenteId ? String(body.agenteId) : '';
    const clientId = body.clientId ? String(body.clientId) : '';
    const isFirstActivity =
      agenteId && clientId ? !(await Activity.exists({ agenteId, clientId })) : false;

    const created = await Activity.create(body);

    if (agenteId && clientId) {
      const clienteFilter = { _id: clientId };
      if (scopeId) clienteFilter.agenteId = agenteId;
      const ts = created && created.createdAt ? new Date(created.createdAt) : new Date();

      await Cliente.updateOne(
        clienteFilter,
        { $set: { 'metadata.ultimaActividad': ts } },
        { runValidators: true }
      );

      if (isFirstActivity) {
        const cliente = await Cliente.findOne(clienteFilter).lean();
        if (cliente) {
          triggerFollowUpAutomation(cliente, agenteId).catch(console.error);
        }
      }
    }
    return res.status(201).json(created);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const filter = { _id: req.params.id };
    if (scopeId) filter.agenteId = scopeId;

    const body = { ...(req.body || {}) };
    if (scopeId) body.agenteId = scopeId;

    const updated = await Activity.findOneAndUpdate(filter, body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    return res.json(updated);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const filter = { _id: req.params.id };
    if (scopeId) filter.agenteId = scopeId;

    const deleted = await Activity.findOneAndDelete(filter);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
