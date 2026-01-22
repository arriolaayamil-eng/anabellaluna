const mongoose = require('mongoose');

const WishlistItemSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Propiedad', index: true, required: true },
  snapshot: { type: Object, default: {} },
}, { timestamps: true });

WishlistItemSchema.index({ userId: 1, propertyId: 1 }, { unique: true });

module.exports = mongoose.model('WishlistItem', WishlistItemSchema);
