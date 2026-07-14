/* Frame Africa service worker (WS16 — installable + offline reading).
 * Strategy: network-first for navigations (so news stays fresh) with a cached
 * fallback and an /offline page; cache-first for static assets. Visited pages
 * are cached so they can be re-read without a connection. */
const CACHE = 'fa-cache-v1';
const SHELL = ['/', '/offline'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/* Breaking-news alerts (WS: web push). The payload is encrypted to this browser's
 * own keys, so only it can read the headline. */
self.addEventListener('push', (event) => {
  let alert = {};
  try {
    alert = event.data ? event.data.json() : {};
  } catch {
    // A malformed payload is not worth waking the reader for.
    return;
  }
  if (!alert.title) return;

  event.waitUntil(
    self.registration.showNotification(alert.title, {
      body: alert.body || '',
      // `tag` collapses repeat alerts for the same story into one.
      tag: alert.tag || 'frame-africa',
      icon: '/brand/icon.png',
      badge: '/brand/icon.png',
      data: { url: alert.url || '/' },
    }),
  );
});

/* Tapping the alert should land on the story — reusing an open tab if there is one. */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(
    (event.notification.data && event.notification.data.url) || '/',
    self.location.origin,
  );

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url === target.href && 'focus' in client) return client.focus();
      }
      return self.clients.openWindow(target.href);
    }),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Page navigations: network-first, then cache, then the offline page.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/offline'))),
    );
    return;
  }

  // Static assets + brand images: cache-first.
  if (url.pathname.startsWith('/_next/static') || url.pathname.startsWith('/brand')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
            return response;
          }),
      ),
    );
  }
});
