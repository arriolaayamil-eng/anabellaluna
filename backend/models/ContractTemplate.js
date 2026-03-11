const mongoose = require('mongoose');

const ContractTemplateSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '', trim: true },
  category: { type: String, default: 'General', trim: true },
  status: { type: String, enum: ['draft', 'active', 'archived'], default: 'active', index: true },
  visibility: { type: String, enum: ['global'], default: 'global', index: true },
  content: { type: String, required: true, default: '' },
  tags: [{ type: String, trim: true }],
  createdBy: { type: String, default: '' },
  createdByRole: { type: String, default: 'admin' },
  updatedBy: { type: String, default: '' },
  version: { type: Number, default: 1 },
}, { timestamps: true });

ContractTemplateSchema.index({ name: 1, category: 1 });

module.exports = mongoose.model('ContractTemplate', ContractTemplateSchema);
