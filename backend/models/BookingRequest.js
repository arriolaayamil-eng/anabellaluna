const mongoose = require('mongoose');

const BookingItemSchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Propiedad', required: true },
  checkIn: { type: Date },
  checkOut: { type: Date },
  guests: { type: Number },
  notes: { type: String },
  snapshot: { type: Object, default: {} },
}, { _id: true });

const BookingRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'cancelled'], default: 'pending' },
  items: { type: [BookingItemSchema], default: [] },
  contact: {
    fullName: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
  },
}, { timestamps: true });

module.exports = mongoose.model('BookingRequest', BookingRequestSchema);
