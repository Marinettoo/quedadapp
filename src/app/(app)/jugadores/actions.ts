"use server";

import { revalidatePath } from "next/cache";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { prisma } from "@/lib/db";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { directorioFotos, rutaFoto } from "@/lib/fotos";

const TAMANO_MAXIMO_FOTO = 4 * 1024 * 1024; // 4 MB

async function exigirPermisoFoto(objetivoId: string) {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario || usuario.estado !== "APROBADA") {
    throw new Error("No autorizado.");
  }
  if (objetivoId !== usuario.id && usuario.rol !== "ADMIN") {
    throw new Error("Solo puedes cambiar tu propia foto.");
  }
  return usuario;
}

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

export async function subirFoto(formData: FormData) {
  const objetivoId = String(formData.get("usuarioId"));
  await exigirPermisoFoto(objetivoId);

  const archivo = formData.get("foto");
  if (!(archivo instanceof File) || archivo.size === 0) {
    throw new Error("Elige una imagen.");
  }
  if (archivo.type !== "image/png") {
    throw new Error("La imagen debe ser un PNG (para poder tener fondo transparente).");
  }
  if (archivo.size > TAMANO_MAXIMO_FOTO) {
    throw new Error("La imagen no puede superar los 4 MB.");
  }

  const objetivo = await prisma.usuario.findUnique({ where: { id: objetivoId } });
  if (!objetivo) {
    throw new Error("El jugador no existe.");
  }

  await mkdir(directorioFotos(), { recursive: true });
  const buffer = Buffer.from(await archivo.arrayBuffer());
  await writeFile(rutaFoto(objetivoId), buffer);

  await prisma.usuario.update({
    where: { id: objetivoId },
    data: { fotoActualizadaEn: new Date() },
  });

  revalidatePath("/jugadores");
  revalidatePath(`/jugadores/${objetivoId}`);
}

export async function quitarFoto(formData: FormData) {
  const objetivoId = String(formData.get("usuarioId"));
  await exigirPermisoFoto(objetivoId);

  await rm(rutaFoto(objetivoId), { force: true });
  await prisma.usuario.update({
    where: { id: objetivoId },
    data: { fotoActualizadaEn: null },
  });

  revalidatePath("/jugadores");
  revalidatePath(`/jugadores/${objetivoId}`);
}
