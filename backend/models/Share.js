const mongoose = require('mongoose');

const ShareSchema = new mongoose.Schema({
  document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  token: String,
  expires_at: Date
});

module.exports = mongoose.model('Share', ShareSchema);
