import React, { useEffect, useState } from 'react';
import { FaCheck, FaTimes, FaGoogle, FaSync } from 'react-icons/fa';
import { confirmToast } from '../utils/confirmToast';
import { useStateContext } from '../contexts/ContextProvider';
import { crmService } from '../services/crmService';

const Integraciones = () => {
  const { currentMode } = useStateContext();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [status, setStatus] = useState({
    configured: false,
    connected: false,
    email: '',
    calendarId: 'primary',
  });

  const loadStatus = async () => {
    setLoading(true);
    setError('');
    try {
      const statusRes = await crmService.integrations.googleCalendar.status();
      setStatus({
        configured: !!statusRes?.configured,
        connected: !!statusRes?.connected,
        email: statusRes?.email || '',
        calendarId: statusRes?.calendarId || 'primary',
      });
    } catch (e) {
      setError(e?.message || 'No se pudo cargar el estado de integraciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    const params = new URLSearchParams(window.location.search);
    if (params.get('googleCalendar') === 'connected') {
      setSuccess('¡Google Calendar conectado exitosamente!');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const connectGoogleCalendar = async () => {
    setConnecting(true);
    setError('');
    try {
      const res = await crmService.integrations.googleCalendar.getAuthUrl();
      const url = res && res.url ? String(res.url) : '';
      if (!url) throw new Error('No se pudo obtener la URL de autorización');
      window.location.href = url;
    } catch (e) {
      setError(e?.message || 'No se pudo iniciar la conexión con Google Calendar. Contacta al administrador.');
      setConnecting(false);
    }
  };

  const disconnectGoogleCalendar = async () => {
    if (!(await confirmToast('¿Desconectar Google Calendar?'))) return;
    setConnecting(true);
    setError('');
    try {
      await crmService.integrations.googleCalendar.disconnect();
      setSuccess('Calendario desconectado');
      await loadStatus();
    } catch (e) {
      setError(e?.message || 'No se pudo desconectar Google Calendar');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className={`min-h-screen px-6 lg:px-8 pt-4 pb-6 ${currentMode === 'Dark' ? 'bg-main-dark-bg' : 'bg-gray-50'}`}>
      <div className="mb-6">
        <h2 className={`text-lg font-semibold flex items-center gap-2 ${currentMode === 'Dark' ? 'text-white' : 'text-gray-900'}`}>
          <FaGoogle className="text-blue-500" /> Integraciones
        </h2>
        <p className={`text-sm mt-1 ${currentMode === 'Dark' ? 'text-gray-400' : 'text-gray-500'}`}>Conecta servicios externos</p>
      </div>

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

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : (
        <div className="max-w-xl">
          {/* Google Calendar Card */}
          <div className={`rounded-2xl p-6 border ${currentMode === 'Dark' ? 'bg-secondary-dark-bg border-gray-700/50' : 'bg-white border-gray-100 shadow-md'}`}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900 rounded-xl flex items-center justify-center">
                <FaGoogle className="text-2xl text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold dark:text-gray-200">Google Calendar</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sincroniza tus citas con tu calendario personal
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                status.connected
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
              }`}
              >
                {status.connected ? <><FaCheck className="inline mr-1" /> Conectado</> : <><FaTimes className="inline mr-1" /> Desconectado</>}
              </span>
            </div>

            {status.connected && (
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="text-sm text-green-800 dark:text-green-300">
                  <div className="flex items-center gap-2 mb-1">
                    <FaCheck className="text-green-600" />
                    <span className="font-semibold">Calendario sincronizado</span>
                  </div>
                  <div className="text-xs text-green-700 dark:text-green-400 ml-6">
                    {status.email && <div>Cuenta: {status.email}</div>}
                    <div>Calendario: {status.calendarId || 'principal'}</div>
                  </div>
                </div>
              </div>
            )}

            {!status.configured && (
              <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  ⚠️ La integración con Google Calendar no está habilitada.
                  Contacta al administrador para activarla.
                </p>
              </div>
            )}

            {status.configured && !status.connected && (
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  📅 Conecta tu cuenta de Google para sincronizar automáticamente
                  las citas del CRM con tu calendario personal.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {status.configured && (
                <button
                  type="button"
                  disabled={connecting}
                  onClick={status.connected ? disconnectGoogleCalendar : connectGoogleCalendar}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                    status.connected
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  } ${connecting ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {connecting ? (
                    <><FaSync className="animate-spin" /> Procesando...</>
                  ) : status.connected ? (
                    <><FaTimes /> Desconectar calendario</>
                  ) : (
                    <><FaGoogle /> Conectar con Google</>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={loadStatus}
                disabled={loading}
                className="w-full py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <FaSync className={loading ? 'animate-spin' : ''} /> Actualizar estado
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Integraciones;
