"use client";

import { AnimatePresence, motion } from "motion/react";

// Envoltorio reutilizable para listas donde los elementos aparecen,
// desaparecen o cambian de orden (apuntados, equipos generados...).
// `motion.ul` con `layout` anima el reflujo cuando un ItemAnimado entra,
// sale o se mueve; AnimatePresence permite animar también la salida.
export function ListaAnimada({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.ul layout className={className}>
      <AnimatePresence initial={false}>{children}</AnimatePresence>
    </motion.ul>
  );
}

const variantes = {
  inicial: { opacity: 0, y: -6 },
  animar: (indice: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.18, delay: Math.min(indice, 10) * 0.03, ease: "easeOut" as const },
  }),
  salida: { opacity: 0, transition: { duration: 0.12 } },
};

// Usar siempre con un `key` único en el elemento (p. ej. key={a.id}),
// y opcionalmente `indice` para escalonar la entrada de la lista.
export function ItemAnimado({
  children,
  className,
  indice = 0,
}: {
  children: React.ReactNode;
  className?: string;
  indice?: number;
}) {
  return (
    <motion.li
      layout
      custom={indice}
      variants={variantes}
      initial="inicial"
      animate="animar"
      exit="salida"
      className={className}
    >
      {children}
    </motion.li>
  );
}
