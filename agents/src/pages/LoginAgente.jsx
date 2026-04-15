import React, { useEffect, useRef, useState, useCallback } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { FiEye, FiEyeOff, FiShield, FiArrowLeft } from 'react-icons/fi';

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

  // 2FA login step
  const [twoFactorToken, setTwoFactorToken] = useState(null);
  const [tfaCode, setTfaCode] = useState('');
  const [tfaRecoveryMode, setTfaRecoveryMode] = useState(false);
  const [tfaError, setTfaError] = useState('');
  const [tfaLoading, setTfaLoading] = useState(false);
  const tfaInputRef = useRef(null);

  const mountedRef = useRef(true);

  useEffect(() => () => { mountedRef.current = false; }, []);

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
      const resp = await authService.login(username, password);

      // 2FA required — show TOTP verification step
      if (resp.requiresTwoFactor) {
        setTwoFactorToken(resp.twoFactorToken);
        setTfaCode('');
        setTfaError('');
        setTfaRecoveryMode(false);
        setLoginStatus('idle');
        setLoading(false);
        setTimeout(() => tfaInputRef.current?.focus(), 100);
        return;
      }

      if (!resp?.token) throw new Error('invalid credentials');
      setLoginStatus('success');
      setShowLoginOverlay(true);
      await new Promise((resolve) => { setTimeout(resolve, 2500); });
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

  const handle2FAVerify = useCallback(async (e) => {
    e && e.preventDefault();
    if (tfaLoading) return;
    setTfaError('');
    setTfaLoading(true);
    try {
      let resp;
      if (tfaRecoveryMode) {
        resp = await authService.useRecoveryCode(twoFactorToken, tfaCode);
      } else {
        resp = await authService.verify2FALogin(twoFactorToken, tfaCode);
      }
      const token = resp?.token;
      if (!token) throw new Error('Verificación fallida');
      setLoginStatus('success');
      setShowLoginOverlay(true);
      await new Promise((resolve) => { setTimeout(resolve, 2500); });
      setTwoFactorToken(null);
      navigate(from, { replace: true });
    } catch (err) {
      if (!mountedRef.current) return;
      const raw = err?.message || 'Código inválido';
      const normalized = String(raw).toLowerCase();
      let message;
      if (normalized.includes('expired') || normalized.includes('expirad')) {
        message = 'Sesión expirada. Por favor, ingresá de nuevo.';
        setTwoFactorToken(null);
      } else if (normalized.includes('locked') || normalized.includes('bloqueada') || normalized.includes('too many')) {
        message = raw;
      } else {
        message = tfaRecoveryMode ? 'Código de recuperación inválido.' : 'Código incorrecto. Intentá de nuevo.';
      }
      setTfaError(message);
    } finally {
      if (mountedRef.current) setTfaLoading(false);
    }
  }, [tfaCode, tfaLoading, tfaRecoveryMode, twoFactorToken, from, navigate]);

  const handleBack2FA = () => {
    setTwoFactorToken(null);
    setTfaCode('');
    setTfaError('');
    setTfaRecoveryMode(false);
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
              <h2 className="text-3xl font-extrabold tracking-tight cs-left-title">
                {twoFactorToken ? 'Verificación de seguridad' : 'Bienvenido al CRM'}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-800">
                {twoFactorToken
                  ? 'Ingresá el código de tu aplicación de autenticación.'
                  : 'Atención, seguimiento y coordinación con clientes en un solo lugar.'}
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
          {/* ── 2FA Verification Step ── */}
          {twoFactorToken ? (
            <form
              onSubmit={handle2FAVerify}
              className={`cs-login-card ${tfaError ? 'cs-shake' : ''}`}
              autoComplete="off"
            >
              <div className="flex items-center gap-3 cs-fade-up" style={{ animationDelay: '60ms' }}>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-sky-50">
                  <FiShield size={24} className="text-sky-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {tfaRecoveryMode ? 'Código de recuperación' : 'Verificación 2FA'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    {tfaRecoveryMode
                      ? 'Ingresá uno de tus códigos de recuperación.'
                      : 'Ingresá el código de 6 dígitos de tu app.'}
                  </p>
                </div>
              </div>

              <div className="mt-6 cs-fade-up" style={{ animationDelay: '120ms' }}>
                <input
                  ref={tfaInputRef}
                  type="text"
                  inputMode={tfaRecoveryMode ? 'text' : 'numeric'}
                  maxLength={tfaRecoveryMode ? 10 : 6}
                  value={tfaCode}
                  onChange={(e) => {
                    setTfaCode(e.target.value);
                    if (tfaError) setTfaError('');
                  }}
                  className={`w-full px-4 py-3 rounded-xl border text-center text-2xl font-mono tracking-[0.3em] text-gray-900 focus:outline-none focus:ring-2 ${
                    tfaError ? 'border-red-300 focus:ring-red-400' : 'border-gray-200 focus:ring-sky-500'
                  }`}
                  placeholder={tfaRecoveryMode ? 'XXXX-XXXX' : '000000'}
                  autoFocus
                  required
                />
              </div>

              <div className="mt-4">
                <div className={`cs-login-alert ${tfaError ? 'cs-alert-in' : ''}`} aria-live="polite">
                  {tfaError}
                </div>
              </div>

              <button
                type="submit"
                disabled={tfaLoading || !tfaCode}
                className={`mt-4 w-full rounded-xl text-white font-semibold py-3 transition-all cs-login-btn ${tfaLoading ? 'opacity-80' : ''}`}
                aria-busy={tfaLoading}
              >
                <span className="flex items-center justify-center gap-2">
                  {tfaLoading && <span className="cs-spinner" />}
                  {tfaLoading ? 'Verificando...' : 'Verificar'}
                </span>
              </button>

              <div className="mt-4 flex items-center justify-between cs-fade-up" style={{ animationDelay: '180ms' }}>
                <button
                  type="button"
                  onClick={handleBack2FA}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  <FiArrowLeft size={14} /> Volver
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTfaRecoveryMode((v) => !v);
                    setTfaCode('');
                    setTfaError('');
                    setTimeout(() => tfaInputRef.current?.focus(), 50);
                  }}
                  className="text-sm font-medium text-sky-600 hover:text-sky-700"
                >
                  {tfaRecoveryMode ? 'Usar código TOTP' : 'Usar código de recuperación'}
                </button>
              </div>
            </form>
          ) : (
          /* ── Normal Login Form ── */
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
                <label htmlFor="field-69" className="block text-sm font-semibold text-gray-800 mb-2">Usuario</label>
                <input
                  id="field-69"
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
                <label htmlFor="field-70" className="block text-sm font-semibold text-gray-800 mb-2">Contraseña</label>
                <div className="relative">
                  <input
                    id="field-70"
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
          )}
        </div>
      </div>
    </div>

  );
};

export default LoginAgente;
