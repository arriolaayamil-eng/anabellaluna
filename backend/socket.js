/**
 * Socket.IO setup — autenticación JWT + salas por user/agent/admin.
 * Si Redis está disponible: usa @socket.io/redis-adapter para escala horizontal.
 * Si no: in-memory adapter (un solo proceso PM2).
 */

const jwt = require('jsonwebtoken');
let _io = null;

async function initSocket(server) {
  const { Server } = require('socket.io');

  const ioOptions = {
    cors: {
      origin: true,
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  };

  // Intentar Redis adapter si está disponible
  const redis = require('./redis');
  if (redis.isAvailable()) {
    try {
      const { createAdapter } = require('@socket.io/redis-adapter');
      const pubClient = redis.createDuplicate();
      const subClient = redis.createDuplicate();
      await Promise.all([pubClient.connect(), subClient.connect()]);
      ioOptions.adapter = createAdapter(pubClient, subClient);
      console.log('[Socket.IO] Redis adapter enabled — horizontal scaling ready.');
    } catch (err) {
      console.warn('[Socket.IO] Redis adapter failed, using in-memory:', err.message);
    }
  } else {
    console.log('[Socket.IO] Using in-memory adapter (single process).');
  }

  _io = new Server(server, ioOptions);

  // ── Middleware de autenticación JWT ────────────────────────────────────────
  _io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers?.authorization || '').replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  // ── Connection handler ─────────────────────────────────────────────────────
  _io.on('connection', (socket) => {
    const userId = String(socket.user.sub || socket.user.id || socket.user._id || '');
    const role = socket.user.role || 'unknown';
    const agenteId = socket.user.agenteId || '';

    // Unir a salas
    if (userId) socket.join(`user:${userId}`);
    if (agenteId) socket.join(`agent:${agenteId}`);
    if (role === 'admin') socket.join('admin');

    console.log(`[Socket.IO] Connected: ${userId} (${role}) — socket ${socket.id}`);

    // ── Tool approval ──────────────────────────────────────────────────────
    socket.on('ai:approve_tool', async ({ executionId }) => {
      try {
        const { executeApprovedTool } = require('./services/ai/toolExecutor');
        const result = await executeApprovedTool(executionId, userId);
        socket.emit('ai:tool_result', { executionId, result, success: true });
        // Notificar la sala completa del usuario (múltiples tabs)
        _io.to(`user:${userId}`).emit('ai:execution_completed', { executionId, success: true });
      } catch (err) {
        socket.emit('ai:tool_result', { executionId, error: err.message, success: false });
      }
    });

    socket.on('ai:reject_tool', async ({ executionId, reason }) => {
      try {
        const { rejectTool } = require('./services/ai/toolExecutor');
        await rejectTool(executionId, userId, reason || 'Rechazado por el usuario');
        socket.emit('ai:tool_rejected', { executionId });
      } catch (err) {
        socket.emit('ai:tool_error', { executionId, error: err.message });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] Disconnected: ${userId} (${reason})`);
    });

    socket.on('error', (err) => {
      console.error(`[Socket.IO] Socket error for ${userId}:`, err.message);
    });
  });

  console.log('[Socket.IO] Server initialized.');
  return _io;
}

function getIO() {
  if (!_io) {
    console.warn('[Socket.IO] getIO() called before initSocket()');
  }
  return _io;
}

/**
 * Emite un evento a todos los sockets de un usuario específico.
 */
function emitToUser(userId, event, data) {
  if (!_io) return;
  _io.to(`user:${userId}`).emit(event, data);
}

/**
 * Emite un evento a todos los admins conectados.
 */
function emitToAdmin(event, data) {
  if (!_io) return;
  _io.to('admin').emit(event, data);
}

module.exports = { initSocket, getIO, emitToUser, emitToAdmin };
