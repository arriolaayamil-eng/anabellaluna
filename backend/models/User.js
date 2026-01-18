const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password_hash: String,
  role: { type: String, default: 'agent' },
  agenteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Agente' },
  // Profile fields for public users (role: 'user') and admins
  nombre: { type: String, default: '' },
  email: { type: String, default: '' },
  telefono: { type: String, default: '' },
  avatar: { type: String, default: '' },
  direccion: { type: String, default: '' },
  bio: { type: String, default: '' },
  cargo: { type: String, default: '' },
  empresa: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
