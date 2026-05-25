/**
 * MongoDB connection for MCP Server.
 * Reuses the same models from the backend.
 */

const mongoose = require('mongoose');
const path = require('path');

// Resolve models from backend
const BACKEND_PATH = path.resolve(__dirname, '../../backend');

function getModel(name) {
  return require(path.join(BACKEND_PATH, 'models', name));
}

async function connect() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/anabella';
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(uri);
  console.error('[MCP] Connected to MongoDB');
}

async function disconnect() {
  await mongoose.disconnect();
}

module.exports = { connect, disconnect, getModel };
