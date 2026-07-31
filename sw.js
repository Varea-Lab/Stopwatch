/* ============================================================
   Varea Lab — Stopwatch — Service Worker
   ------------------------------------------------------------
   IMPORTANT: whenever you publish a new version of index.html (or
   any file listed in CORE_ASSETS), bump CACHE_VERSION below.
   Without this, users who already installed the app will keep
   seeing the old version, because the service worker serves files
   from the cache.
   ============================================================ */
const CACHE_VERSION = 'stopwatch-v1';

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(function (cache) { return cache.addAll(CORE_ASSETS); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(
          keys.filter(function (k) { return k !== CACHE_VERSION; })
              .map(function (k) { return caches.delete(k); })
        );
      })
      .then(function () { return self.clients.claim(); })
  );
});

/* Strategy: cache-first for the app shell assets, with a
   background cache update whenever the network responds. If offline
   and the resource isn't cached, navigations fall back to
   index.html (so the app still opens). */
self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      var networkFetch = fetch(event.request).then(function (response) {
        if (response && response.status === 200 && response.type === 'basic') {
          var copy = response.clone();
          caches.open(CACHE_VERSION).then(function (cache) {
            cache.put(event.request, copy);
          });
        }
        return response;
      }).catch(function () {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });

      return cached || networkFetch;
    })
  );
});
