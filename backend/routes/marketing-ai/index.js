/**
 * Marketing AI — Router raíz.
 * Todas las rutas requieren autenticación + marketing:read mínimo.
 */

const express = require('express');
const router  = express.Router();

const { authenticateToken }   = require('../../auth');
const { requirePermission }   = require('../../middlewares/rbac');
const { aiRateLimit }         = require('../../middlewares/aiRateLimit');

const conversationsRouter   = require('./conversations');
const campaignsRouter       = require('./campaigns');
const metricsRouter         = require('./metrics');
const recommendationsRouter = require('./recommendations');
const toolsRouter           = require('./tools');

// Auth + permiso base en todas las rutas del módulo
router.use(authenticateToken);
router.use(requirePermission('marketing:read'));
router.use(aiRateLimit({ maxRequests: 30, windowSeconds: 60 }));

router.use('/conversations',    conversationsRouter);
router.use('/campaigns',        campaignsRouter);
router.use('/metrics',          metricsRouter);
router.use('/recommendations',  recommendationsRouter);
router.use('/tools',            toolsRouter);

module.exports = router;
