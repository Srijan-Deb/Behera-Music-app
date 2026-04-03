const CACHE_NAME = 'behera-offline-cache-v1';

// We want to aggressively cache everything the Next.js static export generates
// so the shell is completely available offline
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon.svg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Pre-cache core shell resources
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Force active immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Stale-while-revalidate strategy for maximum performance vs freshness
self.addEventListener('fetch', (event) => {
  // Only process GET requests over HTTP(S)
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  // Exempt external APIs ensuring WebRTC and music metadata fetches aren't maliciously cached
  const url = new URL(event.request.url);
  if (url.hostname.includes('acoustid') || url.hostname.includes('coverartarchive') || url.hostname.includes('herokuapp')) {
      return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Clone and cache the dynamic resource if it's a valid 200 response
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // If entirely offline and not in cache, fallback gracefully
        // For audio files, IndexedDB handles them anyway
        return cachedResponse;
      });

      // Return the cached version immediately if available, otherwise wait on the network
      return cachedResponse || fetchPromise;
    })
  );
});
