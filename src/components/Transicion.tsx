"use client";

import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";

// Dentro de /partidos/[id]/*, Resumen/Equipos/Apuestas comparten cabecera
// y pestañas (viven en el layout de esa ruta). Si esta animación se
// disparase con la ruta completa como clave, cambiar de pestaña volvería
// a animar también esa cabecera/pestañas en cada click, aunque en teoría
// se queden montadas: el propio remount de este envoltorio por fuera las
// arrastra. Por eso aquí se usa una clave "de sección" que no distingue
// entre pestañas de un mismo partido, y es ./[id]/layout.tsx quien pone
// un <Transicion> propio alrededor de solo el contenido de cada pestaña.
function seccionDe(pathname: string): string {
  const partes = pathname.split("/").filter(Boolean);
  if (partes[0] === "partidos" && partes[1]) {
    return `/partidos/${partes[1]}`;
  }
  return pathname;
}

// Anima la entrada de cada pantalla al cambiar de ruta: un fundido con
// ligero desplazamiento vertical, sutil y rápido. Deliberadamente SIN
// animación de salida: la pantalla anterior se sustituye al instante (el
// propio cambio de ruta ya es inmediato) y solo la nueva se asienta con
// el fundido. Con salida animada (AnimatePresence + mode="wait") la
// pantalla vieja tenía que desvanecerse del todo antes de que la nueva
// empezara a aparecer, dejando un hueco en blanco que se notaba como un
// salto en vez de un movimiento fluido.
// Respeta prefers-reduced-motion mostrando el cambio sin animación.
//
// `claveCompleta` fuerza a usar la ruta exacta (sin agrupar por sección)
// como clave: se usa en los sitios donde SÍ queremos que anime cada
// cambio de ruta por pequeño que sea, como el contenido de cada pestaña
// de un partido.
export function Transicion({
  children,
  claveCompleta = false,
}: {
  children: React.ReactNode;
  claveCompleta?: boolean;
}) {
  const pathname = usePathname();
  const prefiereMenosMovimiento = useReducedMotion();

  if (prefiereMenosMovimiento) {
    return <>{children}</>;
  }

  return (
    <motion.div
      key={claveCompleta ? pathname : seccionDe(pathname)}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
