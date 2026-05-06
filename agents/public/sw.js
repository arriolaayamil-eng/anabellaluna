/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'anabella-crm-v2';
const APP_ORIGIN = self.location.origin;

// Install — skip waiting immediately
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Activate — clean old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    ).then(() => self.clients.claim())
  );
});

// Push notification — iOS 16.4+ compatible
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'Anabella Luna CRM', body: event.data.text() };
    }
  }

  const title = data.title || 'Anabella Luna CRM';
  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    // NOTE: vibrate is ignored by iOS but harmless on Android
    vibrate: [200, 100, 200],
    // requireInteraction: false is safer for iOS — true can cause issues
    requireInteraction: false,
    data: {
      url: data.url || '/',
      type: data.type || 'general',
      entityId: data.entityId || null,
    },
    // tag deduplication — same type replaces previous
    tag: data.tag || data.type || 'anabella-crm',
    renotify: true,
  };

  // Log for debugging
  console.log('[SW CRM] Push received:', title, options.body);

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click — focus existing tab or open new window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';
  const fullUrl = targetUrl.startsWith('http') ? targetUrl : APP_ORIGIN + targetUrl;

  console.log('[SW CRM] Notification clicked, opening:', fullUrl);

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Find an already-open window for this app
        for (const client of clientList) {
          if (client.url.startsWith(APP_ORIGIN) && 'focus' in client) {
            client.navigate(fullUrl);
            return client.focus();
          }
        }
        // No window open — open a new one (works with app closed / locked screen)
        return self.clients.openWindow(fullUrl);
      })
  );
});
