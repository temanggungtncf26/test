const CACHE_NAME = 'gas-pwa-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json'
];

// Install Event - Pre-cache App Shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Stale-While-Revalidate for App Shell
self.addEventListener('fetch', event => {
  // Hanya tangani request navigasi (halaman) dan aset lokal cangkang PWA
  if (event.request.mode === 'navigate' || ASSETS_TO_CACHE.includes(new URL(event.request.url).pathname)) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // Update cache dinamis
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
          });
          return networkResponse;
        }).catch(() => {
          // Ignore network errors here, return cached if offline
        });
        
        // Kembalikan yang di-cache secepatnya, jika tidak ada tunggu network
        return cachedResponse || fetchPromise;
      })
    );
  }
  // Permintaan lain (seperti iframe ke Google Script) dibiarkan ditangani browser secara native
  // sehingga tidak terblokir CORS oleh Service Worker
});