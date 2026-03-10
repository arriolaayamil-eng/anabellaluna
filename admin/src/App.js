/* eslint-disable no-promise-executor-return, jsx-a11y/label-has-associated-control, no-nested-ternary */
import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { Navbar, Footer, Sidebar, ThemeSettings, OnboardingTutorial } from './components';
import { Ecommerce, Orders, Calendar, Employees, Stacked, Pyramid, Customers, Kanban, Line, Area, Bar, Pie, Financial, ColorPicker, ColorMapping, Editor, DashboardEjecutivo, Propiedades, ClientesCRM, Agentes, Citas, Ventas, Tareas, Documentos, Reportes, Integraciones, Configuracion, Workflows, Automatizacion, RolesPermisos, Campanas, EmailMarketing, AnalyticsMarketing, MiPerfil, Recompensas, Mensajeria } from './pages';
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

  useEffect(() => {
    const currentThemeColor = localStorage.getItem('colorMode');
    const currentThemeMode = localStorage.getItem('themeMode');
    if (currentThemeColor && currentThemeMode) {
      setCurrentColor(currentThemeColor);
      setCurrentMode(currentThemeMode);
    }
  }, [setCurrentColor, setCurrentMode]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError('');
    setLoginStatus('loading');
    try {
      const resp = await authService.login(loginForm.username, loginForm.password);
      const token = resp?.token;
      if (!token) throw new Error('invalid credentials');
      sessionStorage.removeItem('erp_onboarding_completed');
      setLoginStatus('success');
      setShowLoginOverlay(true);
      await new Promise((resolve) => setTimeout(resolve, 2500));
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
                    Bienvenido al ERP
                  </h2>
                  <p className={`mt-2 text-sm leading-relaxed ${currentMode === 'Dark' ? 'text-gray-100' : 'text-gray-800'}`}>
                    Gestión ejecutiva, finanzas y rendimiento del equipo.
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
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${currentMode === 'Dark' ? 'text-gray-200' : 'text-gray-700'}`}>Usuario</label>
                    <input
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
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${currentMode === 'Dark' ? 'text-gray-200' : 'text-gray-700'}`}>Contraseña</label>
                    <div className="relative">
                      <input
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
                  </div>
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
                    {loginStatus === 'success' ? '¡Bienvenido!' : (loggingIn ? 'Ingresando...' : 'Ingresar')}
                  </span>
                </button>

                <div className={`mt-6 text-xs ${currentMode === 'Dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                  © {new Date().getFullYear()} Anabella Luna · ERP
                </div>
              </form>
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
                <Route path="/documentos" element={<Documentos />} />
                <Route path="/reportes" element={<Reportes />} />

                {/* Otras páginas */}
                <Route path="/tareas" element={<Tareas />} />
                <Route path="/integraciones" element={<Integraciones />} />
                <Route path="/configuracion" element={<Configuracion />} />
                <Route path="/perfil" element={<MiPerfil />} />
                <Route path="/recompensas" element={<Recompensas />} />
                <Route path="/mensajeria" element={<Mensajeria />} />

                {/* pages  */}
                <Route path="/orders" element={<Orders />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/customers" element={<Customers />} />

                {/* apps  */}
                <Route path="/kanban" element={<Kanban />} />
                <Route path="/editor" element={<Editor />} />
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
