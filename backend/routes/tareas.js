const express = require('express');
const Tarea = require('../models/Tarea');
const Agente = require('../models/Agente');
const { authenticateToken } = require('../auth');

const router = express.Router();

function agentScopeId(req) {
  if (req.user && req.user.role === 'admin') return null;
  return req.user && req.user.agenteId ? String(req.user.agenteId) : null;
}

// Default kanban columns
const DEFAULT_KANBAN_COLUMNS = [
  { id: 'pendiente', nombre: 'Pendiente', color: '#F59E0B' },
  { id: 'enProgreso', nombre: 'En Progreso', color: '#3B82F6' },
  { id: 'completado', nombre: 'Completado', color: '#10B981' },
];

// ============ KANBAN COLUMNS CONFIG ============

// Get kanban columns for current agent
router.get('/kanban/columns', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    if (!scopeId) {
      return res.json(DEFAULT_KANBAN_COLUMNS);
    }
    const agente = await Agente.findById(scopeId).lean();
    const columns = agente?.metadata?.kanbanColumns || DEFAULT_KANBAN_COLUMNS;
    res.json(columns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save kanban columns for current agent
router.put('/kanban/columns', authenticateToken, async (req, res) => {
  try {
    const columns = req.body.columns || [];
    
    // Get agent ID - for agents use their agenteId, for admins try to get from body or use a default
    let agentId = req.user && req.user.agenteId ? String(req.user.agenteId) : null;
    
    if (!agentId) {
      // For admin users or users without agenteId, store in a global config or return success
      // For now, just return success since admin might not have an agent profile
      console.log('Kanban columns saved (no agent profile):', columns);
      return res.json({ ok: true, columns, note: 'No agent profile - columns not persisted' });
    }
    
    await Agente.findByIdAndUpdate(agentId, {
      $set: { 'metadata.kanbanColumns': columns }
    });
    res.json({ ok: true, columns });
  } catch (err) {
    console.error('Error saving kanban columns:', err);
    res.status(500).json({ error: err.message });
  }
});

// Move task to different column (auto-save)
router.put('/kanban/move/:id', authenticateToken, async (req, res) => {
  try {
    const { kanbanColumn, position } = req.body;
    const scopeId = agentScopeId(req);
    const filter = { _id: req.params.id };
    if (scopeId) filter.agenteId = scopeId;
    
    const updated = await Tarea.findOneAndUpdate(
      filter,
      { kanbanColumn, position: position || 0 },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all tasks grouped by kanban column
router.get('/kanban', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const filter = {};
    if (scopeId) filter.agenteId = scopeId;
    
    const tareas = await Tarea.find(filter).sort({ position: 1, updatedAt: -1 }).lean();
    
    // Group by kanbanColumn
    const grouped = {};
    tareas.forEach(t => {
      const col = t.kanbanColumn || 'pendiente';
      if (!grouped[col]) grouped[col] = [];
      grouped[col].push(t);
    });
    
    res.json(grouped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ STANDARD CRUD ============

// Listar tareas con filtros opcionales ?status=Open&priority=Alta
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, priority, q } = req.query;
    const filter = {};
    const scopeId = agentScopeId(req);
    if (scopeId) filter.agenteId = scopeId;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (q) filter.$or = [
      { title: { $regex: q, $options: 'i' } },
      { summary: { $regex: q, $options: 'i' } }
    ];
    const tareas = await Tarea.find(filter).sort({ position: 1, updatedAt: -1 }).limit(1000).lean();
    res.json(tareas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener una tarea
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const tarea = await Tarea.findById(req.params.id).lean();
    if (!tarea) return res.status(404).json({ error: 'Not found' });
    const scopeId = agentScopeId(req);
    if (scopeId && String(tarea.agenteId || '') !== scopeId) return res.status(403).json({ error: 'forbidden' });
    res.json(tarea);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear tarea
router.post('/', authenticateToken, async (req, res) => {
  try {
    const body = req.body || {};
    const scopeId = agentScopeId(req);
    if (scopeId) body.agenteId = scopeId;
    const tarea = await Tarea.create(body);
    res.status(201).json(tarea);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Actualizar tarea
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const filter = { _id: req.params.id };
    if (scopeId) filter.agenteId = scopeId;
    const body = { ...(req.body || {}) };
    if (scopeId) body.agenteId = scopeId;
    const updated = await Tarea.findOneAndUpdate(filter, body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Eliminar tarea
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const filter = { _id: req.params.id };
    if (scopeId) filter.agenteId = scopeId;
    const deleted = await Tarea.findOneAndDelete(filter);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
