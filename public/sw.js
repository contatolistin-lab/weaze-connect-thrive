const CACHE_NAME = 'weaze-v58';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {
        // Ignore cache errors during install
      });
    })
  );
  // NOTE: Do NOT call self.skipWaiting() here.
  // Automatically taking control of an active page mid-session was causing
  // in-flight Supabase requests to be interrupted and Auth/Tenant loading to deadlock.
  // skipWaiting is only triggered explicitly via the 'skipWaiting' message
  // sent when the user clicks the update banner.
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (fonts, images, etc)
  if (url.origin !== location.origin) {
    // For CDN resources, try network first
    if (request.destination === 'image' || request.destination === 'font') {
      event.respondWith(fetch(request).catch(() => caches.match(request)));
    }
    return;
  }

  // Handle API/Supabase requests - network only
  if (url.pathname.includes('/rest/') || url.pathname.includes('/auth/')) {
    return; // Let these pass through
  }

  // Handle navigation requests (SPA routes)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful responses
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Return cached index.html for SPA routes
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Handle static assets
  if (request.destination === 'script' || request.destination === 'style' || request.destination === 'image' || request.destination === 'font') {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
          return response;
        });
      })
    );
    return;
  }

  // Default: try network, fall back to cache
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// Handle messages from the app
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});