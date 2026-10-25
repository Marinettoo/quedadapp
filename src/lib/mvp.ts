import { prisma } from "./db";
import { crearNotificacionParaVarios } from "./notificaciones";

// Sin un proceso en segundo plano (cron) en el servidor, la forma
// sencilla de "abrir sola" la votación de MVP al acabar un partido es
// comprobarlo cada vez que alguien visita Inicio: si ya pasó la hora de
// fin de algún partido y todavía no tiene votación, se crea en ese
// momento. No es al segundo exacto, pero sí automático sin que nadie
// tenga que acordarse de crearla a mano.
export async function abrirVotacionesMvpPendientes() {
  const ahora = new Date();

  const partidosSinVotacion = await prisma.partido.findMany({
    where: {
      horaFin: { lte: ahora },
      votacionesMvp: { none: {} },
    },
    select: { id: true, encargadoId: true },
  });

  for (const partido of partidosSinVotacion) {
    const votacion = await prisma.votacionMvp.create({
      data: { partidoId: partido.id, creadaPorId: partido.encargadoId },
    });

    const asistentes = await prisma.asistencia.findMany({
      where: { partidoId: partido.id, cancelado: false },
      select: { usuarioId: true },
    });
    await crearNotificacionParaVarios(
      asistentes.map((a) => a.usuarioId),
      {
        tipo: "NUEVA_VOTACION_MVP",
        mensaje: "El partido ha terminado: vota ya al MVP.",
        enlace: `/votaciones/mvp/${votacion.id}`,
      },
    );
  }
}
