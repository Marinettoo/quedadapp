"use client";

import { useActionState } from "react";
import {
  cambiarMiNombreUsuario,
  cambiarMiContrasena,
  actualizarMisDatosJugador,
} from "./actions";
import type { ResultadoFormulario } from "@/app/actions";
import styles from "./page.module.css";

const estadoInicial: ResultadoFormulario = null;

export function EditarPerfil({
  nombreUsuario,
  fechaNacimiento,
  piernaBuena,
}: {
  nombreUsuario: string;
  fechaNacimiento: string;
  piernaBuena: string | null;
}) {
  const [estadoNombre, accionNombre, enviandoNombre] = useActionState(
    cambiarMiNombreUsuario,
    estadoInicial,
  );
  const [estadoPassword, accionPassword, enviandoPassword] = useActionState(
    cambiarMiContrasena,
    estadoInicial,
  );

  return (
    <>
      <section className={styles.seccion}>
        <h2 className={styles.subtitulo}>Datos del jugador</h2>
        <p className={styles.meta}>Opcionales: se muestran en tu ficha si los rellenas.</p>
        <form action={actualizarMisDatosJugador} className={styles.form}>
          <label className={styles.campo}>
            Fecha de nacimiento
            <input type="date" name="fechaNacimiento" defaultValue={fechaNacimiento} />
          </label>
          <label className={styles.campo}>
            Pierna buena
            <select name="piernaBuena" defaultValue={piernaBuena ?? ""}>
              <option value="">Sin indicar</option>
              <option value="DIESTRO">Diestro</option>
              <option value="ZURDO">Zurdo</option>
              <option value="AMBIDIESTRO">Ambidiestro</option>
            </select>
          </label>
          <button type="submit" className={styles.boton}>
            Guardar datos
          </button>
        </form>
      </section>

      <section className={styles.seccion}>
        <h2 className={styles.subtitulo}>Nombre de usuario</h2>
        <form action={accionNombre} className={styles.form}>
          <input
            type="text"
            name="nombreUsuario"
            defaultValue={nombreUsuario}
            required
            minLength={3}
          />
          <button type="submit" className={styles.boton} disabled={enviandoNombre}>
            {enviandoNombre ? "Guardando…" : "Cambiar nombre"}
          </button>
          {estadoNombre && "error" in estadoNombre && (
            <p className={styles.aviso}>{estadoNombre.error}</p>
          )}
          {estadoNombre && "ok" in estadoNombre && (
            <p className={styles.meta}>Nombre actualizado.</p>
          )}
        </form>
      </section>

      <section className={styles.seccion}>
        <h2 className={styles.subtitulo}>Contraseña</h2>
        <form action={accionPassword} className={styles.form}>
          <label className={styles.campo}>
            Contraseña actual
            <input type="password" name="actual" required />
          </label>
          <label className={styles.campo}>
            Contraseña nueva
            <input type="password" name="password" required minLength={8} />
          </label>
          <label className={styles.campo}>
            Repite la contraseña nueva
            <input type="password" name="password2" required minLength={8} />
          </label>
          <button type="submit" className={styles.boton} disabled={enviandoPassword}>
            {enviandoPassword ? "Guardando…" : "Cambiar contraseña"}
          </button>
          {estadoPassword && "error" in estadoPassword && (
            <p className={styles.aviso}>{estadoPassword.error}</p>
          )}
          {estadoPassword && "ok" in estadoPassword && (
            <p className={styles.meta}>Contraseña actualizada.</p>
          )}
        </form>
      </section>
    </>
  );
}
