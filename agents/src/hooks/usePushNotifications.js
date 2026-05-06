import { useState, useEffect, useCallback } from 'react';
import API_CONFIG from '../config/api';

const API_BASE = API_CONFIG.baseURL;

// ── Platform helpers ────────────────────────────────────────────────────────
export function detectIsIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
}

export function detectIsStandalone() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

/**
 * Push notification state machine for iOS + Android + desktop.
 *
 * States:
 *  'unsupported'        — browser doesn't support Web Push at all
 *  'ios-safari-only'    — iOS device but NOT in Safari (e.g. Chrome iOS)
 *  'ios-needs-install'  — iOS Safari but NOT installed as PWA yet
 *  'permission-denied'  — user blocked notifications
 *  'permission-default' — has not been asked yet (ready to ask on standalone)
 *  'subscribed'         — active push subscription
 */
export function computePushState({ isIOS, isStandalone, isSupported, permission, subscription }) {
  if (!isSupported) return 'unsupported';
  if (isIOS && !isStandalone) return 'ios-needs-install';
  if (permission === 'denied') return 'permission-denied';
  if (subscription) return 'subscribed';
  return 'permission-default';
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function usePushNotifications() {
  const isIOS = detectIsIOS();
  const isStandalone = detectIsStandalone();

  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [subscription, setSubscription] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const supported =
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      typeof Notification !== 'undefined';
    setIsSupported(supported);

    if (supported && Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) setSubscription(sub);
        });
      }).catch(() => {});
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!isSupported) return null;
    setLoading(true);
    setError(null);

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        setLoading(false);
        return null;
      }

      const reg = await navigator.serviceWorker.ready;

      const res = await fetch(`${API_BASE}/api/push/vapid-public-key`);
      const { publicKey } = await res.json();
      if (!publicKey) {
        console.warn('[Push] No VAPID public key configured');
        setLoading(false);
        return null;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      setSubscription(sub);

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = (localStorage.getItem('authToken') || '').replace(/^"|"$/g, '');

      await fetch(`${API_BASE}/api/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId: user._id || user.id || 'anonymous',
          role: user.role || 'agent',
          subscription: sub.toJSON(),
          device: navigator.userAgent,
        }),
      });

      console.log('[Push] Subscribed successfully — platform:', isIOS ? 'ios' : 'other');
      setLoading(false);
      return sub;
    } catch (err) {
      console.error('[Push] Subscription error:', err);
      setError(err.message || 'Error al activar notificaciones');
      setLoading(false);
      return null;
    }
  }, [isSupported, isIOS]);

  const unsubscribe = useCallback(async () => {
    if (!subscription) return;
    setLoading(true);

    try {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      setSubscription(null);

      const token = (localStorage.getItem('authToken') || '').replace(/^"|"$/g, '');
      await fetch(`${API_BASE}/api/push/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ endpoint }),
      });

      console.log('[Push] Unsubscribed');
    } catch (err) {
      console.error('[Push] Unsubscribe error:', err);
    }
    setLoading(false);
  }, [subscription]);

  const pushState = computePushState({ isIOS, isStandalone, isSupported, permission, subscription });

  return {
    isSupported,
    isIOS,
    isStandalone,
    pushState,
    permission,
    subscription,
    loading,
    error,
    subscribe,
    unsubscribe,
  };
}
