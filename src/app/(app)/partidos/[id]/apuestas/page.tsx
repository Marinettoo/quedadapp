import { notFound, redirect } from "next/navigation";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apuestasAbiertas } from "@/lib/partidos";
import { AppHeader } from "@/components/AppHeader";
import { Apuestas } from "../Apuestas";
import { SubnavPartido } from "../SubnavPartido";
import styles from "../page.module.css";

export const instant = false;

function capitalizar(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function formatearFecha(fecha: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  }).format(fecha);
}

export default async function ApuestasPartido({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const usuario = await obtenerUsuarioSesion();
  if (!usuario) {
    redirect("/");
  }

  const partido = await prisma.partido.findUnique({
    where: { id },
    include: {
      encargado: { select: { nombreUsuario: true } },
      generacion: { select: { formato: true } },
      apuestas: {
        orderBy: { creadaEn: "asc" },
        include: {
          pronosticos: {
            include: { usuario: { select: { id: true, nombreUsuario: true } } },
            orderBy: { creadoEn: "asc" },
          },
        },
      },
    },
  });

  if (!partido) {
    notFound();
  }

  const puedeGenerar = usuario.rol === "ADMIN" || partido.encargadoId === usuario.id;
  const abierto = apuestasAbiertas(partido.fechaHora);
  const permiteApuestas = partido.generacion?.formato === "DOS_EQUIPOS";

  return (
    <main className={styles.screen}>
      <AppHeader
        titulo={capitalizar(formatearFecha(partido.fechaHora))}
        subtitulo={`${partido.ubicacion} · encargado: ${partido.encargado.nombreUsuario}`}
      />

      <SubnavPartido id={partido.id} activa="apuestas" />

      <Apuestas
        partidoId={partido.id}
        apuestas={partido.apuestas}
        usuarioId={usuario.id}
        puedeGenerar={puedeGenerar}
        abierto={abierto}
        permiteApuestas={permiteApuestas}
      />
    </main>
  );
}
