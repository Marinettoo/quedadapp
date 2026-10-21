import webpush from "web-push";
import { prisma } from "./db";

let vapidConfigurado = false;
function asegurarVapid() {
  if (vapidConfigurado) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (publicKey && privateKey && subject) {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    vapidConfigurado = true;
  }
}

type NuevaNotificacion = {
  usuarioId: string;
  tipo: string;
  mensaje: string;
  enlace?: string;
};

// Crea el aviso en la base de datos (para la campanita) y, si el
// usuario tiene algún dispositivo suscrito, le manda también un push.
// Si el envío push falla (clave no configurada, suscripción caducada...)
// no interrumpe nada: la notificación ya quedó guardada igualmente.
export async function crearNotificacion({ usuarioId, tipo, mensaje, enlace }: NuevaNotificacion) {
  await prisma.notificacion.create({ data: { usuarioId, tipo, mensaje, enlace } });
  await enviarPush(usuarioId, mensaje, enlace);
}

export async function crearNotificacionParaVarios(
  usuarioIds: string[],
  datos: Omit<NuevaNotificacion, "usuarioId">,
) {
  await Promise.all(usuarioIds.map((usuarioId) => crearNotificacion({ usuarioId, ...datos })));
}

async function enviarPush(usuarioId: string, mensaje: string, enlace?: string) {
  asegurarVapid();
  if (!vapidConfigurado) return;

  const suscripciones = await prisma.suscripcionPush.findMany({ where: { usuarioId } });
  if (suscripciones.length === 0) return;

  const payload = JSON.stringify({ titulo: "Quedadapp", mensaje, enlace: enlace ?? "/notificaciones" });

  await Promise.all(
    suscripciones.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
        );
      } catch (error) {
        // 404/410: el navegador invalidó esa suscripción (desinstaló la
        // app, borró datos...). La quitamos para no reintentar siempre.
        const codigo = (error as { statusCode?: number }).statusCode;
        if (codigo === 404 || codigo === 410) {
          await prisma.suscripcionPush.delete({ where: { id: s.id } }).catch(() => {});
        }
      }
    }),
  );
}
