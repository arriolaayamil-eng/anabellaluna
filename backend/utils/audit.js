const AuditLog = require('../models/AuditLog');

async function logAction(userId, action, documentId, details) {
  try {
    const entry = new AuditLog({ user: userId || null, action, document: documentId || null, details: details || '' });
    await entry.save();
  } catch (err) {
    // don't throw; logging should be best-effort
    console.error('Failed to write audit log', err.message || err);
  }
}

module.exports = { logAction };
