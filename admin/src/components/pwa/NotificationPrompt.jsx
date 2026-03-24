import React, { useState, useEffect } from 'react';
import { FaBell, FaTimes } from 'react-icons/fa';
import usePushNotifications from '../../hooks/usePushNotifications';

export default function NotificationPrompt() {
  const { isSupported, permission, subscription, loading, subscribe } = usePushNotifications();
  const [show, setShow] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Wait for user interaction before showing
  useEffect(() => {
    if (!isSupported) return;
    if (permission !== 'default') return;
    if (subscription) return;
    if (localStorage.getItem('push_dismissed') === 'true') {
      const dismissedAt = parseInt(localStorage.getItem('push_dismissed_at') || '0', 10);
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    const handler = () => setHasInteracted(true);
    document.addEventListener('click', handler, { once: true });
    return () => document.removeEventListener('click', handler);
  }, [isSupported, permission, subscription]);

  useEffect(() => {
    if (!hasInteracted) return;
    if (permission !== 'default') return;
    if (subscription) return;

    const timer = setTimeout(() => setShow(true), 5000);
    return () => clearTimeout(timer);
  }, [hasInteracted, permission, subscription]);

  const handleActivate = async () => {
    await subscribe();
    setShow(false);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('push_dismissed', 'true');
    localStorage.setItem('push_dismissed_at', String(Date.now()));
  };

  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-slide-down md:w-80">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
          <FaBell className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm">Activar notificaciones</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Recibí alertas de nuevos leads, consultas y citas en tiempo real
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
