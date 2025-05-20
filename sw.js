const CACHE_NAME = 'malinche-radio';
const CACHE_EXPIRATION = 20 * 60; // 20 minutos en segundos

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/admin.html',
        '/reserva.html'
        // Agrega aquí los recursos adicionales que tu PWA necesita en caché
      ]);
    })
  );
});

self.addEventListener('activate', e => {
  const cacheWhitelist = [CACHE_NAME];

  e.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(e.request).then(response => {
        const fetchPromise = fetch(e.request).then(networkResponse => {
          // Si la respuesta se encuentra en caché, la actualizamos
          if (response) {
            cache.put(e.request, networkResponse.clone());
          }
          return networkResponse;
        });
        return response || fetchPromise;
      });
    })
  );
});

// Manejar la expiración de la caché
self.addEventListener('message', event => {
  if (event.data === 'clearCache') {
    caches.open(CACHE_NAME).then(cache => {
      cache.keys().then(keys => {
        keys.forEach(key => {
          cache.delete(key);
        });
      });
    });
  }
});
