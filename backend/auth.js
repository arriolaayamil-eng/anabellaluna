const express = require('express');

const bcrypt = require('bcryptjs');

const jwt = require('jsonwebtoken');

const { OAuth2Client } = require('google-auth-library');

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



// Public config endpoint: expose social login client IDs to the frontend
router.get('/social-config', (req, res) => {
  res.json({
    googleClientId: process.env.GOOGLE_LOGIN_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID || '',
    facebookAppId: process.env.FACEBOOK_APP_ID || '',
  });
});

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


// ─── Social Login (Google / Facebook) ────────────────────────────────────────
router.post('/social-login', async (req, res) => {
  const { provider, token: idToken, accessToken } = req.body || {};
  if (!provider) return res.status(400).json({ error: 'provider is required (google or facebook)' });

  try {
    let socialId = '';
    let email = '';
    let nombre = '';
    let avatar = '';

    // ── Google ──────────────────────────────────────────────────────────────
    if (provider === 'google') {
      if (!idToken) return res.status(400).json({ error: 'token is required for Google login' });
      const clientId = process.env.GOOGLE_LOGIN_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID || '';
      const client = new OAuth2Client(clientId);
      const ticket = await client.verifyIdToken({ idToken, audience: clientId });
      const payload = ticket.getPayload();
      if (!payload || !payload.sub) return res.status(401).json({ error: 'Invalid Google token' });
      socialId = payload.sub;
      email = payload.email || '';
      nombre = payload.name || '';
      avatar = payload.picture || '';

    // ── Facebook ────────────────────────────────────────────────────────────
    } else if (provider === 'facebook') {
      if (!accessToken) return res.status(400).json({ error: 'accessToken is required for Facebook login' });
      const fbRes = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`);
      if (!fbRes.ok) return res.status(401).json({ error: 'Invalid Facebook token' });
      const fbData = await fbRes.json();
      if (!fbData.id) return res.status(401).json({ error: 'Invalid Facebook token' });
      socialId = fbData.id;
      email = fbData.email || '';
      nombre = fbData.name || '';
      avatar = fbData.picture?.data?.url || '';

    } else {
      return res.status(400).json({ error: 'Unsupported provider. Use google or facebook.' });
    }

    // ── Find or create user ────────────────────────────────────────────────
    const providerIdField = provider === 'google' ? 'googleId' : 'facebookId';

    // 1. Try to find by social provider ID
    let user = await User.findOne({ [providerIdField]: socialId }).exec();

    // 2. If not found by social ID, try by email (link accounts)
    if (!user && email) {
      user = await User.findOne({ $or: [{ username: email }, { email }] }).exec();
      if (user) {
        // Link social provider to existing account
        user[providerIdField] = socialId;
        if (!user.avatar && avatar) user.avatar = avatar;
        if (!user.nombre && nombre) user.nombre = nombre;
        await user.save();
      }
    }

    // 3. Create new user if not found
    if (!user) {
      const username = email || `${provider}_${socialId}`;
      user = new User({
        username,
        role: 'user',
        [providerIdField]: socialId,
        nombre,
        email: email || '',
        avatar,
      });
      await user.save();
    }

    const token = signToken(user);
    return res.json({ token });

  } catch (err) {
    console.error(`Social login error (${provider}):`, err);
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



    // ── 2FA check: if enabled, return temp token instead of full session ──
    if (user.twoFactorEnabled) {
      // Lazy-require to avoid circular dependency at module load
      const { signTempToken } = require('./routes/twoFactor');
      const twoFactorToken = signTempToken(user);
      return res.json({
        requiresTwoFactor: true,
        twoFactorToken,
      });
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

        user.themeMode = (agente.metadata && agente.metadata.themeMode) || '';

        user.colorMode = (agente.metadata && agente.metadata.colorMode) || '';

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

        user.themeMode = (userDoc.metadata && userDoc.metadata.themeMode) || '';

        user.colorMode = (userDoc.metadata && userDoc.metadata.colorMode) || '';

      }

    }

    

    return res.json({ user });

  } catch (err) {

    return res.status(401).json({ error: 'invalid token' });

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



// Persist theme preference per user/agent
router.patch('/theme', authenticateToken, async (req, res) => {
  try {
    const { themeMode, colorMode } = req.body || {};
    const update = {};
    if (themeMode !== undefined) update['metadata.themeMode'] = themeMode;
    if (colorMode !== undefined) update['metadata.colorMode'] = colorMode;
    if (!Object.keys(update).length) return res.json({ ok: true });

    if (req.user.agenteId) {
      await Agente.findByIdAndUpdate(req.user.agenteId, { $set: update });
    } else {
      await User.findByIdAndUpdate(req.user.sub, { $set: update });
    }
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Middleware

function authenticateToken(req, res, next) {

  const auth = req.headers.authorization;
  const queryToken = req.query.token;

  if (!auth && !queryToken) return res.status(401).json({ error: 'missing token' });

  let token;
  if (auth) {
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'invalid token format' });
    token = parts[1];
  } else {
    token = queryToken;
  }

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

