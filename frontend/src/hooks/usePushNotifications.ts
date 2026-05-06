import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';

// ── Platform helpers ─────────────────────────────────────────────────────────
export function detectIsIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
}

export function detectIsStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  );
}

export type PushState =
  | 'unsupported'
  | 'ios-needs-install'
  | 'permission-denied'
  | 'permission-default'
  | 'subscribed';

export function computePushState(params: {
  isIOS: boolean;
  isStandalone: boolean;
  isSupported: boolean;
  permission: NotificationPermission;
  subscription: PushSubscription | null;
}): PushState {
  const { isIOS, isStandalone, isSupported, permission, subscription } = params;
  if (!isSupported) return 'unsupported';
  if (isIOS && !isStandalone) return 'ios-needs-install';
  if (permission === 'denied') return 'permission-denied';
  if (subscription) return 'subscribed';
  return 'permission-default';
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
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

  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

      const res = await fetch(`${API_BASE_URL}/api/push/vapid-public-key`);
      const { publicKey } = await res.json();
      if (!publicKey) {
        console.warn('[Push] No VAPID public key configured');
        setLoading(false);
        return null;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      setSubscription(sub);

      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = (localStorage.getItem('authToken') || '').replace(/^"|"$/g, '');

      await fetch(`${API_BASE_URL}/api/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId: user._id || user.id || 'anonymous',
          role: 'user',
          subscription: sub.toJSON(),
          device: navigator.userAgent,
        }),
      });

      console.log('[Push] Subscribed — platform:', isIOS ? 'ios' : 'other');
      setLoading(false);
      return sub;
    } catch (err: any) {
      console.error('[Push] Subscription error:', err);
      setError(err?.message || 'Error al activar notificaciones');
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
      await fetch(`${API_BASE_URL}/api/push/unsubscribe`, {
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
