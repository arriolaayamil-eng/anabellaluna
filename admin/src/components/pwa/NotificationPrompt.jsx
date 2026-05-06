import React, { useState, useEffect } from 'react';
import { FaBell, FaTimes, FaShareAlt, FaCheckCircle } from 'react-icons/fa';
import usePushNotifications from '../../hooks/usePushNotifications';

export default function NotificationPrompt() {
  const { pushState, loading, subscribe } = usePushNotifications();
  const [show, setShow] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [justSubscribed, setJustSubscribed] = useState(false);

  useEffect(() => {
    if (pushState === 'subscribed' || pushState === 'unsupported' || pushState === 'permission-denied') return;

    if (localStorage.getItem('push_dismissed') === 'true') {
      const dismissedAt = parseInt(localStorage.getItem('push_dismissed_at') || '0', 10);
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    if (pushState === 'ios-needs-install') {
      const timer = setTimeout(() => setShow(true), 4000);
      return () => clearTimeout(timer);
    }

    const handler = () => setHasInteracted(true);
    document.addEventListener('click', handler, { once: true });
    return () => document.removeEventListener('click', handler);
  }, [pushState]);

  useEffect(() => {
    if (!hasInteracted) return;
    if (pushState !== 'permission-default') return;
    const timer = setTimeout(() => setShow(true), 5000);
    return () => clearTimeout(timer);
  }, [hasInteracted, pushState]);

  const handleActivate = async () => {
    await subscribe();
    setJustSubscribed(true);
    setTimeout(() => { setShow(false); setJustSubscribed(false); }, 3000);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('push_dismissed', 'true');
    localStorage.setItem('push_dismissed_at', String(Date.now()));
  };

  if (!show) return null;

  if (pushState === 'ios-needs-install') {
    return (
      <div className="fixed bottom-20 left-3 right-3 z-[9999] animate-slide-up md:bottom-6 md:left-auto md:right-6 md:w-96">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white">
              <FaShareAlt />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Activar notificaciones en iPhone</h4>
              <ol className="mt-2 space-y-1">
                <li className="text-xs text-gray-600 dark:text-gray-300 flex items-start gap-1.5">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold mt-0.5">1</span>
                  Tocá <strong className="text-blue-600 dark:text-blue-400">Compartir</strong> en Safari
                </li>
                <li className="text-xs text-gray-600 dark:text-gray-300 flex items-start gap-1.5">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold mt-0.5">2</span>
                  Seleccioná <strong>&quot;Agregar a pantalla de inicio&quot;</strong>
                </li>
                <li className="text-xs text-gray-600 dark:text-gray-300 flex items-start gap-1.5">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center text-[10px] font-bold mt-0.5">3</span>
                  Abrí la app desde el ícono y activá notificaciones
                </li>
              </ol>
            </div>
            <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mt-0.5 flex-shrink-0">
              <FaTimes className="text-sm" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (justSubscribed) {
    return (
      <div className="fixed top-4 right-4 z-[9999] animate-slide-down md:w-80">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-emerald-200 dark:border-emerald-700 p-4 flex items-center gap-3">
          <FaCheckCircle className="text-emerald-500 text-xl flex-shrink-0" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-white text-sm">¡Notificaciones activadas!</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Vas a recibir alertas en tiempo real</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-slide-down md:w-80">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
          <FaBell className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Activar notificaciones</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Recibí alertas del ERP en tiempo real
          </p>
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleActivate}
              disabled={loading}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Activando...' : 'Activar'}
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xs transition-colors"
            >
              Ahora no
            </button>
          </div>
        </div>
        <button onClick={handleDismiss} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mt-0.5">
          <FaTimes className="text-sm" />
        </button>
      </div>
    </div>
  );
}
