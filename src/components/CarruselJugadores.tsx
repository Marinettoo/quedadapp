"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { TarjetaJugador } from "./TarjetaJugador";
import styles from "./CarruselJugadores.module.css";

const INTERVALO_MS = 4500;
const UMBRAL_DESLIZAR_PX = 40;

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
// con foto y estadísticas). Se puede avanzar o retroceder a mano con
// las flechas (debajo de la tarjeta, no encima, para no tocarlas sin
// querer) o deslizando el dedo sobre la tarjeta en móvil. Cualquier
// cambio (automático o manual) reinicia la cuenta atrás del siguiente
// avance automático. Pulsar la tarjeta (sin deslizar) o "Ver todos"
// lleva a la lista completa de jugadores.
export function CarruselJugadores({ jugadores }: { jugadores: JugadorCarrusel[] }) {
  // Arranca en un jugador al azar (no siempre el primero de la lista):
  // 0 en el primer render para que coincida con el HTML del servidor,
  // y se sortea justo después de montar en el cliente.
  const [indice, setIndice] = useState(0);
  const [direccion, setDireccion] = useState(1);
  const reducido = useReducedMotion();
  const deslizar = useRef<{ x: number; movioSuficiente: boolean } | null>(null);

  useEffect(() => {
    if (jugadores.length <= 1) return;
    const id = setTimeout(() => {
      setIndice(Math.floor(Math.random() * jugadores.length));
    }, 0);
    return () => clearTimeout(id);
    // Solo al montar: elegir el punto de partida una vez, no cada vez
    // que cambia la lista de jugadores.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  function alEmpezarDeslizar(e: ReactPointerEvent<HTMLAnchorElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    deslizar.current = { x: e.clientX, movioSuficiente: false };
  }

  function alMoverDeslizar(e: ReactPointerEvent<HTMLAnchorElement>) {
    if (!deslizar.current) return;
    if (Math.abs(e.clientX - deslizar.current.x) > 10) {
      deslizar.current.movioSuficiente = true;
    }
  }

  function alSoltarDeslizar(e: ReactPointerEvent<HTMLAnchorElement>) {
    if (!deslizar.current) return;
    const dx = e.clientX - deslizar.current.x;
    if (Math.abs(dx) > UMBRAL_DESLIZAR_PX && jugadores.length > 1) {
      if (dx < 0) {
        irSiguiente();
      } else {
        irAnterior();
      }
    }
  }

  function alPulsarEnlace(e: ReactMouseEvent<HTMLAnchorElement>) {
    // Si el gesto fue un deslizamiento (para cambiar de tarjeta), no
    // navegar a "Jugadores": solo navega un toque limpio, sin arrastre.
    if (deslizar.current?.movioSuficiente) {
      e.preventDefault();
    }
    deslizar.current = null;
  }

  const jugador = jugadores[indice];
  const tarjeta = <TarjetaJugador key={jugador.jugadorId} {...jugador} />;

  return (
    <div>
      <div className={styles.contenedor}>
        <Link
          href="/jugadores"
          className={styles.carrusel}
          aria-label="Ver todos los jugadores"
          draggable={false}
          onPointerDown={alEmpezarDeslizar}
          onPointerMove={alMoverDeslizar}
          onPointerUp={alSoltarDeslizar}
          onPointerCancel={() => (deslizar.current = null)}
          onClick={alPulsarEnlace}
        >
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
      </div>

      {jugadores.length > 1 && (
        <div className={styles.controles}>
          <button
            type="button"
            onClick={irAnterior}
            className={styles.flecha}
            aria-label="Jugador anterior"
          >
            ‹
          </button>
          <div className={styles.puntos} aria-hidden="true">
            {jugadores.map((j, i) => (
              <span key={j.jugadorId} className={i === indice ? styles.puntoActivo : styles.punto} />
            ))}
          </div>
          <button
            type="button"
            onClick={irSiguiente}
            className={styles.flecha}
            aria-label="Jugador siguiente"
          >
            ›
          </button>
        </div>
      )}

      <Link href="/jugadores" className={styles.pie}>
        Ver todos los jugadores →
      </Link>
    </div>
  );
}
