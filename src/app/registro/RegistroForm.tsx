"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registrar, type ResultadoFormulario } from "../actions";
import formStyles from "../page.module.css";
import styles from "./page.module.css";

const estadoInicial: ResultadoFormulario = null;

export function RegistroForm() {
  const [estado, formAction, enviando] = useActionState(registrar, estadoInicial);

  return (
    <form className={formStyles.form} action={formAction}>
      <div className={formStyles.field}>
        <label htmlFor="nombreUsuario">Nombre de usuario</label>
        <input id="nombreUsuario" name="nombreUsuario" type="text" autoComplete="username" required minLength={3} />
      </div>
      <div className={formStyles.field}>
        <label htmlFor="email">Correo</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className={formStyles.field}>
        <label htmlFor="password">Contraseña</label>
        <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
      </div>
      <div className={formStyles.field}>
        <label htmlFor="password2">Repite la contraseña</label>
        <input id="password2" name="password2" type="password" autoComplete="new-password" required minLength={8} />
      </div>
      <button type="submit" className={formStyles.submit} disabled={enviando}>
        {enviando ? "Creando cuenta…" : "Crear cuenta"}
      </button>
      {estado && "error" in estado && <p className={formStyles.aviso}>{estado.error}</p>}
      <p className={styles.back}>
        <Link href="/">Ya tengo cuenta, volver al acceso</Link>
      </p>
    </form>
  );
}
