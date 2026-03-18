/**
 * rewardsV2.js – REST endpoints for the new Rewards V2 system.
 *
 * Mounted at /crm/rewards-v2 in server.js
 *
 * Endpoints:
 *   GET  /dashboard              – Agent's own dashboard (captures, revenue, badge, tier, awards)
 *   GET  /leaderboard            – All-agents ranking (admin + agents)
 *   GET  /config                 – Current RewardConfig (admin)
 *   PUT  /config                 – Update RewardConfig (admin)
 *   POST /recalculate            – Full recalculation for year/quarter (admin)
 *   GET  /agent/:id/dashboard    – Specific agent dashboard (admin)
 *   GET  /quarterly-awards       – Quarterly awards list
 *   POST /pre-listing            – Record a pre-listing interview
 *   GET  /pre-listing            – Agent's pre-listing records
 *   GET  /badge-history          – Agent's badge history
 *   GET  /tier-history           – Agent's seller tier history
 */
const express = require('express');
const { authenticateToken, requireRole, agentScopeId, requireCRMUser } = require('../auth');
const engine = require('../services/rewardsEngine');
const RewardConfig = require('../models/RewardConfig');
const PreListing = require('../models/PreListing');
const BadgeRecord = require('../models/BadgeRecord');
const SellerTierHistory = require('../models/SellerTierHistory');
const QuarterlyAward = require('../models/QuarterlyAward');
const CustomerLoyalty = require('../models/CustomerLoyalty');

const router = express.Router();

// ============================================================
// AGENT: My dashboard
// ============================================================
router.get('/dashboard', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    // agentScopeId returns null for admins by design; fall back to req.user.agenteId
    const agenteId = agentScopeId(req) || (req.user && req.user.agenteId ? String(req.user.agenteId) : null);
    if (!agenteId) {
      // Admin without linked agent – return empty dashboard so the page renders
      const now = new Date();
      const q = Math.ceil((now.getMonth() + 1) / 3);
      return res.json({
        year: now.getFullYear(), quarter: q,
        captures: { quarterly: 0, annual: 0, quarterlyGoal: 0, annualGoal: 0 },
        revenue: { quarterly: 0, annual: 0, quarterlyTarget: 0, annualTarget: 0 },
        loyalty: { closedCount: 0, loyalCount: 0, totalCount: 0, seniority: 0 },
        preListing: { weeklyCount: 0, weeklyMinimum: 0, hasBadge: false },
        tier: { tier: 'none', medal: null, totalRevenue: 0, prize: null },
        awards: [], tierHistory: [], config: {},
      });
    }
    const data = await engine.getAgentDashboard(agenteId);
    res.json(data);
  } catch (err) {
    console.error('[RewardsV2] dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// LEADERBOARD (admin + agents)
// ============================================================
router.get('/leaderboard', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const quarter = parseInt(req.query.quarter) || engine.currentQuarter();
    const board = await engine.getLeaderboard(year, quarter);
    res.json({ year, quarter, leaderboard: board });
  } catch (err) {
    console.error('[RewardsV2] leaderboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// CONFIG (admin only)
// ============================================================
router.get('/config', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const cfg = await RewardConfig.load();
    res.json(cfg);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/config', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const allowed = ['captureGoals', 'revenueGoals', 'clientLoyalty', 'preListing', 'sellerTiers'];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    update.updatedBy = req.user?.username || 'admin';

    let cfg = await RewardConfig.findOne();
    if (!cfg) cfg = new RewardConfig();
    Object.assign(cfg, update);
    await cfg.save();
    res.json(cfg.toObject());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// RECALCULATE (admin)
// ============================================================
router.post('/recalculate', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { year, quarter } = req.body;
    const report = await engine.recalculateAll({ year, quarter });
    res.json(report);
  } catch (err) {
    console.error('[RewardsV2] recalculate error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// ADMIN: specific agent dashboard
// ============================================================
router.get('/agent/:id/dashboard', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const data = await engine.getAgentDashboard(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// QUARTERLY AWARDS
// ============================================================
router.get('/quarterly-awards', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const quarter = parseInt(req.query.quarter) || engine.currentQuarter();
    const awards = await QuarterlyAward.find({ year, quarter }).sort({ ranking: 1 }).populate('agenteId', 'nombre email avatar').lean();
    res.json({ year, quarter, awards });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// PRE-LISTING CRUD
// ============================================================
router.post('/pre-listing', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const agenteId = agentScopeId(req) || (req.user && req.user.agenteId ? String(req.user.agenteId) : null);
    if (!agenteId) return res.status(403).json({ error: 'Agent ID required' });
    const { clienteId, tipo, fecha, observaciones } = req.body;
    if (!clienteId || !tipo || !fecha) return res.status(400).json({ error: 'clienteId, tipo, fecha required' });
    const doc = await PreListing.create({
      agenteId,
      clienteId,
      tipo,
      fecha: new Date(fecha),
      observaciones: observaciones || '',
      createdBy: req.user?.username || '',
    });
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/pre-listing', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const agenteId = agentScopeId(req) || (req.user && req.user.agenteId ? String(req.user.agenteId) : null);
    if (!agenteId) return res.json([]);
    const limit = parseInt(req.query.limit) || 50;
    const docs = await PreListing.find({ agenteId }).sort({ fecha: -1 }).limit(limit).populate('clienteId', 'nombre email').lean();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: list all pre-listings
router.get('/pre-listing/all', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 200;
    const docs = await PreListing.find().sort({ fecha: -1 }).limit(limit)
      .populate('agenteId', 'nombre email avatar')
      .populate('clienteId', 'nombre email')
      .lean();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// BADGE HISTORY
// ============================================================
router.get('/badge-history', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const agenteId = agentScopeId(req) || (req.user && req.user.agenteId ? String(req.user.agenteId) : null);
    if (!agenteId) return res.json([]);
    const docs = await BadgeRecord.find({ agenteId }).sort({ createdAt: -1 }).limit(50).lean();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// TIER HISTORY
// ============================================================
router.get('/tier-history', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const agenteId = agentScopeId(req) || (req.user && req.user.agenteId ? String(req.user.agenteId) : null);
    if (!agenteId) return res.json([]);
    const docs = await SellerTierHistory.find({ agenteId }).sort({ year: -1 }).limit(10).lean();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// LOYALTY (admin)
// ============================================================
router.get('/loyalty', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const docs = await CustomerLoyalty.find({ year }).populate('agenteId', 'nombre email avatar').lean();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
