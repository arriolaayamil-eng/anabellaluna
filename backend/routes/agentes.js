const express = require('express');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const Agente = require('../models/Agente');
const User = require('../models/User');
const { authenticateToken, requireRole } = require('../auth');

const router = express.Router();

function agentScopeId(req) {
  if (req.user && req.user.role === 'admin') return null;
  return req.user && req.user.agenteId ? String(req.user.agenteId) : null;
}

async function generateUniqueUsername() {
  for (let i = 0; i < 10; i += 1) {
    const username = `agent_${crypto.randomBytes(4).toString('hex')}`;
    // eslint-disable-next-line no-await-in-loop
    const existing = await User.findOne({ username }).lean();
    if (!existing) return username;
  }
  throw new Error('failed to generate unique username');
}

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    const scopeId = agentScopeId(req);
    const filter = q ? { nombre: { $regex: q, $options: 'i' } } : {};
    if (scopeId) filter._id = scopeId;
    const items = await Agente.find(filter).sort({ updatedAt: -1 }).limit(1000).lean();
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    if (scopeId && scopeId !== String(req.params.id)) return res.status(403).json({ error: 'forbidden' });
    const item = await Agente.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const created = await Agente.create(req.body || {});
    res.status(201).json(created);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.post('/create-with-user', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const body = req.body || {};
    if (!body.nombre) return res.status(400).json({ error: 'nombre required' });

    const agente = await Agente.create({
      nombre: body.nombre,
      email: body.email || '',
      telefono: body.telefono || '',
      role: 'agent',
      metadata: body.metadata || {},
    });

    const username = body.username || await generateUniqueUsername();
    const password = body.password && String(body.password).trim() ? String(body.password) : crypto.randomBytes(9).toString('base64url');
    const hash = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      password_hash: hash,
      role: 'agent',
      agenteId: agente._id,
    });

    await user.save();

    return res.status(201).json({
      agente,
      user: { id: user._id, username: user.username, role: user.role, agenteId: user.agenteId },
      password,
    });
  } catch (err) {
    if (err && err.code === 11000) return res.status(409).json({ error: 'username already exists' });
    return res.status(400).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    if (scopeId && scopeId !== String(req.params.id)) return res.status(403).json({ error: 'forbidden' });
    const updated = await Agente.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const deleted = await Agente.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get all agents with performance metrics (admin only)
router.get('/metrics/all', authenticateToken, requireRole('admin'), async (req, res) => {
  try {
    const Cliente = require('../models/Cliente');
    const Propiedad = require('../models/Propiedad');
    const Activity = require('../models/Activity');
    const mongoose = require('mongoose');

    const agentes = await Agente.find().lean();
    
    const agentesConMetricas = await Promise.all(agentes.map(async (agente) => {
      const agenteId = agente._id;
      
      // Count clients assigned to this agent
      const clientesCount = await Cliente.countDocuments({ agenteId }).catch(() => 0);
      
      // Count properties assigned to this agent
      const propiedadesCount = await Propiedad.countDocuments({ agenteId }).catch(() => 0);
      
      // Count activities (visits, calls, etc.)
      const actividadesCount = await Activity.countDocuments({ agenteId }).catch(() => 0);
      
      // Get activities this month
      const inicioMes = new Date();
      inicioMes.setDate(1);
      inicioMes.setHours(0, 0, 0, 0);
      
      const actividadesMes = await Activity.countDocuments({
        agenteId,
        createdAt: { $gte: inicioMes }
      }).catch(() => 0);
      
      // Get different activity types count
      const actividadesPorTipo = await Activity.aggregate([
        { $match: { agenteId: new mongoose.Types.ObjectId(agenteId) } },
        { $group: { _id: '$tipo', count: { $sum: 1 } } }
      ]).catch(() => []);
      
      // Calculate engagement metrics
      const visitas = actividadesPorTipo.find(a => a._id === 'visita')?.count || 0;
      const llamadas = actividadesPorTipo.find(a => a._id === 'llamada')?.count || 0;
      const emails = actividadesPorTipo.find(a => a._id === 'email')?.count || 0;
      
      // Generate a consistent color based on agent name
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
      const colorIndex = agente.nombre ? agente.nombre.charCodeAt(0) % colors.length : 0;
      
      return {
        ...agente,
        metricas: {
          clientes: clientesCount,
          propiedades: propiedadesCount,
          actividades: actividadesCount,
          actividadesMes,
          visitas,
          llamadas,
          emails,
          // Simulated performance data (can be enhanced with real data later)
          rating: agente.metadata?.rating || (4 + Math.random()).toFixed(1),
          satisfaccion: agente.metadata?.satisfaccion || Math.floor(80 + Math.random() * 20),
        },
        color: agente.metadata?.color || colors[colorIndex],
      };
    }));
    
    res.json(agentesConMetricas);
  } catch (err) {
    console.error('Error fetching agent metrics:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get single agent with detailed metrics
router.get('/metrics/:id', authenticateToken, async (req, res) => {
  try {
    const Cliente = require('../models/Cliente');
    const Propiedad = require('../models/Propiedad');
    const Activity = require('../models/Activity');
    const mongoose = require('mongoose');

    const scopeId = agentScopeId(req);
    if (scopeId && scopeId !== String(req.params.id)) return res.status(403).json({ error: 'forbidden' });
    
    const agente = await Agente.findById(req.params.id).lean();
    if (!agente) return res.status(404).json({ error: 'Not found' });
    
    const agenteId = agente._id;
    
    // Get detailed metrics
    const clientes = await Cliente.find({ agenteId }).select('nombre email estado createdAt').lean().catch(() => []);
    const propiedades = await Propiedad.find({ agenteId }).select('titulo tipo operacion precio estado').lean().catch(() => []);
    const actividades = await Activity.find({ agenteId }).sort({ createdAt: -1 }).limit(50).lean().catch(() => []);
    
    // Monthly activity trend (last 6 months)
    const actividadMensual = [];
    for (let i = 5; i >= 0; i--) {
      const fecha = new Date();
      fecha.setMonth(fecha.getMonth() - i);
      const inicioMes = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
      const finMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0, 23, 59, 59);
      
      const count = await Activity.countDocuments({
        agenteId: new mongoose.Types.ObjectId(agenteId),
        createdAt: { $gte: inicioMes, $lte: finMes }
      }).catch(() => 0);
      
      actividadMensual.push({
        mes: inicioMes.toLocaleDateString('es-AR', { month: 'short' }),
        actividades: count
      });
    }
    
    // Activity breakdown by type
    const actividadesPorTipo = await Activity.aggregate([
      { $match: { agenteId: new mongoose.Types.ObjectId(agenteId) } },
      { $group: { _id: '$tipo', count: { $sum: 1 } } }
    ]).catch(() => []);
    
    // Generate color
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
    const colorIndex = agente.nombre ? agente.nombre.charCodeAt(0) % colors.length : 0;
    
    res.json({
      ...agente,
      color: agente.metadata?.color || colors[colorIndex],
      metricas: {
        clientes: clientes.length,
        propiedades: propiedades.length,
        actividades: actividades.length,
        rating: agente.metadata?.rating || (4 + Math.random()).toFixed(1),
        satisfaccion: agente.metadata?.satisfaccion || Math.floor(80 + Math.random() * 20),
      },
      detalle: {
        clientes,
        propiedades,
        actividadesRecientes: actividades.slice(0, 10),
        actividadMensual,
        actividadesPorTipo,
      }
    });
  } catch (err) {
    console.error('Error fetching agent metrics:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
