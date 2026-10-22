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

export async function agregarInvitado(formData: FormData) {
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

  await prisma.invitado.create({
    data: { partidoId, nombre, estrellas, esPortero, anadidoPorId: usuario.id },
  });

  revalidatePath(`/partidos/${partidoId}`);
}

export async function cambiarEsPorteroInvitado(formData: FormData) {
  await exigirAdmin();
  const partidoId = String(formData.get("partidoId"));
  const id = String(formData.get("id"));
  const invitado = await prisma.invitado.findUnique({ where: { id } });
  if (!invitado) {
    throw new Error("El invitado no existe.");
  }

  await prisma.invitado.update({
    where: { id },
    data: { esPortero: !invitado.esPortero },
  });

  revalidatePath(`/partidos/${partidoId}`);
}

export async function quitarInvitado(formData: FormData) {
  await exigirAdmin();
  const partidoId = String(formData.get("partidoId"));
  const id = String(formData.get("id"));

  await prisma.invitado.delete({ where: { id } });

  revalidatePath(`/partidos/${partidoId}`);
}
