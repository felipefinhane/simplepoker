// Service worker: instalabilidade da PWA (sem cache offline — cada fetch
// vai direto pra rede) + notificação push (mudança de blind, ver
// src/lib/push.ts). Precisa estar registrado (RegisterServiceWorker) antes
// de qualquer inscrição de push funcionar — é o browser, não o app, que
// entrega o evento "push" aqui, mesmo com o app fechado.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});

self.addEventListener("push", (event) => {
  let dados = {};
  try {
    dados = event.data ? event.data.json() : {};
  } catch {
    // Payload não era JSON — segue com os valores padrão abaixo.
  }
  const titulo = dados.titulo || "Poker dos Amigos";
  event.waitUntil(
    self.registration.showNotification(titulo, {
      body: dados.corpo || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      // "tag" igual entre notificações da mesma Partida: a próxima troca
      // de nível substitui a anterior em vez de empilhar notificação
      // atrás de notificação enquanto ninguém abre o celular.
      tag: "timer-blind-" + (dados.url || ""),
      data: { url: dados.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((lista) => {
      const aberta = lista.find((cliente) => cliente.url.includes(url));
      if (aberta) return aberta.focus();
      return self.clients.openWindow(url);
    }),
  );
});
