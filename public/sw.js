// Service worker mínimo: solo existe para cumplir el requisito técnico de
// "instalable" de Android/Chrome. No cachea nada todavía (la app siempre
// necesita datos en vivo del servidor), así que deja pasar todas las
// peticiones tal cual.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Sin caché: deja que el navegador maneje la petición normalmente.
});
