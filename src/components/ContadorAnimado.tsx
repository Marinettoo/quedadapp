"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

// Anima un número contando rápido desde 0 hasta su valor final al
// aparecer en pantalla (p. ej. las estadísticas de una ficha de
// jugador). Respeta prefers-reduced-motion mostrando el valor final
// directamente, sin animar.
export function ContadorAnimado({
  valor,
  decimales = 0,
  retraso = 0,
  duracion = 650,
}: {
  valor: number;
  decimales?: number;
  retraso?: number;
  duracion?: number;
}) {
  const reducido = useReducedMotion();
  const [mostrado, setMostrado] = useState(0);

  useEffect(() => {
    if (reducido) return;

    let marco: number;
    let inicio: number | null = null;

    const temporizador = setTimeout(() => {
      function paso(marca: number) {
        if (inicio === null) inicio = marca;
        const progreso = Math.min(1, (marca - inicio) / duracion);
        const suavizado = 1 - Math.pow(1 - progreso, 3);
        setMostrado(valor * suavizado);
        if (progreso < 1) {
          marco = requestAnimationFrame(paso);
        }
      }
      marco = requestAnimationFrame(paso);
    }, retraso);

    return () => {
      clearTimeout(temporizador);
      cancelAnimationFrame(marco);
    };
  }, [valor, reducido, retraso, duracion]);

  return <>{(reducido ? valor : mostrado).toFixed(decimales)}</>;
}
