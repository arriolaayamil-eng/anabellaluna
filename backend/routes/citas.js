const express = require('express');
const Cita = require('../models/Cita');
const Agente = require('../models/Agente');
const { authenticateToken, agentScopeId, requireCRMUser } = require('../auth');
const googleCalendar = require('../services/googleCalendar');
const {
  attachRequestId,
  confirmMissing,
  confirmPersisted,
  traceMutation,
  traceMutationError,
} = require('../utils/persistenceTrace');

const router = express.Router();

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

router.get('/', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const { q } = req.query;
    const scopeId = agentScopeId(req);
    const filter = q ? { notas: { $regex: q, $options: 'i' } } : {};
    if (scopeId) filter.agenteId = scopeId;
    const items = await Cita.find(filter).sort({ fecha: -1 }).limit(1000).lean();
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, requireCRMUser, async (req, res) => {
  try {
    const item = await Cita.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ error: 'Not found' });
    const scopeId = agentScopeId(req);
    if (scopeId && String(item.agenteId || '') !== scopeId) return res.status(403).json({ error: 'forbidden' });
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, requireCRMUser, async (req, res) => {
  attachRequestId(req, res);
  try {
    const scopeId = agentScopeId(req);
    const body = { ...(req.body || {}) };
    traceMutation(req, 'cita.create.start', {
      titulo: body.titulo || '',
      fecha: body.fecha || '',
      clienteId: body.clienteId || '',
      propiedadId: body.propiedadId || '',
      requestedAgenteId: body.agenteId || '',
    });
    if (scopeId) body.agenteId = scopeId;

    const created = await Cita.create(body);
    let cita = await confirmPersisted(Cita, created._id, 'cita');
    traceMutation(req, 'cita.create.persisted', {
      citaId: cita._id,
      agenteId: cita.agenteId || '',
    });

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
          traceMutation(req, 'cita.googleCalendar.synced', {
            citaId: cita._id,
            eventId: meta.googleCalendar.eventId,
          });
        } catch (e) {
          traceMutationError(req, 'cita.googleCalendar.failed', e, { citaId: cita._id });
        }
      }
    }

    res.status(201).json(cita);
  } catch (err) {
    traceMutationError(req, 'cita.create.failed', err);
    res.status(err.statusCode || 400).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, requireCRMUser, async (req, res) => {
  attachRequestId(req, res);
  try {
    const scopeId = agentScopeId(req);
    const filter = { _id: req.params.id };
    if (scopeId) filter.agenteId = scopeId;
    const body = { ...(req.body || {}) };
    traceMutation(req, 'cita.update.start', {
      citaId: req.params.id,
      fields: Object.keys(body),
    });
    if (scopeId) body.agenteId = scopeId;

    const existing = await Cita.findOne(filter).lean();
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const updated = await Cita.findOneAndUpdate(filter, body, { new: true, runValidators: true }).lean();
    if (!updated) return res.status(404).json({ error: 'Not found' });

    let cita = await Cita.findOne(filter).lean();
    if (!cita) {
      const error = new Error('No se pudo confirmar la persistencia de la cita actualizada');
      error.statusCode = 500;
      throw error;
    }
    traceMutation(req, 'cita.update.persisted', {
      citaId: cita._id,
      agenteId: cita.agenteId || '',
    });
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
          traceMutation(req, 'cita.googleCalendar.synced', {
            citaId: cita._id,
            eventId: meta.googleCalendar.eventId,
          });
        } catch (e) {
          traceMutationError(req, 'cita.googleCalendar.failed', e, { citaId: cita._id });
        }
      }
    }

    res.json(cita);
  } catch (err) {
    traceMutationError(req, 'cita.update.failed', err, { citaId: req.params.id });
    res.status(err.statusCode || 400).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, requireCRMUser, async (req, res) => {
  attachRequestId(req, res);
  try {
    const scopeId = agentScopeId(req);
    const filter = { _id: req.params.id };
    if (scopeId) filter.agenteId = scopeId;
    traceMutation(req, 'cita.delete.start', { citaId: req.params.id });

    const existing = await Cita.findOne(filter).lean();
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const agentId = String(existing.agenteId || '');
    const meta = existing && existing.metadata ? existing.metadata : {};
    const gc = meta.googleCalendar || {};
    const eventId = gc.eventId ? String(gc.eventId) : '';

    const deleted = await Cita.findOneAndDelete(filter);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    await confirmMissing(Cita, deleted._id, 'cita');
    traceMutation(req, 'cita.delete.persisted', { citaId: deleted._id });

    if (eventId && googleCalendar.isConfigured()) {
      const creds = await getAgentCalendarCredentials(agentId);
      if (creds) {
        try {
          await googleCalendar.deleteCalendarEvent({
            refreshToken: creds.refreshToken,
            calendarId: creds.calendarId,
            eventId,
          });
          traceMutation(req, 'cita.googleCalendar.deleted', { citaId: deleted._id, eventId });
        } catch (e) {
          traceMutationError(req, 'cita.googleCalendarDelete.failed', e, { citaId: deleted._id, eventId });
        }
      }
    }

    res.json({ ok: true });
  } catch (err) {
    traceMutationError(req, 'cita.delete.failed', err, { citaId: req.params.id });
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

module.exports = router;
