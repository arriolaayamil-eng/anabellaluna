const express = require('express');
const Team = require('../models/Team');
const { authenticateToken, agentScopeId, requireCRMUser } = require('../auth');

const router = express.Router();

// ── LIST ─────────────────────────────────────────────────────────────
router.get('/', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const filter = { activo: true };
    // Agents only see teams they belong to
    if (scopeId) filter['miembros.userId'] = scopeId;
    const teams = await Team.find(filter).sort({ nombre: 1 }).lean();
    res.json(teams);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET ONE ──────────────────────────────────────────────────────────
router.get('/:id', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).lean();
    if (!team) return res.status(404).json({ error: 'Not found' });
    res.json(team);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── CREATE (admin only) ──────────────────────────────────────────────
router.post('/', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    if (scopeId) return res.status(403).json({ error: 'Solo el administrador puede crear equipos' });
    const body = { ...(req.body || {}) };
    if (!body.createdBy) body.createdBy = req.user?.sub || '';
    const team = await Team.create(body);
    res.status(201).json(team);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ── UPDATE (admin or team leader) ────────────────────────────────────
router.put('/:id', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ error: 'Not found' });
    // Only admin or team leader can update
    if (scopeId && String(team.leaderId) !== scopeId) {
      return res.status(403).json({ error: 'Solo el administrador o líder del equipo puede editar' });
    }
    const body = { ...(req.body || {}) };
    const updated = await Team.findByIdAndUpdate(req.params.id, body, { new: true, runValidators: true });
    res.json(updated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ── DELETE (admin only) ──────────────────────────────────────────────
router.delete('/:id', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    if (scopeId) return res.status(403).json({ error: 'Solo el administrador puede eliminar equipos' });
    const deleted = await Team.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── ADD MEMBER ───────────────────────────────────────────────────────
router.post('/:id/members', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const { userId, userName, role } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ error: 'Not found' });
    // Check not already member
    if (team.miembros.some(m => m.userId === userId)) {
      return res.status(409).json({ error: 'Ya es miembro del equipo' });
    }
    team.miembros.push({ userId, userName: userName || '', role: role || 'miembro' });
    await team.save();
    res.json(team);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ── REMOVE MEMBER ────────────────────────────────────────────────────
router.delete('/:id/members/:userId', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ error: 'Not found' });
    team.miembros = team.miembros.filter(m => m.userId !== req.params.userId);
    await team.save();
    res.json(team);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;
