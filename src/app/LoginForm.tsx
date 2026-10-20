"use client";

import { useActionState } from "react";
import Link from "next/link";
import { iniciarSesion, type ResultadoFormulario } from "./actions";
import styles from "./page.module.css";

const estadoInicial: ResultadoFormulario = null;

export function LoginForm() {
  const [estado, formAction, enviando] = useActionState(iniciarSesion, estadoInicial);

  return (
    <form className={styles.form} action={formAction}>
      <div className={styles.field}>
        <label htmlFor="nombreUsuario">Nombre de usuario</label>
        <input id="nombreUsuario" name="nombreUsuario" type="text" autoComplete="username" required />
      </div>
      <div className={styles.field}>
        <label htmlFor="password">Contraseña</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <button type="submit" className={styles.submit} disabled={enviando}>
        {enviando ? "Entrando…" : "Entrar"}
      </button>
      {estado && "error" in estado && <p className={styles.aviso}>{estado.error}</p>}
      <p className={styles.registroLink}>
        ¿No tienes cuenta? <Link href="/registro">Regístrate</Link>
      </p>
      <p className={styles.meta}>
        Las cuentas nuevas quedan pendientes de aprobación por un administrador.
      </p>
    </form>
  );
}
