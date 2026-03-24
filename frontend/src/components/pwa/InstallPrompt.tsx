import React, { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const isIOS = () => {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
};

const isInStandaloneMode = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as any).standalone === true;

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    if (isInStandaloneMode()) return;
    if (localStorage.getItem('pwa_installed') === 'true') return;
    if (localStorage.getItem('pwa_dismissed') === 'true') {
      const dismissedAt = parseInt(localStorage.getItem('pwa_dismissed_at') || '0', 10);
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    if (isIOS()) {
      const timer = setTimeout(() => setShowIOSGuide(true), 3000);
      return () => clearTimeout(timer);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    const installed = () => {
      localStorage.setItem('pwa_installed', 'true');
      setShowBanner(false);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', installed);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem('pwa_installed', 'true');
    }
    setDeferredPrompt(null);
    setShowBanner(false);
  }, [deferredPrompt]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    setShowIOSGuide(false);
    localStorage.setItem('pwa_dismissed', 'true');
    localStorage.setItem('pwa_dismissed_at', String(Date.now()));
  }, []);

  const bannerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '1rem',
    left: '1rem',
    right: '1rem',
    zIndex: 9999,
    animation: 'pwaSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
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
    maxWidth: '24rem',
    marginLeft: 'auto',
  };

  const iconBoxStyle: React.CSSProperties = {
    flexShrink: 0,
    width: '3rem',
    height: '3rem',
    background: 'linear-gradient(135deg, #3b82f6, #4f46e5)',
    borderRadius: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: '1.125rem',
  };

  if (showBanner && deferredPrompt) {
    return (
      <>
        <style>{`@keyframes pwaSlideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`}</style>
        <div style={bannerStyle}>
          <div style={cardStyle}>
            <div style={iconBoxStyle}>⬇</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{ fontWeight: 600, fontSize: '0.875rem', margin: 0, color: '#111827' }}>Instalar Anabella Luna</h4>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                Accedé más rápido desde tu pantalla de inicio
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button
                  onClick={handleInstall}
                  style={{ padding: '0.375rem 1rem', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 500, cursor: 'pointer' }}
                >
                  Instalar
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

  if (showIOSGuide) {
    return (
      <>
        <style>{`@keyframes pwaSlideUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }`}</style>
        <div style={bannerStyle}>
          <div style={cardStyle}>
            <div style={iconBoxStyle}>↗</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h4 style={{ fontWeight: 600, fontSize: '0.875rem', margin: 0, color: '#111827' }}>Instalar Anabella Luna</h4>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem', lineHeight: 1.5 }}>
                Tocá el botón <strong>Compartir</strong> ↗ y luego <strong>&quot;Agregar a pantalla de inicio&quot;</strong>
              </p>
            </div>
            <button onClick={handleDismiss} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1rem', padding: '0.25rem' }}>✕</button>
          </div>
        </div>
      </>
    );
  }

  return null;
}
