const mongoose = require('mongoose');



const DocumentSchema = new mongoose.Schema({

  nombre: String,

  tipo: String,

  mimetype: { type: String, default: '' },

  categoria: { type: String, default: 'Sin clasificar' },

  tamano: Number,

  fecha: { type: Date, default: Date.now },

  relacionado: String,

  agenteId: { type: String, default: '', index: true },

  accesos: { type: Number, default: 0 },

  starred: { type: Boolean, default: false },

  url: String,

  bucket: { type: String, default: '' },

  object_key: String,

  cloudinary_id: String,

  versions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Version' }],

  folder: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },

  sourceModule: { type: String, default: '' },

  documentType: { type: String, default: '' },

  ownerType: { type: String, default: '' },

  ownerId: { type: String, default: '' },

  ownerLabel: { type: String, default: '' },

  status: { type: String, default: 'active' },

  tags: [{ type: String }],

  uploadedBy: { type: String, default: '' },

  metadata: { type: Object, default: {} }

});



DocumentSchema.index({ folder: 1, agenteId: 1 });

DocumentSchema.index({ documentType: 1, agenteId: 1 });



module.exports = mongoose.model('Document', DocumentSchema);

