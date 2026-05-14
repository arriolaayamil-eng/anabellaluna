import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { confirmToast } from '../utils/confirmToast';
import { FaGoogle, FaCheck, FaTimes, FaCopy, FaEye, FaEyeSlash, FaSave, FaTrash, FaExternalLinkAlt, FaStar, FaRegStar, FaSync, FaUnlink } from 'react-icons/fa';
import { Header } from '../components';
import { useStateContext } from '../contexts/ContextProvider';

const API_URL = process.env.REACT_APP_API_URL
  || (typeof window !== 'undefined' && !['localhost', '127.0.0.1'].includes(window.location.hostname)
    ? 'https://api.anabellaluna.com.ar'
    : 'http://localhost:4000');
const getAuthToken = () => localStorage.getItem('authToken');

const STARS = [0, 1, 2, 3, 4, 5];
const STAR_LABELS = ['free', 'bronze', 'silver', 'gold', 'gold_special', 'gold_premium'];

const Integraciones = () => {
  const { currentColor, currentMode } = useStateContext();
  const isDark = currentMode === 'Dark';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [showMLSecret, setShowMLSecret] = useState(false);
  const [copied, setCopied] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [mlMessage, setMLMessage] = useState({ type: '', text: '' });
  const [mlSaving, setMLSaving] = useState(false);

  const [googleOAuth, setGoogleOAuth] = useState({
    clientId: '',
    clientSecret: '',
    hasCredentials: false,
    redirectUri: '',
  });

  const [mlConfig, setMLConfig] = useState({
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    webhookUrl: '',
    hasCredentials: false,
    isAuthenticated: false,
    userId: null,
  });

  useEffect(() => {
    loadGoogleOAuthConfig();
    loadMLConfig();
  }, []);

  const loadGoogleOAuthConfig = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/admin/config/google-oauth`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGoogleOAuth({
          clientId: data.clientId || '',
          clientSecret: data.clientSecret || '',
          hasCredentials: data.hasCredentials || false,
          redirectUri: data.redirectUri || '',
        });
      }
    } catch (err) {
      console.error('Error loading Google OAuth config:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveGoogleOAuth = async () => {
    if (!googleOAuth.clientId || !googleOAuth.clientSecret) {
      setMessage({ type: 'error', text: 'Client ID y Client Secret son requeridos' });
      return;
    }
    
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/admin/config/google-oauth`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientId: googleOAuth.clientId,
          clientSecret: googleOAuth.clientSecret,
        }),
      });
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Credenciales guardadas correctamente' });
        setGoogleOAuth(prev => ({ ...prev, hasCredentials: true }));
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Error al guardar' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setSaving(false);
    }
  };

  const deleteGoogleOAuth = async () => {
    if (!(await confirmToast('¿Eliminar las credenciales de Google OAuth? Los agentes no podrán conectar sus calendarios.'))) {
      return;
    }
    
    setSaving(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/admin/config/google-oauth`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        setGoogleOAuth({ clientId: '', clientSecret: '', hasCredentials: false, redirectUri: googleOAuth.redirectUri });
        setMessage({ type: 'success', text: 'Credenciales eliminadas' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al eliminar' });
    } finally {
      setSaving(false);
    }
  };

  const loadMLConfig = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/admin/ml/config`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMLConfig({
          clientId: data.clientId || '',
          clientSecret: data.clientSecret || '',
          redirectUri: data.redirectUri || '',
          webhookUrl: data.webhookUrl || '',
          hasCredentials: data.hasCredentials || false,
          isAuthenticated: data.isAuthenticated || false,
          userId: data.userId || null,
        });
      }
    } catch (err) {
      console.error('Error loading ML config:', err);
    }
  };

  const saveMLConfig = async () => {
    if (!mlConfig.clientId || !mlConfig.redirectUri) {
      setMLMessage({ type: 'error', text: 'Client ID y Redirect URI son requeridos' });
      return;
    }
    if (!mlConfig.hasCredentials && !mlConfig.clientSecret) {
      setMLMessage({ type: 'error', text: 'Client Secret es requerido al configurar por primera vez' });
      return;
    }
    setMLSaving(true);
    setMLMessage({ type: '', text: '' });
    try {
      const token = getAuthToken();
      const body = {
        clientId: mlConfig.clientId,
        redirectUri: mlConfig.redirectUri,
        webhookUrl: mlConfig.webhookUrl,
      };
      // Only send secret if user typed a new one (not the masked placeholder)
      if (mlConfig.clientSecret && mlConfig.clientSecret !== '••••••••') {
        body.clientSecret = mlConfig.clientSecret;
      } else if (!mlConfig.hasCredentials) {
        setMLMessage({ type: 'error', text: 'Client Secret es requerido' });
        setMLSaving(false);
        return;
      } else {
        // Keep existing secret — send a dummy that the backend will ignore
        // We must send something, so re-fetch real and re-save not needed;
        // instead skip update of secret by sending empty and handle server-side.
        // Conservative: require user to re-enter secret when updating.
        setMLMessage({ type: 'error', text: 'Para actualizar las credenciales, ingresá el Client Secret nuevamente' });
        setMLSaving(false);
        return;
      }
      const res = await fetch(`${API_URL}/admin/ml/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setMLMessage({ type: 'success', text: 'Credenciales guardadas correctamente' });
        setMLConfig(prev => ({ ...prev, hasCredentials: true, clientSecret: '••••••••' }));
      } else {
        const data = await res.json();
        setMLMessage({ type: 'error', text: data.error || 'Error al guardar' });
      }
    } catch (err) {
      setMLMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setMLSaving(false);
    }
  };

  const deleteMLConfig = async () => {
    if (!(await confirmToast('¿Eliminar las credenciales de Mercado Libre? Las propiedades dejarán de sincronizarse.'))) return;
    setMLSaving(true);
    try {
      const token = getAuthToken();
      await fetch(`${API_URL}/admin/ml/config`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      setMLConfig({ clientId: '', clientSecret: '', redirectUri: '', webhookUrl: '', hasCredentials: false, isAuthenticated: false, userId: null });
      setMLMessage({ type: 'success', text: 'Credenciales eliminadas' });
    } catch (err) {
      setMLMessage({ type: 'error', text: 'Error al eliminar' });
    } finally {
      setMLSaving(false);
    }
  };

  const connectML = () => {
    window.location.href = `${API_URL}/admin/ml/auth`;
  };

  const disconnectML = async () => {
    if (!(await confirmToast('¿Desconectar la cuenta de Mercado Libre? Las credenciales se conservarán.'))) return;
    setMLSaving(true);
    try {
      const token = getAuthToken();
      await fetch(`${API_URL}/admin/ml/disconnect`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      setMLConfig(prev => ({ ...prev, isAuthenticated: false, userId: null }));
      setMLMessage({ type: 'success', text: 'Desconectado de Mercado Libre' });
    } catch (err) {
      setMLMessage({ type: 'error', text: 'Error al desconectar' });
    } finally {
      setMLSaving(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  if (loading) {
    return (
      <div className={`min-h-screen px-6 lg:px-8 pt-4 pb-6 ${isDark ? 'bg-main-dark-bg' : 'bg-gray-50'}`}>
        <div className="mb-6">
          <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <FaGoogle className="text-blue-500" /> Integraciones
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Configuración de servicios externos</p>
        </div>
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: currentColor }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen px-6 lg:px-8 pt-4 pb-6 ${isDark ? 'bg-main-dark-bg' : 'bg-gray-50'}`}>
      <div className="mb-6">
        <h2 className={`text-lg font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <FaGoogle className="text-blue-500" /> Integraciones
        </h2>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Configuración de servicios externos</p>
      </div>
      
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Google Calendar OAuth Configuration */}
      <div className={`rounded-2xl p-6 border mb-6 ${isDark ? 'bg-secondary-dark-bg border-gray-700/50' : 'bg-white border-gray-100 shadow-md'}`}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
            <FaGoogle className="text-2xl text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold dark:text-gray-200">Google Calendar</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configuración central OAuth para sincronización de calendarios de agentes
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            googleOAuth.hasCredentials 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
          }`}>
            {googleOAuth.hasCredentials ? <><FaCheck className="inline mr-1" /> Configurado</> : <><FaTimes className="inline mr-1" /> No configurado</>}
          </span>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">📋 Instrucciones:</h4>
          <ol className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-decimal list-inside">
            <li>Ir a <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">Google Cloud Console <FaExternalLinkAlt className="inline text-xs" /></a></li>
            <li>Crear o seleccionar un proyecto</li>
            <li>Habilitar la API de Google Calendar</li>
            <li>Crear credenciales OAuth 2.0 (tipo "Web Application")</li>
            <li>Agregar la URI de redirección (abajo) a "Authorized redirect URIs"</li>
            <li>Copiar el Client ID y Client Secret aquí</li>
          </ol>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Redirect URI (copiar a Google Console)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={googleOAuth.redirectUri}
                readOnly
                className="flex-1 px-4 py-2 border rounded-lg bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 text-sm"
              />
              <button
                onClick={() => copyToClipboard(googleOAuth.redirectUri, 'redirect')}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                title="Copiar"
              >
                {copied === 'redirect' ? <FaCheck className="text-green-600" /> : <FaCopy className="dark:text-gray-300" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Client ID *
            </label>
            <input
              type="text"
              value={googleOAuth.clientId}
              onChange={(e) => setGoogleOAuth(prev => ({ ...prev, clientId: e.target.value }))}
              placeholder="xxxxxx.apps.googleusercontent.com"
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Client Secret *
            </label>
            <div className="flex gap-2">
              <input
                type={showSecret ? 'text' : 'password'}
                value={googleOAuth.clientSecret}
                onChange={(e) => setGoogleOAuth(prev => ({ ...prev, clientSecret: e.target.value }))}
                placeholder="GOCSPX-xxxxxx"
                className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
              />
              <button
                onClick={() => setShowSecret(!showSecret)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                title={showSecret ? 'Ocultar' : 'Mostrar'}
              >
                {showSecret ? <FaEyeSlash className="dark:text-gray-300" /> : <FaEye className="dark:text-gray-300" />}
              </button>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={saveGoogleOAuth}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 text-white rounded-lg transition-colors disabled:opacity-50"
              style={{ backgroundColor: currentColor }}
            >
              <FaSave /> {saving ? 'Guardando...' : 'Guardar Credenciales'}
            </button>
            {googleOAuth.hasCredentials && (
              <button
                onClick={deleteGoogleOAuth}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <FaTrash /> Eliminar
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 pt-6 border-t dark:border-gray-700">
          <h4 className="font-semibold dark:text-gray-200 mb-2">💡 ¿Cómo funciona?</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Una vez configuradas las credenciales aquí, los <strong>agentes solo necesitan hacer clic en "Conectar Google Calendar"</strong> desde su panel de Integraciones.
            No necesitan configurar nada más. Sus calendarios personales de Google se sincronizarán automáticamente con las citas del CRM.
          </p>
        </div>
      </div>

      {/* ── Mercado Libre Integration ───────────────────────────────────────── */}
      <div className={`rounded-2xl p-6 border mb-6 ${isDark ? 'bg-secondary-dark-bg border-gray-700/50' : 'bg-white border-gray-100 shadow-md'}`}>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
            <span className="text-2xl">🛒</span>
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold dark:text-gray-200">Mercado Libre</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Publicación automática de propiedades al cambiar el estado a publicado
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            mlConfig.isAuthenticated
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : mlConfig.hasCredentials
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
          }`}>
            {mlConfig.isAuthenticated
              ? (<><FaCheck className="inline mr-1" /> Conectado</>)
              : mlConfig.hasCredentials
                ? (<><FaSync className="inline mr-1" /> Credenciales OK — sin token</>)
                : (<><FaTimes className="inline mr-1" /> No configurado</>)}
          </span>
        </div>

        {mlMessage.text && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            mlMessage.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}>
            {mlMessage.text}
          </div>
        )}

        {/* Credentials form */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Client ID *</label>
            <input
              type="text"
              value={mlConfig.clientId}
              onChange={(e) => setMLConfig(prev => ({ ...prev, clientId: e.target.value }))}
              placeholder="Número de App ID de Mercado Libre"
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Client Secret {mlConfig.hasCredentials ? '(dejar en blanco mantiene el existente — reingresá para cambiar)' : '*'}
            </label>
            <div className="flex gap-2">
              <input
                type={showMLSecret ? 'text' : 'password'}
                value={mlConfig.clientSecret}
                onChange={(e) => setMLConfig(prev => ({ ...prev, clientSecret: e.target.value }))}
                placeholder={mlConfig.hasCredentials ? '••••••••' : 'Secret de la app ML'}
                className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
              />
              <button
                onClick={() => setShowMLSecret(!showMLSecret)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                {showMLSecret ? <FaEyeSlash className="dark:text-gray-300" /> : <FaEye className="dark:text-gray-300" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Redirect URI * (configurar en ML Developers)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={mlConfig.redirectUri}
                onChange={(e) => setMLConfig(prev => ({ ...prev, redirectUri: e.target.value }))}
                placeholder="https://api.anabellaluna.com.ar/admin/ml/callback"
                className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
              />
              <button
                onClick={() => copyToClipboard(mlConfig.redirectUri, 'mlRedirect')}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                title="Copiar"
              >
                {copied === 'mlRedirect' ? <FaCheck className="text-green-600" /> : <FaCopy className="dark:text-gray-300" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Webhook URL (opcional — para notificaciones de ML)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={mlConfig.webhookUrl}
                onChange={(e) => setMLConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                placeholder="https://api.anabellaluna.com.ar/admin/ml/webhook"
                className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
              />
              <button
                onClick={() => copyToClipboard(mlConfig.webhookUrl, 'mlWebhook')}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                title="Copiar"
              >
                {copied === 'mlWebhook' ? <FaCheck className="text-green-600" /> : <FaCopy className="dark:text-gray-300" />}
              </button>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={saveMLConfig}
            disabled={mlSaving}
            className="flex items-center gap-2 px-6 py-2 text-white rounded-lg transition-colors disabled:opacity-50"
            style={{ backgroundColor: currentColor }}
          >
            <FaSave /> {mlSaving ? 'Guardando...' : 'Guardar Credenciales'}
          </button>
          {mlConfig.hasCredentials && !mlConfig.isAuthenticated && (
            <button
              onClick={connectML}
              disabled={mlSaving}
              className="flex items-center gap-2 px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <FaSync /> Conectar cuenta ML
            </button>
          )}
          {mlConfig.isAuthenticated && (
            <button
              onClick={disconnectML}
              disabled={mlSaving}
              className="flex items-center gap-2 px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <FaUnlink /> Desconectar
            </button>
          )}
          {mlConfig.hasCredentials && (
            <button
              onClick={deleteMLConfig}
              disabled={mlSaving}
              className="flex items-center gap-2 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <FaTrash /> Eliminar
            </button>
          )}
        </div>

        {/* Listing type legend */}
        <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-yellow-50'}`}>
          <h4 className="font-semibold text-sm mb-3 dark:text-gray-200">⭐ Estrellas → Tipo de publicación ML</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {STARS.map((n) => (
              <div key={n} className="flex items-center gap-2 text-xs">
                <div className="flex">
                  {STARS.slice(0, 5).map((i) => (
                    i < n
                      ? <FaStar key={i} className="text-yellow-400" />
                      : <FaRegStar key={i} className="text-gray-400" />
                  ))}
                </div>
                <span className={`font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{STAR_LABELS[n]}</span>
              </div>
            ))}
          </div>
          <p className="text-xs mt-3 text-gray-500 dark:text-gray-400">
            Las estrellas se asignan desde el detalle de cada propiedad en el ERP. El tipo de publicación
            se actualiza automáticamente en ML cuando se cambia.
          </p>
        </div>

        {mlConfig.isAuthenticated && mlConfig.userId && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
            Cuenta conectada: User ID {mlConfig.userId}
          </p>
        )}
      </div>

      {/* Other integrations (placeholder) */}
      <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Otras Integraciones</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { nombre: 'ZonaProp', descripcion: 'Portal inmobiliario líder', conectado: false, logo: '🏢' },
          { nombre: 'ArgentinaProp', descripcion: 'Publicación de propiedades', conectado: false, logo: '🏘️' },
          { nombre: 'WhatsApp Business', descripcion: 'Mensajería con clientes', conectado: false, logo: '💬' },
          { nombre: 'Mailchimp', descripcion: 'Email marketing', conectado: false, logo: '📧' },
        ].map((int, index) => (
          <div key={index} className={`rounded-2xl p-6 border opacity-60 ${isDark ? 'bg-secondary-dark-bg border-gray-700/50' : 'bg-white border-gray-100'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl">{int.logo}</div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                Próximamente
              </span>
            </div>
            <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{int.nombre}</h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{int.descripcion}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Integraciones;
