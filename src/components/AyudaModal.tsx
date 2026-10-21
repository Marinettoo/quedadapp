"use client";

import { useEffect } from "react";
import { AyudaContenido } from "./AyudaContenido";
import styles from "./AyudaModal.module.css";

export function AyudaModal({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
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
        aria-label="¿Cómo funciona?"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.cabecera}>
          <div>
            <h2 className={styles.titulo}>¿Cómo funciona?</h2>
            <p className={styles.subtitulo}>Lo esencial de Quedadapp.</p>
          </div>
          <button type="button" className={styles.cerrar} onClick={onCerrar} aria-label="Cerrar">
            ✕
          </button>
        </div>
        <div className={styles.cuerpo}>
          <AyudaContenido />
        </div>
      </div>
    </div>
  );
}
