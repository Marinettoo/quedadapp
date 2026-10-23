"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import styles from "./AyudaModal.module.css";

// Modal flotante reutilizado por "¿Cómo funciona?" y "Notificaciones".
// Animación de entrada: el panel "se despliega" desde una forma de
// píldora (como las que ya usa el resto de la app: navbar, pestañas,
// botones) hasta el bloque redondeado habitual, en vez del típico
// fundido + escala genérico. El fondo solo hace un fundido simple.
// Respeta prefers-reduced-motion mostrando/ocultando sin animación.
export function ModalFlotante({
  abierto,
  onCerrar,
  titulo,
  subtitulo,
  children,
}: {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  subtitulo: string;
  children: React.ReactNode;
}) {
  const prefiereMenosMovimiento = useReducedMotion();

  useEffect(() => {
    if (!abierto) return;
    function alTeclear(e: KeyboardEvent) {
      if (e.key === "Escape") onCerrar();
    }
    document.addEventListener("keydown", alTeclear);
    return () => document.removeEventListener("keydown", alTeclear);
  }, [abierto, onCerrar]);

  const estadoPanel = prefiereMenosMovimiento
    ? {}
    : {
        initial: { opacity: 0, scale: 0.82, borderRadius: "999px" },
        animate: { opacity: 1, scale: 1, borderRadius: "30px" },
        exit: { opacity: 0, scale: 0.82, borderRadius: "999px" },
        transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <AnimatePresence>
      {abierto && (
        <motion.div
          className={styles.fondo}
          onClick={onCerrar}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <motion.div
            className={styles.panel}
            role="dialog"
            aria-modal="true"
            aria-label={titulo}
            onClick={(e) => e.stopPropagation()}
            {...estadoPanel}
          >
            <div className={styles.cabecera}>
              <div>
                <h2 className={styles.titulo}>{titulo}</h2>
                <p className={styles.subtitulo}>{subtitulo}</p>
              </div>
              <button type="button" className={styles.cerrar} onClick={onCerrar} aria-label="Cerrar">
                ✕
              </button>
            </div>
            <div className={styles.cuerpo}>{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
