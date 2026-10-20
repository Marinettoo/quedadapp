"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BallMark } from "./BallMark";
import { ToggleTema } from "./ToggleTema";
import styles from "./Navbar.module.css";

type NavbarProps = {
  esAdmin: boolean;
  solicitudesPendientes: number;
};

const ENLACES_BASE = [
  { href: "/panel", etiqueta: "Inicio" },
  { href: "/jugadores", etiqueta: "Jugadores" },
  { href: "/historial", etiqueta: "Historial" },
];

const ENLACES_ADMIN = [
  { href: "/admin/solicitudes", etiqueta: "Solicitudes" },
  { href: "/admin/usuarios", etiqueta: "Usuarios" },
];

export function Navbar({ esAdmin, solicitudesPendientes }: NavbarProps) {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);
  const enlaces = esAdmin ? [...ENLACES_BASE, ...ENLACES_ADMIN] : ENLACES_BASE;

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
        </ul>

        <div className={styles.acciones}>
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

      {abierto && (
        <ul className={styles.menuMovil}>
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
        </ul>
      )}
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
