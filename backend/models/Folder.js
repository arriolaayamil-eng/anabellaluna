const mongoose = require('mongoose');

const FolderSchema = new mongoose.Schema({
  name: String,
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' }
});

module.exports = mongoose.model('Folder', FolderSchema);
