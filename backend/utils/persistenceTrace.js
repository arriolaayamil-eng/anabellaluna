const crypto = require('crypto');

function getRequestId(req) {
  if (req.requestId) return req.requestId;

  const headerId = req.headers && (req.headers['x-request-id'] || req.headers['x-correlation-id']);
  req.requestId = String(headerId || crypto.randomUUID());
  return req.requestId;
}

function userFromReq(req) {
  const user = req.user || {};
  return {
    userId: String(user.sub || user.id || user._id || ''),
    role: user.role || '',
    agenteId: String(user.agenteId || ''),
  };
}

function sanitize(value) {
  if (Array.isArray(value)) return value.map(sanitize);
  if (!value || typeof value !== 'object') return value;

  return Object.entries(value).reduce((acc, [key, val]) => {
    if (/password|token|secret|apiKey|authorization/i.test(key)) {
      acc[key] = '[redacted]';
      return acc;
    }
    acc[key] = sanitize(val);
    return acc;
  }, {});
}

function traceMutation(req, event, payload = {}) {
  const line = {
    at: new Date().toISOString(),
    requestId: getRequestId(req),
    event,
    method: req.method,
    path: req.originalUrl || req.url,
    ...userFromReq(req),
    ...sanitize(payload),
  };

  console.log(`[CRM:${event}] ${JSON.stringify(line)}`);
}

function traceMutationError(req, event, error, payload = {}) {
  traceMutation(req, event, {
    ...payload,
    error: error && error.message ? error.message : String(error),
    errorName: error && error.name ? error.name : 'Error',
  });
}

async function confirmPersisted(Model, id, label = 'documento') {
  const persisted = await Model.findById(id).lean();
  if (!persisted) {
    const error = new Error(`No se pudo confirmar la persistencia de ${label}`);
    error.statusCode = 500;
    throw error;
  }
  return persisted;
}

async function confirmMissing(Model, id, label = 'documento') {
  const stillThere = await Model.findById(id).select('_id').lean();
  if (stillThere) {
    const error = new Error(`No se pudo confirmar la eliminación de ${label}`);
    error.statusCode = 500;
    throw error;
  }
}

function attachRequestId(req, res) {
  res.set('x-request-id', getRequestId(req));
}

module.exports = {
  attachRequestId,
  confirmMissing,
  confirmPersisted,
  getRequestId,
  traceMutation,
  traceMutationError,
};
