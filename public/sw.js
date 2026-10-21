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

// Notificaciones push: el payload lo manda crearNotificacion() en
// src/lib/notificaciones.ts, como JSON { titulo, mensaje, enlace }.
self.addEventListener("push", (event) => {
  let datos = { titulo: "Quedadapp", mensaje: "Tienes una notificación nueva.", enlace: "/notificaciones" };
  try {
    if (event.data) datos = { ...datos, ...event.data.json() };
  } catch {
    // payload no era JSON válido: nos quedamos con el mensaje por defecto.
  }

  event.waitUntil(
    self.registration.showNotification(datos.titulo, {
      body: datos.mensaje,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { enlace: datos.enlace },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const enlace = event.notification.data?.enlace ?? "/notificaciones";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((lista) => {
      for (const cliente of lista) {
        if (cliente.url.includes(enlace) && "focus" in cliente) {
          return cliente.focus();
        }
      }
      if (lista.length > 0 && "focus" in lista[0]) {
        lista[0].navigate(enlace);
        return lista[0].focus();
      }
      return self.clients.openWindow(enlace);
    }),
  );
});
