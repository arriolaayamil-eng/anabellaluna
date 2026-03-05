const express = require('express');
const Reward = require('../models/Reward');
const AgentMetrics = require('../models/AgentMetrics');
const Agente = require('../models/Agente');
const Cliente = require('../models/Cliente');
const Activity = require('../models/Activity');
const Operacion = require('../models/Operacion');
const Propiedad = require('../models/Propiedad');
const Tarea = require('../models/Tarea');
const Cita = require('../models/Cita');
const AutomationRule = require('../models/AutomationRule');
const { authenticateToken, requireRole, agentScopeId, requireCRMUser } = require('../auth');

const router = express.Router();

// Reward definitions
const REWARD_DEFINITIONS = {
  login_star: {
    category: 'star',
    title: 'Estrella de Actividad',
    description: 'Iniciaste sesión al menos 5 veces esta semana',
    icon: '⭐',
    color: '#FFD700',
    period: 'weekly',
  },
  data_completeness: {
    category: 'badge',
    title: 'Datos Completos',
    description: 'Mantuviste el 90% de tu cartera actualizada',
    icon: '📊',
    color: '#10B981',
    period: 'monthly',
  },
  quick_response: {
    category: 'badge',
    title: 'Respuesta Rápida',
    description: 'Respondiste consultas en menos de 24 horas',
    icon: '⚡',
    color: '#3B82F6',
    period: 'monthly',
  },
  conversion_bronze: {
    category: 'medal',
    title: 'Medalla de Bronce - Conversión',
    description: 'Convertiste al menos 10% de tus leads',
    icon: '🥉',
    color: '#CD7F32',
    period: 'monthly',
  },
  conversion_silver: {
    category: 'medal',
    title: 'Medalla de Plata - Conversión',
    description: 'Convertiste al menos 20% de tus leads',
    icon: '🥈',
    color: '#C0C0C0',
    period: 'monthly',
  },
  conversion_gold: {
    category: 'medal',
    title: 'Medalla de Oro - Conversión',
    description: 'Convertiste al menos 30% de tus leads',
    icon: '🥇',
    color: '#FFD700',
    period: 'monthly',
  },
  satisfaction_bronze: {
    category: 'medal',
    title: 'Medalla de Bronce - Satisfacción',
    description: 'Promedio de calificación entre 4.0 y 4.4 estrellas',
    icon: '🥉',
    color: '#CD7F32',
    period: 'monthly',
  },
  satisfaction_silver: {
    category: 'medal',
    title: 'Medalla de Plata - Satisfacción',
    description: 'Promedio de calificación entre 4.5 y 4.7 estrellas',
    icon: '🥈',
    color: '#C0C0C0',
    period: 'monthly',
  },
  satisfaction_gold: {
    category: 'medal',
    title: 'Medalla de Oro - Satisfacción',
    description: 'Promedio de calificación de 4.8 o superior',
    icon: '🥇',
    color: '#FFD700',
    period: 'monthly',
  },
  seniority_junior: {
    category: 'level',
    title: 'Nivel Junior',
    description: 'Gestiona hasta 20 clientes',
    icon: '🌱',
    color: '#84CC16',
    period: 'permanent',
  },
  seniority_semisenior: {
    category: 'level',
    title: 'Nivel Semi-Senior',
    description: 'Gestiona entre 21 y 50 clientes',
    icon: '🌿',
    color: '#22C55E',
    period: 'permanent',
  },
  seniority_senior: {
    category: 'level',
    title: 'Nivel Senior',
    description: 'Gestiona más de 50 clientes',
    icon: '🌳',
    color: '#15803D',
    period: 'permanent',
  },
  // ---- Milestones (first-time achievements) ----
  milestone_first_property: {
    category: 'milestone',
    title: '¡Tu primera propiedad!',
    description: 'Agregaste tu primera propiedad al catálogo. ¡El comienzo de un gran portfolio!',
    encouragement: 'Seguí sumando propiedades para ampliar tu oferta',
    icon: '🏠',
    color: '#0ea5e9',
    period: 'permanent',
  },
  milestone_first_client: {
    category: 'milestone',
    title: '¡Tu primer cliente!',
    description: 'Registraste tu primer cliente en el CRM. ¡Tu cartera empieza a crecer!',
    encouragement: 'Cada cliente es una oportunidad. ¡Seguí así!',
    icon: '🤝',
    color: '#8b5cf6',
    period: 'permanent',
  },
  milestone_first_appointment: {
    category: 'milestone',
    title: '¡Tu primera cita!',
    description: 'Agendaste tu primera cita con un cliente. ¡La acción empieza!',
    encouragement: 'Las visitas son el primer paso hacia el cierre',
    icon: '📅',
    color: '#f59e0b',
    period: 'permanent',
  },
  milestone_first_operation: {
    category: 'milestone',
    title: '¡Tu primera operación!',
    description: 'Registraste tu primera operación comercial. ¡Estás en camino!',
    encouragement: 'Cada operación te acerca a una medalla de ventas',
    icon: '💰',
    color: '#10b981',
    period: 'permanent',
  },
  milestone_first_task: {
    category: 'milestone',
    title: '¡Primera tarea completada!',
    description: 'Completaste tu primera tarea. ¡Organización es clave!',
    encouragement: 'Mantené el ritmo y organizá tu día a día',
    icon: '✅',
    color: '#22c55e',
    period: 'permanent',
  },
  milestone_first_report: {
    category: 'milestone',
    title: '¡Tu primer reporte!',
    description: 'Generaste tu primer reporte de rendimiento. ¡Datos que impulsan decisiones!',
    encouragement: 'Los reportes te ayudan a mejorar cada semana',
    icon: '📊',
    color: '#6366f1',
    period: 'permanent',
  },
  milestone_first_enquiry: {
    category: 'milestone',
    title: '¡Primera consulta atendida!',
    description: 'Respondiste tu primera consulta web. ¡Atención al cliente de primera!',
    encouragement: 'Respuestas rápidas generan más conversiones',
    icon: '💬',
    color: '#ec4899',
    period: 'permanent',
  },
  milestone_first_automation: {
    category: 'milestone',
    title: '¡Primera automatización!',
    description: 'Configuraste tu primera regla de automatización. ¡El sistema trabaja por vos!',
    encouragement: 'Automatizá más tareas para enfocarte en vender',
    icon: '🤖',
    color: '#14b8a6',
    period: 'permanent',
  },
  milestone_first_document: {
    category: 'milestone',
    title: '¡Primer documento!',
    description: 'Subiste tu primer documento al sistema. ¡Todo organizado!',
    encouragement: 'Mantené tu documentación al día',
    icon: '📁',
    color: '#64748b',
    period: 'permanent',
  },
  milestone_five_clients: {
    category: 'milestone',
    title: '¡5 clientes en cartera!',
    description: 'Ya tenés 5 clientes registrados. ¡Tu cartera crece!',
    encouragement: 'Objetivo siguiente: 10 clientes. ¡Vas muy bien!',
    icon: '⭐',
    color: '#f59e0b',
    period: 'permanent',
  },
  milestone_ten_properties: {
    category: 'milestone',
    title: '¡10 propiedades cargadas!',
    description: 'Alcanzaste las 10 propiedades en tu catálogo. ¡Gran portfolio!',
    encouragement: 'Más propiedades = más oportunidades de cierre',
    icon: '🏘️',
    color: '#0ea5e9',
    period: 'permanent',
  },
  milestone_first_sale: {
    category: 'milestone',
    title: '¡Primera venta cerrada!',
    description: '¡Cerraste tu primera venta! Un hito enorme en tu carrera.',
    encouragement: 'Obtené la medalla de bronce con un 10% de conversión',
    icon: '🎯',
    color: '#ef4444',
    period: 'permanent',
  },
  milestone_five_appointments: {
    category: 'milestone',
    title: '¡5 citas completadas!',
    description: 'Ya realizaste 5 citas con clientes. ¡Experiencia que se nota!',
    encouragement: 'Cada visita perfecciona tu técnica de venta',
    icon: '🗓️',
    color: '#a855f7',
    period: 'permanent',
  },
  milestone_complete_profile: {
    category: 'milestone',
    title: '¡Perfil completo!',
    description: 'Completaste toda la información de tu perfil. ¡Profesionalismo ante todo!',
    encouragement: 'Un perfil completo genera más confianza',
    icon: '🎖️',
    color: '#FFD700',
    period: 'permanent',
  },
};

