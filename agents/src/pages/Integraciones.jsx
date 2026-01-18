import React, { useEffect, useState } from 'react';
import { FaCheck, FaTimes, FaCog, FaKey, FaExternalLinkAlt, FaTrash, FaEye, FaEyeSlash, FaMapMarkerAlt, FaCloud, FaSave } from 'react-icons/fa';
import { Header } from '../components';
import { crmService } from '../services/crmService';

const Integraciones = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [status, setStatus] = useState({ 
    configured: false, 
    connected: false, 
    email: '', 
    calendarId: 'primary',
    hasOwnCredentials: false,
    redirectUri: ''
  });
  
  // Credentials form
  const [showCredentialsForm, setShowCredentialsForm] = useState(false);
  const [credentials, setCredentials] = useState({ clientId: '', clientSecret: '' });
  const [showSecret, setShowSecret] = useState(false);

  // Google Maps configuration
  const [showMapsForm, setShowMapsForm] = useState(false);
  const [mapsConfig, setMapsConfig] = useState({ apiKey: '', configured: false });
  const [savingMaps, setSavingMaps] = useState(false);
  const [showMapsKey, setShowMapsKey] = useState(false);

  // Google Cloud configuration
  const [showCloudForm, setShowCloudForm] = useState(false);
  const [cloudConfig, setCloudConfig] = useState({ 
    projectId: '', 
    placesEnabled: false,
    geocodingEnabled: false,
    configured: false 
  });
  const [savingCloud, setSavingCloud] = useState(false);

  const loadStatus = async () => {
    setLoading(true);
    setError('');
    try {
      const [statusRes, credRes] = await Promise.all([
        crmService.integrations.googleCalendar.status(),
        crmService.integrations.googleCalendar.getCredentials()
      ]);
      setStatus({
        configured: !!statusRes?.configured,
        connected: !!statusRes?.connected,
        email: statusRes?.email || '',
        calendarId: statusRes?.calendarId || 'primary',
        hasOwnCredentials: !!statusRes?.hasOwnCredentials,
        redirectUri: statusRes?.redirectUri || credRes?.redirectUri || ''
      });
      setCredentials(prev => ({
        ...prev,
        clientId: credRes?.clientId || ''
      }));
    } catch (e) {
      setError(e?.message || 'No se pudo cargar el estado de integraciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    // Check URL for success callback
    const params = new URLSearchParams(window.location.search);
    if (params.get('googleCalendar') === 'connected') {
      setSuccess('¡Google Calendar conectado exitosamente!');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const saveCredentials = async (e) => {
    e.preventDefault();
    if (!credentials.clientId || !credentials.clientSecret) {
      setError('Debes ingresar Client ID y Client Secret');
      return;
    }
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await crmService.integrations.googleCalendar.saveCredentials(credentials.clientId, credentials.clientSecret);
      setSuccess('Credenciales guardadas correctamente');
      setCredentials(prev => ({ ...prev, clientSecret: '' }));
      setShowCredentialsForm(false);
      await loadStatus();
    } catch (e) {
      setError(e?.message || 'Error al guardar las credenciales');
    } finally {
      setSaving(false);
    }
  };

  const deleteCredentials = async () => {
    if (!window.confirm('¿Eliminar las credenciales de Google OAuth? Esto también desconectará el calendario.')) return;
    setSaving(true);
    setError('');
    try {
      await crmService.integrations.googleCalendar.deleteCredentials();
      setSuccess('Credenciales eliminadas');
      setCredentials({ clientId: '', clientSecret: '' });
      await loadStatus();
    } catch (e) {
      setError(e?.message || 'Error al eliminar las credenciales');
    } finally {
      setSaving(false);
    }
  };

  const connectGoogleCalendar = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await crmService.integrations.googleCalendar.getAuthUrl();
      const url = res && res.url ? String(res.url) : '';
      if (!url) throw new Error('No se pudo obtener la URL de autorización');
      window.location.href = url;
    } catch (e) {
      setError(e?.message || 'No se pudo iniciar la conexión con Google Calendar');
      setLoading(false);
    }
  };

  const disconnectGoogleCalendar = async () => {
    if (!window.confirm('¿Desconectar Google Calendar?')) return;
    setLoading(true);
    setError('');
    try {
      await crmService.integrations.googleCalendar.disconnect();
      await loadStatus();
    } catch (e) {
      setError(e?.message || 'No se pudo desconectar Google Calendar');
      setLoading(false);
    }
  };

  // Google Maps functions
  const saveMapsConfig = async (e) => {
    e.preventDefault();
    if (!mapsConfig.apiKey) {
      setError('Debes ingresar una API Key de Google Maps');
      return;
    }
    setSavingMaps(true);
    setError('');
    setSuccess('');
    try {
      await crmService.integrations.googleMaps.saveConfig({ apiKey: mapsConfig.apiKey });
      setSuccess('Configuración de Google Maps guardada correctamente');
      setMapsConfig(prev => ({ ...prev, configured: true }));
      setShowMapsForm(false);
    } catch (e) {
      setError(e?.message || 'Error al guardar la configuración de Google Maps');
    } finally {
      setSavingMaps(false);
    }
  };

  const deleteMapsConfig = async () => {
    if (!window.confirm('¿Eliminar la configuración de Google Maps?')) return;
    setSavingMaps(true);
    setError('');
    try {
      await crmService.integrations.googleMaps.deleteConfig();
      setSuccess('Configuración de Google Maps eliminada');
      setMapsConfig({ apiKey: '', configured: false });
    } catch (e) {
      setError(e?.message || 'Error al eliminar la configuración');
    } finally {
      setSavingMaps(false);
    }
  };

  // Google Cloud functions
  const saveCloudConfig = async (e) => {
    e.preventDefault();
    if (!cloudConfig.projectId) {
      setError('Debes ingresar el Project ID de Google Cloud');
      return;
    }
    setSavingCloud(true);
    setError('');
    setSuccess('');
    try {
      await crmService.integrations.googleCloud.saveConfig({
        projectId: cloudConfig.projectId,
        placesEnabled: cloudConfig.placesEnabled,
        geocodingEnabled: cloudConfig.geocodingEnabled
      });
      setSuccess('Configuración de Google Cloud guardada correctamente');
      setCloudConfig(prev => ({ ...prev, configured: true }));
      setShowCloudForm(false);
    } catch (e) {
      setError(e?.message || 'Error al guardar la configuración de Google Cloud');
    } finally {
      setSavingCloud(false);
    }
  };

  const loadGoogleConfigs = async () => {
    try {
      const [mapsRes, cloudRes] = await Promise.all([
        crmService.integrations.googleMaps.getConfig().catch(() => null),
        crmService.integrations.googleCloud.getConfig().catch(() => null)
      ]);
      if (mapsRes) {
        setMapsConfig(prev => ({ 
          ...prev, 
          apiKey: mapsRes.apiKey || '',
          configured: !!mapsRes.configured 
        }));
      }
      if (cloudRes) {
        setCloudConfig(prev => ({
          ...prev,
          projectId: cloudRes.projectId || '',
          placesEnabled: !!cloudRes.placesEnabled,
          geocodingEnabled: !!cloudRes.geocodingEnabled,
          configured: !!cloudRes.configured
        }));
      }
    } catch (e) {
      // Silent fail for optional configs
    }
  };

  useEffect(() => {
    loadGoogleConfigs();
  }, []);

  return (
    <div className="m-2 md:m-10 mt-24 p-2 md:p-10 bg-white dark:bg-secondary-dark-bg rounded-3xl">
      <Header category="Configuración" title="Integraciones" />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Google Calendar Card */}
        <div className="border dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">📅</div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              status.connected ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
            }`}>
              {status.connected ? <><FaCheck className="inline mr-1" /> Conectado</> : <><FaTimes className="inline mr-1" /> Desconectado</>}
            </span>
          </div>

          <h3 className="text-lg font-bold dark:text-gray-200 mb-2">Google Calendar</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Sincroniza tus citas automáticamente con Google Calendar</p>

          {/* Credentials status */}
          <div className={`text-sm rounded-lg px-3 py-2 mb-4 ${
            status.hasOwnCredentials 
              ? 'bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300'
              : 'bg-orange-50 border border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300'
          }`}>
            {status.hasOwnCredentials ? (
              <><FaKey className="inline mr-2" /> Credenciales configuradas</>
            ) : (
              <><FaCog className="inline mr-2" /> Configura tus credenciales de Google OAuth</>
            )}
          </div>

          {status.connected && (
            <div className="text-xs text-gray-600 dark:text-gray-300 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div><span className="font-semibold">Cuenta:</span> {status.email || '—'}</div>
              <div><span className="font-semibold">Calendario:</span> {status.calendarId || 'primary'}</div>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowCredentialsForm(!showCredentialsForm)}
              className="w-full py-2 px-4 rounded-lg border border-purple-300 text-purple-600 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-400 dark:hover:bg-purple-900/20 transition-colors flex items-center justify-center gap-2"
            >
              <FaCog /> {showCredentialsForm ? 'Ocultar configuración' : 'Configurar credenciales'}
            </button>

            {status.configured && (
              <button
                type="button"
                disabled={loading}
                onClick={status.connected ? disconnectGoogleCalendar : connectGoogleCalendar}
                className={`w-full py-2 px-4 rounded-lg transition-colors ${
                  status.connected ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                } ${loading ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Procesando...' : (status.connected ? 'Desconectar calendario' : 'Conectar calendario')}
              </button>
            )}
          </div>
        </div>

        {/* Credentials Form Card */}
        {showCredentialsForm && (
          <div className="border dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-bold dark:text-gray-200 mb-4 flex items-center gap-2">
              <FaKey /> Configurar Google OAuth
            </h3>
            
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
              <p className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Instrucciones:</p>
              <ol className="list-decimal list-inside text-blue-700 dark:text-blue-400 space-y-1">
                <li>Ir a <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900 dark:hover:text-blue-200">Google Cloud Console <FaExternalLinkAlt className="inline text-xs" /></a></li>
                <li>Crear o seleccionar un proyecto</li>
                <li>Habilitar la API de Google Calendar</li>
                <li>Crear credenciales OAuth 2.0 (tipo Web Application)</li>
                <li>Agregar el URI de redirección abajo</li>
              </ol>
            </div>

            {status.redirectUri && (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  URI de redirección (copiar a Google Console)
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded border dark:border-gray-700 break-all">
                    {status.redirectUri}
                  </code>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(status.redirectUri);
                      setSuccess('URI copiada al portapapeles');
                    }}
                    className="px-3 py-2 text-xs bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                  >
                    Copiar
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={saveCredentials} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Client ID
                </label>
                <input
                  type="text"
                  value={credentials.clientId}
                  onChange={(e) => setCredentials(prev => ({ ...prev, clientId: e.target.value }))}
                  placeholder="123456789-xxxxx.apps.googleusercontent.com"
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Client Secret
                </label>
                <div className="relative">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={credentials.clientSecret}
                    onChange={(e) => setCredentials(prev => ({ ...prev, clientSecret: e.target.value }))}
                    placeholder="GOCSPX-xxxxxx"
                    className="w-full px-3 py-2 pr-10 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    required={!status.hasOwnCredentials}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showSecret ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {status.hasOwnCredentials && (
                  <p className="text-xs text-gray-500 mt-1">Deja vacío para mantener el secret actual</p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-60"
                >
                  {saving ? 'Guardando...' : 'Guardar credenciales'}
                </button>
                
                {status.hasOwnCredentials && (
                  <button
                    type="button"
                    onClick={deleteCredentials}
                    disabled={saving}
                    className="py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-60"
                    title="Eliminar credenciales"
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Google Maps Card */}
        <div className="border dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">🗺️</div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              mapsConfig.configured ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
            }`}>
              {mapsConfig.configured ? <><FaCheck className="inline mr-1" /> Configurado</> : <><FaTimes className="inline mr-1" /> Sin configurar</>}
            </span>
          </div>

          <h3 className="text-lg font-bold dark:text-gray-200 mb-2">Google Maps</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Muestra mapas de ubicación en las propiedades del sitio público</p>

          <div className={`text-sm rounded-lg px-3 py-2 mb-4 ${
            mapsConfig.configured 
              ? 'bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300'
              : 'bg-orange-50 border border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300'
          }`}>
            {mapsConfig.configured ? (
              <><FaMapMarkerAlt className="inline mr-2" /> Maps Embed API habilitada</>
            ) : (
              <><FaCog className="inline mr-2" /> Configura tu API Key de Google Maps</>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowMapsForm(!showMapsForm)}
            className="w-full py-2 px-4 rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-600 dark:text-blue-400 dark:hover:bg-blue-900/20 transition-colors flex items-center justify-center gap-2"
          >
            <FaCog /> {showMapsForm ? 'Ocultar configuración' : 'Configurar API Key'}
          </button>
        </div>

        {/* Google Maps Form */}
        {showMapsForm && (
          <div className="border dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-bold dark:text-gray-200 mb-4 flex items-center gap-2">
              <FaMapMarkerAlt /> Configurar Google Maps
            </h3>
            
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
              <p className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Instrucciones:</p>
              <ol className="list-decimal list-inside text-blue-700 dark:text-blue-400 space-y-1">
                <li>Ir a <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900 dark:hover:text-blue-200">Google Cloud Console <FaExternalLinkAlt className="inline text-xs" /></a></li>
                <li>Crear o seleccionar un proyecto</li>
                <li>Habilitar <strong>Maps Embed API</strong></li>
                <li>Crear una API Key</li>
                <li>Opcional: Restringir la key a tu dominio</li>
              </ol>
            </div>

            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm">
              <p className="text-yellow-800 dark:text-yellow-300">
                <strong>APIs recomendadas:</strong> Maps Embed API (gratis), Places API, Geocoding API
              </p>
            </div>

            <form onSubmit={saveMapsConfig} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showMapsKey ? 'text' : 'password'}
                    value={mapsConfig.apiKey}
                    onChange={(e) => setMapsConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="AIzaSy..."
                    className="w-full px-3 py-2 pr-10 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowMapsKey(!showMapsKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showMapsKey ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={savingMaps}
                  className="flex-1 py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <FaSave /> {savingMaps ? 'Guardando...' : 'Guardar configuración'}
                </button>
                
                {mapsConfig.configured && (
                  <button
                    type="button"
                    onClick={deleteMapsConfig}
                    disabled={savingMaps}
                    className="py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-60"
                    title="Eliminar configuración"
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Google Cloud Card */}
        <div className="border dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="text-4xl">☁️</div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              cloudConfig.configured ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
            }`}>
              {cloudConfig.configured ? <><FaCheck className="inline mr-1" /> Configurado</> : <><FaTimes className="inline mr-1" /> Sin configurar</>}
            </span>
          </div>

          <h3 className="text-lg font-bold dark:text-gray-200 mb-2">Google Cloud Platform</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Configuración central del proyecto de Google Cloud</p>

          <div className={`text-sm rounded-lg px-3 py-2 mb-4 ${
            cloudConfig.configured 
              ? 'bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300'
              : 'bg-orange-50 border border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300'
          }`}>
            {cloudConfig.configured ? (
              <><FaCloud className="inline mr-2" /> Proyecto: {cloudConfig.projectId}</>
            ) : (
              <><FaCog className="inline mr-2" /> Configura tu proyecto de Google Cloud</>
            )}
          </div>

          {cloudConfig.configured && (
            <div className="text-xs text-gray-600 dark:text-gray-300 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-1">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${cloudConfig.placesEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                <span>Places API: {cloudConfig.placesEnabled ? 'Habilitada' : 'Deshabilitada'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${cloudConfig.geocodingEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                <span>Geocoding API: {cloudConfig.geocodingEnabled ? 'Habilitada' : 'Deshabilitada'}</span>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowCloudForm(!showCloudForm)}
            className="w-full py-2 px-4 rounded-lg border border-indigo-300 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-600 dark:text-indigo-400 dark:hover:bg-indigo-900/20 transition-colors flex items-center justify-center gap-2"
          >
            <FaCog /> {showCloudForm ? 'Ocultar configuración' : 'Configurar proyecto'}
          </button>
        </div>

        {/* Google Cloud Form */}
        {showCloudForm && (
          <div className="border dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-bold dark:text-gray-200 mb-4 flex items-center gap-2">
              <FaCloud /> Configurar Google Cloud
            </h3>
            
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
              <p className="font-semibold text-blue-800 dark:text-blue-300 mb-2">APIs disponibles:</p>
              <ul className="list-disc list-inside text-blue-700 dark:text-blue-400 space-y-1">
                <li><strong>Places API:</strong> Autocompletado de direcciones</li>
                <li><strong>Geocoding API:</strong> Convertir direcciones a coordenadas</li>
                <li><strong>Maps Embed API:</strong> Mapas embebidos (gratis)</li>
                <li><strong>Maps JavaScript API:</strong> Mapas interactivos</li>
              </ul>
            </div>

            <form onSubmit={saveCloudConfig} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Project ID
                </label>
                <input
                  type="text"
                  value={cloudConfig.projectId}
                  onChange={(e) => setCloudConfig(prev => ({ ...prev, projectId: e.target.value }))}
                  placeholder="mi-proyecto-12345"
                  className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lo encuentras en <a href="https://console.cloud.google.com/home/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Google Cloud Console <FaExternalLinkAlt className="inline text-xs" /></a>
                </p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  APIs habilitadas
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cloudConfig.placesEnabled}
                      onChange={(e) => setCloudConfig(prev => ({ ...prev, placesEnabled: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm dark:text-gray-300">Places API (autocompletado)</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cloudConfig.geocodingEnabled}
                      onChange={(e) => setCloudConfig(prev => ({ ...prev, geocodingEnabled: e.target.checked }))}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm dark:text-gray-300">Geocoding API (coordenadas)</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingCloud}
                className="w-full py-2 px-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <FaSave /> {savingCloud ? 'Guardando...' : 'Guardar configuración'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Integraciones;
