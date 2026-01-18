const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  agenteId: { type: String, default: '', index: true },
  clientId: { type: String, default: '', index: true },
  propertyId: { type: String, default: '', index: true },
  type: { type: String, default: '' },
  notes: { type: String, default: '' },
  metadata: { type: Object, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('Activity', ActivitySchema);
