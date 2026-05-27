/**
 * MongoDB connection for MCP Server.
 * Reuses the same models from the backend.
 */

const path = require('path');
const { createRequire } = require('module');

// Resolve models from backend
const BACKEND_PATH = path.resolve(__dirname, '../../backend');
const backendRequire = createRequire(path.join(BACKEND_PATH, 'package.json'));
const backendMongoose = backendRequire('mongoose');

function getModel(name) {
  return require(path.join(BACKEND_PATH, 'models', name));
}

async function connect() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/anabella';
  if (backendMongoose.connection.readyState === 1) return;
  await backendMongoose.connect(uri);
  console.error('[MCP] Connected to MongoDB');
}

async function disconnect() {
  await backendMongoose.disconnect();
}

module.exports = { connect, disconnect, getModel };
