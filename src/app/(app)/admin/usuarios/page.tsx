import { redirect } from "next/navigation";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { FilaUsuario } from "./FilaUsuario";
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
        subtitulo="Asciende o desciende administradores, o restablece una contraseña. No puedes cambiar tu propio rol."
      />

      <ul className={styles.lista}>
        {usuarios.map((u) => (
          <FilaUsuario key={u.id} usuario={u} esUnoMismo={u.id === usuario.id} />
        ))}
      </ul>
    </main>
  );
}
