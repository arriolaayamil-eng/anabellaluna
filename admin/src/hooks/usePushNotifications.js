import { useState, useEffect, useCallback } from 'react';
import API_CONFIG from '../config/api';

const API_BASE = API_CONFIG.baseURL;

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
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [subscription, setSubscription] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [loading, setLoading] = useState(false);

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
      });
    }
  }, []);

  const subscribe = useCallback(async () => {
    if (!isSupported) return null;
    setLoading(true);

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        setLoading(false);
        return null;
      }

      const reg = await navigator.serviceWorker.ready;

      // Get VAPID public key from backend
      const res = await fetch(`${API_BASE}/api/push/vapid-public-key`);
      const { publicKey } = await res.json();
      if (!publicKey) {
        console.warn('No VAPID public key configured');
        setLoading(false);
        return null;
      }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      setSubscription(sub);

      // Send subscription to backend
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const token = localStorage.getItem('authToken');

      await fetch(`${API_BASE}/api/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token.replace(/^"|"$/g, '')}` } : {}),
        },
        body: JSON.stringify({
          userId: user._id || user.id || 'anonymous',
          role: user.role || 'admin',
          subscription: sub.toJSON(),
          device: navigator.userAgent,
        }),
      });

      setLoading(false);
      return sub;
    } catch (err) {
      console.error('Push subscription error:', err);
      setLoading(false);
      return null;
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!subscription) return;
    setLoading(true);

    try {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      setSubscription(null);

      const token = localStorage.getItem('authToken');
      await fetch(`${API_BASE}/api/push/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token.replace(/^"|"$/g, '')}` } : {}),
        },
        body: JSON.stringify({ endpoint }),
      });
    } catch (err) {
      console.error('Push unsubscribe error:', err);
    }
    setLoading(false);
  }, [subscription]);

  return {
    isSupported,
    permission,
    subscription,
    loading,
    subscribe,
    unsubscribe,
  };
}
