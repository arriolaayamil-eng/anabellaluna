import React, { useEffect, useState, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FiEye, FiEyeOff, FiShield, FiArrowLeft } from 'react-icons/fi';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { Navbar, Footer, Sidebar, ThemeSettings, OnboardingTutorial } from './components';
import { Ecommerce, Orders, Calendar, Employees, Stacked, Pyramid, Customers, Kanban, Line, Area, Bar, Pie, Financial, ColorPicker, ColorMapping, Editor, DashboardEjecutivo, Propiedades, ClientesCRM, Agentes, Citas, Ventas, Documentos, Plantillas, Reportes, Integraciones, Configuracion, Workflows, Automatizacion, RolesPermisos, Campanas, EmailMarketing, AnalyticsMarketing, MiPerfil, Recompensas, Mensajeria, EditorImagenes, Tasaciones } from './pages';
import Seguridad from './pages/Seguridad';
import MarketingAI from './pages/MarketingAI';
import AIProviders from './pages/AIProviders';
import InstallPrompt from './components/pwa/InstallPrompt';
import NotificationPrompt from './components/pwa/NotificationPrompt';
import './App.css';
import { authService } from './services/authService';
import { useStateContext } from './contexts/ContextProvider';

const App = () => {
  const { setCurrentColor, setCurrentMode, currentMode, themeSettings } = useStateContext();

  const [authToken, setAuthToken] = useState(() => localStorage.getItem('authToken'));
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
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

  useEffect(() => {
    // Prefer backend-persisted theme; fall back to localStorage
    const user = authService.getCurrentUser();
    const backendMode = user?.themeMode;
    const backendColor = user?.colorMode;
    const localMode = localStorage.getItem('themeMode');
    const localColor = localStorage.getItem('colorMode');
    const mode = backendMode || localMode;
    const color = backendColor || localColor;
    if (mode) { setCurrentMode(mode); localStorage.setItem('themeMode', mode); }
    if (color) { setCurrentColor(color); localStorage.setItem('colorMode', color); }
  }, [setCurrentColor, setCurrentMode]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    setLoginStatus('loading');
    try {
      const resp = await authService.login(loginForm.username, loginForm.password);

      // 2FA required — show TOTP verification step
      if (resp.requiresTwoFactor) {
        setTwoFactorToken(resp.twoFactorToken);
        setTfaCode('');
        setTfaError('');
        setTfaRecoveryMode(false);
        setLoginStatus('idle');
        setLoggingIn(false);
        setTimeout(() => tfaInputRef.current?.focus(), 100);
        return;
      }

      const token = resp?.token;
      if (!token) throw new Error('invalid credentials');
      setLoginStatus('success');
      setShowLoginOverlay(true);
      await new Promise((resolve) => { setTimeout(resolve, 2500); });
      setAuthToken(token);
    } catch (err) {
      const raw = err?.message || 'Error al iniciar sesión';
      const normalized = String(raw).toLowerCase();
      const message = normalized.includes('invalid') || normalized.includes('credential') || normalized.includes('unauthorized')
        ? 'Usuario o contraseña incorrectos.'
        : raw;
      setLoginError(message);
      setLoginStatus('error');
      setShowLoginOverlay(false);
      setTimeout(() => setLoginStatus('idle'), 700);
    } finally {
      setLoggingIn(false);
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
      setAuthToken(token);
      setTwoFactorToken(null);
    } catch (err) {
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
      setTfaLoading(false);
    }
  }, [tfaCode, tfaLoading, tfaRecoveryMode, twoFactorToken]);

  const handleBack2FA = () => {
    setTwoFactorToken(null);
    setTfaCode('');
    setTfaError('');
    setTfaRecoveryMode(false);
  };

  if (!authToken) {
    return (
      <div className={currentMode === 'Dark' ? 'dark' : ''}>
        <div className="min-h-screen flex items-center justify-center bg-main-bg dark:bg-main-dark-bg p-4 al-login-bg">
          {showLoginOverlay && (
            <div className="al-login-overlay" role="status" aria-live="polite" aria-label="Ingresando al ERP">
              <div className={`al-login-overlay-card ${currentMode === 'Dark' ? 'dark' : ''}`}>
                <div className="al-wheel" />
                <div className={`mt-4 text-sm font-semibold ${currentMode === 'Dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                  Ingresando al ERP...
                </div>
                <div className={`mt-1 text-xs ${currentMode === 'Dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Preparando tu panel
                </div>
              </div>
            </div>
          )}
          <div className={`w-full max-w-5xl grid md:grid-cols-2 overflow-hidden rounded-3xl border ${currentMode === 'Dark' ? 'border-gray-700/50' : 'border-gray-200'} shadow-2xl`}>
            <div className="hidden md:flex flex-col justify-between p-10 al-login-left">
              <div className="al-fade-up" style={{ animationDelay: '80ms' }}>
                <img
                  src={currentMode === 'Dark' ? '/anabella-logo-white.svg' : '/anabella-logo.svg'}
                  alt="Anabella Luna"
                  className="h-10 w-auto al-login-logo"
                />
              </div>
              <div className="al-fade-up" style={{ animationDelay: '160ms' }}>
                <div className={`al-left-copy ${currentMode === 'Dark' ? 'text-white' : 'text-gray-900'}`}>
                  <h2 className="text-3xl font-extrabold tracking-tight al-left-title">
                    {twoFactorToken ? 'Verificación de seguridad' : 'Bienvenido al ERP'}
                  </h2>
                  <p className={`mt-2 text-sm leading-relaxed ${currentMode === 'Dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                    {twoFactorToken
                      ? 'Ingresá el código de tu aplicación de autenticación.'
                      : 'Gestión ejecutiva, finanzas y rendimiento del equipo.'}
                  </p>
                </div>
              </div>
              <div className="al-fade-up" style={{ animationDelay: '240ms' }}>
                <div className={`inline-flex items-center gap-2 text-xs px-3 py-2 rounded-xl ${currentMode === 'Dark' ? 'bg-black/25 text-gray-100 border border-white/10' : 'bg-white/65 text-gray-900 border border-black/5'}`}>
                  <span className="al-dot" />
                  Acceso seguro para administradores
                </div>
              </div>
            </div>

            <div className={`p-6 sm:p-8 md:p-10 ${currentMode === 'Dark' ? 'bg-secondary-dark-bg' : 'bg-white'}`}>
              {/* ── 2FA Verification Step ── */}
              {twoFactorToken ? (
                <form
                  onSubmit={handle2FAVerify}
                  className={`al-login-card ${tfaError ? 'al-shake' : ''}`}
                  autoComplete="off"
                >
                  <div className="flex items-center gap-3 al-fade-up" style={{ animationDelay: '60ms' }}>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${currentMode === 'Dark' ? 'bg-indigo-500/20' : 'bg-indigo-50'}`}>
                      <FiShield size={24} className="text-indigo-500" />
                    </div>
                    <div>
                      <h1 className={`text-xl font-bold ${currentMode === 'Dark' ? 'text-white' : 'text-gray-900'}`}>
                        {tfaRecoveryMode ? 'Código de recuperación' : 'Verificación 2FA'}
                      </h1>
                      <p className={`text-sm ${currentMode === 'Dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        {tfaRecoveryMode
                          ? 'Ingresá uno de tus códigos de recuperación.'
                          : 'Ingresá el código de 6 dígitos de tu app.'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 al-fade-up" style={{ animationDelay: '120ms' }}>
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
                      className={`w-full px-4 py-3 rounded-xl border text-center text-2xl font-mono tracking-[0.3em] focus:outline-none focus:ring-2 ${
                        tfaError
                          ? 'border-red-300 focus:ring-red-300 dark:border-red-500/40'
                          : 'border-gray-200 focus:ring-indigo-500 dark:border-gray-700/70'
                      } ${currentMode === 'Dark' ? 'bg-gray-900/40 text-gray-100' : 'bg-white text-gray-900'}`}
                      placeholder={tfaRecoveryMode ? 'XXXX-XXXX' : '000000'}
                      autoFocus
                      required
                    />
                  </div>

                  <div className="mt-4">
                    <div className={`al-login-alert ${tfaError ? 'al-alert-in' : ''}`} aria-live="polite">
                      {tfaError}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={tfaLoading || !tfaCode}
                    className={`mt-4 w-full px-4 py-3 rounded-xl font-semibold text-white al-login-btn ${tfaLoading ? 'opacity-80' : ''}`}
                    aria-busy={tfaLoading}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {tfaLoading && <span className="al-spinner" />}
                      {tfaLoading ? 'Verificando...' : 'Verificar'}
                    </span>
                  </button>

                  <div className="mt-4 flex items-center justify-between al-fade-up" style={{ animationDelay: '180ms' }}>
                    <button
                      type="button"
                      onClick={handleBack2FA}
                      className={`flex items-center gap-1 text-sm ${currentMode === 'Dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
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
                      className={`text-sm font-medium ${currentMode === 'Dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'}`}
                    >
                      {tfaRecoveryMode ? 'Usar código TOTP' : 'Usar código de recuperación'}
                    </button>
                  </div>
                </form>
              ) : (
              /* ── Normal Login Form ── */
              <form
                onSubmit={handleLogin}
                className={`al-login-card ${loginStatus === 'error' ? 'al-shake' : ''} ${loginStatus === 'success' ? 'al-success' : ''}`}
                autoComplete="off"
              >
                <div className="md:hidden al-fade-up" style={{ animationDelay: '80ms' }}>
                  <img
                    src={currentMode === 'Dark' ? '/anabella-logo-white.svg' : '/anabella-logo.svg'}
                    alt="Anabella Luna"
                    className="h-10 w-auto mb-6 al-login-logo"
                  />
                </div>

                <div className="al-fade-up" style={{ animationDelay: '120ms' }}>
                  <h1 className={`text-2xl font-bold ${currentMode === 'Dark' ? 'text-white' : 'text-gray-900'}`}>Iniciar sesión</h1>
                  <p className={`mt-1 text-sm ${currentMode === 'Dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    Ingresá con tus credenciales de administrador.
                  </p>
                </div>

                <div className="mt-7 space-y-4 al-fade-up" style={{ animationDelay: '180ms' }}>
                  <label htmlFor="login-username" className={`block text-sm font-medium mb-2 ${currentMode === 'Dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                    <span className="block mb-2">Usuario</span>
                    <input
                      id="login-username"
                      type="text"
                      value={loginForm.username}
                      onChange={(e) => {
                        setLoginForm((prev) => ({ ...prev, username: e.target.value }));
                        if (loginError) setLoginError('');
                      }}
                      className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 ${
                        loginStatus === 'error'
                          ? 'border-red-300 ring-red-200 focus:ring-red-300 dark:border-red-500/40 dark:ring-red-500/20'
                          : 'border-gray-200 focus:ring-indigo-500 dark:border-gray-700/70 dark:focus:ring-indigo-500'
                      } ${currentMode === 'Dark' ? 'bg-gray-900/40 text-gray-100 placeholder:text-gray-500' : 'bg-white text-gray-900 placeholder:text-gray-400'}`}
                      placeholder="admin"
                      required
                    />
                  </label>

                  <label htmlFor="login-password" className={`block text-sm font-medium ${currentMode === 'Dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                    <span className="block mb-2">Contraseña</span>
                    <div className="relative">
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        value={loginForm.password}
                        onChange={(e) => {
                          setLoginForm((prev) => ({ ...prev, password: e.target.value }));
                          if (loginError) setLoginError('');
                        }}
                        className={`w-full px-4 py-2.5 pr-12 rounded-xl border focus:outline-none focus:ring-2 ${
                          loginStatus === 'error'
                            ? 'border-red-300 ring-red-200 focus:ring-red-300 dark:border-red-500/40 dark:ring-red-500/20'
                            : 'border-gray-200 focus:ring-indigo-500 dark:border-gray-700/70 dark:focus:ring-indigo-500'
                        } ${currentMode === 'Dark' ? 'bg-gray-900/40 text-gray-100 placeholder:text-gray-500' : 'bg-white text-gray-900 placeholder:text-gray-400'}`}
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        disabled={loggingIn}
                        className={`al-pw-toggle text-black hover:bg-black/5 ${loggingIn ? 'opacity-60 cursor-not-allowed' : ''}`}
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      >
                        <span key={showPassword ? 'show' : 'hide'} className="al-icon-swap">
                          {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                        </span>
                      </button>
                    </div>
                  </label>
                </div>

                <div className="mt-5">
                  <div className={`al-login-alert ${loginError ? 'al-alert-in' : ''}`} aria-live="polite">
                    {loginError}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loggingIn}
                  className={`mt-5 w-full px-4 py-3 rounded-xl font-semibold text-white al-login-btn ${loggingIn ? 'opacity-80' : ''}`}
                  aria-busy={loggingIn}
                >
                  <span className="flex items-center justify-center gap-2">
                    {loggingIn && <span className="al-spinner" />}
                    {loginStatus === 'success' && '¡Bienvenido!'}
                    {loginStatus !== 'success' && (loggingIn ? 'Ingresando...' : 'Ingresar')}
                  </span>
                </button>

                <div className={`mt-6 text-xs ${currentMode === 'Dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                  © {new Date().getFullYear()} Anabella Luna · ERP
                </div>
              </form>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={currentMode === 'Dark' ? 'dark' : ''}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="flex relative dark:bg-main-dark-bg">
          <Sidebar />
          <div
            className="bg-main-bg dark:bg-main-dark-bg min-h-screen w-full transition-all duration-300 ease-in-out"
          >
            <div className="bg-main-bg dark:bg-main-dark-bg navbar w-full">
              <Navbar />
            </div>
            <InstallPrompt />
            <NotificationPrompt />
            <div className="pt-16 md:pt-0 pb-20 md:pb-0">
              {themeSettings && (<ThemeSettings />)}

              <Routes>
                {/* dashboard  */}
                <Route path="/" element={(<DashboardEjecutivo />)} />
                <Route path="/ecommerce" element={(<Ecommerce />)} />

                {/* CRM Inmobiliario - 8 Módulos Principales */}
                <Route path="/propiedades" element={<Propiedades />} />
                <Route path="/clientes" element={<ClientesCRM />} />
                <Route path="/agentes" element={<Agentes />} />
                <Route path="/operaciones" element={<Ventas />} />
                <Route path="/citas" element={<Citas />} />
                <Route path="/documentos" element={<Navigate to="/archivos" replace />} />
                <Route path="/archivos" element={<Documentos />} />
                <Route path="/plantillas" element={<Plantillas />} />
                <Route path="/reportes" element={<Reportes />} />

                {/* Otras páginas */}
                <Route path="/tareas" element={<Navigate to="/citas" replace />} />
                <Route path="/integraciones" element={<Integraciones />} />
                <Route path="/configuracion" element={<Configuracion />} />
                <Route path="/perfil" element={<MiPerfil />} />
                <Route path="/seguridad" element={<Seguridad />} />
                <Route path="/recompensas" element={<Recompensas />} />
                <Route path="/mensajeria" element={<Mensajeria />} />
                <Route path="/tasaciones" element={<Tasaciones />} />

                {/* pages  */}
                <Route path="/orders" element={<Orders />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/customers" element={<Customers />} />

                {/* apps  */}
                <Route path="/kanban" element={<Kanban />} />
                <Route path="/editor" element={<EditorImagenes />} />
                <Route path="/editor-imagenes" element={<EditorImagenes />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/color-picker" element={<ColorPicker />} />

                {/* charts  */}
                <Route path="/line" element={<Line />} />
                <Route path="/area" element={<Area />} />
                <Route path="/bar" element={<Bar />} />
                <Route path="/pie" element={<Pie />} />
                <Route path="/financial" element={<Financial />} />
                <Route path="/color-mapping" element={<ColorMapping />} />
                <Route path="/pyramid" element={<Pyramid />} />
                <Route path="/stacked" element={<Stacked />} />

                {/* Módulos Avanzados - Automatización */}
                <Route path="/workflows" element={<Workflows />} />
                <Route path="/automatizacion" element={<Automatizacion />} />
                <Route path="/reglas-negocio" element={<Workflows />} />

                {/* Módulos Avanzados - Seguridad */}
                <Route path="/autenticacion" element={<RolesPermisos />} />
                <Route path="/roles-permisos" element={<RolesPermisos />} />
                <Route path="/auditoria" element={<RolesPermisos />} />

                {/* Módulos Avanzados - Marketing */}
                <Route path="/campanas" element={<Campanas />} />
                <Route path="/email-marketing" element={<EmailMarketing />} />
                <Route path="/analytics-marketing" element={<AnalyticsMarketing />} />
                <Route path="/marketing-ai" element={<MarketingAI />} />
                <Route path="/ai-providers" element={<AIProviders />} />

                {/* Módulos Avanzados - Atención al Cliente */}
                <Route path="/tickets" element={<Workflows />} />
                <Route path="/chat-soporte" element={<Workflows />} />
                <Route path="/base-conocimiento" element={<Workflows />} />

                {/* Módulos Avanzados - Integraciones */}
                <Route path="/erp-integracion" element={<Integraciones />} />
                <Route path="/contabilidad" element={<Integraciones />} />
                <Route path="/telefonia" element={<Integraciones />} />
                <Route path="/apis-externas" element={<Integraciones />} />
                <Route path="/webhooks" element={<Integraciones />} />

                {/* Módulos Avanzados - Movilidad */}
                <Route path="/app-movil" element={<Workflows />} />
                <Route path="/geolocalizacion" element={<Workflows />} />
                <Route path="/notificaciones-push" element={<Workflows />} />

              </Routes>
            </div>
            <Footer />
          </div>
        </div>
        <OnboardingTutorial />
        <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover theme={currentMode === 'Dark' ? 'dark' : 'light'} />
      </BrowserRouter>
    </div>
  );
};

export default App;
