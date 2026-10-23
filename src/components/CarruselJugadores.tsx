"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { TarjetaJugador } from "./TarjetaJugador";
import styles from "./CarruselJugadores.module.css";

const INTERVALO_MS = 4500;

export type JugadorCarrusel = {
  jugadorId: string;
  nombreUsuario: string;
  fotoActualizadaEn: Date | null;
  media: number | null;
  cuenta: number;
  partidosJugados: number;
  golesMarcados: number;
  edad: number | null;
  piernaBuena: string | null;
  fotoOffsetX: number;
  fotoOffsetY: number;
  fotoEscala: number;
};

// Carrusel que va pasando solo, cada pocos segundos, entre las fichas
// de los jugadores de la peña (misma tarjeta que se ve en su ficha,
// con foto y estadísticas). Pulsar en cualquier parte lleva a la lista
// completa de jugadores.
export function CarruselJugadores({ jugadores }: { jugadores: JugadorCarrusel[] }) {
  const [indice, setIndice] = useState(0);
  const reducido = useReducedMotion();

  useEffect(() => {
    if (jugadores.length <= 1) return;
    const id = setInterval(() => {
      setIndice((i) => (i + 1) % jugadores.length);
    }, INTERVALO_MS);
    return () => clearInterval(id);
  }, [jugadores.length]);

  if (jugadores.length === 0) {
    return null;
  }

  const jugador = jugadores[indice];

  return (
    <Link href="/jugadores" className={styles.carrusel} aria-label="Ver todos los jugadores">
      {reducido ? (
        <TarjetaJugador key={jugador.jugadorId} {...jugador} />
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={jugador.jugadorId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <TarjetaJugador {...jugador} />
          </motion.div>
        </AnimatePresence>
      )}

      {jugadores.length > 1 && (
        <div className={styles.puntos} aria-hidden="true">
          {jugadores.map((j, i) => (
            <span key={j.jugadorId} className={i === indice ? styles.puntoActivo : styles.punto} />
          ))}
        </div>
      )}

      <p className={styles.pie}>Ver todos los jugadores →</p>
    </Link>
  );
}
