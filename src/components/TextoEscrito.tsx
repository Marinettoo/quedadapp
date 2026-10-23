import type { CSSProperties } from "react";
import styles from "./TextoEscrito.module.css";

// Anima un texto "escribiéndose" de izquierda a derecha al aparecer
// (p. ej. la pierna buena en una ficha de jugador). Puro CSS: ancho
// en `ch` revelado con steps() según el número de caracteres, sin
// depender de JavaScript para el propio dibujado. Respeta
// prefers-reduced-motion mostrando el texto entero directamente.
export function TextoEscrito({ texto, retraso = 0 }: { texto: string; retraso?: number }) {
  return (
    <span
      className={styles.textoEscrito}
      style={{ "--chars": texto.length, animationDelay: `${retraso}ms` } as CSSProperties}
    >
      {texto}
    </span>
  );
}
