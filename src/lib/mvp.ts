import { prisma } from "./db";
import { crearNotificacionParaVarios } from "./notificaciones";

const HORAS_VOTACION_ABIERTA = 3;

// Sin un proceso en segundo plano (cron) en el servidor, la forma
// sencilla de abrir y cerrar sola la votación de MVP es comprobarlo
// cada vez que alguien visita Inicio: si ya pasó la hora de fin de
// algún partido y todavía no tiene votación, se crea en ese momento;
// si ya pasaron las horas de margen desde que acabó el partido y la
// votación de ese partido sigue abierta, se cierra sola. No es al
// segundo exacto, pero sí automático sin que nadie tenga que
// acordarse de abrirla ni cerrarla a mano.
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

// Deja la votación cerrada y, si hay un ganador claro, lo corona
// (Usuario.esMvpActual, uno como mucho a la vez). Lo reutilizan tanto
// el cierre manual (votaciones/mvp/actions.ts) como el automático de
// aquí abajo, para no calcular el resultado de dos formas distintas.
export async function aplicarCierreVotacionMvp(votacionId: string, ganadorId: string | null) {
  await prisma.$transaction(async (tx) => {
    await tx.votacionMvp.update({
      where: { id: votacionId },
      data: { cerrada: true, cerradaEn: new Date(), ganadorId },
    });
    if (ganadorId) {
      await tx.usuario.updateMany({ where: { esMvpActual: true }, data: { esMvpActual: false } });
      await tx.usuario.update({ where: { id: ganadorId }, data: { esMvpActual: true } });
    }
  });

  return ganadorId
    ? prisma.usuario.findUnique({ where: { id: ganadorId }, select: { nombreUsuario: true } })
    : null;
}

// Pasadas HORAS_VOTACION_ABIERTA desde que acabó el partido, la
// votación se cierra sola. Si en ese momento hay un empate, se cierra
// sin ganador (no se inventa uno al azar ni se elige por nosotros): un
// admin puede reabrirla y desempatar a mano si quiere.
export async function cerrarVotacionesMvpVencidas() {
  const limite = new Date(Date.now() - HORAS_VOTACION_ABIERTA * 60 * 60 * 1000);

  const vencidas = await prisma.votacionMvp.findMany({
    where: { cerrada: false, partido: { horaFin: { lte: limite } } },
    include: { votos: true },
  });

  for (const votacion of vencidas) {
    const cuentas = new Map<string, number>();
    for (const voto of votacion.votos) {
      cuentas.set(voto.candidatoId, (cuentas.get(voto.candidatoId) ?? 0) + 1);
    }
    const maxVotos = Math.max(0, ...cuentas.values());
    const empatados = [...cuentas.entries()].filter(([, n]) => n === maxVotos).map(([id]) => id);
    const ganadorId = maxVotos > 0 && empatados.length === 1 ? empatados[0] : null;

    const ganador = await aplicarCierreVotacionMvp(votacion.id, ganadorId);

    const asistentes = await prisma.asistencia.findMany({
      where: { partidoId: votacion.partidoId, cancelado: false },
      select: { usuarioId: true },
    });
    await crearNotificacionParaVarios(
      asistentes.map((a) => a.usuarioId),
      {
        tipo: "VOTACION_MVP_CERRADA",
        mensaje: ganador
          ? `Votación de MVP cerrada: ${ganador.nombreUsuario} es el MVP.`
          : maxVotos > 0
            ? "Votación de MVP cerrada: empate sin resolver. Un admin puede reabrirla y desempatar."
            : "Votación de MVP cerrada sin ganador (sin votos).",
        enlace: `/votaciones/mvp/${votacion.id}`,
      },
    );
  }
}
