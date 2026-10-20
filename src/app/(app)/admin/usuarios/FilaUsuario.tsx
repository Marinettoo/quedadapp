"use client";

import { useActionState, useState } from "react";
import { AccionBoton } from "@/components/AccionBoton";
import { cambiarRol, restablecerContrasena, cambiarNombreUsuario, quitarUsuario } from "./actions";
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
  const [mostrarNombre, setMostrarNombre] = useState(false);
  const [confirmarQuitar, setConfirmarQuitar] = useState(false);
  const [estadoReset, formActionReset, enviandoReset] = useActionState(
    restablecerContrasena,
    estadoInicial,
  );
  const [estadoNombre, formActionNombre, enviandoNombre] = useActionState(
    cambiarNombreUsuario,
    estadoInicial,
  );

  return (
    <li className={styles.item}>
      <div className={styles.fila}>
        <div>
          <p className={styles.nombre}>{usuario.nombreUsuario}</p>
          <p className={styles.email}>
            {usuario.email} · {usuario.rol === "ADMIN" ? "Administrador" : "Usuario"}
          </p>
        </div>

        <div className={styles.acciones}>
          {esUnoMismo && <span className={styles.tu}>Tú</span>}

          <button
            type="button"
            className={styles.descender}
            onClick={() => setMostrarNombre((v) => !v)}
          >
            {mostrarNombre ? "Cancelar" : "Cambiar nombre"}
          </button>

          {!esUnoMismo && (
            <>
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
              {!confirmarQuitar ? (
                <button
                  type="button"
                  className={styles.descender}
                  onClick={() => setConfirmarQuitar(true)}
                >
                  Quitar
                </button>
              ) : (
                <>
                  <span className={styles.email}>¿Seguro? Pierde el acceso a la app.</span>
                  <AccionBoton
                    accion={quitarUsuario}
                    campos={{ usuarioId: usuario.id }}
                    className={styles.ascender}
                  >
                    Sí, quitar
                  </AccionBoton>
                  <button
                    type="button"
                    className={styles.descender}
                    onClick={() => setConfirmarQuitar(false)}
                  >
                    Cancelar
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {mostrarNombre && (
        <form action={formActionNombre} className={styles.resetForm}>
          <input type="hidden" name="usuarioId" value={usuario.id} />
          <input
            type="text"
            name="nombreUsuario"
            placeholder="Nuevo nombre de usuario"
            defaultValue={usuario.nombreUsuario}
            minLength={3}
            required
          />
          <button type="submit" className={styles.ascender} disabled={enviandoNombre}>
            {enviandoNombre ? "Guardando…" : "Guardar nombre"}
          </button>
          {estadoNombre && "error" in estadoNombre && (
            <p className={styles.aviso}>{estadoNombre.error}</p>
          )}
          {estadoNombre && "ok" in estadoNombre && <p className={styles.aviso}>Nombre actualizado.</p>}
        </form>
      )}

      {!esUnoMismo && mostrarReset && (
        <form action={formActionReset} className={styles.resetForm}>
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
          <button type="submit" className={styles.ascender} disabled={enviandoReset}>
            {enviandoReset ? "Restableciendo…" : "Confirmar restablecimiento"}
          </button>
          {estadoReset && "error" in estadoReset && <p className={styles.aviso}>{estadoReset.error}</p>}
          {estadoReset && "ok" in estadoReset && (
            <p className={styles.aviso}>
              Contraseña restablecida. Comunícasela a {usuario.nombreUsuario} por otra vía.
            </p>
          )}
        </form>
      )}
    </li>
  );
}
