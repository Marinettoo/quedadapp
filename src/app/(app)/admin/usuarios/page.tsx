import { redirect } from "next/navigation";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { AccionBoton } from "@/components/AccionBoton";
import { cambiarRol } from "./actions";
import styles from "./page.module.css";

export const instant = false;

export default async function Usuarios() {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario) {
    redirect("/");
  }
  if (usuario.rol !== "ADMIN") {
    redirect("/panel");
  }

  const usuarios = await prisma.usuario.findMany({
    where: { estado: "APROBADA" },
    orderBy: { nombreUsuario: "asc" },
  });

  return (
    <main className={styles.screen}>
      <AppHeader
        titulo="Usuarios"
        subtitulo="Asciende o desciende administradores. No puedes cambiar tu propio rol."
      />

      <ul className={styles.lista}>
        {usuarios.map((u) => (
          <li key={u.id} className={styles.item}>
            <div>
              <p className={styles.nombre}>{u.nombreUsuario}</p>
              <p className={styles.email}>
                {u.email} · {u.rol === "ADMIN" ? "Administrador" : "Usuario"}
              </p>
            </div>
            {u.id === usuario.id ? (
              <span className={styles.tu}>Tú</span>
            ) : (
              <AccionBoton
                accion={cambiarRol}
                campos={{ usuarioId: u.id }}
                className={u.rol === "ADMIN" ? styles.descender : styles.ascender}
              >
                {u.rol === "ADMIN" ? "Descender a usuario" : "Ascender a admin"}
              </AccionBoton>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
