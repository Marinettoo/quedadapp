"use client";

import { useEffect, useState } from "react";
import styles from "./ToggleTema.module.css";

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
      {tema === "dark" ? "☀" : "☾"}
    </button>
  );
}
