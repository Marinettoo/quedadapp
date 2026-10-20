import { redirect } from "next/navigation";
import Link from "next/link";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { salir } from "../actions";
import styles from "./page.module.css";

// Página protegida: necesita la sesión (cookie) en cada petición.
export const instant = false;

export default async function Panel() {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario) {
    redirect("/");
  }

  return (
    <main className={styles.screen}>
      <h1 className={styles.title}>Hola, {usuario.nombreUsuario}</h1>
      <p className={styles.body}>
        Has entrado como {usuario.rol === "ADMIN" ? "administrador" : "usuario"}.
        Todavía no hay partidos que mostrar: es la siguiente etapa del proyecto.
      </p>
      {usuario.rol === "ADMIN" && (
        <Link className={styles.adminLink} href="/admin/solicitudes">
          Revisar solicitudes de acceso
        </Link>
      )}
      <form action={salir}>
        <button type="submit" className={styles.salir}>
          Cerrar sesión
        </button>
      </form>
    </main>
  );
}
