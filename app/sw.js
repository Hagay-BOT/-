/* Offline-first service worker: precache the whole app, serve from cache, refresh in background. */
const VERSION = 'v1';
const CACHE = 'gav-hazak-' + VERSION;
const ASSETS = [
  './', 'index.html', 'app.css', 'app.js', 'anim.js', 'moves.js', 'content.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png',
  'fonts/rubik-hebrew-500-normal.woff2', 'fonts/rubik-latin-500-normal.woff2', 'fonts/rubik-hebrew-700-normal.woff2', 'fonts/rubik-latin-700-normal.woff2',
  'fonts/assistant-hebrew-400-normal.woff2', 'fonts/assistant-latin-400-normal.woff2', 'fonts/assistant-hebrew-600-normal.woff2', 'fonts/assistant-latin-600-normal.woff2', 'fonts/assistant-hebrew-700-normal.woff2'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    const old = keys.filter(k => k.startsWith('gav-hazak-') && k !== CACHE);
    await Promise.all(old.map(k => caches.delete(k)));
    await self.clients.claim();
    if (old.length) (await self.clients.matchAll()).forEach(c => c.postMessage('updated'));
  })());
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(req, { ignoreSearch: true }) || (req.mode === 'navigate' ? await cache.match('index.html') : null);
    const net = fetch(req).then(res => { if (res && res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
    if (hit) { e.waitUntil(net); return hit; }
    const res = await net;
    return res || new Response('אין חיבור והקובץ לא נשמר', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  })());
});
