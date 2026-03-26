const CACHE = 'my-diary-v3';
const ASSETS = [
  './diary-notes.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Lora:ital,wght@0,400;0,500;1,400&display=swap'
];

// Install: cache all assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      // Cache local files; Google Fonts may fail offline — that's OK
      return cache.addAll(['./diary-notes.html', './manifest.json']).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for local files, network-first for fonts
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always go network for Google Fonts (non-critical)
  if (url.hostname.includes('fonts.google') || url.hostname.includes('fonts.gstatic')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
    return;
  }

  // Cache-first for everything else
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return response;
      });
    })
  );
});
