const CACHE_NAME = 'leet-dorian-v3';

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/css/style.css',
        '/css/admin.css',
        '/js/menu.js',
        '/js/admin.js',
        '/js/config.js',
        '/assets/logo.svg',
        '/assets/logo-resto-leet-dorian.png'
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
  if (e.request.method !== 'GET') return;

  const url = e.request.url;

  if (
    url.includes('i.ibb.co') ||
    url.includes('imgbb.com') ||
    url.includes('jsonbin.io') ||
    url.includes('api.') ||
    url.includes('fonts.googleapis.com') ||
    url.includes('fonts.gstatic.com')
  ) {
    return;
  }

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
