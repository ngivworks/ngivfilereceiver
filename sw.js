// NGIV File Receiver — app shell cache.
// Never touches Google traffic or your uploads: only same-origin GET requests are handled.
// After changing any file, bump V (v3 -> v4) so phones pick the new shell up.
const V = 'ngiv-pwa-v3';

const SHELL = [
  './',
  'index.html',
  'config.js',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'apple-touch-icon.png',
  'favicon-48.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(V)
      .then((c) => c.addAll(SHELL))
      .catch(() => {})            // one missing file must not break install
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== V).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;                       // never touch form posts/uploads
  if (new URL(req.url).origin !== location.origin) return; // never touch Apps Script

  // Pages: try the network first so updates appear, fall back to the stored shell offline.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(V).then((c) => c.put('./', copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('./').then((hit) => hit || caches.match('index.html')))
    );
    return;
  }

  // Assets: serve from cache instantly, refresh in the background.
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((hit) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(V).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => hit);
      return hit || network;
    })
  );
});

self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
