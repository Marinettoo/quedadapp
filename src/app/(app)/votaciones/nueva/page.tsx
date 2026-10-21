import { redirect } from "next/navigation";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { AppHeader } from "@/components/AppHeader";
import { NuevaVotacionForm } from "./NuevaVotacionForm";
import styles from "../page.module.css";

export const instant = false;

export default async function NuevaVotacion() {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario) {
    redirect("/");
  }
  if (usuario.rol !== "ADMIN") {
    redirect("/votaciones");
  }

  return (
    <main className={styles.screen}>
      <AppHeader
        titulo="Crear votación"
        subtitulo="Propón varias fechas y horas para que la peña elija cuál le viene mejor."
      />
      <NuevaVotacionForm />
    </main>
  );
}
