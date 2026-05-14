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

    // ── Build PDF ──
    const MARGIN = 50;
    const PAGE_W = 595.28;
    const PAGE_H = 841.89;
    const CONTENT_W = PAGE_W - MARGIN * 2;
    const PRIMARY = '#1a365d';
    const ACCENT = '#ed8936';
    const DARK = '#1a202c';
    const GRAY = '#4a5568';
    const WHITE = '#ffffff';
    const LIGHT_GRAY = '#e2e8f0';

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-';
    const fmtCurrency = (val, mon = 'USD') => val ? `${mon} ${Number(val).toLocaleString('es-AR')}` : '-';

    const doc = new PDFDocument({ size: 'A4', margin: MARGIN, bufferPages: true });
    const chunks = [];
    doc.on('data', c => chunks.push(c));

    await new Promise((resolve, reject) => {
      doc.on('end', resolve);
      doc.on('error', reject);

      // ── PORTADA ──
      doc.save();
      doc.rect(0, 0, PAGE_W, PAGE_H).fill(PRIMARY);
      doc.restore();

      doc.fillColor(WHITE).font('Helvetica-Bold').fontSize(28)
        .text('INFORME DE MERCADO', MARGIN, 220, { align: 'center', width: CONTENT_W });
      doc.font('Helvetica').fontSize(13)
        .text(`Últimos ${days} días`, MARGIN, 260, { align: 'center', width: CONTENT_W });

      const titulo = propiedad.title || 'Sin título';
      const direccion = propiedad.address || propiedad.metadata?.direccion || '';
      doc.fontSize(12).text(titulo, MARGIN, 320, { align: 'center', width: CONTENT_W });
      if (direccion) doc.fontSize(10).text(direccion, MARGIN, 342, { align: 'center', width: CONTENT_W });

      doc.save();
      doc.moveTo(200, 375).lineTo(395, 375).strokeColor(ACCENT).lineWidth(2).stroke();
      doc.restore();

      doc.fillColor(LIGHT_GRAY).font('Helvetica').fontSize(10)
        .text(`Generado el ${fmtDate(now)}`, MARGIN, 390, { align: 'center', width: CONTENT_W });

      doc.fontSize(8).fillColor('#718096')
        .text('Informe generado automáticamente por el sistema de gestión inmobiliaria.', MARGIN, PAGE_H - 50, { align: 'center', width: CONTENT_W });

      // helper: ensure space
      const ensureSpace = (needed) => {
        if (doc.y + needed > PAGE_H - 60) { doc.addPage(); doc.y = MARGIN; }
      };

      const sectionTitle = (title) => {
        ensureSpace(40);
        doc.moveDown(0.5);
        const ty = doc.y;
        doc.fontSize(12).fillColor(PRIMARY).font('Helvetica-Bold').text(title, MARGIN, ty, { width: CONTENT_W });
        const ly = doc.y + 1;
        doc.save();
        doc.moveTo(MARGIN, ly).lineTo(MARGIN + CONTENT_W, ly).strokeColor(ACCENT).lineWidth(1.5).stroke();
        doc.restore();
        doc.moveDown(0.6);
      };

      const kpiRow = (pairs) => {
        // pairs: [[label, value], ...]  — up to 4 per row
        const colW = CONTENT_W / pairs.length;
        ensureSpace(50);
        const ry = doc.y;
        pairs.forEach(([label, value], idx) => {
          const x = MARGIN + idx * colW;
          doc.save();
          doc.rect(x + 2, ry, colW - 4, 44).fill(idx % 2 === 0 ? '#f7fafc' : '#edf2f7');
          doc.restore();
          doc.fontSize(18).font('Helvetica-Bold').fillColor(PRIMARY)
            .text(String(value), x + 4, ry + 4, { width: colW - 8, align: 'center', lineBreak: false });
          doc.fontSize(7).font('Helvetica').fillColor(GRAY)
            .text(label, x + 4, ry + 28, { width: colW - 8, align: 'center', lineBreak: false });
        });
        doc.text('', MARGIN, ry + 50);
      };

      const twoCol = (pairs) => {
        for (let i = 0; i < pairs.length; i += 2) {
          ensureSpace(16);
          const ry = doc.y;
          const [l1, v1] = pairs[i];
          doc.fontSize(9).font('Helvetica-Bold').fillColor(DARK).text(`${l1}:`, MARGIN, ry, { width: 120, lineBreak: false });
          doc.fontSize(9).font('Helvetica').fillColor(GRAY).text(String(v1 || '-'), MARGIN + 125, ry, { width: 110, lineBreak: false });
          if (pairs[i + 1]) {
            const [l2, v2] = pairs[i + 1];
            doc.fontSize(9).font('Helvetica-Bold').fillColor(DARK).text(`${l2}:`, MARGIN + 250, ry, { width: 120, lineBreak: false });
            doc.fontSize(9).font('Helvetica').fillColor(GRAY).text(String(v2 || '-'), MARGIN + 375, ry, { width: 115, lineBreak: false });
          }
          doc.text('', MARGIN, ry + 16);
        }
      };

      // ── PAGE 2: RESUMEN ──
      doc.addPage();

      sectionTitle('Ficha de la Propiedad');
      twoCol([
        ['Título', propiedad.title || '-'],
        ['Dirección', propiedad.address || propiedad.metadata?.direccion || '-'],
        ['Precio', fmtCurrency(propiedad.price, propiedad.moneda)],
        ['Estado', propiedad.status || 'Disponible'],
        ['Días publicada', `${Math.round((now - new Date(propiedad.createdAt)) / (1000 * 60 * 60 * 24))} días`],
        ['Tipo', propiedad.metadata?.tipo || '-'],
      ]);

      doc.moveDown(0.5);
      sectionTitle(`Resumen del Período (${days} días)`);
      kpiRow([['Consultas', enquiries], ['Visitas Agendadas', visitasAgendadas], ['Visitas Realizadas', visitasRealizadas], ['Asistencia', `${visitasAsistencia}%`]]);
      kpiRow([['Clientes Interesados', uniqueClients.length], ['Guardados', favorites], ['Total Interacciones', interactions.length], ['Índice de Intención', `${intentScore}/100`]]);

      // Interest levels
      if (interestLevels.alto + interestLevels.medio + interestLevels.bajo > 0) {
        doc.moveDown(0.3);
        sectionTitle('Niveles de Interés');
        ensureSpace(16);
        const ily = doc.y;
        const nivelColors = { alto: '#16a34a', medio: '#d97706', bajo: '#dc2626' };
        let ix = MARGIN;
        Object.entries(interestLevels).forEach(([nivel, count]) => {
          doc.save();
          doc.circle(ix + 5, ily + 5, 5).fill(nivelColors[nivel]);
          doc.restore();
          doc.fontSize(9).font('Helvetica').fillColor(DARK)
            .text(`${nivel.charAt(0).toUpperCase() + nivel.slice(1)}: `, ix + 14, ily, { width: 60, lineBreak: false });
          doc.font('Helvetica-Bold').text(String(count), ix + 70, ily, { width: 30, lineBreak: false });
          ix += 120;
        });
        doc.text('', MARGIN, ily + 16);
      }

      // ── TENDENCIA SEMANAL ──
      doc.moveDown(0.3);
      sectionTitle('Tendencia Semanal (últimas 4 semanas)');
      ensureSpace(80);
      const tableY = doc.y;
      const COL_W = [120, 170, 170];
      const ROW_H = 18;
      const headers = ['Semana', 'Interacciones', 'Consultas'];

      // Header row
      doc.save();
      doc.rect(MARGIN, tableY, CONTENT_W, ROW_H).fill('#e2e8f0');
      doc.restore();
      headers.forEach((h, i) => {
        const x = MARGIN + COL_W.slice(0, i).reduce((a, b) => a + b, 0);
        doc.fontSize(8).font('Helvetica-Bold').fillColor(DARK)
          .text(h, x + 4, tableY + 4, { width: COL_W[i] - 8, lineBreak: false });
      });

      weeklyTrend.forEach((w, rowIdx) => {
        const ry2 = tableY + ROW_H * (rowIdx + 1);
        doc.save();
        doc.rect(MARGIN, ry2, CONTENT_W, ROW_H).fill(rowIdx % 2 === 0 ? WHITE : '#f7fafc');
        doc.restore();
        const vals = [w.semana, String(w.interacciones), String(w.consultas)];
        vals.forEach((v, i) => {
          const x = MARGIN + COL_W.slice(0, i).reduce((a, b) => a + b, 0);
          doc.fontSize(8).font('Helvetica').fillColor(GRAY)
            .text(v, x + 4, ry2 + 4, { width: COL_W[i] - 8, lineBreak: false });
        });
      });
      doc.text('', MARGIN, tableY + ROW_H * (weeklyTrend.length + 1) + 4);

      // ── OFERTAS DE PAGO ──
      if (paymentOffers.length > 0) {
        sectionTitle(`Ofertas de Pago Recibidas (${paymentOffers.length})`);
        paymentOffers.forEach((o, idx) => {
          ensureSpace(20);
          const oy = doc.y;
          doc.save();
          doc.rect(MARGIN, oy, CONTENT_W, 18).fill(idx % 2 === 0 ? '#fffbeb' : '#fef3c7');
          doc.restore();
          doc.fontSize(8).font('Helvetica-Bold').fillColor(DARK)
            .text(o.tipo, MARGIN + 4, oy + 4, { width: 130, lineBreak: false });
          if (o.montoOfrecido > 0) {
            doc.font('Helvetica').fillColor('#16a34a')
              .text(fmtCurrency(o.montoOfrecido, o.moneda), MARGIN + 140, oy + 4, { width: 160, lineBreak: false });
          }
          doc.fillColor(GRAY)
            .text(fmtDate(o.fecha), MARGIN + 310, oy + 4, { width: 120, lineBreak: false });
          doc.text('', MARGIN, oy + 20);
        });
      }

      // ── HISTORIAL DE INTERACCIONES ──
      if (interactions.length > 0) {
        sectionTitle(`Historial de Interacciones (${interactions.length})`);
        const tipoLabels = {
          nota: 'Nota', recontacto: 'Recontacto', visita_agendada: 'Visita Agendada',
          visita_realizada: 'Visita Realizada', propiedad_interes: 'Interés', opcion_pago: 'Oferta Pago', preferencia: 'Preferencia',
        };
        const ROW_H2 = 22;
        interactions.forEach((inter, idx) => {
          ensureSpace(ROW_H2 + 2);
          const iy = doc.y;
          doc.save();
          doc.rect(MARGIN, iy, CONTENT_W, ROW_H2).fill(idx % 2 === 0 ? '#f7fafc' : WHITE);
          doc.restore();
          const cliente = clienteMap[String(inter.clienteId)] || { nombre: 'Desconocido', telefono: '' };
          doc.fontSize(7.5).font('Helvetica-Bold').fillColor(DARK)
            .text(tipoLabels[inter.tipo] || inter.tipo, MARGIN + 4, iy + 3, { width: 100, lineBreak: false });
          doc.font('Helvetica').fillColor(GRAY)
            .text(cliente.nombre, MARGIN + 110, iy + 3, { width: 160, lineBreak: false });
          if (cliente.telefono) {
            doc.text(cliente.telefono, MARGIN + 278, iy + 3, { width: 100, lineBreak: false });
          }
          doc.fillColor('#6b7280')
            .text(fmtDate(inter.createdAt), MARGIN + 385, iy + 3, { width: 100, lineBreak: false });
          if (inter.descripcion) {
            doc.fontSize(6.5).fillColor('#9ca3af')
              .text(inter.descripcion.slice(0, 80), MARGIN + 4, iy + 13, { width: CONTENT_W - 8, lineBreak: false });
          }
          doc.text('', MARGIN, iy + ROW_H2 + 1);
        });
      }

      // ── FOOTERS ──
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        if (i === 0) continue; // skip cover
        doc.save();
        doc.fontSize(7).fillColor(GRAY)
          .text(`Informe de Mercado — ${titulo} · Página ${i + 1}`, MARGIN, PAGE_H - 30, { align: 'center', width: CONTENT_W });
        doc.restore();
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
