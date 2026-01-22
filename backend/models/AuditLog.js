const mongoose = require('mongoose');

const AuditSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: String,
  document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  details: String,
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', AuditSchema);
