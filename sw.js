// Keeps the app shell available and never touches Google traffic or your uploads.
// To force phones to refresh the shell after you change files, change v1 to v2, v3, and so on.
const V = 'ngiv-pwa-v1';
const SHELL = ['./', 'index.html', 'config.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'favicon-48.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== V).map(x => caches.delete(x)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith(
    fetch(r).then(res => { if (res.ok) { const copy = res.clone(); caches.open(V).then(c => c.put(r, copy)); } return res; })
      .catch(() => caches.match(r, {ignoreSearch: true}).then(h => h || (r.mode === 'navigate' ? caches.match('./') : undefined)))
  );
});
