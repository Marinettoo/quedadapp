"use client";

import { useEffect, useState } from "react";
import styles from "./ToggleTema.module.css";

function IconoSol() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={styles.icono} aria-hidden="true">
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 2.5v2.3M12 19.2v2.3M21.5 12h-2.3M4.8 12H2.5M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6M18.4 18.4l-1.6-1.6M7.2 7.2 5.6 5.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconoLuna() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={styles.icono} aria-hidden="true">
      <path
        d="M20 14.2A8.5 8.5 0 1 1 9.8 4a6.8 6.8 0 0 0 10.2 10.2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ToggleTema({ className }: { className?: string }) {
  const [tema, setTema] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const atributo = document.documentElement.getAttribute("data-theme");
    const inicial: "light" | "dark" =
      atributo === "dark" || atributo === "light"
        ? atributo
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    // Lee el tema real una sola vez al montar: no es una suscripción a un
    // valor externo que cambie con el tiempo, es el estado inicial de la
    // página (atributo ya puesto por el script anti-parpadeo, o preferencia
    // del sistema si el usuario no eligió nada todavía).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTema(inicial);
  }, []);

  function alternar() {
    const siguiente = tema === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", siguiente);
    localStorage.setItem("tema", siguiente);
    setTema(siguiente);
  }

  if (tema === null) {
    return <span className={`${styles.espacio} ${className ?? ""}`} aria-hidden="true" />;
  }

  return (
    <button
      type="button"
      onClick={alternar}
      className={`${styles.boton} ${className ?? ""}`}
      aria-label={tema === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {tema === "dark" ? <IconoSol /> : <IconoLuna />}
    </button>
  );
}
