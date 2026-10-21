"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { promediosEstrellas } from "@/lib/valoraciones";
import { generarEquipos, type JugadorGen } from "@/lib/generador";
import { crearNotificacion } from "@/lib/notificaciones";

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
  const invitados = await prisma.invitado.findMany({
    where: { partidoId },
    orderBy: { creadoEn: "asc" },
  });

  if (asistencias.length + invitados.length < 2) {
    throw new Error("Hacen falta al menos 2 jugadores apuntados para generar equipos.");
  }

  const promedios = await promediosEstrellas(asistencias.map((a) => a.usuarioId));

  type Fechado = { fecha: Date; jugador: JugadorGen };
  const combinados: Fechado[] = [
    ...asistencias.map((a) => ({
      fecha: a.apuntadoEn,
      jugador: {
        tipo: "USUARIO" as const,
        id: a.usuarioId,
        nombre: a.usuario.nombreUsuario,
        estrellas: promedios[a.usuarioId],
      },
    })),
    ...invitados.map((i) => ({
      fecha: i.creadoEn,
      jugador: {
        tipo: "INVITADO" as const,
        id: i.id,
        nombre: `${i.nombre} (invitado)`,
        estrellas: i.estrellas,
      },
    })),
  ];
  combinados.sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
  const jugadores: JugadorGen[] = combinados.map((c) => c.jugador);

  const resultado = generarEquipos(jugadores);

  function datosAsignacion(j: JugadorGen, equipo: number) {
    return {
      generacionId: "",
      equipo,
      usuarioId: j.tipo === "USUARIO" ? j.id : null,
      invitadoId: j.tipo === "INVITADO" ? j.id : null,
    };
  }

  await prisma.$transaction(async (tx) => {
    await tx.generacionEquipos.deleteMany({ where: { partidoId } });
    const generacion = await tx.generacionEquipos.create({
      data: { partidoId, formato: resultado.formato, generadoPorId: usuario.id },
    });

    const asignaciones = [
      ...resultado.equipos.flatMap((equipo, indice) =>
        equipo.map((j) => ({ ...datosAsignacion(j, indice + 1), generacionId: generacion.id })),
      ),
      ...resultado.listaEspera.map((j) => ({
        ...datosAsignacion(j, 0),
        generacionId: generacion.id,
      })),
    ];

    if (asignaciones.length > 0) {
      await tx.asignacionEquipo.createMany({ data: asignaciones });
    }
  });

  await Promise.all([
    ...resultado.equipos.flatMap((equipo, indice) =>
      equipo
        .filter((j) => j.tipo === "USUARIO")
        .map((j) =>
          crearNotificacion({
            usuarioId: j.id,
            tipo: "EQUIPOS_GENERADOS",
            mensaje: `Ya están los equipos: vas en el Equipo ${indice + 1}.`,
            enlace: `/partidos/${partidoId}/equipos`,
          }),
        ),
    ),
    ...resultado.listaEspera
      .filter((j) => j.tipo === "USUARIO")
      .map((j) =>
        crearNotificacion({
          usuarioId: j.id,
          tipo: "EQUIPOS_GENERADOS",
          mensaje: "Ya están los equipos: te has quedado en la lista de espera.",
          enlace: `/partidos/${partidoId}/equipos`,
        }),
      ),
  ]);

  revalidatePath(`/partidos/${partidoId}`);
}
