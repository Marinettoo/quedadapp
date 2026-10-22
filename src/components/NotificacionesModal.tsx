"use client";

import { useEffect } from "react";
import { NotificacionesContenido } from "./NotificacionesContenido";
import styles from "./AyudaModal.module.css";

type Notificacion = {
  id: string;
  mensaje: string;
  enlace: string | null;
  leidaEn: Date | null;
  creadaEn: Date;
};

export function NotificacionesModal({
  abierto,
  onCerrar,
  notificaciones,
  vapidPublicKey,
}: {
  abierto: boolean;
  onCerrar: () => void;
  notificaciones: Notificacion[];
  vapidPublicKey: string | null;
}) {
  useEffect(() => {
    if (!abierto) return;
    function alTeclear(e: KeyboardEvent) {
      if (e.key === "Escape") onCerrar();
    }
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div className={styles.fondo} onClick={onCerrar}>
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Notificaciones"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.cabecera}>
          <div>
            <h2 className={styles.titulo}>Notificaciones</h2>
            <p className={styles.subtitulo}>Novedades de la peña para ti.</p>
          </div>
          <button type="button" className={styles.cerrar} onClick={onCerrar} aria-label="Cerrar">
            ✕
          </button>
        </div>
        <div className={styles.cuerpo}>
          <NotificacionesContenido
            notificaciones={notificaciones}
            vapidPublicKey={vapidPublicKey}
            onNavegar={onCerrar}
          />
        </div>
      </div>
    </div>
  );
}
