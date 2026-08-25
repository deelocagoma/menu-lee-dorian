const CACHE_NAME = 'pili-pili-v3';

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
  // Ignorer les requêtes non-GET
  if (e.request.method !== 'GET') return;

  const url = e.request.url;

  // Laisser passer directement sans cache : images externes, API JSONBin, ImgBB
  if (
    url.includes('i.ibb.co') ||
    url.includes('imgbb.com') ||
    url.includes('jsonbin.io') ||
    url.includes('api.') ||
    url.includes('fonts.googleapis.com') ||
    url.includes('fonts.gstatic.com')
  ) {
    return; // Ne pas intercepter, laisser le navigateur gérer normalement
  }

  // Pour les ressources locales uniquement : network-first
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(e.request, resClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(e.request);
      })
  );
});
