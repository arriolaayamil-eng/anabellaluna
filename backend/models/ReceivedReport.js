const mongoose = require('mongoose');

const ReceivedReportSchema = new mongoose.Schema({
  agentId: { type: String, required: true, index: true },
  agentName: { type: String, default: 'Agente' },
  type: { type: String, enum: ['manual', 'monthly', 'annual'], default: 'manual' },
  period: { type: String },
  filename: { type: String },
  pdfData: { type: Buffer, required: true },
  fileSize: { type: Number },
  downloadedByAdmin: { type: Boolean, default: false },
  downloadedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('ReceivedReport', ReceivedReportSchema);
