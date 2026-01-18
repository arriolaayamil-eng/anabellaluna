const express = require('express');
const Cita = require('../models/Cita');
const Agente = require('../models/Agente');
const { authenticateToken } = require('../auth');
const googleCalendar = require('../services/googleCalendar');

const router = express.Router();

function agentScopeId(req) {
  if (req.user && req.user.role === 'admin') return null;
  return req.user && req.user.agenteId ? String(req.user.agenteId) : null;
}

async function getAgentCalendarCredentials(agentId) {
  if (!agentId) return null;
  const agent = await Agente.findById(agentId).lean();
  if (!agent) return null;
  const gc = agent.metadata && agent.metadata.googleCalendar ? agent.metadata.googleCalendar : {};
  if (!gc.refreshToken) return null;
  return {
    refreshToken: String(gc.refreshToken),
    calendarId: String(gc.calendarId || 'primary'),
  };
}

function computeEndDate(start, end) {
  const s = new Date(start);
  if (!Number.isNaN(new Date(end).getTime())) return new Date(end);
  return new Date(s.getTime() + 60 * 60 * 1000);
}

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;
    const scopeId = agentScopeId(req);
    const filter = q ? { notas: { $regex: q, $options: 'i' } } : {};
    if (scopeId) filter.agenteId = scopeId;
    const items = await Cita.find(filter).sort({ fecha: -1 }).limit(1000).lean();
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const item = await Cita.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ error: 'Not found' });
    const scopeId = agentScopeId(req);
    if (scopeId && String(item.agenteId || '') !== scopeId) return res.status(403).json({ error: 'forbidden' });
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const body = { ...(req.body || {}) };
    if (scopeId) body.agenteId = scopeId;

    const created = await Cita.create(body);
    let cita = created.toObject ? created.toObject() : created;

    const agentId = String(cita.agenteId || body.agenteId || '');
    if (googleCalendar.isConfigured()) {
      const creds = await getAgentCalendarCredentials(agentId);
      if (creds) {
        try {
          const start = cita.fecha;
          const end = computeEndDate(cita.fecha, cita.fechaFin);

          const ev = await googleCalendar.createCalendarEvent({
            refreshToken: creds.refreshToken,
            calendarId: creds.calendarId,
            summary: cita.titulo || 'Cita',
            description: cita.notas || '',
            start,
            end,
          });

          const meta = { ...(cita.metadata || {}) };
          meta.googleCalendar = {
            eventId: ev && ev.id ? String(ev.id) : '',
            htmlLink: ev && ev.htmlLink ? String(ev.htmlLink) : '',
          };

          cita = await Cita.findByIdAndUpdate(
            cita._id,
            { $set: { fechaFin: end, metadata: meta } },
            { new: true }
          ).lean();
        } catch (e) {
        }
      }
    }

    res.status(201).json(cita);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const filter = { _id: req.params.id };
    if (scopeId) filter.agenteId = scopeId;
    const body = { ...(req.body || {}) };
    if (scopeId) body.agenteId = scopeId;

    const existing = await Cita.findOne(filter).lean();
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const updated = await Cita.findOneAndUpdate(filter, body, { new: true, runValidators: true }).lean();
    if (!updated) return res.status(404).json({ error: 'Not found' });

    let cita = updated;
    const agentId = String(updated.agenteId || '');
    const existingMeta = existing && existing.metadata ? existing.metadata : {};
    const gcMeta = existingMeta.googleCalendar || {};
    const eventId = gcMeta.eventId ? String(gcMeta.eventId) : '';

    if (googleCalendar.isConfigured()) {
      const creds = await getAgentCalendarCredentials(agentId);
      if (creds) {
        try {
          const start = cita.fecha;
          const end = computeEndDate(cita.fecha, cita.fechaFin);

          const description = cita.notas || '';
          let ev = null;
          if (eventId) {
            ev = await googleCalendar.updateCalendarEvent({
              refreshToken: creds.refreshToken,
              calendarId: creds.calendarId,
              eventId,
              summary: cita.titulo || 'Cita',
              description,
              start,
              end,
            });
          } else {
            ev = await googleCalendar.createCalendarEvent({
              refreshToken: creds.refreshToken,
              calendarId: creds.calendarId,
              summary: cita.titulo || 'Cita',
              description,
              start,
              end,
            });
          }

          const meta = { ...(cita.metadata || {}) };
          meta.googleCalendar = {
            eventId: ev && ev.id ? String(ev.id) : eventId,
            htmlLink: ev && ev.htmlLink ? String(ev.htmlLink) : (gcMeta.htmlLink || ''),
          };

          cita = await Cita.findByIdAndUpdate(
            cita._id,
            { $set: { fechaFin: end, metadata: meta } },
            { new: true }
          ).lean();
        } catch (e) {
        }
      }
    }

    res.json(cita);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const scopeId = agentScopeId(req);
    const filter = { _id: req.params.id };
    if (scopeId) filter.agenteId = scopeId;

    const existing = await Cita.findOne(filter).lean();
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const agentId = String(existing.agenteId || '');
    const meta = existing && existing.metadata ? existing.metadata : {};
    const gc = meta.googleCalendar || {};
    const eventId = gc.eventId ? String(gc.eventId) : '';

    const deleted = await Cita.findOneAndDelete(filter);
    if (!deleted) return res.status(404).json({ error: 'Not found' });

    if (eventId && googleCalendar.isConfigured()) {
      const creds = await getAgentCalendarCredentials(agentId);
      if (creds) {
        try {
          await googleCalendar.deleteCalendarEvent({
            refreshToken: creds.refreshToken,
            calendarId: creds.calendarId,
            eventId,
          });
        } catch (e) {
        }
      }
    }

    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
