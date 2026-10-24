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
    // foto nueva: se reinicia el encuadre anterior, pensado para la
    // imagen vieja.
    data: { fotoActualizadaEn: new Date(), fotoOffsetX: 0, fotoOffsetY: 0, fotoEscala: 1 },
  });

  revalidatePath("/jugadores");
  revalidatePath(`/jugadores/${objetivoId}`);
  revalidatePath("/perfil");
}

export async function quitarFoto(formData: FormData) {
  const objetivoId = String(formData.get("usuarioId"));
  await exigirPermisoFoto(objetivoId);

  await rm(rutaFoto(objetivoId), { force: true });
  await prisma.usuario.update({
    where: { id: objetivoId },
    data: { fotoActualizadaEn: null, fotoOffsetX: 0, fotoOffsetY: 0, fotoEscala: 1 },
  });

  revalidatePath("/jugadores");
  revalidatePath(`/jugadores/${objetivoId}`);
  revalidatePath("/perfil");
}

// En % del tamaño de la propia foto (no en píxeles): así el mismo
// encuadre se ve igual en pantallas grandes y pequeñas.
const LIMITE_DESPLAZAMIENTO = 70;

export async function actualizarEncuadreFoto(formData: FormData) {
  const objetivoId = String(formData.get("usuarioId"));
  await exigirPermisoFoto(objetivoId);

  const offsetX = Number(formData.get("offsetX"));
  const offsetY = Number(formData.get("offsetY"));
  const escala = Number(formData.get("escala"));

  if (![offsetX, offsetY, escala].every(Number.isFinite)) {
    throw new Error("Encuadre no válido.");
  }

  const clamp = (v: number, limite: number) => Math.min(limite, Math.max(-limite, v));

  await prisma.usuario.update({
    where: { id: objetivoId },
    data: {
      fotoOffsetX: clamp(offsetX, LIMITE_DESPLAZAMIENTO),
      fotoOffsetY: clamp(offsetY, LIMITE_DESPLAZAMIENTO),
      fotoEscala: Math.min(1.8, Math.max(0.6, escala)),
    },
  });

  revalidatePath("/perfil");
  revalidatePath("/jugadores");
  revalidatePath(`/jugadores/${objetivoId}`);
}
