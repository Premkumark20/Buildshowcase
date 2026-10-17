// Service Worker for Business Showcase Admin PWA & Mobile Notifications
const CACHE_NAME = 'showcase-sw-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming Web Push notifications (when app is in background or closed)
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (err) {
    payload = {
      title: '🔔 New Lead Enquiry Received!',
      body: event.data ? event.data.text() : 'A client submitted an enquiry on your website.'
    };
  }

  const title = payload.title || '🔔 New Lead Enquiry!';
  const options = {
    body: payload.body || 'New property enquiry received. Tap to view.',
    icon: payload.icon || '/logo/sk-builders-logo.png',
    badge: payload.badge || '/logo/sk-builders-logo.png',
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: payload.url || '/admin#leads',
      leadId: payload.leadId
    },
    tag: payload.tag || `lead-alert-${Date.now()}`,
    renotify: true,
    requireInteraction: true
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// When user taps the notification on the mobile notification bar / drawer
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/admin#leads';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 1. If an admin window is already open, focus it, post message, and navigate to /admin#leads
      for (const client of windowClients) {
        if (client.url.includes('/admin')) {
          client.postMessage({ type: 'OPEN_TAB', tab: 'leads' });
          if ('navigate' in client && !client.url.includes('#leads')) {
            client.navigate('/admin#leads');
          }
          if ('focus' in client) {
            return client.focus();
          }
        }
      }
      // 2. If any client window of this domain is open, navigate directly to /admin#leads
      for (const client of windowClients) {
        if ('navigate' in client) {
          client.navigate(targetUrl);
          if ('focus' in client) {
            return client.focus();
          }
        }
      }
      // 3. Otherwise open new window directly to /admin#leads
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Handle messages from client tabs (e.g. to trigger showNotification directly)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    self.registration.showNotification(title, options);
  }
});
