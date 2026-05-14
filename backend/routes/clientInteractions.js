const express = require('express');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');
const ClientInteraction = require('../models/ClientInteraction');
const Cliente = require('../models/Cliente');
const Agente = require('../models/Agente');
const Activity = require('../models/Activity');
const Cita = require('../models/Cita');
const Propiedad = require('../models/Propiedad');
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
    const days = parseInt(req.query.days, 10) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const propiedad = await Propiedad.findById(propiedadId).lean();
    if (!propiedad) return res.status(404).json({ error: 'Propiedad no encontrada' });

    const pid = new mongoose.Types.ObjectId(propiedadId);

    // All interactions for this property within date range
    const interactions = await ClientInteraction.find({ propiedadId: pid, createdAt: { $gte: since } })
      .sort({ createdAt: -1 }).lean();

    // Populate client names
    const clienteIds = [...new Set(interactions.map(i => String(i.clienteId)))];
    const clientes = await Cliente.find({ _id: { $in: clienteIds } }).select('nombre email telefono metadata').lean();
    const clienteMap = {};
    clientes.forEach(c => {
      clienteMap[String(c._id)] = {
        nombre: [c.nombre, c.metadata?.apellido].filter(Boolean).join(' '),
        email: c.email || '',
        telefono: c.telefono || '',
      };
    });

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

    // Decorate interactions with client info
    const interactionesDetalle = interactions.map(i => ({
      ...i,
      cliente: clienteMap[String(i.clienteId)] || { nombre: 'Desconocido', email: '', telefono: '' },
    }));

    res.json({
      dias: days,
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
      interacciones: interactionesDetalle,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── GET /crm/client-interactions/owner-report/:propiedadId/pdf — PDF download ──
router.get('/owner-report/:propiedadId/pdf', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const { propiedadId } = req.params;
    const days = parseInt(req.query.days, 10) || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const now = new Date();

    const propiedad = await Propiedad.findById(propiedadId).lean();
    if (!propiedad) return res.status(404).json({ error: 'Propiedad no encontrada' });

    const pid = new mongoose.Types.ObjectId(propiedadId);
    const interactions = await ClientInteraction.find({ propiedadId: pid, createdAt: { $gte: since } })
      .sort({ createdAt: -1 }).lean();

    const clienteIds = [...new Set(interactions.map(i => String(i.clienteId)))];
    const clientes = await Cliente.find({ _id: { $in: clienteIds } }).select('nombre email telefono metadata').lean();
    const clienteMap = {};
    clientes.forEach(c => {
      clienteMap[String(c._id)] = {
        nombre: [c.nombre, c.metadata?.apellido].filter(Boolean).join(' '),
        telefono: c.telefono || '',
      };
    });

    const typeCounts = {};
    interactions.forEach(i => { typeCounts[i.tipo] = (typeCounts[i.tipo] || 0) + 1; });

    const uniqueClients = [...new Set(interactions.map(i => String(i.clienteId)))];
    const enquiries = await Activity.countDocuments({ $or: [{ propertyId: propiedadId }, { 'metadata.propiedadId': propiedadId }] });
    const visitasAgendadas = await Cita.countDocuments({ $or: [{ propiedadId }, { 'metadata.propiedadId': propiedadId }] });
    const visitasRealizadas = typeCounts['visita_realizada'] || 0;
    const visitasAsistencia = visitasAgendadas > 0 ? Math.round((visitasRealizadas / visitasAgendadas) * 100) : 0;

    const interestLevels = { alto: 0, medio: 0, bajo: 0 };
    interactions.filter(i => i.tipo === 'propiedad_interes').forEach(i => {
      if (i.nivelInteres && interestLevels[i.nivelInteres] !== undefined) interestLevels[i.nivelInteres]++;
    });

    const favorites = await Activity.countDocuments({
      $or: [{ propertyId: propiedadId }, { 'metadata.propiedadId': propiedadId }],
      type: { $in: ['favorite', 'save', 'wishlist'] },
    });

    const intentScore = Math.min(100, Math.round(
      enquiries * 5 + (typeCounts['visita_agendada'] || 0) * 10 + visitasRealizadas * 15 +
      interestLevels.alto * 20 + interestLevels.medio * 10 + (typeCounts['opcion_pago'] || 0) * 25,
    ));

    const paymentOffers = interactions
      .filter(i => i.tipo === 'opcion_pago' && i.opcionPago?.tipo)
      .map(i => ({ tipo: i.opcionPago.tipo, montoOfrecido: i.opcionPago.montoOfrecido || 0, moneda: i.opcionPago.moneda || 'USD', fecha: i.createdAt }));

    const weeklyTrend = [];
    for (let w = 3; w >= 0; w--) {
      const wStart = new Date(now); wStart.setDate(wStart.getDate() - (w + 1) * 7); wStart.setHours(0, 0, 0, 0);
      const wEnd = new Date(now); wEnd.setDate(wEnd.getDate() - w * 7); wEnd.setHours(23, 59, 59, 999);
      const wi = interactions.filter(i => { const d = new Date(i.createdAt); return d >= wStart && d <= wEnd; }).length;
      const wq = await Activity.countDocuments({ $or: [{ propertyId: propiedadId }, { 'metadata.propiedadId': propiedadId }], createdAt: { $gte: wStart, $lte: wEnd } });
      weeklyTrend.push({ semana: `Sem ${4 - w}`, interacciones: wi, consultas: wq });
    }

    // ── Build PDF ─────────────────────────────────────────────
    // Mirrors the PropiedadInforme.jsx preview card exactly.
    const MARGIN  = 40;
    const PAGE_W  = 595.28;
    const PAGE_H  = 841.89;
    const CW      = PAGE_W - MARGIN * 2;   // 515.28
    const PRIMARY = '#1a365d';
    const ORANGE  = '#ed8936';
    const DARK    = '#1a202c';
    const GRAY    = '#4a5568';
    const LGRAY   = '#718096';
    const WHITE   = '#ffffff';
    const BG_CARD = '#ffffff';
    const BG_PAGE = '#f7fafc';

    const fmtDate = (d) => d
      ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : '-';
    const fmtCurrency = (val, mon = 'USD') =>
      (val || val === 0) ? `${mon} ${Number(val).toLocaleString('es-AR')}` : '-';

    const titulo   = propiedad.title || 'Sin título';
    const direccion = propiedad.address || propiedad.metadata?.direccion || '-';
    const estado   = propiedad.status || 'Disponible';
    const diasPub  = Math.round((now - new Date(propiedad.createdAt)) / (1000 * 60 * 60 * 24));

    const tipoLabels = {
      nota: 'Nota', recontacto: 'Recontacto', visita_agendada: 'Visita Agendada',
      visita_realizada: 'Visita Realizada', propiedad_interes: 'Interés en Propiedad',
      opcion_pago: 'Opción de Pago', preferencia: 'Preferencia',
    };
    const nivelColors = { alto: '#16a34a', medio: '#d97706', bajo: '#dc2626' };
    const kpiColors   = ['#3b82f6','#6366f1','#10b981','#ec4899','#eab308','#8b5cf6','#14b8a6','#f97316'];

    const doc = new PDFDocument({ size: 'A4', margin: MARGIN, bufferPages: true });
    const chunks = [];
    doc.on('data', c => chunks.push(c));

    await new Promise((resolve, reject) => {
      doc.on('end', resolve);
      doc.on('error', reject);

      // ── helpers ──────────────────────────────────────────────
      const ensureSpace = (needed) => {
        if (doc.y + needed > PAGE_H - 50) { doc.addPage(); doc.y = MARGIN; }
      };

      // Rounded-rect card with white bg and light border — mirrors the card style
      const cardStart = (estimatedH) => {
        ensureSpace(estimatedH + 16);
        const cy = doc.y;
        doc.save();
        doc.roundedRect(MARGIN, cy, CW, estimatedH, 6).fillAndStroke(BG_CARD, '#e2e8f0');
        doc.restore();
        return cy;
      };

      // Card section header (orange icon dot + bold title)
      const cardHeader = (title, cardY, iconColor) => {
        doc.save();
        doc.circle(MARGIN + 14, cardY + 14, 5).fill(iconColor || ORANGE);
        doc.restore();
        doc.fontSize(11).font('Helvetica-Bold').fillColor(DARK)
          .text(title, MARGIN + 24, cardY + 8, { width: CW - 30, lineBreak: false });
        doc.text('', MARGIN, cardY + 26);
      };

      // ── PAGE BACKGROUND ──────────────────────────────────────
      doc.save();
      doc.rect(0, 0, PAGE_W, PAGE_H).fill(BG_PAGE);
      doc.restore();

      // ── HEADER BAR (mirrors the modal header) ────────────────
      const HDR_H = 52;
      doc.save();
      doc.rect(0, 0, PAGE_W, HDR_H).fill(WHITE);
      doc.moveTo(0, HDR_H).lineTo(PAGE_W, HDR_H).strokeColor('#e2e8f0').lineWidth(1).stroke();
      doc.restore();
      // orange building icon dot
      doc.save();
      doc.circle(MARGIN + 10, 26, 7).fill(ORANGE);
      doc.restore();
      doc.fontSize(13).font('Helvetica-Bold').fillColor(DARK)
        .text('Informe de Mercado', MARGIN + 22, 14, { lineBreak: false });
      doc.fontSize(8).font('Helvetica').fillColor(LGRAY)
        .text(titulo, MARGIN + 22, 29, { lineBreak: false });
      // period label top-right
      doc.fontSize(8).font('Helvetica').fillColor(LGRAY)
        .text(`Período: últimos ${days} días`, PAGE_W - MARGIN - 120, 22, { width: 120, align: 'right', lineBreak: false });

      doc.y = HDR_H + 14;

      // ══════════════════════════════════════════════════════════
      // CARD 1 — Propiedad (4 fields in a row)
      // ══════════════════════════════════════════════════════════
      const CARD1_H = 72;
      const c1y = cardStart(CARD1_H);
      cardHeader('Propiedad', c1y, ORANGE);

      const propFields = [
        ['Título',         titulo],
        ['Dirección',      direccion],
        ['Estado',         estado],
        ['Días publicada', `${diasPub} días`],
      ];
      const colW4 = CW / 4;
      propFields.forEach(([label, val], i) => {
        const fx = MARGIN + i * colW4 + 8;
        const fy = c1y + 32;
        doc.fontSize(7).font('Helvetica').fillColor(LGRAY)
          .text(label, fx, fy, { width: colW4 - 12, lineBreak: false });
        doc.fontSize(8.5).font('Helvetica-Bold').fillColor(DARK)
          .text(String(val || '—'), fx, fy + 10, { width: colW4 - 12, lineBreak: false });
      });
      doc.text('', MARGIN, c1y + CARD1_H + 10);

      // ══════════════════════════════════════════════════════════
      // CARD 2 — Resumen del período (8 KPI tiles, 2 rows × 4)
      // ══════════════════════════════════════════════════════════
      const kpis = [
        { label: 'Consultas',           value: enquiries },
        { label: 'Visitas Agendadas',   value: visitasAgendadas },
        { label: 'Visitas Realizadas',  value: visitasRealizadas },
        { label: 'Clientes Interesados',value: uniqueClients.length },
        { label: 'Guardados',           value: favorites },
        { label: 'Interacciones',       value: interactions.length },
        { label: 'Asistencia Visitas',  value: `${visitasAsistencia}%` },
        { label: 'Índice de Intención', value: `${intentScore}/100` },
      ];
      const KPI_TILE_H = 52;
      const CARD2_H = 26 + KPI_TILE_H * 2 + 4 + 8; // header + 2 rows + gaps
      const c2y = cardStart(CARD2_H);
      cardHeader(`Resumen del período (${days} días)`, c2y, '#3b82f6');

      const colW_kpi = CW / 4;
      kpis.forEach(({ label, value }, i) => {
        const row = Math.floor(i / 4);
        const col = i % 4;
        const tx = MARGIN + col * colW_kpi + 4;
        const ty = c2y + 30 + row * (KPI_TILE_H + 4);
        // tile bg
        doc.save();
        doc.roundedRect(tx, ty, colW_kpi - 6, KPI_TILE_H, 4).fill('#f7fafc');
        doc.restore();
        // color dot (icon substitute)
        doc.save();
        doc.circle(tx + colW_kpi / 2 - 1, ty + 10, 4).fill(kpiColors[i] || ORANGE);
        doc.restore();
        // value
        doc.fontSize(15).font('Helvetica-Bold').fillColor(DARK)
          .text(String(value), tx + 4, ty + 18, { width: colW_kpi - 14, align: 'center', lineBreak: false });
        // label
        doc.fontSize(6.5).font('Helvetica').fillColor(LGRAY)
          .text(label, tx + 4, ty + 37, { width: colW_kpi - 14, align: 'center', lineBreak: false });
      });
      doc.text('', MARGIN, c2y + CARD2_H + 10);

      // ══════════════════════════════════════════════════════════
      // CARD 3 — Niveles de Interés (only if any > 0)
      // ══════════════════════════════════════════════════════════
      const hasInterest = interestLevels.alto + interestLevels.medio + interestLevels.bajo > 0;
      if (hasInterest) {
        const CARD3_H = 52;
        const c3y = cardStart(CARD3_H);
        cardHeader('Niveles de Interés', c3y, '#ec4899');
        let ix = MARGIN + 14;
        Object.entries(interestLevels).forEach(([nivel, count]) => {
          const iy = c3y + 32;
          doc.save();
          doc.circle(ix + 5, iy + 5, 5).fill(nivelColors[nivel]);
          doc.restore();
          doc.fontSize(9).font('Helvetica').fillColor(DARK)
            .text(`${nivel.charAt(0).toUpperCase() + nivel.slice(1)}:`, ix + 14, iy, { width: 50, lineBreak: false });
          doc.font('Helvetica-Bold').fillColor(DARK)
            .text(String(count), ix + 66, iy, { width: 24, lineBreak: false });
          ix += 110;
        });
        doc.text('', MARGIN, c3y + CARD3_H + 10);
      }

      // ══════════════════════════════════════════════════════════
      // CARD 4 — Ofertas de Pago (only if any)
      // ══════════════════════════════════════════════════════════
      if (paymentOffers.length > 0) {
        const OFFER_ROW_H = 22;
        const CARD4_H = 30 + paymentOffers.length * OFFER_ROW_H + 6;
        const c4y = cardStart(CARD4_H);
        cardHeader('Ofertas de Pago Recibidas', c4y, '#eab308');
        paymentOffers.forEach((o, idx) => {
          const oy = c4y + 30 + idx * OFFER_ROW_H;
          doc.save();
          doc.rect(MARGIN + 4, oy, CW - 8, OFFER_ROW_H - 2).fill(idx % 2 === 0 ? '#fffbeb' : '#fef3c7');
          doc.restore();
          doc.fontSize(8).font('Helvetica-Bold').fillColor(DARK)
            .text(o.tipo, MARGIN + 8, oy + 5, { width: 130, lineBreak: false });
          if (o.montoOfrecido > 0) {
            doc.font('Helvetica').fillColor('#16a34a')
              .text(fmtCurrency(o.montoOfrecido, o.moneda), MARGIN + 145, oy + 5, { width: 160, lineBreak: false });
          }
          doc.fillColor(LGRAY)
            .text(fmtDate(o.fecha), MARGIN + 320, oy + 5, { width: 120, lineBreak: false });
        });
        doc.text('', MARGIN, c4y + CARD4_H + 10);
      }

      // ══════════════════════════════════════════════════════════
      // CARD 5 — Tendencia Semanal (table)
      // ══════════════════════════════════════════════════════════
      if (weeklyTrend.length > 0) {
        const TBL_ROW_H = 18;
        const CARD5_H = 30 + TBL_ROW_H * (weeklyTrend.length + 1) + 8;
        const c5y = cardStart(CARD5_H);
        cardHeader('Tendencia Semanal (últimas 4 semanas)', c5y, '#8b5cf6');

        const tblY = c5y + 30;
        const tCols = [{ label: 'Semana', w: 150 }, { label: 'Interacciones', w: 180 }, { label: 'Consultas', w: 185 }];

        // header row
        doc.save();
        doc.rect(MARGIN + 4, tblY, CW - 8, TBL_ROW_H).fill('#e2e8f0');
        doc.restore();
        let cx2 = MARGIN + 8;
        tCols.forEach(({ label, w }) => {
          doc.fontSize(7.5).font('Helvetica-Bold').fillColor(GRAY)
            .text(label, cx2, tblY + 4, { width: w - 4, lineBreak: false });
          cx2 += w;
        });

        weeklyTrend.forEach((w, ri) => {
          const ry3 = tblY + TBL_ROW_H * (ri + 1);
          doc.save();
          doc.rect(MARGIN + 4, ry3, CW - 8, TBL_ROW_H).fill(ri % 2 === 0 ? WHITE : '#f7fafc');
          doc.restore();
          // border-t
          doc.save();
          doc.moveTo(MARGIN + 4, ry3).lineTo(MARGIN + 4 + CW - 8, ry3).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
          doc.restore();
          const vals = [w.semana, String(w.interacciones), String(w.consultas)];
          let cx3 = MARGIN + 8;
          vals.forEach((v, vi) => {
            const align = vi === 0 ? 'left' : 'center';
            doc.fontSize(8).font(vi > 0 ? 'Helvetica-Bold' : 'Helvetica').fillColor(GRAY)
              .text(v, cx3, ry3 + 4, { width: tCols[vi].w - 4, align, lineBreak: false });
            cx3 += tCols[vi].w;
          });
        });
        doc.text('', MARGIN, c5y + CARD5_H + 10);
      }

      // ══════════════════════════════════════════════════════════
      // CARD 6 — Historial de Interacciones (row-by-row, page-break safe)
      // ══════════════════════════════════════════════════════════
      if (interactions.length > 0) {
        const ROW_H_INTER = 28;
        // Section header card (just the title bar, no pre-measured full height)
        ensureSpace(42);
        const c6hY = doc.y;
        doc.save();
        doc.roundedRect(MARGIN, c6hY, CW, 34, 6).fillAndStroke(BG_CARD, '#e2e8f0');
        doc.restore();
        doc.save();
        doc.circle(MARGIN + 14, c6hY + 17, 5).fill('#6366f1');
        doc.restore();
        doc.fontSize(11).font('Helvetica-Bold').fillColor(DARK)
          .text(`Historial de Interacciones (${interactions.length})`, MARGIN + 24, c6hY + 10, { width: CW - 30, lineBreak: false });
        doc.text('', MARGIN, c6hY + 40);

        interactions.forEach((inter, idx) => {
          ensureSpace(ROW_H_INTER + 2);
          const iy = doc.y;

          // stripe bg
          doc.save();
          doc.rect(MARGIN + 4, iy, CW - 8, ROW_H_INTER).fill(idx % 2 === 0 ? '#f7fafc' : WHITE);
          doc.restore();
          // top border
          doc.save();
          doc.moveTo(MARGIN + 4, iy).lineTo(MARGIN + 4 + CW - 8, iy).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
          doc.restore();

          const cliente = clienteMap[String(inter.clienteId)] || { nombre: 'Desconocido', telefono: '' };
          const tipoTxt = tipoLabels[inter.tipo] || inter.tipo;

          const badgeBg = inter.tipo === 'visita_realizada' ? '#d1fae5'
            : inter.tipo === 'visita_agendada'   ? '#dbeafe'
            : inter.tipo === 'propiedad_interes' ? '#ede9fe'
            : inter.tipo === 'opcion_pago'       ? '#fef3c7'
            : '#f3f4f6';
          const badgeFg = inter.tipo === 'visita_realizada' ? '#065f46'
            : inter.tipo === 'visita_agendada'   ? '#1e40af'
            : inter.tipo === 'propiedad_interes' ? '#5b21b6'
            : inter.tipo === 'opcion_pago'       ? '#92400e'
            : '#374151';

          const badgeW = Math.min(doc.widthOfString(tipoTxt, { fontSize: 7 }) + 10, 110);
          doc.save();
          doc.roundedRect(MARGIN + 8, iy + 5, badgeW, 12, 6).fill(badgeBg);
          doc.restore();
          doc.fontSize(7).font('Helvetica-Bold').fillColor(badgeFg)
            .text(tipoTxt, MARGIN + 8, iy + 7, { width: badgeW - 2, lineBreak: false });

          doc.fontSize(8).font('Helvetica-Bold').fillColor(DARK)
            .text(cliente.nombre, MARGIN + badgeW + 14, iy + 5, { width: 140, lineBreak: false });

          if (cliente.telefono) {
            doc.fontSize(7.5).font('Helvetica').fillColor(LGRAY)
              .text(cliente.telefono, MARGIN + badgeW + 160, iy + 5, { width: 90, lineBreak: false });
          }

          doc.fontSize(7).font('Helvetica').fillColor('#9ca3af')
            .text(fmtDate(inter.createdAt), MARGIN + CW - 75, iy + 5, { width: 70, align: 'right', lineBreak: false });

          if (inter.descripcion) {
            doc.fontSize(7).font('Helvetica').fillColor(LGRAY)
              .text(inter.descripcion.slice(0, 100), MARGIN + 8, iy + 17, { width: CW - 30, lineBreak: false });
          } else if (inter.nivelInteres) {
            doc.fontSize(7).font('Helvetica').fillColor(LGRAY)
              .text(`Interés: ${inter.nivelInteres}`, MARGIN + 8, iy + 17, { width: 120, lineBreak: false });
          }

          doc.text('', MARGIN, iy + ROW_H_INTER + 1);
        });
        doc.moveDown(0.3);
      }

      // ══════════════════════════════════════════════════════════
      // FOOTER LINE — matches the preview footer text
      // ══════════════════════════════════════════════════════════
      ensureSpace(20);
      doc.save();
      doc.moveTo(MARGIN, doc.y).lineTo(MARGIN + CW, doc.y).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
      doc.restore();
      doc.fontSize(7.5).font('Helvetica').fillColor('#9ca3af')
        .text(
          `Informe generado el ${now.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })} · Período: últimos ${days} días`,
          MARGIN, doc.y + 6, { align: 'center', width: CW }
        );

      // ── Page numbers on every page ──
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(7).font('Helvetica').fillColor('#9ca3af')
          .text(`${i + 1} / ${pages.count}`, PAGE_W - MARGIN - 30, PAGE_H - 28, { width: 30, align: 'right', lineBreak: false });
      }

      doc.end();
    });

    const buffer = Buffer.concat(chunks);
    const filename = `Informe_Mercado_${propiedad.title || propiedadId}_${days}d.pdf`.replace(/[^a-zA-Z0-9_.\-]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.end(buffer);
  } catch (err) {
    console.error('[OwnerReport PDF]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── DYNAMIC ROUTES (must come before /:clienteId) ──

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

    // ── Side-effects based on interaction type ──
    const { tipo, propiedadId, nivelInteres, preferencias } = body;
    const agenteId = body.agenteId;

    // 1) Property metrics: visita_agendada, visita_realizada, propiedad_interes
    if (propiedadId && mongoose.Types.ObjectId.isValid(propiedadId)) {
      if (tipo === 'visita_agendada') {
        await Propiedad.findByIdAndUpdate(propiedadId, {
          $inc: { 'metadata.visitasAgendadas': 1 },
        });
      } else if (tipo === 'visita_realizada') {
        await Propiedad.findByIdAndUpdate(propiedadId, {
          $inc: { 'metadata.visitasRealizadas': 1, 'metadata.visitasPositivas': 1 },
        });
      } else if (tipo === 'propiedad_interes') {
        const interesInc = { 'metadata.intereses': 1 };
        if (nivelInteres === 'alto') interesInc['metadata.interesAlto'] = 1;
        else if (nivelInteres === 'medio') interesInc['metadata.interesMedio'] = 1;
        else if (nivelInteres === 'bajo') interesInc['metadata.interesBajo'] = 1;
        await Propiedad.findByIdAndUpdate(propiedadId, { $inc: interesInc });
      }
    }

    // 2) Agent metadata: track visit counts per agent
    if (agenteId) {
      if (tipo === 'visita_agendada') {
        await Agente.findByIdAndUpdate(agenteId, {
          $inc: { 'metadata.visitasAgendadas': 1 },
        }).catch(() => {});
      } else if (tipo === 'visita_realizada') {
        await Agente.findByIdAndUpdate(agenteId, {
          $inc: { 'metadata.visitasRealizadas': 1, 'metadata.visitasPositivas': 1 },
        }).catch(() => {});
      }
    }

    // 3) Update cliente: ultimaActividad + preferences tracking
    if (tipo === 'preferencia' && preferencias && preferencias.tipo) {
      const prefEntry = {
        tipo: preferencias.tipo,
        detalle: preferencias.detalle || '',
        fecha: new Date().toISOString(),
      };
      await Cliente.findByIdAndUpdate(clienteId, {
        $set: { 'metadata.ultimaActividad': new Date().toISOString() },
        $push: { 'metadata.preferencias': prefEntry },
      });
    } else {
      await Cliente.findByIdAndUpdate(clienteId, {
        $set: { 'metadata.ultimaActividad': new Date().toISOString() },
      });
    }

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
