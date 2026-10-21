// Script de diagnóstico: manda un push de prueba a todas las
// suscripciones de un usuario y muestra el error completo si falla
// (crearNotificacion, en producción, se traga el error a propósito
// para no romper el resto de la acción).
//
// Uso: npx tsx prisma/probar-push.ts <nombreUsuario>
import "dotenv/config";
import webpush from "web-push";
import { prisma } from "../src/lib/db";

async function main() {
  const nombreUsuario = process.argv[2];
  if (!nombreUsuario) {
    throw new Error("Uso: npx tsx prisma/probar-push.ts <nombreUsuario>");
  }

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  console.log("VAPID_PUBLIC_KEY:", publicKey ? `${publicKey.slice(0, 12)}…` : "(vacío)");
  console.log("VAPID_PRIVATE_KEY:", privateKey ? "definida" : "(vacío)");
  console.log("VAPID_SUBJECT:", subject || "(vacío)");
  if (!publicKey || !privateKey || !subject) {
    throw new Error("Faltan variables VAPID en el entorno. Revisa el .env del servidor.");
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);

  const usuario = await prisma.usuario.findUnique({ where: { nombreUsuario } });
  if (!usuario) {
    throw new Error(`No existe el usuario "${nombreUsuario}".`);
  }

  const suscripciones = await prisma.suscripcionPush.findMany({ where: { usuarioId: usuario.id } });
  console.log(`Suscripciones de ${nombreUsuario}: ${suscripciones.length}`);

  if (suscripciones.length === 0) {
    console.log("No hay ninguna suscripción guardada para este usuario.");
    return;
  }

  const payload = JSON.stringify({
    titulo: "Quedadapp (prueba)",
    mensaje: "Si ves esto, el push funciona.",
    enlace: "/notificaciones",
  });

  for (const s of suscripciones) {
    console.log("\n--- Suscripción", s.id, "---");
    console.log("endpoint:", s.endpoint.slice(0, 60), "…");
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        payload,
      );
      console.log("✅ Enviado sin error.");
    } catch (error) {
      console.log("❌ Falló:");
      console.log(error);
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e.message ?? e);
    await prisma.$disconnect();
    process.exit(1);
  });
