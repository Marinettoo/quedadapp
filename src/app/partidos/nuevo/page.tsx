import { redirect } from "next/navigation";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { CrearPartidoForm } from "./CrearPartidoForm";
import styles from "./page.module.css";

export const instant = false;

export default async function NuevoPartido() {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario) {
    redirect("/");
  }
  if (usuario.rol !== "ADMIN") {
    redirect("/panel");
  }

  const encargados = await prisma.usuario.findMany({
    where: { estado: "APROBADA" },
    select: { id: true, nombreUsuario: true },
    orderBy: { nombreUsuario: "asc" },
  });

  return (
    <main className={styles.screen}>
      <AppHeader
        titulo="Crear partido"
        subtitulo="El formato (triangular o 2 equipos) se decide solo al generar los equipos, según cuántos se hayan apuntado."
      />
      <CrearPartidoForm encargados={encargados} />
    </main>
  );
}
