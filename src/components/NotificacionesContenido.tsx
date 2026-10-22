"use client";

import Link from "next/link";
import { AccionBoton } from "@/components/AccionBoton";
import {
  marcarLeida,
  marcarTodasLeidas,
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
                  <Link href={n.enlace} className={styles.itemEnlace} onClick={onNavegar}>
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
    </>
  );
}
