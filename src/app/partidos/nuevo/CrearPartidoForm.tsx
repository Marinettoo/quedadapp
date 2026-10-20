"use client";

import { useActionState } from "react";
import { crearPartido } from "../actions";
import type { ResultadoFormulario } from "../../actions";
import styles from "./page.module.css";

const estadoInicial: ResultadoFormulario = null;

type Encargado = { id: string; nombreUsuario: string };

export function CrearPartidoForm({ encargados }: { encargados: Encargado[] }) {
  const [estado, formAction, enviando] = useActionState(crearPartido, estadoInicial);

  return (
    <form className={styles.form} action={formAction}>
      <div className={styles.field}>
        <label htmlFor="fecha">Fecha</label>
        <input id="fecha" name="fecha" type="date" required />
      </div>
      <div className={styles.field}>
        <label htmlFor="hora">Hora</label>
        <input id="hora" name="hora" type="time" required />
      </div>
      <div className={styles.field}>
        <label htmlFor="ubicacion">Ubicación</label>
        <input id="ubicacion" name="ubicacion" type="text" required />
      </div>
      <div className={styles.field}>
        <label htmlFor="formato">Formato</label>
        <select id="formato" name="formato" required defaultValue="">
          <option value="" disabled>
            Elige un formato
          </option>
          <option value="TRIANGULAR">Triangular (3 equipos)</option>
          <option value="DOS_EQUIPOS">2 equipos</option>
        </select>
      </div>
      <div className={styles.field}>
        <label htmlFor="encargadoId">Persona encargada de la reserva</label>
        <select id="encargadoId" name="encargadoId" required defaultValue="">
          <option value="" disabled>
            Elige quién se encarga
          </option>
          {encargados.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nombreUsuario}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.field}>
        <label htmlFor="horasCierre">Horas de antelación para cerrar asistencia</label>
        <input id="horasCierre" name="horasCierre" type="number" min={0} defaultValue={2} required />
      </div>
      <button type="submit" className={styles.submit} disabled={enviando}>
        {enviando ? "Creando…" : "Crear partido"}
      </button>
      {estado && "error" in estado && <p className={styles.aviso}>{estado.error}</p>}
    </form>
  );
}
