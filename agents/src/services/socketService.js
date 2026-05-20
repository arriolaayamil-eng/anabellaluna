import { api } from '../config/api';

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
      Object.entries(_handlers).forEach(([event, handlers]) => {
        handlers.forEach((h) => _socket.on(event, h));
      });
    });

    _socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    return _socket;
  } catch (err) {
    console.warn('[Socket] Not available:', err.message);
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
  if (_socket && _socket.connected) _socket.emit(event, data);
}

function disconnect() {
  if (_socket) { _socket.disconnect(); _socket = null; _handlers = {}; }
}

function isConnected() {
  return !!((_socket && _socket.connected));
}

export const socketService = { connect, on, off, emit, disconnect, isConnected };
export default socketService;
