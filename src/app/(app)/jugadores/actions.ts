"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obtenerUsuarioSesion } from "@/lib/auth";

export async function valorar(formData: FormData) {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario || usuario.estado !== "APROBADA") {
    throw new Error("No autorizado.");
  }

  const valoradoId = String(formData.get("valoradoId"));
  const estrellas = Number(formData.get("estrellas"));

  if (valoradoId === usuario.id) {
    throw new Error("No puedes valorarte a ti mismo.");
  }
  if (!Number.isInteger(estrellas) || estrellas < 1 || estrellas > 5) {
    throw new Error("La valoración debe ser de 1 a 5 estrellas.");
  }

  const valorado = await prisma.usuario.findUnique({ where: { id: valoradoId } });
  if (!valorado || valorado.estado !== "APROBADA") {
    throw new Error("Ese jugador no existe o no está aprobado.");
  }

  await prisma.valoracion.upsert({
    where: { valoradoId_autorId: { valoradoId, autorId: usuario.id } },
    update: { estrellas },
    create: { valoradoId, autorId: usuario.id, estrellas },
  });

  revalidatePath("/jugadores");
}
