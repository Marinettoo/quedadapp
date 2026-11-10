"use client";

import { useActionState, useState } from "react";
import { editarPartido, eliminarPartido } from "../actions";
import type { ResultadoFormulario } from "@/app/actions";
import { AccionBoton } from "@/components/AccionBoton";
import { AppHeader } from "@/components/AppHeader";
import headerStyles from "@/components/AppHeader.module.css";
import styles from "./page.module.css";

const estadoInicial: ResultadoFormulario = null;

type Partido = {
  id: string;
  fechaHora: Date;
  horaFin: Date | null;
  ubicacion: string;
  horasCierre: number;
};

function paraInputFecha(fecha: Date) {
  const offset = fecha.getTimezoneOffset();
  const local = new Date(fecha.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}

function paraInputHora(fecha: Date) {
  const offset = fecha.getTimezoneOffset();
  const local = new Date(fecha.getTime() - offset * 60000);
  return local.toISOString().slice(11, 16);
}

function IconoLapiz() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconoPapelera() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4.5 7h15M9.5 7V4.8c0-.4.4-.8.8-.8h3.4c.4 0 .8.4.8.8V7M6.5 7l.8 12c.05.9.8 1.6 1.7 1.6h5.9c.9 0 1.65-.7 1.7-1.6l.8-12"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 10.8v6.5M14 10.8v6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

// Cabecera del partido con, si eres admin, un lápiz y una papelera para
// editar o eliminar: antes eran dos botones de texto debajo del cuadro
// de asistencia, pegados a "Apuntados" sin espacio lateral. Al vivir
// aquí (en el layout, arriba del todo) quedan accesibles desde
// cualquier pestaña y solo los ve quien puede usarlos.
export function CabeceraPartido({
  titulo,
  subtitulo,
  esAdmin,
  partido,
}: {
  titulo: string;
  subtitulo: string;
  esAdmin: boolean;
  partido: Partido;
}) {
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const [estado, formAction, enviando] = useActionState(editarPartido, estadoInicial);

  return (
    <>
      <AppHeader
        titulo={titulo}
        subtitulo={subtitulo}
        acciones={
          esAdmin && (
            <>
              <button
                type="button"
                className={headerStyles.iconoAccion}
                aria-label={mostrarEditar ? "Cancelar edición del partido" : "Editar partido"}
                onClick={() => {
                  setMostrarEditar((v) => !v);
                  setConfirmarBorrado(false);
                }}
              >
                <IconoLapiz />
              </button>
              <button
                type="button"
                className={headerStyles.iconoAccion}
                aria-label="Eliminar partido"
                onClick={() => {
                  setConfirmarBorrado((v) => !v);
                  setMostrarEditar(false);
                }}
              >
                <IconoPapelera />
              </button>
            </>
          )
        }
      />

      {esAdmin && mostrarEditar && (
        <form action={formAction} className={styles.importeForm}>
          <input type="hidden" name="partidoId" value={partido.id} />
          <div className={styles.resultadoForm}>
            <input type="date" name="fecha" defaultValue={paraInputFecha(partido.fechaHora)} required />
            <input type="time" name="hora" defaultValue={paraInputHora(partido.fechaHora)} required />
          </div>
          <label htmlFor="horaFin" className={styles.meta}>
            Hora de fin (en blanco si no se sabe aún)
          </label>
          <input
            id="horaFin"
            type="time"
            name="horaFin"
            defaultValue={partido.horaFin ? paraInputHora(partido.horaFin) : ""}
          />
          <input type="text" name="ubicacion" defaultValue={partido.ubicacion} required placeholder="Ubicación" />
          <label htmlFor="horasCierre" className={styles.meta}>
            Horas de antelación para cerrar asistencia
          </label>
          <input
            id="horasCierre"
            type="number"
            name="horasCierre"
            min={0}
            defaultValue={partido.horasCierre}
            required
            className={styles.golesInput}
          />
          <button type="submit" className={styles.generar} disabled={enviando}>
            {enviando ? "Guardando…" : "Guardar cambios"}
          </button>
          {estado && "error" in estado && <p className={styles.aviso}>{estado.error}</p>}
          {estado && "ok" in estado && <p className={styles.aviso}>Cambios guardados.</p>}
        </form>
      )}

      {esAdmin && confirmarBorrado && (
        <div className={styles.editarSeccion}>
          <span className={styles.meta}>
            ¿Seguro? Se borra todo: asistencia, equipos, pagos y resultados.
          </span>
          <div className={styles.editarAcciones}>
            <AccionBoton
              accion={eliminarPartido}
              campos={{ partidoId: partido.id }}
              className={styles.pagoBoton}
            >
              Sí, eliminar
            </AccionBoton>
            <button
              type="button"
              className={styles.pagoBotonSecundario}
              onClick={() => setConfirmarBorrado(false)}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
