"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

export function LoginForm() {
  const [aviso, setAviso] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAviso("El acceso todavía no está conectado. Es el siguiente paso.");
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.field}>
        <label htmlFor="nombreUsuario">Nombre de usuario</label>
        <input id="nombreUsuario" name="nombreUsuario" type="text" autoComplete="username" required />
      </div>
      <div className={styles.field}>
        <label htmlFor="password">Contraseña</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      <button type="submit" className={styles.submit}>
        Entrar
      </button>
      {aviso && <p className={styles.aviso}>{aviso}</p>}
      <p className={styles.registroLink}>
        ¿No tienes cuenta? <Link href="/registro">Regístrate</Link>
      </p>
      <p className={styles.meta}>
        Las cuentas nuevas quedan pendientes de aprobación por un administrador.
      </p>
    </form>
  );
}
