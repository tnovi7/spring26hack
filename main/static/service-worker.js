const CACHE_NAME = 'spring26hack-pwa-v1';
const CACHE_ITEMS = [
  '/',
  '/dashboard/',
  '/login/',
  '/complaints/',
  '/seatplan/',
  '/ai/',
  '/ledger/',
  '/sos/',
  '/rules/',
  '/captain/2/',
  '/captain/3/',
  '/static/main/css/styles.css',
  '/static/main/js/app.js',
  '/static/manifest.json',
  '/static/offline.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CACHE_ITEMS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).then((response) => {
      const responseClone = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
      return response;
    }).catch(() => caches.match(event.request).then((cached) => cached || caches.match('/static/offline.html')))
  );
});
