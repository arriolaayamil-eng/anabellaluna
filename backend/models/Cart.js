const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Propiedad', required: true },
  checkIn: { type: Date },
  checkOut: { type: Date },
  guests: { type: Number },
  notes: { type: String },
  snapshot: { type: Object, default: {} },
}, { _id: true });

const CartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true, index: true, required: true },
  items: { type: [CartItemSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('Cart', CartSchema);
