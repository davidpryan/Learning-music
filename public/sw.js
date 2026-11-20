// Offline cache: network-first for the page, cache-first for hashed assets.
const CACHE = 'learning-music-v2';
self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './index.html']))); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(e.request);
    if (hit && /\/assets\//.test(e.request.url)) return hit;
    try { const res = await fetch(e.request); if (res.ok) cache.put(e.request, res.clone()); return res; }
    catch (err) { if (hit) return hit; throw err; }
  })());
});
