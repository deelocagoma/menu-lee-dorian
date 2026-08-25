const CACHE_NAME = 'pili-pili-v2';

self.addEventListener('install', (e) => {
  self.skipWaiting(); // Force SW activation
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/css/style.css',
        '/js/menu.js',
        '/js/config.js',
        '/assets/logo.jpg'
      ]);
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // Ignorer les requêtes non-GET (ex: POST pour l'upload d'images ou update API)
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Optionnel : mettre en cache les requêtes réussies (même externes)
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          // On ne cache que les requêtes http/https (évite les erreurs sur extensions chrome etc)
          if (e.request.url.startsWith('http')) {
             cache.put(e.request, resClone);
          }
        });
        return response;
      })
      .catch(() => {
        // Si pas de réseau, on cherche dans le cache
        return caches.match(e.request);
      })
  );
});
