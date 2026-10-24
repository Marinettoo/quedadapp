"use client";

import { useActionState } from "react";
import { crearVotacionMvp } from "../actions";
import type { ResultadoFormulario } from "@/app/actions";
import styles from "../../page.module.css";

const estadoInicial: ResultadoFormulario = null;

function formatearFecha(fecha: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  }).format(fecha);
}

export function NuevaVotacionMvpForm({
  partidos,
}: {
  partidos: { id: string; fechaHora: Date; ubicacion: string }[];
}) {
  const [estado, formAction, enviando] = useActionState(crearVotacionMvp, estadoInicial);

  if (partidos.length === 0) {
    return <p className={styles.vacio}>Todavía no hay ningún partido creado.</p>;
  }

  return (
    <form className={styles.form} action={formAction}>
      <div className={styles.field}>
        <label htmlFor="partidoId">Partido</label>
        <select id="partidoId" name="partidoId" required defaultValue="">
          <option value="" disabled>
            Elige un partido
          </option>
          {partidos.map((p) => (
            <option key={p.id} value={p.id}>
              {formatearFecha(p.fechaHora)} · {p.ubicacion}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className={styles.submit} disabled={enviando}>
        {enviando ? "Creando…" : "Crear votación de MVP"}
      </button>
      {estado && "error" in estado && <p className={styles.aviso}>{estado.error}</p>}
    </form>
  );
}
