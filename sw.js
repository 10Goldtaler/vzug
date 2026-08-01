// Hält die Weiterleitungsseite lokal vor. Nach dem ersten Besuch startet
// der Scan-Ablauf ohne Netzwerk-Request – das spart den grössten Teil der
// Wartezeit zwischen Binary Eye und vzug.com.
// Bei Änderungen an index.html die Versionsnummer hochzählen.
const CACHE = 'vzug-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(['./', './index.html']))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.mode !== 'navigate' || url.origin !== location.origin) return;

  // Cache zuerst, im Hintergrund aktualisieren.
  e.respondWith(
    caches.match('./index.html').then((hit) => {
      const net = fetch(e.request)
        .then((res) => {
          caches.open(CACHE).then((c) => c.put('./index.html', res.clone()));
          return res;
        })
        .catch(() => hit);
      return hit || net;
    })
  );
});
