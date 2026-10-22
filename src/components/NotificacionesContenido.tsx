"use client";

import Link from "next/link";
import { AccionBoton } from "@/components/AccionBoton";
import {
  marcarLeida,
  marcarTodasLeidas,
  borrarNotificacion,
} from "@/app/(app)/notificaciones/actions";
import { ActivarPush } from "@/app/(app)/notificaciones/ActivarPush";
import styles from "@/app/(app)/notificaciones/page.module.css";

type Notificacion = {
  id: string;
  mensaje: string;
  enlace: string | null;
  leidaEn: Date | null;
  creadaEn: Date;
};

function formatearFecha(fecha: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  }).format(fecha);
}

export function NotificacionesContenido({
  notificaciones,
  vapidPublicKey,
  onNavegar,
}: {
  notificaciones: Notificacion[];
  vapidPublicKey: string | null;
  onNavegar?: () => void;
}) {
  const hayNoLeidas = notificaciones.some((n) => !n.leidaEn);

  function alAbrir(id: string) {
    // Se abre (tiene enlace): se da por leída y se borra, no hace
    // falta conservarla.
    const formData = new FormData();
    formData.append("id", id);
    borrarNotificacion(formData);
    onNavegar?.();
  }

  return (
    <>
      <ActivarPush vapidPublicKey={vapidPublicKey} />

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
                  <Link href={n.enlace} className={styles.itemEnlace} onClick={() => alAbrir(n.id)}>
                    {contenido}
                  </Link>
                ) : (
                  <div className={styles.itemEnlace}>{contenido}</div>
                )}
                <div className={styles.itemAcciones}>
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
                  <AccionBoton
                    accion={borrarNotificacion}
                    campos={{ id: n.id }}
                    className={styles.borrarUna}
                    ariaLabel="Borrar notificación"
                  >
                    ✕
                  </AccionBoton>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
