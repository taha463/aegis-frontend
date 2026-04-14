// public/sw.js
const CACHE_NAME = "aegis-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/static/js/main.chunk.js",
  "/static/css/main.css",
  // Add your logo and lottie files here
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache)),
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    }),
  );
});
