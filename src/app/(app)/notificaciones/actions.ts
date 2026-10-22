"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obtenerUsuarioSesion } from "@/lib/auth";

async function exigirUsuarioAprobado() {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario || usuario.estado !== "APROBADA") {
    throw new Error("No autorizado.");
  }
  return usuario;
}

export async function guardarSuscripcion(formData: FormData) {
  const usuario = await exigirUsuarioAprobado();
  const endpoint = String(formData.get("endpoint") ?? "");
  const p256dh = String(formData.get("p256dh") ?? "");
  const auth = String(formData.get("auth") ?? "");

  if (!endpoint || !p256dh || !auth) {
    throw new Error("Suscripción push incompleta.");
  }

  await prisma.suscripcionPush.upsert({
    where: { endpoint },
    update: { usuarioId: usuario.id, p256dh, auth },
    create: { usuarioId: usuario.id, endpoint, p256dh, auth },
  });
}

export async function quitarSuscripcion(formData: FormData) {
  await exigirUsuarioAprobado();
  const endpoint = String(formData.get("endpoint") ?? "");
  if (!endpoint) return;
  await prisma.suscripcionPush.deleteMany({ where: { endpoint } });
}

export async function marcarLeida(formData: FormData) {
  const usuario = await exigirUsuarioAprobado();
  const id = String(formData.get("id"));

  await prisma.notificacion.updateMany({
    where: { id, usuarioId: usuario.id, leidaEn: null },
    data: { leidaEn: new Date() },
  });

  revalidatePath("/notificaciones");
}

export async function marcarTodasLeidas() {
  const usuario = await exigirUsuarioAprobado();

  await prisma.notificacion.updateMany({
    where: { usuarioId: usuario.id, leidaEn: null },
    data: { leidaEn: new Date() },
  });

  revalidatePath("/notificaciones");
}

export async function borrarNotificacion(formData: FormData) {
  const usuario = await exigirUsuarioAprobado();
  const id = String(formData.get("id"));

  await prisma.notificacion.deleteMany({ where: { id, usuarioId: usuario.id } });

  revalidatePath("/notificaciones");
}
