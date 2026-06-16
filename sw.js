// ===== sw.js · MS360-UCI · Service Worker v5 =====
const CACHE_NAME = 'ms360uci-v5';

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
    caches.open(CACHE_NAME).then((cache) => {
      // Cachea uno por uno; si alguno falla no rompe toda la instalación
      return Promise.allSettled(
        PRECACHE_URLS.map((url) => cache.add(url))
      );
    })
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

  // Para navegaciones (abrir la app), siempre devolver index.html si falla la red
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', clone));
          return networkResponse;
        })
        .catch(() =>
          caches.match('./index.html').then(
            (cached) => cached || caches.match('./')
          )
        )
    );
    return;
  }

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
