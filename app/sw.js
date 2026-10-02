/* Offline-first service worker.
   - install: precache every asset, bypassing the HTTP cache so a new VERSION never stores old files
   - fetch: cache-first (query string ignored); the network is used only for files missing from the cache.
     Updates arrive as a whole new VERSION, so files from two versions never mix
   - activate: drop old caches and tell open pages an update is ready */
const VERSION = 'v4';
const CACHE = 'gav-hazak-' + VERSION;
const ASSETS = [
  './', 'index.html', 'app.css', 'app.js', 'anim.js', 'moves.js', 'fig3d.js', 'lib/three.min.js', 'content.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png',
  'fonts/rubik-hebrew-500-normal.woff2', 'fonts/rubik-latin-500-normal.woff2', 'fonts/rubik-hebrew-700-normal.woff2', 'fonts/rubik-latin-700-normal.woff2',
  'fonts/assistant-hebrew-400-normal.woff2', 'fonts/assistant-latin-400-normal.woff2', 'fonts/assistant-hebrew-700-normal.woff2', 'fonts/assistant-latin-700-normal.woff2'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
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
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  const scope = new URL(self.registration.scope);
  // navigations to unknown deeper paths: send them back to the app root so relative assets resolve
  if (req.mode === 'navigate') {
    const rel = url.pathname.slice(scope.pathname.length);
    if (rel !== '' && rel !== 'index.html') { e.respondWith(Response.redirect(scope.href, 302)); return; }
  }
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const key = url.origin + url.pathname; // ignore the query string
    const hit = await cache.match(key) || (req.mode === 'navigate' ? await cache.match(scope.href) || await cache.match('index.html') : null);
    if (hit) return hit;
    const res = await fetch(req).catch(() => null);
    return res || new Response('אין חיבור והקובץ לא נשמר', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  })());
});
