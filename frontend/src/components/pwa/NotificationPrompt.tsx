import React, { useState, useEffect } from 'react';
import usePushNotifications from '../../hooks/usePushNotifications';

export default function NotificationPrompt() {
  const { isSupported, permission, subscription, loading, subscribe } = usePushNotifications();
  const [show, setShow] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

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

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: '1rem',
    right: '1rem',
    zIndex: 9999,
    maxWidth: '20rem',
    animation: 'pwaSlideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
  };

  const cardStyle: React.CSSProperties = {
    background: '#fff',
    borderRadius: '1rem',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,.25)',
    border: '1px solid #e5e7eb',
    padding: '1rem',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.75rem',
  };

  const iconBoxStyle: React.CSSProperties = {
    flexShrink: 0,
    width: '2.5rem',
    height: '2.5rem',
    background: 'linear-gradient(135deg, #f59e0b, #f97316)',
    borderRadius: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '1rem',
  };

  return (
    <>
      <style>{`@keyframes pwaSlideDown { from { opacity:0; transform:translateY(-20px); } to { opacity:1; transform:translateY(0); } }`}</style>
      <div style={containerStyle}>
        <div style={cardStyle}>
          <div style={iconBoxStyle}>🔔</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h4 style={{ fontWeight: 600, fontSize: '0.875rem', margin: 0, color: '#111827' }}>Activar notificaciones</h4>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
              Recibí alertas sobre tus propiedades favoritas y reservas
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button
                onClick={handleActivate}
                disabled={loading}
                style={{ padding: '0.375rem 1rem', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer', opacity: loading ? 0.5 : 1 }}
              >
                {loading ? 'Activando...' : 'Activar'}
              </button>
              <button
                onClick={handleDismiss}
                style={{ padding: '0.375rem 0.75rem', background: 'transparent', color: '#6b7280', border: 'none', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                Ahora no
              </button>
            </div>
          </div>
          <button onClick={handleDismiss} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1rem', padding: '0.25rem' }}>✕</button>
        </div>
      </div>
    </>
  );
}
