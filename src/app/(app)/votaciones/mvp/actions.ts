"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { crearNotificacionParaVarios } from "@/lib/notificaciones";
import type { ResultadoFormulario } from "@/app/actions";

async function exigirUsuarioAprobado() {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario || usuario.estado !== "APROBADA") {
    throw new Error("No autorizado.");
  }
  return usuario;
}

async function exigirAdmin() {
  const usuario = await exigirUsuarioAprobado();
  if (usuario.rol !== "ADMIN") {
    throw new Error("Solo un administrador puede hacer esto.");
  }
  return usuario;
}

export async function crearVotacionMvp(
  _estadoPrevio: ResultadoFormulario,
  formData: FormData,
): Promise<ResultadoFormulario> {
  const usuario = await exigirUsuarioAprobado();
  if (usuario.rol !== "ADMIN") {
    return { error: "Solo un administrador puede crear una votación de MVP." };
  }

  const partidoId = String(formData.get("partidoId") ?? "");
  const partido = await prisma.partido.findUnique({ where: { id: partidoId } });
  if (!partido) {
    return { error: "Elige un partido." };
  }

  const votacion = await prisma.votacionMvp.create({
    data: { partidoId, creadaPorId: usuario.id },
  });

  const resto = await prisma.usuario.findMany({
    where: { estado: "APROBADA", id: { not: usuario.id } },
    select: { id: true },
  });
  await crearNotificacionParaVarios(
    resto.map((u) => u.id),
    {
      tipo: "NUEVA_VOTACION_MVP",
      mensaje: "Nueva votación: elige al MVP del partido.",
      enlace: `/votaciones/mvp/${votacion.id}`,
    },
  );

  revalidatePath("/votaciones");
  redirect(`/votaciones/mvp/${votacion.id}`);
}

export async function votarMvp(formData: FormData) {
  const usuario = await exigirUsuarioAprobado();
  const votacionId = String(formData.get("votacionId"));
  const candidatoId = String(formData.get("candidatoId"));

  if (candidatoId === usuario.id) {
    throw new Error("No puedes votarte a ti mismo como MVP.");
  }

  const votacion = await prisma.votacionMvp.findUnique({ where: { id: votacionId } });
  if (!votacion) {
    throw new Error("La votación no existe.");
  }
  if (votacion.cerrada) {
    throw new Error("Esta votación ya está cerrada.");
  }

  await prisma.votoMvp.upsert({
    where: { votacionId_autorId: { votacionId, autorId: usuario.id } },
    create: { votacionId, candidatoId, autorId: usuario.id },
    update: { candidatoId, votadoEn: new Date() },
  });

  revalidatePath(`/votaciones/mvp/${votacionId}`);
  revalidatePath("/votaciones");
}

// Cierra la votación y corona al MVP (Usuario.esMvpActual, uno como
// mucho a la vez: se quita a quien lo tuviera y se pone al ganador).
// Si hay empate, ganadorId es obligatorio (lo elige el admin a mano
// entre los empatados); la propia página solo deja mandar esta acción
// sin ganadorId cuando no hay empate, así que el error de abajo no
// debería saltar en el uso normal.
export async function cerrarVotacionMvp(formData: FormData) {
  await exigirAdmin();
  const votacionId = String(formData.get("votacionId"));
  const ganadorElegido = formData.get("ganadorId");

  const votacion = await prisma.votacionMvp.findUnique({
    where: { id: votacionId },
    include: { votos: true },
  });
  if (!votacion) {
    throw new Error("La votación no existe.");
  }
  if (votacion.cerrada) {
    throw new Error("Esta votación ya está cerrada.");
  }

  const cuentas = new Map<string, number>();
  for (const voto of votacion.votos) {
    cuentas.set(voto.candidatoId, (cuentas.get(voto.candidatoId) ?? 0) + 1);
  }
  const maxVotos = Math.max(0, ...cuentas.values());
  const empatados = [...cuentas.entries()].filter(([, n]) => n === maxVotos).map(([id]) => id);

  let ganadorId: string | null = null;
  if (maxVotos > 0) {
    if (empatados.length === 1) {
      ganadorId = empatados[0];
    } else {
      const elegido = String(ganadorElegido ?? "");
      if (!elegido || !empatados.includes(elegido)) {
        throw new Error("Hay empate: indica cuál de los jugadores empatados gana.");
      }
      ganadorId = elegido;
    }
  }

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

  revalidatePath(`/votaciones/mvp/${votacionId}`);
  revalidatePath("/votaciones");
  revalidatePath("/panel");
  revalidatePath("/jugadores");
  if (ganadorId) {
    revalidatePath(`/jugadores/${ganadorId}`);
  }
}
