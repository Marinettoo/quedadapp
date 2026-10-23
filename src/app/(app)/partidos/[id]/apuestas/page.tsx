import { notFound, redirect } from "next/navigation";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { apuestasAbiertas } from "@/lib/partidos";
import { Apuestas } from "../Apuestas";

export const instant = false;

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
  const permiteApuestas = partido.generacion != null;

  return (
    <Apuestas
      partidoId={partido.id}
      apuestas={partido.apuestas}
      usuarioId={usuario.id}
      puedeGenerar={puedeGenerar}
      abierto={abierto}
      permiteApuestas={permiteApuestas}
      formato={partido.generacion?.formato ?? "DOS_EQUIPOS"}
    />
  );
}
