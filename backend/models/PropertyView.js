const mongoose = require('mongoose');

const PropertyViewSchema = new mongoose.Schema({
  propertyId: { type: String, required: true, index: true },
  visitorId: { type: String, required: true, index: true },
}, { timestamps: true });

PropertyViewSchema.index({ propertyId: 1, visitorId: 1 }, { unique: true });

module.exports = mongoose.model('PropertyView', PropertyViewSchema);
