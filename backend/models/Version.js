const mongoose = require('mongoose');

const VersionSchema = new mongoose.Schema({
  document: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  filename: String,
  url: String,
  bucket: String,
  object_key: String,
  cloudinary_id: String,
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Version', VersionSchema);
