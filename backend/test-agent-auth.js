require('dotenv').config();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Agente = require('./models/Agente');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/app_inmobiliaria';

async function testAgentAuth() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB\n');

    // Find the agent user (eric)
    const agentUser = await User.findOne({ username: 'eric' }).lean();
    
    if (!agentUser) {
      console.log('❌ Agent user "eric" not found');
      return;
    }
    
    console.log('Agent User Document:');
    console.log('  _id:', agentUser._id.toString());
    console.log('  username:', agentUser.username);
    console.log('  role:', agentUser.role);
    console.log('  agenteId:', agentUser.agenteId ? agentUser.agenteId.toString() : 'NOT SET');
    console.log('');

    // Check if agenteId exists in User
    if (agentUser.agenteId) {
      const agente = await Agente.findById(agentUser.agenteId).lean();
      if (agente) {
        console.log('Linked Agente Document:');
        console.log('  _id:', agente._id.toString());
        console.log('  nombre:', agente.nombre);
        console.log('  email:', agente.email);
        console.log('');
      } else {
        console.log('❌ Agente document not found for agenteId:', agentUser.agenteId.toString());
        console.log('');
      }
    } else {
      console.log('⚠️  User document has NO agenteId field set!');
      console.log('   Searching for Agente by email...');
      const agente = await Agente.findOne({ email: agentUser.username }).lean();
      if (agente) {
        console.log('   Found Agente by email:');
        console.log('     _id:', agente._id.toString());
        console.log('     nombre:', agente.nombre);
        console.log('     email:', agente.email);
        console.log('   ⚠️  This Agente needs to be linked to User via agenteId!');
      } else {
        console.log('   ❌ No Agente found with email:', agentUser.username);
      }
      console.log('');
    }

    // Simulate JWT token creation (what happens on login)
    console.log('JWT Token Payload (signToken):');
    const tokenPayload = {
      sub: agentUser._id,
      username: agentUser.username,
      role: agentUser.role,
      agenteId: agentUser.agenteId
    };
    console.log('  ', JSON.stringify(tokenPayload, null, 2));
    console.log('');

    // Create actual JWT
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '8h' });
    console.log('JWT Token created:', token.substring(0, 50) + '...');
    console.log('');

    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Decoded JWT:');
    console.log('  sub:', decoded.sub);
    console.log('  username:', decoded.username);
    console.log('  role:', decoded.role);
    console.log('  agenteId:', decoded.agenteId || 'NOT IN TOKEN');
    console.log('');

    // Simulate /auth/me endpoint logic
    console.log('Simulating /auth/me response:');
    const meUser = {
      sub: decoded.sub,
      username: decoded.username,
      role: decoded.role,
      agenteId: decoded.agenteId,
    };

    if (decoded.agenteId) {
      const agente = await Agente.findById(decoded.agenteId).lean();
      if (agente) {
        meUser.nombre = agente.nombre || '';
        meUser.email = agente.email || '';
        meUser.telefono = agente.telefono || '';
        meUser.cargo = agente.cargo || 'Agente Inmobiliario';
        meUser.bio = agente.bio || '';
        meUser.direccion = agente.direccion || '';
        meUser.especialidad = agente.especialidad || '';
        meUser.avatar = agente.avatar || '';
        meUser.redesSociales = agente.redesSociales || {};
        console.log('  ✓ Enriched with Agente data');
      }
    }

    console.log('  /auth/me user object:');
    console.log('    ', JSON.stringify(meUser, null, 2));
    console.log('');

    // Simulate what CRM frontend does
    console.log('CRM Frontend currentAgentId derivation:');
    console.log('  const user = JSON.parse(localStorage.getItem("user"))');
    console.log('  currentAgentId = user.agenteId || user._id || null');
    console.log('  ');
    console.log('  With this user object:');
    console.log('    user.agenteId =', meUser.agenteId ? meUser.agenteId.toString() : 'undefined');
    console.log('    user._id =', meUser._id ? meUser._id.toString() : 'undefined');
    console.log('    user.sub =', meUser.sub);
    console.log('  ');
    const currentAgentId = meUser.agenteId || meUser._id || meUser.sub || null;
    console.log('  → currentAgentId would be:', currentAgentId ? currentAgentId.toString() : 'NULL');
    console.log('');

    console.log('✓ Diagnostic complete');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

testAgentAuth();
