import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';

import windowsHdBg from '../data/windows-abstract-hd.svg';
import { authService } from '../services/authService';

const LoginAgente = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState('idle');
  const [showPassword, setShowPassword] = useState(false);
  const [showLoginOverlay, setShowLoginOverlay] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (authService.isAuthenticated()) {
      navigate('/crm', { replace: true });
    }
  }, [navigate]);

  const from = location.state?.from?.pathname || '/crm';

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setLoginStatus('loading');

    try {
      await authService.login(username, password);
      setLoginStatus('success');
      setShowLoginOverlay(true);
      await new Promise((resolve) => setTimeout(resolve, 2500));
      navigate(from, { replace: true });
    } catch (err) {
      if (!mountedRef.current) return;
      const raw = err?.message || 'No se pudo iniciar sesión';
      const normalized = String(raw).toLowerCase();
      const message = normalized.includes('invalid') || normalized.includes('credential') || normalized.includes('unauthorized')
        ? 'Usuario o contraseña incorrectos.'
        : raw;
      setError(message);
      setLoginStatus('error');
      setShowLoginOverlay(false);
      setTimeout(() => { if (mountedRef.current) setLoginStatus('idle'); }, 700);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gray-950 cs-hd-bg"
      style={{
        backgroundImage: `url(${windowsHdBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {showLoginOverlay && (
        <div className="cs-login-overlay" role="status" aria-live="polite" aria-label="Ingresando al CRM">
          <div className="cs-login-overlay-card">
            <div className="cs-wheel" />
            <div className="mt-4 text-sm font-semibold text-gray-900">
              Conectando con Client Service...
            </div>
            <div className="mt-1 text-xs text-gray-600">
              Preparando tu bandeja de trabajo
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-5xl mx-4 grid md:grid-cols-2 overflow-hidden rounded-3xl border border-white/20 shadow-2xl backdrop-blur">
        <div className="hidden md:flex flex-col justify-between p-10 cs-login-left">
          <div className="cs-fade-up" style={{ animationDelay: '60ms' }}>
            <div className="cs-badge">
              Client Service
            </div>
          </div>
          <div className="cs-fade-up" style={{ animationDelay: '140ms' }}>
            <div className="cs-left-copy">
              <h2 className="text-3xl font-extrabold tracking-tight cs-left-title">Bienvenido al CRM</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-800">
                Atención, seguimiento y coordinación con clientes en un solo lugar.
              </p>
            </div>
          </div>
          <div className="cs-fade-up" style={{ animationDelay: '220ms' }}>
            <div className="cs-chip">
              <span className="cs-dot" />
              Acceso para agentes y atención al cliente
            </div>
          </div>
        </div>

        <div className="p-6 sm:p-8 md:p-10 bg-white/95">
          <form
            onSubmit={onSubmit}
            className={`cs-login-card ${loginStatus === 'error' ? 'cs-shake' : ''} ${loginStatus === 'success' ? 'cs-success' : ''}`}
            autoComplete="off"
          >
            <div className="md:hidden cs-fade-up" style={{ animationDelay: '60ms' }}>
              <div className="cs-badge">Client Service</div>
            </div>

            <div className="mt-2 cs-fade-up" style={{ animationDelay: '110ms' }}>
              <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Acceso de Agentes</h1>
              <p className="text-sm text-gray-600 mt-1">Ingresá tus credenciales para entrar al CRM</p>
            </div>

            <div className="mt-7 space-y-4 cs-fade-up" style={{ animationDelay: '170ms' }}>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Usuario</label>
                <input
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (error) setError('');
                  }}
                  className={`w-full rounded-xl border px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 ${
                    loginStatus === 'error' ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-sky-500'
                  }`}
                  placeholder="usuario"
                  autoComplete="username"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Contraseña</label>
                <div className="relative">
                  <input
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    className={`w-full rounded-xl border px-4 py-2.5 pr-12 text-gray-900 focus:outline-none focus:ring-2 ${
                      loginStatus === 'error' ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-sky-500'
                    }`}
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    disabled={loading}
                    className={`cs-pw-toggle text-black hover:bg-black/5 ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    <span key={showPassword ? 'show' : 'hide'} className="cs-icon-swap">
                      {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <div className={`cs-login-alert ${error ? 'cs-alert-in' : ''}`} aria-live="polite">
                {error}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`mt-5 w-full rounded-xl text-white font-semibold py-3 transition-all cs-login-btn ${loading ? 'opacity-80' : ''}`}
              aria-busy={loading}
            >
              <span className="flex items-center justify-center gap-2">
                {loading && <span className="cs-spinner" />}
                {loginStatus === 'success' ? '¡Bienvenido!' : (loading ? 'Conectando...' : 'Ingresar al CRM')}
              </span>
            </button>

            <div className="mt-6 text-xs text-gray-500">
              Si no tenés usuario, pedilo a un administrador.
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginAgente;
