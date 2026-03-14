const CACHE_NAME = "Letterswap-v1";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css",
  "./10letter.js",
  "./i18n.js",
  "./woorden.txt",
  "./woorden_de.txt",
  "./woorden_fr.txt",
  "./woorden_en.txt",
  "./manifest.json",
  "./icons/icon-192b.png",
  "./icons/icon-512b.png",
  "./images/DE.png",
  "./images/EN.png",
  "./images/FR.png",
  "./images/info.png",
  "./images/logoFS.png",
  "./images/new.png",
  "./images/NL.png",
  "./images/oog.png",
  "./images/sluiten.png",
  "./images/taal.png"
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
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request);
    })
  );
});
