// Service worker mínimo: só o necessário para o navegador considerar o app
// instalável (PWA). Sem cache offline nesta versão — cada fetch vai direto
// para a rede. Cache/offline pode ser adicionado depois, se fizer falta.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
