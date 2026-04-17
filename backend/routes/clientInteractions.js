const express = require('express');
const mongoose = require('mongoose');
const ClientInteraction = require('../models/ClientInteraction');
const Cliente = require('../models/Cliente');
const Agente = require('../models/Agente');
const Activity = require('../models/Activity');
const Cita = require('../models/Cita');
const { authenticateToken, agentScopeId, requireCRMUser } = require('../auth');

const router = express.Router();

// ── STATIC ROUTES (must come before /:clienteId) ──

// ── GET /crm/client-interactions/bulk/lifebars — bulk lifebar for all clients ──
router.get('/bulk/lifebars', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const clientFilter = scopeId ? { agenteId: scopeId } : {};
    const clientes = await Cliente.find(clientFilter).select('_id metadata createdAt').lean();

    const clienteIds = clientes.map(c => c._id);

    // Get latest recontact per client in one aggregation
    const latestRecontacts = await ClientInteraction.aggregate([
      {
        $match: {
          clienteId: { $in: clienteIds },
          tipo: { $in: ['recontacto', 'visita_realizada', 'visita_agendada'] },
        },
      },
      { $sort: { createdAt: -1 } },
      { $group: { _id: '$clienteId', lastDate: { $first: '$createdAt' } } },
    ]);

    const recontactMap = {};
    latestRecontacts.forEach(r => { recontactMap[String(r._id)] = r.lastDate; });

    const LIFEBAR_DAYS = 7;
    const now = new Date();
    const result = {};

    clientes.forEach(c => {
      const id = String(c._id);
      const md = c.metadata || {};
      const dates = [
        recontactMap[id],
        md.ultimaActividad ? new Date(md.ultimaActividad) : null,
        c.createdAt,
      ].filter(Boolean);
      const lastContactDate = new Date(Math.max(...dates.map(d => new Date(d).getTime())));
      const msElapsed = now.getTime() - lastContactDate.getTime();
      const daysElapsed = msElapsed / (1000 * 60 * 60 * 24);
      const remaining = Math.max(0, LIFEBAR_DAYS - daysElapsed);
      const percentage = Math.max(0, Math.min(100, (remaining / LIFEBAR_DAYS) * 100));

      result[id] = {
        percentage: Math.round(percentage),
        remaining: Math.round(remaining * 10) / 10,
        expired: remaining <= 0,
        daysElapsed: Math.round(daysElapsed * 10) / 10,
      };
    });

    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /crm/client-interactions/bulk-counts — total interaction counts per client ──
router.get('/bulk-counts', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const clienteFilter = scopeId ? { agenteId: scopeId } : {};
    const clientes = await Cliente.find(clienteFilter).select('_id').lean();
    const clienteIds = clientes.map(c => c._id);

    const counts = await ClientInteraction.aggregate([
      { $match: { clienteId: { $in: clienteIds } } },
      { $group: { _id: '$clienteId', total: { $sum: 1 } } },
    ]);

    const result = {};
    counts.forEach(r => { result[String(r._id)] = r.total; });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /crm/client-interactions/property/:propiedadId/metrics — property metrics ──
router.get('/property/:propiedadId/metrics', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const { propiedadId } = req.params;
    const pid = propiedadId;

    // Count interactions by type for this property
    const interactionCounts = await ClientInteraction.aggregate([
      { $match: { propiedadId: new mongoose.Types.ObjectId(pid) } },
      { $group: { _id: '$tipo', count: { $sum: 1 } } },
    ]);

    const counts = {};
    interactionCounts.forEach(r => { counts[r._id] = r.count; });

    // Count activities (enquiries) for this property
    const enquiries = await Activity.countDocuments({ propertyId: pid });

    // Count scheduled visits (Cita model)
    const visitasAgendadas = await Cita.countDocuments({
      $or: [{ propiedadId: pid }, { 'metadata.propiedadId': pid }],
    });

    // Count completed visits from interactions
    const visitasRealizadas = counts['visita_realizada'] || 0;

    // Count interest signals
    const interesAlto = await ClientInteraction.countDocuments({
      propiedadId: new mongoose.Types.ObjectId(pid),
      tipo: 'propiedad_interes',
      nivelInteres: 'alto',
    });
    const interesMedio = await ClientInteraction.countDocuments({
      propiedadId: new mongoose.Types.ObjectId(pid),
      tipo: 'propiedad_interes',
      nivelInteres: 'medio',
    });

    // Count payment options discussed
    const opcionesPago = counts['opcion_pago'] || 0;

    // Unique clients interested
    const clientesInteresados = await ClientInteraction.distinct('clienteId', {
      propiedadId: new mongoose.Types.ObjectId(pid),
    });

    // Purchase intent score (0-100)
    const intentScore = Math.min(100, Math.round(
      (enquiries * 5) +
      ((counts['visita_agendada'] || 0) * 10) +
      (visitasRealizadas * 15) +
      (interesAlto * 20) +
      (interesMedio * 10) +
      (opcionesPago * 25)
    ));

    res.json({
      consultas: enquiries,
      visitasAgendadas,
      visitasRealizadas,
      interesAlto,
      interesMedio,
      intereses: (counts['propiedad_interes'] || 0),
      opcionesPago,
      clientesInteresados: clientesInteresados.length,
      intentScore,
      interactions: counts,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /crm/client-interactions/client-metrics/:clienteId — aggregated client metrics ──
router.get('/client-metrics/:clienteId', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const { clienteId } = req.params;
    const scopeId = agentScopeId(req);

    const cliente = await Cliente.findById(clienteId).lean();
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    if (scopeId && String(cliente.agenteId || '') !== scopeId) {
      return res.status(403).json({ error: 'No tenés acceso a este cliente' });
    }

    const interactionCounts = await ClientInteraction.aggregate([
      { $match: { clienteId: new mongoose.Types.ObjectId(clienteId) } },
      { $group: { _id: '$tipo', count: { $sum: 1 } } },
    ]);
    const counts = {};
    interactionCounts.forEach(r => { counts[r._id] = r.count; });

    const totalInteractions = Object.values(counts).reduce((s, v) => s + v, 0);

    // Properties the client has shown interest in
    const propiedadesInteres = await ClientInteraction.distinct('propiedadId', {
      clienteId: new mongoose.Types.ObjectId(clienteId),
      propiedadId: { $ne: null },
    });

    // Last interaction date
    const lastInteraction = await ClientInteraction.findOne({ clienteId })
      .sort({ createdAt: -1 }).select('createdAt tipo').lean();

    // Payment options discussed
    const paymentOptions = await ClientInteraction.find({
      clienteId: new mongoose.Types.ObjectId(clienteId),
      tipo: 'opcion_pago',
    }).select('opcionPago createdAt').lean();

    // Preferences recorded
    const preferences = await ClientInteraction.find({
      clienteId: new mongoose.Types.ObjectId(clienteId),
      tipo: 'preferencia',
    }).select('preferencias createdAt').lean();

    // Engagement score (0-100)
    const engagementScore = Math.min(100, Math.round(
      (totalInteractions * 5) +
      ((counts['recontacto'] || 0) * 8) +
      ((counts['visita_realizada'] || 0) * 15) +
      ((counts['propiedad_interes'] || 0) * 10) +
      ((counts['opcion_pago'] || 0) * 20)
    ));

    res.json({
      totalInteractions,
      interactionsByType: counts,
      propiedadesInteres: propiedadesInteres.length,
      lastInteraction: lastInteraction ? { date: lastInteraction.createdAt, tipo: lastInteraction.tipo } : null,
      paymentOptions: paymentOptions.map(p => ({ ...p.opcionPago, date: p.createdAt })),
      preferences: preferences.map(p => ({ ...p.preferencias, date: p.createdAt })),
      engagementScore,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /crm/client-interactions/owner-report/:propiedadId — property owner report ──
router.get('/owner-report/:propiedadId', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const { propiedadId } = req.params;
    const Propiedad = require('../models/Propiedad');
    const propiedad = await Propiedad.findById(propiedadId).lean();
    if (!propiedad) return res.status(404).json({ error: 'Propiedad no encontrada' });

    const pid = new mongoose.Types.ObjectId(propiedadId);

    // All interactions for this property
    const interactions = await ClientInteraction.find({ propiedadId: pid })
      .sort({ createdAt: -1 }).lean();

    // Interaction counts by type
    const typeCounts = {};
    interactions.forEach(i => { typeCounts[i.tipo] = (typeCounts[i.tipo] || 0) + 1; });

    // Unique clients
    const uniqueClients = [...new Set(interactions.map(i => String(i.clienteId)))];

    // Enquiries from Activity model
    const enquiries = await Activity.countDocuments({
      $or: [{ propertyId: propiedadId }, { 'metadata.propiedadId': propiedadId }],
    });

    // Visits (from Cita model)
    const visitasAgendadas = await Cita.countDocuments({
      $or: [{ propiedadId }, { 'metadata.propiedadId': propiedadId }],
    });
    const visitasRealizadas = typeCounts['visita_realizada'] || 0;
    const visitasAsistencia = (visitasAgendadas > 0) ? Math.round((visitasRealizadas / visitasAgendadas) * 100) : 0;

    // Interest levels
    const interestLevels = { alto: 0, medio: 0, bajo: 0 };
    interactions.filter(i => i.tipo === 'propiedad_interes').forEach(i => {
      if (i.nivelInteres && interestLevels[i.nivelInteres] !== undefined) {
        interestLevels[i.nivelInteres]++;
      }
    });

    // Payment offers
    const paymentOffers = interactions
      .filter(i => i.tipo === 'opcion_pago' && i.opcionPago?.tipo)
      .map(i => ({
        tipo: i.opcionPago.tipo,
        montoOfrecido: i.opcionPago.montoOfrecido || 0,
        moneda: i.opcionPago.moneda || 'USD',
        detalle: i.opcionPago.detalle || '',
        fecha: i.createdAt,
      }));

    // Favorites / saved count from Activity
    const favorites = await Activity.countDocuments({
      $or: [{ propertyId: propiedadId }, { 'metadata.propiedadId': propiedadId }],
      type: { $in: ['favorite', 'save', 'wishlist'] },
    });

    // Purchase intent score
    const intentScore = Math.min(100, Math.round(
      (enquiries * 5) +
      ((typeCounts['visita_agendada'] || 0) * 10) +
      (visitasRealizadas * 15) +
      (interestLevels.alto * 20) +
      (interestLevels.medio * 10) +
      ((typeCounts['opcion_pago'] || 0) * 25)
    ));

    // Weekly trend (last 4 weeks)
    const weeklyTrend = [];
    const now = new Date();
    for (let w = 3; w >= 0; w--) {
      const wStart = new Date(now); wStart.setDate(wStart.getDate() - (w + 1) * 7); wStart.setHours(0, 0, 0, 0);
      const wEnd = new Date(now); wEnd.setDate(wEnd.getDate() - w * 7); wEnd.setHours(23, 59, 59, 999);
      const weekInteractions = interactions.filter(i => {
        const d = new Date(i.createdAt);
        return d >= wStart && d <= wEnd;
      }).length;
      const weekEnquiries = await Activity.countDocuments({
        $or: [{ propertyId: propiedadId }, { 'metadata.propiedadId': propiedadId }],
        createdAt: { $gte: wStart, $lte: wEnd },
      });
      weeklyTrend.push({
        semana: `Sem ${4 - w}`,
        interacciones: weekInteractions,
        consultas: weekEnquiries,
      });
    }

    // Property info summary
    const propSummary = {
      titulo: propiedad.title || '',
      direccion: propiedad.address || propiedad.metadata?.direccion || '',
      precio: propiedad.price || 0,
      moneda: propiedad.moneda || 'USD',
      estado: propiedad.status || 'Disponible',
      tiempoPublicado: propiedad.createdAt ? Math.round((now - new Date(propiedad.createdAt)) / (1000 * 60 * 60 * 24)) : 0,
    };

    res.json({
      propiedad: propSummary,
      resumen: {
        consultas: enquiries,
        visitasAgendadas,
        visitasRealizadas,
        visitasAsistencia: `${visitasAsistencia}%`,
        clientesInteresados: uniqueClients.length,
        favorites,
        intentScore,
        totalInteracciones: interactions.length,
      },
      interestLevels,
      paymentOffers,
      interactionsByType: typeCounts,
      weeklyTrend,
      clienteIds: uniqueClients,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── DYNAMIC ROUTES (/:clienteId) ──

// ── GET /crm/client-interactions/:clienteId — list interactions for a client ──
router.get('/:clienteId', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const filter = { clienteId: req.params.clienteId };
    if (scopeId) filter.agenteId = scopeId;

    const items = await ClientInteraction.find(filter)
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── POST /crm/client-interactions/:clienteId — create an interaction ──
router.post('/:clienteId', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const { clienteId } = req.params;

    // Verify client exists and agent has access
    const cliente = await Cliente.findById(clienteId).lean();
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
    if (scopeId && String(cliente.agenteId || '') !== scopeId) {
      return res.status(403).json({ error: 'No tenés acceso a este cliente' });
    }

    const body = { ...(req.body || {}) };
    body.clienteId = clienteId;
    body.agenteId = scopeId || body.agenteId || String(cliente.agenteId || '');

    const created = await ClientInteraction.create(body);

    // Update cliente.metadata.ultimaActividad for lifebar
    await Cliente.findByIdAndUpdate(clienteId, {
      'metadata.ultimaActividad': new Date().toISOString(),
    });

    res.status(201).json(created);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ── GET /crm/client-interactions/:clienteId/lifebar — lifebar data ──
router.get('/:clienteId/lifebar', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const { clienteId } = req.params;
    const cliente = await Cliente.findById(clienteId).lean();
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });

    const md = cliente.metadata || {};
    const LIFEBAR_DAYS = 7;

    // Find most recent recontact interaction
    const lastRecontact = await ClientInteraction.findOne({
      clienteId,
      tipo: { $in: ['recontacto', 'visita_realizada', 'visita_agendada'] },
    }).sort({ createdAt: -1 }).lean();

    // The reference date is the latest of: last recontact, last activity, or creation date
    const dates = [
      lastRecontact?.createdAt,
      md.ultimaActividad ? new Date(md.ultimaActividad) : null,
      cliente.createdAt,
    ].filter(Boolean);
    const lastContactDate = new Date(Math.max(...dates.map(d => new Date(d).getTime())));

    const now = new Date();
    const msElapsed = now.getTime() - lastContactDate.getTime();
    const daysElapsed = msElapsed / (1000 * 60 * 60 * 24);
    const remaining = Math.max(0, LIFEBAR_DAYS - daysElapsed);
    const percentage = Math.max(0, Math.min(100, (remaining / LIFEBAR_DAYS) * 100));

    res.json({
      lastContactDate,
      daysElapsed: Math.round(daysElapsed * 10) / 10,
      remaining: Math.round(remaining * 10) / 10,
      percentage: Math.round(percentage),
      expired: remaining <= 0,
      totalDays: LIFEBAR_DAYS,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
