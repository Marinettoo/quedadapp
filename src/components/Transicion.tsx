"use client";

import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

// Anima la entrada/salida de cada pantalla al cambiar de ruta: un fundido
// con ligero desplazamiento vertical, sutil y rápido. Respeta
// prefers-reduced-motion (useReducedMotion) mostrando el cambio sin
// animación para quien lo tenga activado.
export function Transicion({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prefiereMenosMovimiento = useReducedMotion();

  if (prefiereMenosMovimiento) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
