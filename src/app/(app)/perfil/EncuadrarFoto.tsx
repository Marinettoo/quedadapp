"use client";

import { useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { actualizarEncuadreFoto } from "../jugadores/actions";
import tarjetaStyles from "@/components/TarjetaJugador.module.css";
import styles from "./page.module.css";

// En % del tamaño de la propia foto (no en píxeles): el mismo encuadre
// se ve igual en escritorio y en móvil, donde la foto se renderiza más
// pequeña. Ver TarjetaJugador.module.css (.foto usa clamp() en vez de
// un alto fijo) y el mismo límite en jugadores/actions.ts.
const LIMITE_DESPLAZAMIENTO = 70;
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
  const fotoRef = useRef<HTMLImageElement>(null);
  const inicio = useRef({ x: 0, y: 0, offsetX: 0, offsetY: 0, anchoFoto: 1, altoFoto: 1 });

  function alEmpezar(e: ReactPointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = fotoRef.current?.getBoundingClientRect();
    inicio.current = {
      x: e.clientX,
      y: e.clientY,
      offsetX,
      offsetY,
      // El tamaño real en pantalla de la foto en este momento: hace
      // falta para convertir el arrastre (en px del dedo/ratón) a %
      // relativo a la propia foto, que es como se guarda y se aplica.
      anchoFoto: rect?.width || 1,
      altoFoto: rect?.height || 1,
    };
    setArrastrando(true);
  }

  function alMover(e: ReactPointerEvent<HTMLDivElement>) {
    if (!arrastrando) return;
    const dxPx = e.clientX - inicio.current.x;
    const dyPx = e.clientY - inicio.current.y;
    const dxPorcentaje = (dxPx / inicio.current.anchoFoto) * 100;
    const dyPorcentaje = (dyPx / inicio.current.altoFoto) * 100;
    setOffsetX(limitar(inicio.current.offsetX + dxPorcentaje));
    setOffsetY(limitar(inicio.current.offsetY + dyPorcentaje));
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
          ref={fotoRef}
          src={`/fotos/${jugadorId}?v=${fotoActualizadaEn}`}
          alt=""
          draggable={false}
          className={tarjetaStyles.foto}
          style={{ transform: `translate(${offsetX}%, ${offsetY}%) scale(${escala})` }}
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
