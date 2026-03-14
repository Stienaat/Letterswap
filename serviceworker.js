const CACHE_NAME = "Letterswap-v1";

const FILES_TO_CACHE = [
  "/Letterswap/",
  "/Letterswap/index.html",
  "/Letterswap/style.css",
  "/Letterswap/10letter.js",
  "/Letterswap/i18n.js",
  "/Letterswap/woorden.txt",
  "/Letterswap/woorden_de.txt",
  "/Letterswap/woorden_fr.txt",
  "/Letterswap/woorden_en.txt",
  "/Letterswap/manifest.json",
  "/Letterswap/icons/icon-192b.png",
  "/Letterswap/icons/icon-512b.png",
  "/Letterswap/images/DE.png",
  "/Letterswap/images/EN.png",
  "/Letterswap/images/FR.png",
  "/Letterswap/images/info.png",
  "/Letterswap/images/logoFS.png",
  "/Letterswap/images/new.png",
  "/Letterswap/images/NL.png",
  "/Letterswap/images/oog.png",
  "/Letterswap/images/sluiten.png",
  "/Letterswap/images/taal.png",
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return (
        cached ||
        fetch(event.request).then(response => {
          return response;
        })
      );
    })
  );
});
