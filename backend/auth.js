const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const User = require('./models/User');
const Agente = require('./models/Agente');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'please-change-this-secret';

function signToken(user) {
  return jwt.sign(
    { sub: user._id, username: user.username, role: user.role, agenteId: user.agenteId },
    JWT_SECRET,
    { expiresIn: '8h' }
  );
}

async function protectRegister(req, res, next) {
  try {
    const count = await User.countDocuments({}).exec();
    if (count === 0) return next();

    return authenticateToken(req, res, () => {
      const role = (req.user && req.user.role) || 'agent';
      if (role !== 'admin') return res.status(403).json({ error: 'forbidden - admin required' });
      return next();
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

router.post('/public-register', async (req, res) => {
  const { username, password, nombre } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  if (typeof password === 'string' && password.length < 6) return res.status(400).json({ error: 'password too short (min 6 chars)' });
  try {
    const existing = await User.findOne({ username }).exec();
    if (existing) return res.status(409).json({ error: 'username already exists' });
    const hash = await bcrypt.hash(password, 10);
    const user = new User({ 
      username, 
      password_hash: hash, 
      role: 'user',
      nombre: nombre || '',
      email: username, // Use username (email) as default email
    });
    await user.save();
    const token = signToken(user);
    return res.json({ token });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/register', protectRegister, async (req, res) => {
  const { username, password, role } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  if (typeof password === 'string' && password.length < 6) return res.status(400).json({ error: 'password too short (min 6 chars)' });
  try {
    const existing = await User.findOne({ username }).exec();
    if (existing) return res.status(409).json({ error: 'username already exists' });
    const hash = await bcrypt.hash(password, 10);
    const user = new User({ username, password_hash: hash, role: role || 'agent' });
    await user.save();
    res.json({ id: user._id, username: user.username });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  try {
    const user = await User.findOne({ username }).exec();
    if (!user) return res.status(401).json({ error: 'invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'invalid credentials' });

    // For agents without agenteId, try to find and link the Agente by email/username
    if (user.role === 'agent' && !user.agenteId) {
      const agente = await Agente.findOne({
        $or: [
          { email: username },
          { email: user.email },
          { nombre: username },
        ],
      }).exec();
      if (agente) {
        user.agenteId = agente._id;
        await user.save();
      }
    }

    const token = signToken(user);
    res.json({ token });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Get current user with full profile data
router.get('/me', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'missing token' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'invalid token format' });
  const token = parts[1];
  
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    
    // Build user object with JWT payload
    const user = {
      sub: payload.sub,
      username: payload.username,
      role: payload.role,
      agenteId: payload.agenteId,
    };
    
    // If user is an agent, fetch full Agente data
    if (payload.agenteId) {
      const agente = await Agente.findById(payload.agenteId).lean();
      if (agente) {
        user.nombre = agente.nombre || '';
        user.email = agente.email || '';
        user.telefono = agente.telefono || '';
        user.cargo = agente.cargo || 'Agente Inmobiliario';
        user.bio = agente.bio || '';
        user.direccion = agente.direccion || '';
        user.especialidad = agente.especialidad || '';
        user.avatar = agente.avatar || '';
        user.redesSociales = agente.redesSociales || {};
      }
    } else {
      // For public users (role: 'user') and admins, fetch User document directly
      const userDoc = await User.findById(payload.sub).lean();
      if (userDoc) {
        user.nombre = userDoc.nombre || '';
        user.email = userDoc.email || userDoc.username || '';
        user.telefono = userDoc.telefono || '';
        user.avatar = userDoc.avatar || '';
        user.direccion = userDoc.direccion || '';
        user.bio = userDoc.bio || '';
        user.cargo = userDoc.cargo || '';
        user.empresa = userDoc.empresa || '';
      }
    }
    
    return res.json({ user });
  } catch (err) {
    return res.status(401).json({ error: 'invalid token' });
  }
});

// Change own password (authenticated user)
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'currentPassword and newPassword required' });
    if (typeof newPassword === 'string' && newPassword.length < 6) return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });

    const user = await User.findById(req.user.sub);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const ok = await bcrypt.compare(currentPassword, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'La contraseña actual es incorrecta' });

    user.password_hash = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Update current user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.sub;
    const { nombre, email, telefono, avatar, direccion, bio, cargo, empresa } = req.body || {};
    
    const updateData = {};
    if (nombre !== undefined) updateData.nombre = nombre;
    if (email !== undefined) updateData.email = email;
    if (telefono !== undefined) updateData.telefono = telefono;
    if (avatar !== undefined) updateData.avatar = avatar;
    if (direccion !== undefined) updateData.direccion = direccion;
    if (bio !== undefined) updateData.bio = bio;
    if (cargo !== undefined) updateData.cargo = cargo;
    if (empresa !== undefined) updateData.empresa = empresa;
    
    const updated = await User.findByIdAndUpdate(userId, updateData, { new: true }).lean();
    if (!updated) return res.status(404).json({ error: 'User not found' });
    
    return res.json({
      sub: updated._id,
      username: updated.username,
      role: updated.role,
      nombre: updated.nombre || '',
      email: updated.email || updated.username || '',
      telefono: updated.telefono || '',
      avatar: updated.avatar || '',
      direccion: updated.direccion || '',
      bio: updated.bio || '',
      cargo: updated.cargo || '',
      empresa: updated.empresa || '',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Middleware
function authenticateToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'missing token' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'invalid token format' });
  const token = parts[1];
  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.status(401).json({ error: 'invalid token' });
    const normalized = { ...(payload || {}) };
    normalized.role = normalized.role || 'agent';
    if (normalized.sub) {
      normalized.sub = String(normalized.sub);
      if (!normalized.id) normalized.id = normalized.sub;
      if (!normalized._id) normalized._id = normalized.sub;
    }
    if (normalized.agenteId) normalized.agenteId = String(normalized.agenteId);
    req.user = normalized;
    next();
  });
}

// Role-based middleware: require a specific role (or admin)
function requireRole(role) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'missing token' });
    const userRole = req.user.role || 'agent';
    if (userRole === role || userRole === 'admin') return next();
    return res.status(403).json({ error: 'forbidden - insufficient role' });
  };
}

function getUserId(req) {
  const u = req.user || {};
  const id = u.sub || u.id || u._id;
  return id ? String(id) : null;
}

function agentScopeId(req) {
  if (req.user && req.user.role === 'admin') return null;
  return req.user && req.user.agenteId ? String(req.user.agenteId) : null;
}

function requireCRMUser(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'missing token' });
  const role = req.user.role || 'agent';
  if (role === 'admin') return next();
  if (role !== 'agent') return res.status(403).json({ error: 'forbidden' });
  if (!req.user.agenteId) return res.status(403).json({ error: 'agenteId required' });
  return next();
}

module.exports = {
  router,
  authenticateToken,
  requireRole,
  getUserId,
  agentScopeId,
  requireCRMUser,
};
