"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { promediosEstrellas } from "@/lib/valoraciones";
import { generarEquipos, type JugadorGen } from "@/lib/generador";

export async function generarEquiposPartido(formData: FormData) {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario || usuario.estado !== "APROBADA") {
    throw new Error("No autorizado.");
  }

  const partidoId = String(formData.get("partidoId"));
  const partido = await prisma.partido.findUnique({ where: { id: partidoId } });
  if (!partido) {
    throw new Error("El partido no existe.");
  }
  if (usuario.rol !== "ADMIN" && partido.encargadoId !== usuario.id) {
    throw new Error("Solo un administrador o la persona encargada pueden generar los equipos.");
  }

  const asistencias = await prisma.asistencia.findMany({
    where: { partidoId, cancelado: false },
    include: { usuario: { select: { id: true, nombreUsuario: true } } },
    orderBy: { apuntadoEn: "asc" },
  });

  if (asistencias.length < 2) {
    throw new Error("Hacen falta al menos 2 jugadores apuntados para generar equipos.");
  }

  const promedios = await promediosEstrellas(asistencias.map((a) => a.usuarioId));

  const jugadores: JugadorGen[] = asistencias.map((a) => ({
    usuarioId: a.usuarioId,
    nombreUsuario: a.usuario.nombreUsuario,
    estrellas: promedios[a.usuarioId],
  }));

  const resultado = generarEquipos(jugadores);

  await prisma.$transaction(async (tx) => {
    await tx.generacionEquipos.deleteMany({ where: { partidoId } });
    const generacion = await tx.generacionEquipos.create({
      data: { partidoId, formato: resultado.formato, generadoPorId: usuario.id },
    });

    const asignaciones = [
      ...resultado.equipos.flatMap((equipo, indice) =>
        equipo.map((j) => ({ generacionId: generacion.id, usuarioId: j.usuarioId, equipo: indice + 1 })),
      ),
      ...resultado.listaEspera.map((j) => ({
        generacionId: generacion.id,
        usuarioId: j.usuarioId,
        equipo: 0,
      })),
    ];

    if (asignaciones.length > 0) {
      await tx.asignacionEquipo.createMany({ data: asignaciones });
    }
  });

  revalidatePath(`/partidos/${partidoId}`);
}
