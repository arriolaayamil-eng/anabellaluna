const mongoose = require('mongoose');

const FolderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  agenteId: { type: String, default: '', index: true },
  color: { type: String, default: '' },
  starred: { type: Boolean, default: false },
}, { timestamps: true });

FolderSchema.index({ parent: 1, agenteId: 1 });

module.exports = mongoose.model('Folder', FolderSchema);
