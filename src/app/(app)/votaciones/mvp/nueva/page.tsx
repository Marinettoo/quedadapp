import { redirect } from "next/navigation";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { NuevaVotacionMvpForm } from "./NuevaVotacionMvpForm";
import styles from "../../page.module.css";

export const instant = false;

export default async function NuevaVotacionMvp() {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario) {
    redirect("/");
  }
  if (usuario.rol !== "ADMIN") {
    redirect("/votaciones");
  }

  const partidos = await prisma.partido.findMany({
    orderBy: { fechaHora: "desc" },
    select: { id: true, fechaHora: true, ubicacion: true },
    take: 30,
  });

  return (
    <main className={styles.screen}>
      <AppHeader
        titulo="Votación de MVP"
        subtitulo="Elige el partido: la peña vota entre los apuntados a ese partido."
      />
      <NuevaVotacionMvpForm partidos={partidos} />
    </main>
  );
}
