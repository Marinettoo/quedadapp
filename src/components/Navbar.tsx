"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BallMark } from "./BallMark";
import { ToggleTema } from "./ToggleTema";
import { CampanaNotificaciones } from "./CampanaNotificaciones";
import { AyudaModal } from "./AyudaModal";
import { NotificacionesModal } from "./NotificacionesModal";
import { CreadorModal } from "./CreadorModal";
import styles from "./Navbar.module.css";

type Notificacion = {
  id: string;
  mensaje: string;
  enlace: string | null;
  leidaEn: Date | null;
  creadaEn: Date;
};

type NavbarProps = {
  esAdmin: boolean;
  solicitudesPendientes: number;
  notificaciones: Notificacion[];
  vapidPublicKey: string | null;
};

const ENLACES_BASE = [
  { href: "/panel", etiqueta: "Inicio" },
  { href: "/jugadores", etiqueta: "Jugadores" },
  { href: "/historial", etiqueta: "Historial" },
  { href: "/estadisticas", etiqueta: "Estadísticas" },
  { href: "/votaciones", etiqueta: "Votaciones" },
  { href: "/bote", etiqueta: "Bote" },
];

const ENLACES_ADMIN = [
  { href: "/admin/solicitudes", etiqueta: "Solicitudes" },
  { href: "/admin/usuarios", etiqueta: "Usuarios" },
];

export function Navbar({
  esAdmin,
  solicitudesPendientes,
  notificaciones,
  vapidPublicKey,
}: NavbarProps) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [ayudaAbierta, setAyudaAbierta] = useState(false);
  const [notificacionesAbiertas, setNotificacionesAbiertas] = useState(false);
  const notificacionesNoLeidas = notificaciones.filter((n) => !n.leidaEn).length;
  const enlaces = [...ENLACES_BASE, ...(esAdmin ? ENLACES_ADMIN : [])];

  return (
    <nav className={styles.nav}>
      <div className={styles.contenido}>
        <Link href="/panel" className={styles.marca} onClick={() => setAbierto(false)}>
          <BallMark className={styles.icono} />
          Quedadapp
        </Link>

        <ul className={styles.enlaces}>
          {enlaces.map((enlace) => (
            <li key={enlace.href}>
              <EnlaceNav enlace={enlace} pathname={pathname} solicitudesPendientes={solicitudesPendientes} />
            </li>
          ))}
          <li>
            <button type="button" className={styles.enlace} onClick={() => setAyudaAbierta(true)}>
              ¿Cómo funciona?
            </button>
          </li>
          <li>
            <CreadorModal className={styles.enlacePie} />
          </li>
        </ul>

        <div className={styles.acciones}>
          <CampanaNotificaciones
            noLeidas={notificacionesNoLeidas}
            onClick={() => setNotificacionesAbiertas(true)}
          />
          <ToggleTema className={styles.toggle} />
          <button
            type="button"
            className={abierto ? `${styles.hamburguesa} ${styles.hamburguesaAbierta}` : styles.hamburguesa}
            onClick={() => setAbierto((v) => !v)}
            aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={abierto}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      <ul className={abierto ? `${styles.menuMovil} ${styles.menuMovilAbierto}` : styles.menuMovil}>
        {enlaces.map((enlace) => (
          <li key={enlace.href}>
            <EnlaceNav
              enlace={enlace}
              pathname={pathname}
              solicitudesPendientes={solicitudesPendientes}
              onNavigate={() => setAbierto(false)}
            />
          </li>
        ))}
        <li>
          <button
            type="button"
            className={styles.enlace}
            onClick={() => {
              setAbierto(false);
              setAyudaAbierta(true);
            }}
          >
            ¿Cómo funciona?
          </button>
        </li>
        <li>
          <CreadorModal className={styles.enlacePie} />
        </li>
      </ul>

      <AyudaModal abierto={ayudaAbierta} onCerrar={() => setAyudaAbierta(false)} />
      <NotificacionesModal
        abierto={notificacionesAbiertas}
        onCerrar={() => setNotificacionesAbiertas(false)}
        notificaciones={notificaciones}
        vapidPublicKey={vapidPublicKey}
      />
    </nav>
  );
}

function EnlaceNav({
  enlace,
  pathname,
  solicitudesPendientes,
  onNavigate,
}: {
  enlace: { href: string; etiqueta: string };
  pathname: string;
  solicitudesPendientes: number;
  onNavigate?: () => void;
}) {
  const activo =
    pathname === enlace.href || (enlace.href !== "/panel" && pathname.startsWith(enlace.href));

  return (
    <Link
      href={enlace.href}
      className={activo ? styles.enlaceActivo : styles.enlace}
      onClick={onNavigate}
    >
      {enlace.etiqueta}
      {enlace.href === "/admin/solicitudes" && solicitudesPendientes > 0 && (
        <span className={styles.badge}>{solicitudesPendientes}</span>
      )}
    </Link>
  );
}
