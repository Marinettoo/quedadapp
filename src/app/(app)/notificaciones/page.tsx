import { redirect } from "next/navigation";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { NotificacionesContenido } from "@/components/NotificacionesContenido";
import styles from "./page.module.css";

export const instant = false;

export default async function Notificaciones() {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario) {
    redirect("/");
  }

  const notificaciones = await prisma.notificacion.findMany({
    where: { usuarioId: usuario.id },
    orderBy: { creadaEn: "desc" },
    take: 50,
  });

  return (
    <main className={styles.screen}>
      <AppHeader titulo="Notificaciones" subtitulo="Novedades de la peña para ti." />
      <NotificacionesContenido
        notificaciones={notificaciones}
        vapidPublicKey={process.env.VAPID_PUBLIC_KEY ?? null}
      />
    </main>
  );
}
