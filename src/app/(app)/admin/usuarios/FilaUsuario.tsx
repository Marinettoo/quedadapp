"use client";

import { useActionState, useState } from "react";
import { AccionBoton } from "@/components/AccionBoton";
import { cambiarRol, restablecerContrasena } from "./actions";
import type { ResultadoFormulario } from "@/app/actions";
import styles from "./page.module.css";

const estadoInicial: ResultadoFormulario = null;

type Usuario = {
  id: string;
  nombreUsuario: string;
  email: string;
  rol: "ADMIN" | "USUARIO";
};

export function FilaUsuario({ usuario, esUnoMismo }: { usuario: Usuario; esUnoMismo: boolean }) {
  const [mostrarReset, setMostrarReset] = useState(false);
  const [estado, formAction, enviando] = useActionState(restablecerContrasena, estadoInicial);

  return (
    <li className={styles.item}>
      <div className={styles.fila}>
        <div>
          <p className={styles.nombre}>{usuario.nombreUsuario}</p>
          <p className={styles.email}>
            {usuario.email} · {usuario.rol === "ADMIN" ? "Administrador" : "Usuario"}
          </p>
        </div>

        {esUnoMismo ? (
          <span className={styles.tu}>Tú</span>
        ) : (
          <div className={styles.acciones}>
            <AccionBoton
              accion={cambiarRol}
              campos={{ usuarioId: usuario.id }}
              className={usuario.rol === "ADMIN" ? styles.descender : styles.ascender}
            >
              {usuario.rol === "ADMIN" ? "Descender a usuario" : "Ascender a admin"}
            </AccionBoton>
            <button
              type="button"
              className={styles.descender}
              onClick={() => setMostrarReset((v) => !v)}
            >
              {mostrarReset ? "Cancelar" : "Restablecer contraseña"}
            </button>
          </div>
        )}
      </div>

      {!esUnoMismo && mostrarReset && (
        <form action={formAction} className={styles.resetForm}>
          <input type="hidden" name="usuarioId" value={usuario.id} />
          <input
            type="password"
            name="password"
            placeholder="Nueva contraseña"
            minLength={8}
            required
            autoComplete="new-password"
          />
          <input
            type="password"
            name="password2"
            placeholder="Repite la contraseña"
            minLength={8}
            required
            autoComplete="new-password"
          />
          <button type="submit" className={styles.ascender} disabled={enviando}>
            {enviando ? "Restableciendo…" : "Confirmar restablecimiento"}
          </button>
          {estado && "error" in estado && <p className={styles.aviso}>{estado.error}</p>}
          {estado && "ok" in estado && (
            <p className={styles.aviso}>
              Contraseña restablecida. Comunícasela a {usuario.nombreUsuario} por otra vía.
            </p>
          )}
        </form>
      )}
    </li>
  );
}
