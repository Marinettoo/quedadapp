import { redirect } from "next/navigation";
import Link from "next/link";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { AccionBoton } from "@/components/AccionBoton";
import { marcarLeida, marcarTodasLeidas } from "./actions";
import { ActivarPush } from "./ActivarPush";
import styles from "./page.module.css";

export const instant = false;

function formatearFecha(fecha: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  }).format(fecha);
}

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
  const hayNoLeidas = notificaciones.some((n) => !n.leidaEn);

  return (
    <main className={styles.screen}>
      <AppHeader titulo="Notificaciones" subtitulo="Novedades de la peña para ti." />

      <ActivarPush vapidPublicKey={process.env.VAPID_PUBLIC_KEY ?? null} />

      {hayNoLeidas && (
        <form action={marcarTodasLeidas}>
          <button type="submit" className={styles.marcarTodas}>
            Marcar todas como leídas
          </button>
        </form>
      )}

      {notificaciones.length === 0 ? (
        <p className={styles.vacio}>Todavía no tienes notificaciones.</p>
      ) : (
        <ul className={styles.lista}>
          {notificaciones.map((n) => {
            const contenido = (
              <>
                <span className={styles.mensaje}>{n.mensaje}</span>
                <span className={styles.fecha}>{formatearFecha(n.creadaEn)}</span>
              </>
            );
            return (
              <li
                key={n.id}
                className={n.leidaEn ? styles.item : `${styles.item} ${styles.itemNoLeido}`}
              >
                {n.enlace ? (
                  <Link href={n.enlace} className={styles.itemEnlace}>
                    {contenido}
                  </Link>
                ) : (
                  <div className={styles.itemEnlace}>{contenido}</div>
                )}
                {!n.leidaEn && (
                  <AccionBoton
                    accion={marcarLeida}
                    campos={{ id: n.id }}
                    className={styles.marcarUna}
                    ariaLabel="Marcar como leída"
                  >
                    ✓
                  </AccionBoton>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
