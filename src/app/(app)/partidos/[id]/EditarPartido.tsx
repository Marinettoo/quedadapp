"use client";

import { useActionState, useState } from "react";
import { editarPartido, eliminarPartido } from "../actions";
import type { ResultadoFormulario } from "@/app/actions";
import { AccionBoton } from "@/components/AccionBoton";
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

export function EditarPartido({ partido }: { partido: Partido }) {
  const [mostrarEditar, setMostrarEditar] = useState(false);
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const [estado, formAction, enviando] = useActionState(editarPartido, estadoInicial);

  return (
    <section className={styles.editarSeccion}>
      <div className={styles.editarAcciones}>
        <button
          type="button"
          className={styles.pagoBotonSecundario}
          onClick={() => {
            setMostrarEditar((v) => !v);
            setConfirmarBorrado(false);
          }}
        >
          {mostrarEditar ? "Cancelar" : "Editar partido"}
        </button>

        {!confirmarBorrado ? (
          <button
            type="button"
            className={styles.pagoBotonSecundario}
            onClick={() => {
              setConfirmarBorrado(true);
              setMostrarEditar(false);
            }}
          >
            Eliminar partido
          </button>
        ) : (
          <>
            <span className={styles.meta}>
              ¿Seguro? Se borra todo: asistencia, equipos, pagos y resultados.
            </span>
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
          </>
        )}
      </div>

      {mostrarEditar && (
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
    </section>
  );
}
