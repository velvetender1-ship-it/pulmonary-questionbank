const V = 'lungqb-v1';
const CORE = ['./', 'index.html', 'css/style.css', 'js/app.js', 'data/questions.js', 'fonts.css', 'manifest.webmanifest', 'icons/favicon.svg',
  'fonts/NotoAr-400.woff2', 'fonts/NotoAr-500.woff2', 'fonts/NotoAr-700.woff2', 'fonts/NotoAr-800.woff2',
  'fonts/PlexLat-400.woff2', 'fonts/PlexLat-500.woff2', 'fonts/PlexLat-600.woff2', 'fonts/PlexLat-700.woff2',
  'fonts/PlexMono-500.woff2', 'fonts/PlexMono-700.woff2', 'fonts/Archivo-400.woff2', 'fonts/NotoLat-400.woff2', 'fonts/NotoLat-700.woff2'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(caches.open(V).then(c => c.match(r, { ignoreSearch: true }).then(hit => {
    const net = fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  })));
});
