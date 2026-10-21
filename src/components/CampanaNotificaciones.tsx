import Link from "next/link";
import styles from "./CampanaNotificaciones.module.css";

export function CampanaNotificaciones({ noLeidas }: { noLeidas: number }) {
  return (
    <Link
      href="/notificaciones"
      className={styles.boton}
      aria-label={noLeidas > 0 ? `Notificaciones, ${noLeidas} sin leer` : "Notificaciones"}
    >
      <svg viewBox="0 0 24 24" fill="none" className={styles.icono} aria-hidden="true">
        <path
          d="M18 16v-5a6 6 0 1 0-12 0v5l-1.8 2.4c-.3.4 0 1 .5 1h14.6c.5 0 .8-.6.5-1L18 16Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path d="M9.5 20.5a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      {noLeidas > 0 && (
        <span className={styles.badge}>{noLeidas > 9 ? "9+" : noLeidas}</span>
      )}
    </Link>
  );
}