function getWeekBounds(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function getMonthBounds(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// Get rewards for current agent
router.get('/my', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const agenteId = agentScopeId(req);
    if (!agenteId) return res.json([]); // Return empty array for non-agents
    
    const rewards = await Reward.find({ agenteId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    
    res.json(rewards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get unseen rewards (for celebration)
router.get('/unseen', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const agenteId = agentScopeId(req);
    if (!agenteId) return res.json([]); // Return empty array for non-agents
    
    const rewards = await Reward.find({ 
      agenteId, 
      celebrationShown: false 
    }).sort({ createdAt: -1 }).lean();
    
    res.json(rewards);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark rewards as seen/celebrated
router.post('/mark-celebrated', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const agenteId = agentScopeId(req);
    if (!agenteId) return res.status(403).json({ error: 'Agent ID required' });
    
    const { rewardIds } = req.body;
    if (!Array.isArray(rewardIds)) return res.status(400).json({ error: 'rewardIds array required' });
    
    await Reward.updateMany(
      { _id: { $in: rewardIds }, agenteId },
      { $set: { celebrationShown: true, seen: true } }
    );
    
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get metrics for current agent
router.get('/metrics', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const agenteId = agentScopeId(req);
    if (!agenteId) return res.status(403).json({ error: 'Agent ID required' });
    
    const { period = 'monthly' } = req.query;
    const bounds = period === 'weekly' ? getWeekBounds() : getMonthBounds();
    
    let metrics = await AgentMetrics.findOne({
      agenteId,
      period,
      periodStart: bounds.start,
    }).lean();
    
    if (!metrics) {
      metrics = await calculateMetrics(agenteId, period, bounds);
    }
    
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Record login (called on agent login)
router.post('/record-login', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const agenteId = agentScopeId(req);
    if (!agenteId) return res.json({ ok: true });
    
    const bounds = getWeekBounds();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    await AgentMetrics.findOneAndUpdate(
      { agenteId, period: 'weekly', periodStart: bounds.start },
      {
        $inc: { loginCount: 1 },
        $addToSet: { loginDays: today },
        $setOnInsert: { periodEnd: bounds.end },
      },
      { upsert: true, new: true }
    );
    
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Calculate and assign rewards (can be called manually or by cron)
router.post('/calculate', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const agenteId = agentScopeId(req);
    if (!agenteId) return res.status(403).json({ error: 'Agent ID required' });
    
    const newRewards = await calculateAndAssignRewards(agenteId);
    res.json({ newRewards });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get all agents rewards summary
router.get('/summary', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const agentes = await Agente.find().lean();
    const summary = [];
    
    for (const agente of agentes) {
      const rewards = await Reward.find({ agenteId: agente._id }).lean();
      const monthBounds = getMonthBounds();
      const weekBounds = getWeekBounds();
      
      const monthlyRewards = rewards.filter(r => 
        r.periodStart && new Date(r.periodStart) >= monthBounds.start
      );
      const weeklyRewards = rewards.filter(r => 
        r.periodStart && new Date(r.periodStart) >= weekBounds.start
      );
      
      const clientCount = await Cliente.countDocuments({ agenteId: String(agente._id) });
      let seniority = 'junior';
      if (clientCount > 50) seniority = 'senior';
      else if (clientCount > 20) seniority = 'semi-senior';
      
      summary.push({
        agente: {
          _id: agente._id,
          nombre: agente.nombre,
          email: agente.email,
          avatar: agente.avatar,
        },
        seniority,
        clientCount,
        totalRewards: rewards.length,
        monthlyRewards: monthlyRewards.length,
        weeklyRewards: weeklyRewards.length,
        stars: rewards.filter(r => r.category === 'star').length,
        badges: rewards.filter(r => r.category === 'badge').length,
        medals: rewards.filter(r => r.category === 'medal').length,
        recentRewards: rewards.slice(0, 5),
      });
    }
    
    summary.sort((a, b) => b.totalRewards - a.totalRewards);
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get detailed rewards for specific agent
router.get('/agent/:agenteId', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const { agenteId } = req.params;
    const rewards = await Reward.find({ agenteId }).sort({ createdAt: -1 }).lean();
    const metrics = await AgentMetrics.find({ agenteId }).sort({ periodStart: -1 }).limit(12).lean();
    
    res.json({ rewards, metrics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper: Calculate metrics for an agent
async function calculateMetrics(agenteId, period, bounds) {
  const clientCount = await Cliente.countDocuments({ agenteId: String(agenteId) });
  
  // Data completeness: count clients with email AND phone
  const completeClients = await Cliente.countDocuments({
    agenteId: String(agenteId),
    email: { $exists: true, $ne: '' },
    telefono: { $exists: true, $ne: '' },
  });
  
  // Enquiries and response time
  const enquiries = await Activity.find({
    agenteId: String(agenteId),
    type: { $in: ['enquiry', 'visit_scheduled'] },
    createdAt: { $gte: bounds.start, $lte: bounds.end },
  }).lean();
  
  const respondedIn24h = enquiries.filter(e => {
    if (!e.metadata || !e.metadata.respondedAt) return false;
    const responseTime = new Date(e.metadata.respondedAt) - new Date(e.createdAt);
    return responseTime <= 24 * 60 * 60 * 1000;
  }).length;
  
  // Conversion: leads that became operations
  const operations = await Operacion.find({
    agenteId: String(agenteId),
    createdAt: { $gte: bounds.start, $lte: bounds.end },
    estado: { $in: ['cerrada', 'completada', 'vendida', 'alquilada'] },
  }).lean();
  
  const totalLeads = enquiries.length;
  const leadsConverted = operations.length;
  const conversionRate = totalLeads > 0 ? (leadsConverted / totalLeads) * 100 : 0;
  
  // Satisfaction (from client ratings if available)
  const ratings = await Activity.find({
    agenteId: String(agenteId),
    type: 'rating',
    createdAt: { $gte: bounds.start, $lte: bounds.end },
  }).lean();
  
  const avgRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + (r.metadata?.rating || 0), 0) / ratings.length
    : 0;
  
  // Seniority
  let seniority = 'junior';
  if (clientCount > 50) seniority = 'senior';
  else if (clientCount > 20) seniority = 'semi-senior';
  
  const metrics = {
    agenteId,
    period,
    periodStart: bounds.start,
    periodEnd: bounds.end,
    totalClients: clientCount,
    clientsWithCompleteData: completeClients,
    dataCompletenessPercent: clientCount > 0 ? (completeClients / clientCount) * 100 : 0,
    totalEnquiries: enquiries.length,
    enquiriesRespondedIn24h: respondedIn24h,
    totalLeads,
    leadsConverted,
    conversionRate,
    totalRatings: ratings.length,
    avgRating,
    seniority,
  };
  
  await AgentMetrics.findOneAndUpdate(
    { agenteId, period, periodStart: bounds.start },
    metrics,
    { upsert: true, new: true }
  );
  
  return metrics;
}

// Helper: Calculate and assign rewards
async function calculateAndAssignRewards(agenteId) {
  const newRewards = [];
  const weekBounds = getWeekBounds();
  const monthBounds = getMonthBounds();
  
  // Get or calculate metrics
  let weeklyMetrics = await AgentMetrics.findOne({
    agenteId,
    period: 'weekly',
    periodStart: weekBounds.start,
  }).lean();
  
  if (!weeklyMetrics) {
    weeklyMetrics = await calculateMetrics(agenteId, 'weekly', weekBounds);
  }
  
  let monthlyMetrics = await AgentMetrics.findOne({
    agenteId,
    period: 'monthly',
    periodStart: monthBounds.start,
  }).lean();
  
  if (!monthlyMetrics) {
    monthlyMetrics = await calculateMetrics(agenteId, 'monthly', monthBounds);
  }
  
  // Check login star (5+ logins per week)
  if (weeklyMetrics.loginDays && weeklyMetrics.loginDays.length >= 5) {
    const existing = await Reward.findOne({
      agenteId,
      type: 'login_star',
      periodStart: weekBounds.start,
    });
    if (!existing) {
      const reward = await createReward(agenteId, 'login_star', weekBounds);
      newRewards.push(reward);
    }
  }
  
  // Check data completeness (90%+)
  if (monthlyMetrics.dataCompletenessPercent >= 90) {
    const existing = await Reward.findOne({
      agenteId,
      type: 'data_completeness',
      periodStart: monthBounds.start,
    });
    if (!existing) {
      const reward = await createReward(agenteId, 'data_completeness', monthBounds);
      newRewards.push(reward);
    }
  }
  
  // Check quick response
  if (monthlyMetrics.totalEnquiries > 0) {
    const responseRate = (monthlyMetrics.enquiriesRespondedIn24h / monthlyMetrics.totalEnquiries) * 100;
    if (responseRate >= 80) {
      const existing = await Reward.findOne({
        agenteId,
        type: 'quick_response',
        periodStart: monthBounds.start,
      });
      if (!existing) {
        const reward = await createReward(agenteId, 'quick_response', monthBounds);
        newRewards.push(reward);
      }
    }
  }
  
  // Check conversion medals
  if (monthlyMetrics.conversionRate >= 30) {
    const existing = await Reward.findOne({
      agenteId,
      type: 'conversion_gold',
      periodStart: monthBounds.start,
    });
    if (!existing) {
      const reward = await createReward(agenteId, 'conversion_gold', monthBounds);
      newRewards.push(reward);
    }
  } else if (monthlyMetrics.conversionRate >= 20) {
    const existing = await Reward.findOne({
      agenteId,
      type: 'conversion_silver',
      periodStart: monthBounds.start,
    });
    if (!existing) {
      const reward = await createReward(agenteId, 'conversion_silver', monthBounds);
      newRewards.push(reward);
    }
  } else if (monthlyMetrics.conversionRate >= 10) {
    const existing = await Reward.findOne({
      agenteId,
      type: 'conversion_bronze',
      periodStart: monthBounds.start,
    });
    if (!existing) {
      const reward = await createReward(agenteId, 'conversion_bronze', monthBounds);
      newRewards.push(reward);
    }
  }
  
  // Check satisfaction medals
  if (monthlyMetrics.avgRating >= 4.8) {
    const existing = await Reward.findOne({
      agenteId,
      type: 'satisfaction_gold',
      periodStart: monthBounds.start,
    });
    if (!existing) {
      const reward = await createReward(agenteId, 'satisfaction_gold', monthBounds);
      newRewards.push(reward);
    }
  } else if (monthlyMetrics.avgRating >= 4.5) {
    const existing = await Reward.findOne({
      agenteId,
      type: 'satisfaction_silver',
      periodStart: monthBounds.start,
    });
    if (!existing) {
      const reward = await createReward(agenteId, 'satisfaction_silver', monthBounds);
      newRewards.push(reward);
    }
  } else if (monthlyMetrics.avgRating >= 4.0) {
    const existing = await Reward.findOne({
      agenteId,
      type: 'satisfaction_bronze',
      periodStart: monthBounds.start,
    });
    if (!existing) {
      const reward = await createReward(agenteId, 'satisfaction_bronze', monthBounds);
      newRewards.push(reward);
    }
  }
  
  // Check seniority level
  const currentSeniority = monthlyMetrics.seniority;
  const seniorityType = `seniority_${currentSeniority.replace('-', '')}`;
  const existingSeniority = await Reward.findOne({
    agenteId,
    type: { $regex: /^seniority_/ },
  }).sort({ createdAt: -1 });
  
  if (!existingSeniority || existingSeniority.type !== seniorityType) {
    const reward = await createReward(agenteId, seniorityType, { start: new Date(), end: null });
    newRewards.push(reward);
  }
  
  return newRewards;
}

async function createReward(agenteId, type, bounds) {
  const def = REWARD_DEFINITIONS[type];
  if (!def) throw new Error(`Unknown reward type: ${type}`);
  
  const rewardData = {
    agenteId,
    type,
    category: def.category,
    title: def.title,
    description: def.description,
    icon: def.icon,
    color: def.color,
    period: def.period,
    periodStart: bounds ? bounds.start : undefined,
    periodEnd: bounds ? bounds.end : undefined,
  };

  // Store encouragement message in metadata for milestone rewards
  if (def.encouragement) {
    rewardData.metadata = { encouragement: def.encouragement };
  }

  const reward = await Reward.create(rewardData);
  
  return reward;
}

// ============ MILESTONES: first-time achievement checks ============

async function checkAndAwardMilestones(agenteId, hint) {
  const newRewards = [];
  const aid = String(agenteId);

  async function alreadyHas(type) {
    return Reward.exists({ agenteId, type });
  }

  async function award(type) {
    if (await alreadyHas(type)) return null;
    const r = await createReward(agenteId, type, null);
    newRewards.push(r);
    return r;
  }

  // Only check relevant milestones based on hint to minimize DB queries
  const checks = hint ? [hint] : [
    'property', 'client', 'appointment', 'operation', 'task',
    'enquiry', 'automation', 'document', 'sale', 'profile',
  ];

  for (const check of checks) {
    switch (check) {
      case 'property': {
        const count = await Propiedad.countDocuments({ agentId: aid });
        if (count >= 1) await award('milestone_first_property');
        if (count >= 10) await award('milestone_ten_properties');
        break;
      }
      case 'client': {
        const count = await Cliente.countDocuments({ agenteId: aid });
        if (count >= 1) await award('milestone_first_client');
        if (count >= 5) await award('milestone_five_clients');
        break;
      }
      case 'appointment': {
        const count = await Cita.countDocuments({ agenteId: aid });
        if (count >= 1) await award('milestone_first_appointment');
        if (count >= 5) await award('milestone_five_appointments');
        break;
      }
      case 'operation': {
        const count = await Operacion.countDocuments({ agenteId: aid });
        if (count >= 1) await award('milestone_first_operation');
        break;
      }
      case 'task': {
        const count = await Tarea.countDocuments({
          agenteId: aid,
          $or: [{ status: 'Close' }, { completed: true }],
        });
        if (count >= 1) await award('milestone_first_task');
        break;
      }
      case 'report': {
        await award('milestone_first_report');
        break;
      }
      case 'enquiry': {
        const count = await Activity.countDocuments({
          agenteId: aid,
          type: { $in: ['enquiry', 'visit_scheduled'] },
          'metadata.respondedAt': { $exists: true },
        });
        if (count >= 1) await award('milestone_first_enquiry');
        break;
      }
      case 'automation': {
        const count = await AutomationRule.countDocuments({ agenteId: aid });
        if (count >= 1) await award('milestone_first_automation');
        break;
      }
      case 'document': {
        await award('milestone_first_document');
        break;
      }
      case 'sale': {
        const count = await Operacion.countDocuments({
          agenteId: aid,
          estado: { $in: ['cerrada', 'completada', 'vendida'] },
        });
        if (count >= 1) await award('milestone_first_sale');
        break;
      }
      case 'profile': {
        const agente = await Agente.findById(agenteId).lean();
        if (agente && agente.nombre && agente.email && agente.telefono && agente.avatar) {
          await award('milestone_complete_profile');
        }
        break;
      }
    }
  }

  return newRewards;
}

// POST /crm/rewards/check-milestones
// Called after key CRM actions. Body: { hint: 'property' | 'client' | ... }
router.post('/check-milestones', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const agenteId = agentScopeId(req);
    if (!agenteId) return res.json({ newRewards: [] });

    const { hint } = req.body;
    const newRewards = await checkAndAwardMilestones(agenteId, hint || null);
    res.json({ newRewards });
  } catch (err) {
    console.error('Milestone check error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
