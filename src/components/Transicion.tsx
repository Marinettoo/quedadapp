"use client";

import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";

// Anima la entrada de cada pantalla al cambiar de ruta: un fundido con
// ligero desplazamiento vertical, sutil y rápido. Deliberadamente SIN
// animación de salida: la pantalla anterior se sustituye al instante (el
// propio cambio de ruta ya es inmediato) y solo la nueva se asienta con
// el fundido. Con salida animada (AnimatePresence + mode="wait") la
// pantalla vieja tenía que desvanecerse del todo antes de que la nueva
// empezara a aparecer, dejando un hueco en blanco que se notaba como un
// salto en vez de un movimiento fluido.
// Respeta prefers-reduced-motion mostrando el cambio sin animación.
export function Transicion({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prefiereMenosMovimiento = useReducedMotion();

  if (prefiereMenosMovimiento) {
    return <>{children}</>;
  }

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
