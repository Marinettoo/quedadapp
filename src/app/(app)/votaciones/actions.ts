"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { fechaHoraMadrid } from "@/lib/partidos";
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

const MAX_OPCIONES = 4;

export async function crearVotacion(
  _estadoPrevio: ResultadoFormulario,
  formData: FormData,
): Promise<ResultadoFormulario> {
  const usuario = await exigirUsuarioAprobado();
  if (usuario.rol !== "ADMIN") {
    return { error: "Solo un administrador puede crear una votación." };
  }

  const titulo = String(formData.get("titulo") ?? "").trim() || "Próximo partido";

  const fechas: Date[] = [];
  for (let i = 1; i <= MAX_OPCIONES; i++) {
    const fecha = String(formData.get(`fecha${i}`) ?? "");
    const hora = String(formData.get(`hora${i}`) ?? "");
    if (!fecha || !hora) continue;

    const fechaHora = fechaHoraMadrid(fecha, hora);
    if (Number.isNaN(fechaHora.getTime())) {
      return { error: `La opción ${i} tiene una fecha u hora no válida.` };
    }
    fechas.push(fechaHora);
  }

  if (fechas.length < 2) {
    return { error: "Indica al menos dos opciones de fecha y hora." };
  }

  const votacion = await prisma.votacionFecha.create({
    data: {
      titulo,
      creadaPorId: usuario.id,
      opciones: {
        create: fechas.map((fechaHora) => ({ fechaHora })),
      },
    },
  });

  const resto = await prisma.usuario.findMany({
    where: { estado: "APROBADA", id: { not: usuario.id } },
    select: { id: true },
  });
  await crearNotificacionParaVarios(
    resto.map((u) => u.id),
    {
      tipo: "NUEVA_VOTACION",
      mensaje: `Nueva votación: ${titulo}. Elige tu fecha preferida.`,
      enlace: `/votaciones/${votacion.id}`,
    },
  );

  redirect(`/votaciones/${votacion.id}`);
}

export async function votar(formData: FormData) {
  const usuario = await exigirUsuarioAprobado();
  const votacionId = String(formData.get("votacionId"));
  const opcionId = String(formData.get("opcionId"));

  const votacion = await prisma.votacionFecha.findUnique({ where: { id: votacionId } });
  if (!votacion) {
    throw new Error("La votación no existe.");
  }
  if (votacion.cerrada) {
    throw new Error("Esta votación ya está cerrada.");
  }

  await prisma.votoFecha.upsert({
    where: { votacionId_usuarioId: { votacionId, usuarioId: usuario.id } },
    create: { votacionId, opcionId, usuarioId: usuario.id },
    update: { opcionId, votadoEn: new Date() },
  });

  revalidatePath(`/votaciones/${votacionId}`);
  revalidatePath("/votaciones");
}

export async function cerrarVotacion(formData: FormData) {
  await exigirAdmin();
  const votacionId = String(formData.get("votacionId"));

  await prisma.votacionFecha.update({
    where: { id: votacionId },
    data: { cerrada: true, cerradaEn: new Date() },
  });

  revalidatePath(`/votaciones/${votacionId}`);
  revalidatePath("/votaciones");
}
