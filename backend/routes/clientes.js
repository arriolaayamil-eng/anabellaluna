const express = require('express');
const Cliente = require('../models/Cliente');
const { authenticateToken } = require('../auth');
const { triggerWelcomeAutomation } = require('../services/automationScheduler');

const router = express.Router();

function agentScopeId(req) {
  if (req.user && req.user.role === 'admin') return null;
  return req.user && req.user.agenteId ? String(req.user.agenteId) : null;
}

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    const scopeId = agentScopeId(req);
    const filter = q ? { nombre: { $regex: q, $options: 'i' } } : {};
    if (scopeId) filter.agenteId = scopeId;
    const items = await Cliente.find(filter).sort({ updatedAt: -1 }).limit(1000).lean();
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const item = await Cliente.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ error: 'Not found' });
    if (scopeId && String(item.agenteId || '') !== scopeId) return res.status(403).json({ error: 'forbidden' });
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const body = { ...(req.body || {}) };
    if (scopeId) body.agenteId = scopeId;
    const created = await Cliente.create(body);
    
    // Trigger welcome automation for new client
    if (created.agenteId) {
      triggerWelcomeAutomation(created, created.agenteId).catch(console.error);
    }
    
    res.status(201).json(created);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const filter = { _id: req.params.id };
    if (scopeId) filter.agenteId = scopeId;
    const body = { ...(req.body || {}) };
    if (scopeId) body.agenteId = scopeId;
    const updated = await Cliente.findOneAndUpdate(filter, body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const filter = { _id: req.params.id };
    if (scopeId) filter.agenteId = scopeId;
    const deleted = await Cliente.findOneAndDelete(filter);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
