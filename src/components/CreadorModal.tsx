"use client";

import { useEffect, useState } from "react";
import modalStyles from "./AyudaModal.module.css";
import styles from "./CreadorModal.module.css";

const ENLACES = [
  { etiqueta: "GitHub", href: "https://github.com/Marinettoo" },
  {
    etiqueta: "LinkedIn",
    href: "https://www.linkedin.com/in/jes%C3%BAs-p%C3%A9rez-marinetto-b32292396/",
  },
  { etiqueta: "Instagram", href: "https://www.instagram.com/jesusperezm_/" },
  { etiqueta: "Portfolio", href: "https://marinettoo.es" },
];

export function CreadorModal({ className }: { className?: string }) {
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    function alTeclear(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(false);
    }
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [abierto]);

  return (
    <>
      <button type="button" className={className ?? styles.enlaceDiscreto} onClick={() => setAbierto(true)}>
        Creado por Marinetto
      </button>

      {abierto && (
        <div className={modalStyles.fondo} onClick={() => setAbierto(false)}>
          <div
            className={modalStyles.panel}
            role="dialog"
            aria-modal="true"
            aria-label="Creado por Marinetto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={modalStyles.cabecera}>
              <div>
                <h2 className={modalStyles.titulo}>Marinetto</h2>
              </div>
              <button
                type="button"
                className={modalStyles.cerrar}
                onClick={() => setAbierto(false)}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <div className={modalStyles.cuerpo}>
              <ul className={styles.lista}>
                {ENLACES.map((e) => (
                  <li key={e.etiqueta}>
                    <a href={e.href} target="_blank" rel="noopener noreferrer" className={styles.item}>
                      {e.etiqueta}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
