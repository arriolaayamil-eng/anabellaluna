const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  nombre: String,
  tipo: String,
  categoria: { type: String, default: 'Sin clasificar' },
  tamano: Number,
  fecha: { type: Date, default: Date.now },
  relacionado: String,
  agenteId: { type: String, default: '', index: true },
  accesos: { type: Number, default: 0 },
  url: String,
  bucket: { type: String, default: '' },
  object_key: String,
  cloudinary_id: String,
  versions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Version' }],
  folder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder' }
});

module.exports = mongoose.model('Document', DocumentSchema);
