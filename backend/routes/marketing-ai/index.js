/**
 * AI Copilot — Router raíz.
 * Conversations accesibles con marketing:read O crm:read (cualquier agente o admin).
 * Campaigns/Metrics/Recommendations requieren marketing:read.
 */

const express = require('express');
const router  = express.Router();

const { authenticateToken }   = require('../../auth');
const { requirePermission, resolvePermissions } = require('../../middlewares/rbac');
const { aiRateLimit }         = require('../../middlewares/aiRateLimit');

const conversationsRouter   = require('./conversations');
const campaignsRouter       = require('./campaigns');
const metricsRouter         = require('./metrics');
const recommendationsRouter = require('./recommendations');
const toolsRouter           = require('./tools');

// Auth + rate limit en todas las rutas del módulo
router.use(authenticateToken);
router.use(aiRateLimit({ maxRequests: 30, windowSeconds: 60 }));

// Conversations & tools: accessible with marketing:read OR crm:read (all CRM users)
function requireAIAccess(req, res, next) {
  const perms = resolvePermissions(req.user);
  if (!perms.includes('marketing:read') && !perms.includes('crm:read')) {
    return res.status(403).json({ error: 'Insufficient permissions', required: ['marketing:read OR crm:read'] });
  }
  req.permissions = perms;
  next();
}

router.use('/conversations',    requireAIAccess, conversationsRouter);
router.use('/tools',            requireAIAccess, toolsRouter);

// Marketing-specific routes still require marketing:read
router.use('/campaigns',        requirePermission('marketing:read'), campaignsRouter);
router.use('/metrics',          requirePermission('marketing:read'), metricsRouter);
router.use('/recommendations',  requirePermission('marketing:read'), recommendationsRouter);

module.exports = router;
