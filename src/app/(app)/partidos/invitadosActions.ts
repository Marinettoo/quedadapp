"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obtenerUsuarioSesion } from "@/lib/auth";

async function exigirAdmin() {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario || usuario.estado !== "APROBADA" || usuario.rol !== "ADMIN") {
    throw new Error("Solo un administrador puede gestionar invitados.");
  }
  return usuario;
}

// Apunta a este partido a un invitado que ya existe (jugó otro partido
// antes): misma persona permanente, pero la valoración y si juega de
// portero son propias de este partido. Así sus goles y estadísticas
// se siguen sumando a la misma persona en vez de crear un duplicado.
export async function apuntarInvitadoExistente(formData: FormData) {
  const usuario = await exigirAdmin();
  const partidoId = String(formData.get("partidoId"));
  const invitadoId = String(formData.get("invitadoId"));
  const estrellas = Number(formData.get("estrellas"));
  const esPortero = formData.get("esPortero") === "on";

  if (!invitadoId) {
    throw new Error("Elige un invitado.");
  }
  if (!Number.isInteger(estrellas) || estrellas < 1 || estrellas > 5) {
    throw new Error("La valoración debe ser de 1 a 5 estrellas.");
  }

  const invitado = await prisma.invitado.findUnique({ where: { id: invitadoId } });
  if (!invitado) {
    throw new Error("Ese invitado no existe.");
  }

  await prisma.asistenciaInvitado.upsert({
    where: { partidoId_invitadoId: { partidoId, invitadoId } },
    update: { estrellas, esPortero },
    create: { partidoId, invitadoId, estrellas, esPortero, anadidoPorId: usuario.id },
  });

  revalidatePath(`/partidos/${partidoId}`);
  revalidatePath(`/partidos/${partidoId}/equipos`);
}

// Crea una persona invitada nueva (nunca antes añadida a ningún
// partido de la peña) y la apunta a este partido. Para alguien que ya
// jugó otro partido, usa apuntarInvitadoExistente en vez de esto.
export async function crearInvitado(formData: FormData) {
  const usuario = await exigirAdmin();
  const partidoId = String(formData.get("partidoId"));
  const nombre = String(formData.get("nombre") ?? "").trim();
  const estrellas = Number(formData.get("estrellas"));
  const esPortero = formData.get("esPortero") === "on";

  if (!nombre) {
    throw new Error("Indica el nombre del invitado.");
  }
  if (!Number.isInteger(estrellas) || estrellas < 1 || estrellas > 5) {
    throw new Error("La valoración debe ser de 1 a 5 estrellas.");
  }

  const invitado = await prisma.invitado.create({
    data: { nombre, creadoPorId: usuario.id },
  });

  await prisma.asistenciaInvitado.create({
    data: { partidoId, invitadoId: invitado.id, estrellas, esPortero, anadidoPorId: usuario.id },
  });

  revalidatePath(`/partidos/${partidoId}`);
  revalidatePath(`/partidos/${partidoId}/equipos`);
}

export async function cambiarEsPorteroInvitado(formData: FormData) {
  await exigirAdmin();
  const partidoId = String(formData.get("partidoId"));
  const invitadoId = String(formData.get("invitadoId"));
  const asistencia = await prisma.asistenciaInvitado.findUnique({
    where: { partidoId_invitadoId: { partidoId, invitadoId } },
  });
  if (!asistencia) {
    throw new Error("Ese invitado no está en este partido.");
  }

  await prisma.asistenciaInvitado.update({
    where: { id: asistencia.id },
    data: { esPortero: !asistencia.esPortero },
  });

  revalidatePath(`/partidos/${partidoId}`);
  revalidatePath(`/partidos/${partidoId}/equipos`);
}

// Quita a este invitado solo de ESTE partido: la persona y sus goles o
// estadísticas de otros partidos no se tocan (igual que cancelar la
// asistencia de un jugador con cuenta no borra su historial).
export async function quitarInvitado(formData: FormData) {
  await exigirAdmin();
  const partidoId = String(formData.get("partidoId"));
  const invitadoId = String(formData.get("invitadoId"));

  await prisma.asistenciaInvitado.deleteMany({ where: { partidoId, invitadoId } });

  revalidatePath(`/partidos/${partidoId}`);
  revalidatePath(`/partidos/${partidoId}/equipos`);
}
