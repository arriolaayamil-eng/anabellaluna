/**
 * Socket.IO client service — singleton con degradación elegante.
 * Si socket.io-client no está instalado o el servidor no está disponible,
 * no rompe la app.
 */

const API_BASE = process.env.REACT_APP_API_URL
  || (typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? 'https://api.anabellaluna.com.ar'
    : 'http://localhost:4000');

let _socket   = null;
let _handlers = {};

function getToken() {
  const raw = localStorage.getItem('authToken');
  if (!raw) return null;
  return String(raw).trim().replace(/^"|"$/g, '').replace(/^Bearer\s+/i, '');
}

async function connect() {
  if (_socket && _socket.connected) return _socket;

  try {
    const { io } = await import('socket.io-client');
    const token  = getToken();
    if (!token) return null;

    _socket = io(API_BASE, {
      auth:              { token },
      transports:        ['websocket', 'polling'],
      reconnectionDelay: 2000,
      reconnectionAttempts: 5,
    });

    _socket.on('connect', () => {
      console.log('[Socket] Connected:', _socket.id);
    });

    _socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    _socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    // Re-attach all registered handlers after reconnect
    _socket.on('connect', () => {
      Object.entries(_handlers).forEach(([event, handlers]) => {
        handlers.forEach((handler) => _socket.on(event, handler));
      });
    });

    return _socket;
  } catch (err) {
    console.warn('[Socket] socket.io-client not available or failed:', err.message);
    return null;
  }
}

function on(event, handler) {
  if (!_handlers[event]) _handlers[event] = [];
  _handlers[event].push(handler);
  if (_socket) _socket.on(event, handler);
}

function off(event, handler) {
  if (_handlers[event]) {
    _handlers[event] = _handlers[event].filter((h) => h !== handler);
  }
  if (_socket) _socket.off(event, handler);
}

function emit(event, data) {
  if (_socket && _socket.connected) {
    _socket.emit(event, data);
  }
}

function disconnect() {
  if (_socket) {
    _socket.disconnect();
    _socket   = null;
    _handlers = {};
  }
}

function isConnected() {
  return !!((_socket && _socket.connected));
}

export const socketService = { connect, on, off, emit, disconnect, isConnected };
export default socketService;
