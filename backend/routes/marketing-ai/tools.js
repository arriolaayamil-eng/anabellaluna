const express = require('express');
const router  = express.Router();

const { requirePermission, resolvePermissions } = require('../../middlewares/rbac');
const { listTools }          = require('../../services/ai/toolRegistry');
const { executeApprovedTool, rejectTool, rollbackExecution } = require('../../services/ai/toolExecutor');
const AIToolExecution        = require('../../models/AIToolExecution');

// GET /marketing-ai/tools — Lista tools disponibles para el usuario actual
router.get('/', (req, res) => {
  const permissions = resolvePermissions(req.user);
  const tools       = listTools().filter((t) =>
    t.requiredPermissions.every((p) => permissions.includes(p))
  );
  res.json(tools);
});

// GET /marketing-ai/tools/executions — Historial de ejecuciones
router.get('/executions', async (req, res) => {
  try {
    const userId = String(req.user.sub || req.user.id || req.user._id || '');
    const filter = { userId };
    if (req.query.status) filter.status = req.query.status;
    if (req.query.conversationId) filter.conversationId = req.query.conversationId;

    const executions = await AIToolExecution.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json(executions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /marketing-ai/tools/executions/:id/approve
router.post('/executions/:id/approve', requirePermission('marketing:write'), async (req, res) => {
  try {
    const userId = String(req.user.sub || req.user.id || req.user._id || '');
    const result = await executeApprovedTool(req.params.id, userId);

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${userId}`).emit('ai:execution_completed', {
        executionId: req.params.id,
        success:     true,
        result,
      });
    }

    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /marketing-ai/tools/executions/:id/reject
router.post('/executions/:id/reject', async (req, res) => {
  try {
    const userId = String(req.user.sub || req.user.id || req.user._id || '');
    await rejectTool(req.params.id, userId, req.body.reason || '');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /marketing-ai/tools/executions/:id/rollback
router.post('/executions/:id/rollback', requirePermission('marketing:write'), async (req, res) => {
  try {
    const userId = String(req.user.sub || req.user.id || req.user._id || '');
    const result = await rollbackExecution(req.params.id, userId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
