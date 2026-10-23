"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { actualizarEncuadreFoto } from "../jugadores/actions";
import tarjetaStyles from "@/components/TarjetaJugador.module.css";
import styles from "./page.module.css";

const LIMITE_DESPLAZAMIENTO = 150;
const ESCALA_MIN = 0.6;
const ESCALA_MAX = 1.8;

function limitar(valor: number) {
  return Math.min(LIMITE_DESPLAZAMIENTO, Math.max(-LIMITE_DESPLAZAMIENTO, valor));
}

// Arrastrar + zoom para encuadrar la foto a gusto de cada uno. La vista
// previa usa las mismas clases que la tarjeta real (TarjetaJugador),
// así que lo que se ve aquí es exactamente lo que saldrá en la ficha.
export function EncuadrarFoto({
  jugadorId,
  fotoActualizadaEn,
  offsetXInicial,
  offsetYInicial,
  escalaInicial,
}: {
  jugadorId: string;
  fotoActualizadaEn: number;
  offsetXInicial: number;
  offsetYInicial: number;
  escalaInicial: number;
}) {
  const [offsetX, setOffsetX] = useState(offsetXInicial);
  const [offsetY, setOffsetY] = useState(offsetYInicial);
  const [escala, setEscala] = useState(escalaInicial);
  const [arrastrando, setArrastrando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(true);
  const inicio = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

  function alEmpezar(e: ReactPointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    inicio.current = { x: e.clientX, y: e.clientY, offsetX, offsetY };
    setArrastrando(true);
  }

  function alMover(e: ReactPointerEvent<HTMLDivElement>) {
    if (!arrastrando) return;
    const dx = e.clientX - inicio.current.x;
    const dy = e.clientY - inicio.current.y;
    setOffsetX(limitar(inicio.current.offsetX + dx));
    setOffsetY(limitar(inicio.current.offsetY + dy));
    setGuardado(false);
  }

  function alSoltar() {
    setArrastrando(false);
  }

  function cambiarEscala(valor: number) {
    setEscala(valor);
    setGuardado(false);
  }

  function reiniciar() {
    setOffsetX(0);
    setOffsetY(0);
    setEscala(1);
    setGuardado(false);
  }

  async function guardar() {
    setGuardando(true);
    const formData = new FormData();
    formData.append("offsetX", String(offsetX));
    formData.append("offsetY", String(offsetY));
    formData.append("escala", String(escala));
    await actualizarEncuadreFoto(formData);
    setGuardando(false);
    setGuardado(true);
  }

  return (
    <section className={styles.seccion}>
      <h2 className={styles.subtitulo}>Encuadrar foto</h2>
      <p className={styles.meta}>
        Arrastra la foto para colocarla donde quieras y usa el control para acercarla o alejarla.
      </p>

      <div
        className={tarjetaStyles.ficha}
        style={{ touchAction: "none", cursor: arrastrando ? "grabbing" : "grab" }}
        onPointerDown={alEmpezar}
        onPointerMove={alMover}
        onPointerUp={alSoltar}
        onPointerCancel={alSoltar}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- imagen servida desde disco vía /fotos/[id], no optimizable por next/image */}
        <img
          src={`/fotos/${jugadorId}?v=${fotoActualizadaEn}`}
          alt=""
          draggable={false}
          className={tarjetaStyles.foto}
          style={{ transform: `translate(${offsetX}px, ${offsetY}px) scale(${escala})` }}
        />
      </div>

      <label className={styles.campo}>
        Zoom
        <input
          type="range"
          min={ESCALA_MIN}
          max={ESCALA_MAX}
          step={0.02}
          value={escala}
          onChange={(e) => cambiarEscala(Number(e.target.value))}
        />
      </label>

      <div className={styles.accionesEncuadre}>
        <button type="button" className={styles.boton} onClick={guardar} disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar encuadre"}
        </button>
        <button type="button" className={styles.botonSecundario} onClick={reiniciar}>
          Reiniciar
        </button>
      </div>
      {guardado && <p className={styles.meta}>Encuadre guardado.</p>}
    </section>
  );
}
