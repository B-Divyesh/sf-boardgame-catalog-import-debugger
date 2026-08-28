// Vite replaces these placeholders at build time with the exact hashed shell.
// Keeping the manifest in the generated worker makes a first offline reopen
// functional without depending on an earlier online reload.
const CACHE = '__CACHE_NAME__';
const CACHE_PREFIX = 'meeple-doctor-shell-';
const SHELL = [
  '/',
  '/privacy/',
  '/terms/',
  '/favicon.svg',
  '/art/inspection-bench-900.webp',
  '/art/inspection-bench-1536.webp',
  ...__PRECACHE_ASSETS__,
];

self.addEventListener('install', (event) => {
  // `reload` prevents a first-page HTTP-cache revalidation from producing a
  // cache key with an empty body while the initial asset request is in flight.
  const shellRequests = SHELL.map((url) => new Request(url, { cache: 'reload' }));
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(shellRequests)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match(event.request, { ignoreVary: true }).then((cached) => cached || caches.match('/', { ignoreVary: true }))));
    return;
  }

  // The hosting response varies on `Origin`, while install requests and page
  // subresource requests can carry different Origin headers for the same URL.
  event.respondWith(caches.match(event.request, { ignoreVary: true }).then((cached) => cached || fetch(event.request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    }
    return response;
  })));
});
