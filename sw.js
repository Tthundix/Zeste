/* Zeste : fonctionnement hors ligne.
   Changer VERSION à chaque mise en ligne : les appareils proposent alors la mise à jour. */
const VERSION = 'zeste-0.26.0';
const ASSETS = [
  './', 'index.html', 'app.css', 'app.js', 'data.js', 'manifest.webmanifest',
  'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-192.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png',
  "fonts/big-shoulders-display-latin-700-normal.woff2",  "fonts/big-shoulders-display-latin-800-normal.woff2",  "fonts/figtree-latin-400-normal.woff2",  "fonts/figtree-latin-500-normal.woff2",  "fonts/figtree-latin-600-normal.woff2",  "fonts/figtree-latin-700-normal.woff2",  "fonts/ibm-plex-mono-latin-400-normal.woff2",  "fonts/ibm-plex-mono-latin-500-normal.woff2"
];

self.addEventListener('install', e => {
  // cache: 'reload' contourne le cache HTTP du navigateur : sinon une nouvelle version pourrait enregistrer d'anciens fichiers.
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('zeste-') && k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
      if (res.ok && res.type === 'basic') {
        const copy = res.clone();
        caches.open(VERSION).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => req.mode === 'navigate' ? caches.match('index.html') : Response.error()))
  );
});
