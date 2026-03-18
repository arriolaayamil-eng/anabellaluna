const mongoose = require('mongoose');

const EditedImageSchema = new mongoose.Schema({
  originalDocumentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', default: null },
  originalObjectKey: { type: String, required: true },
  originalFilename: { type: String, default: '' },
  watermarkObjectKey: { type: String, default: '' },
  watermarkFilename: { type: String, default: '' },
  outputObjectKey: { type: String, required: true },
  outputFilename: { type: String, default: '' },
  outputBucket: { type: String, default: '' },
  outputFormat: { type: String, default: 'png' },
  outputSize: { type: Number, default: 0 },
  outputWidth: { type: Number, default: 0 },
  outputHeight: { type: Number, default: 0 },
  watermarkConfig: { type: Object, default: {} },
  userId: { type: String, default: '' },
  userName: { type: String, default: '' },
  agenteId: { type: String, default: '', index: true },
  createdAt: { type: Date, default: Date.now },
});

EditedImageSchema.index({ createdAt: -1 });
EditedImageSchema.index({ originalObjectKey: 1 });

module.exports = mongoose.model('EditedImage', EditedImageSchema);
