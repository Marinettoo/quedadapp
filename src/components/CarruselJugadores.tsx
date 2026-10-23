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

const variantes = {
  entra: (direccion: number) => ({ x: direccion > 0 ? 60 : -60, opacity: 0 }),
  centro: { x: 0, opacity: 1 },
  sale: (direccion: number) => ({ x: direccion > 0 ? -60 : 60, opacity: 0 }),
};

// Carrusel que va pasando solo, cada pocos segundos, entre las fichas
// de los jugadores de la peña (misma tarjeta que se ve en su ficha,
// con foto y estadísticas), con una flecha a cada lado para avanzar o
// retroceder a mano. Cualquier cambio (automático o manual) reinicia
// la cuenta atrás del siguiente avance automático. Pulsar la tarjeta
// o "Ver todos" lleva a la lista completa de jugadores.
export function CarruselJugadores({ jugadores }: { jugadores: JugadorCarrusel[] }) {
  const [indice, setIndice] = useState(0);
  const [direccion, setDireccion] = useState(1);
  const reducido = useReducedMotion();

  useEffect(() => {
    if (jugadores.length <= 1) return;
    const id = setTimeout(() => {
      setDireccion(1);
      setIndice((i) => (i + 1) % jugadores.length);
    }, INTERVALO_MS);
    return () => clearTimeout(id);
    // Se reinicia en cada cambio de tarjeta (automático o manual), así
    // un paso manual no se ve interrumpido enseguida por el automático.
  }, [indice, jugadores.length]);

  if (jugadores.length === 0) {
    return null;
  }

  function irSiguiente() {
    setDireccion(1);
    setIndice((i) => (i + 1) % jugadores.length);
  }

  function irAnterior() {
    setDireccion(-1);
    setIndice((i) => (i - 1 + jugadores.length) % jugadores.length);
  }

  const jugador = jugadores[indice];
  const tarjeta = <TarjetaJugador key={jugador.jugadorId} {...jugador} />;

  return (
    <div>
      <div className={styles.contenedor}>
        {jugadores.length > 1 && (
          <button
            type="button"
            onClick={irAnterior}
            className={`${styles.flecha} ${styles.flechaIzquierda}`}
            aria-label="Jugador anterior"
          >
            ‹
          </button>
        )}

        <Link href="/jugadores" className={styles.carrusel} aria-label="Ver todos los jugadores">
          {reducido ? (
            tarjeta
          ) : (
            <AnimatePresence mode="wait" initial={false} custom={direccion}>
              <motion.div
                key={jugador.jugadorId}
                custom={direccion}
                variants={variantes}
                initial="entra"
                animate="centro"
                exit="sale"
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                <TarjetaJugador {...jugador} />
              </motion.div>
            </AnimatePresence>
          )}
        </Link>

        {jugadores.length > 1 && (
          <button
            type="button"
            onClick={irSiguiente}
            className={`${styles.flecha} ${styles.flechaDerecha}`}
            aria-label="Jugador siguiente"
          >
            ›
          </button>
        )}
      </div>

      {jugadores.length > 1 && (
        <div className={styles.puntos} aria-hidden="true">
          {jugadores.map((j, i) => (
            <span key={j.jugadorId} className={i === indice ? styles.puntoActivo : styles.punto} />
          ))}
        </div>
      )}

      <Link href="/jugadores" className={styles.pie}>
        Ver todos los jugadores →
      </Link>
    </div>
  );
}
