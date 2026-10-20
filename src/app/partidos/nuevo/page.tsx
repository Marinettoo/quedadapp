import { redirect } from "next/navigation";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Volver } from "@/components/Volver";
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
      <Volver />
      <h1 className={styles.title}>Crear partido</h1>
      <p className={styles.nota}>
        El formato (triangular o 2 equipos) se decide solo al generar los
        equipos, según cuántos se hayan apuntado.
      </p>
      <CrearPartidoForm encargados={encargados} />
    </main>
  );
}
