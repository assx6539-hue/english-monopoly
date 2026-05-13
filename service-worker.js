// English Monopoly PWA — Service Worker (network-first, auto-update)
// Strategy: always try the network first; fall back to cache only when offline.
// This guarantees that pushed updates appear immediately, while still allowing
// the game to be played without internet (PWA install).

const CACHE_NAME = 'english-monopoly-runtime';

// On install: skip the standard 4-step wait — activate immediately.
self.addEventListener('install', e => {
  self.skipWaiting();
});

// On activate: clean old caches and take control of all open pages right away.
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// On fetch: try network first, save fresh copy to cache, fallback to cache offline.
self.addEventListener('fetch', e => {
  const req = e.request;
  // Only handle GET requests
  if (req.method !== 'GET') return;

  e.respondWith((async () => {
    try {
      const fresh = await fetch(req, { cache: 'no-store' });
      // Store a copy for offline fallback (only same-origin successful responses)
      if (fresh.ok && new URL(req.url).origin === self.location.origin) {
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch (err) {
      // Offline — try cache
      const cached = await caches.match(req);
      if (cached) return cached;
      // Last resort: tell the user
      return new Response('Offline and no cached copy', { status: 503 });
    }
  })());
});

// Listen for manual "skipWaiting" from the page (instant update on demand)
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
