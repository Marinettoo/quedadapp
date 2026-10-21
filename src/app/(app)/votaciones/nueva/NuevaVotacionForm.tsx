"use client";

import { useActionState } from "react";
import { crearVotacion } from "../actions";
import type { ResultadoFormulario } from "@/app/actions";
import styles from "../page.module.css";

const estadoInicial: ResultadoFormulario = null;

export function NuevaVotacionForm() {
  const [estado, formAction, enviando] = useActionState(crearVotacion, estadoInicial);

  return (
    <form className={styles.form} action={formAction}>
      <div className={styles.field}>
        <label htmlFor="titulo">Título</label>
        <input
          id="titulo"
          name="titulo"
          type="text"
          placeholder="Próximo partido"
        />
      </div>

      <p className={styles.meta}>Indica al menos dos fechas y horas candidatas.</p>

      {[1, 2, 3, 4].map((n) => (
        <div key={n} className={styles.opcion}>
          <div className={styles.field}>
            <label htmlFor={`fecha${n}`}>Fecha {n}</label>
            <input id={`fecha${n}`} name={`fecha${n}`} type="date" required={n <= 2} />
          </div>
          <div className={styles.field}>
            <label htmlFor={`hora${n}`}>Hora {n}</label>
            <input id={`hora${n}`} name={`hora${n}`} type="time" required={n <= 2} />
          </div>
        </div>
      ))}

      <button type="submit" className={styles.submit} disabled={enviando}>
        {enviando ? "Creando…" : "Crear votación"}
      </button>
      {estado && "error" in estado && <p className={styles.aviso}>{estado.error}</p>}
    </form>
  );
}
