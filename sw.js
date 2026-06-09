// ===== sw.js · MS360-UCI · Service Worker v3 =====
const CACHE_NAME = 'ms360uci-v3';

const PRECACHE_URLS = [
  './',
  './index.html',
  './app.js',
  './activacion.js',
  './style.css',
  './manifest.json',
  './favicon.png',
  './icon-180.png',
  './icon-512.png',
];

const BYPASS_ORIGINS = [
  'firestore.googleapis.com',
  'firebase.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'www.gstatic.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (BYPASS_ORIGINS.some((origin) => url.hostname.includes(origin))) return;
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        const clone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return networkResponse;
      })
      .catch(() =>
        caches.match(event.request).then(
          (cached) => cached || new Response('Sin conexión', { status: 503 })
        )
      )
  );
});
