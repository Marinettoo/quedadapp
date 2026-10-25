"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { asistenciaAbierta, fechaHoraMadrid } from "@/lib/partidos";
import { crearNotificacionParaVarios } from "@/lib/notificaciones";
import type { ResultadoFormulario } from "@/app/actions";

function formatearFechaCorta(fecha: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  }).format(fecha);
}

async function exigirUsuarioAprobado() {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario || usuario.estado !== "APROBADA") {
    throw new Error("No autorizado.");
  }
  return usuario;
}

export async function crearPartido(
  _estadoPrevio: ResultadoFormulario,
  formData: FormData,
): Promise<ResultadoFormulario> {
  const usuario = await exigirUsuarioAprobado();
  if (usuario.rol !== "ADMIN") {
    return { error: "Solo un administrador puede crear partidos." };
  }

  const fecha = String(formData.get("fecha") ?? "");
  const hora = String(formData.get("hora") ?? "");
  const horaFinTexto = String(formData.get("horaFin") ?? "");
  const ubicacion = String(formData.get("ubicacion") ?? "").trim();
  const encargadoId = String(formData.get("encargadoId") ?? "");
  const horasCierre = Number(formData.get("horasCierre") ?? 2);

  if (!fecha || !hora) {
    return { error: "Indica fecha y hora del partido." };
  }
  if (!horaFinTexto) {
    return { error: "Indica a qué hora termina el partido." };
  }
  if (!ubicacion) {
    return { error: "Indica la ubicación." };
  }
  if (!encargadoId) {
    return { error: "Elige quién se encarga de la reserva." };
  }
  if (!Number.isFinite(horasCierre) || horasCierre < 0) {
    return { error: "Las horas de antelación para cerrar asistencia no son válidas." };
  }

  const fechaHora = fechaHoraMadrid(fecha, hora);
  if (Number.isNaN(fechaHora.getTime())) {
    return { error: "La fecha u hora no son válidas." };
  }
  const horaFin = fechaHoraMadrid(fecha, horaFinTexto);
  if (Number.isNaN(horaFin.getTime())) {
    return { error: "La hora de fin no es válida." };
  }
  if (horaFin <= fechaHora) {
    return { error: "La hora de fin debe ser posterior a la de inicio (el mismo día)." };
  }

  const encargado = await prisma.usuario.findUnique({ where: { id: encargadoId } });
  if (!encargado || encargado.estado !== "APROBADA") {
    return { error: "La persona encargada debe ser una cuenta aprobada." };
  }

  const partido = await prisma.partido.create({
    data: {
      fechaHora,
      horaFin,
      ubicacion,
      horasCierre,
      encargadoId,
      creadoPorId: usuario.id,
    },
  });

  const resto = await prisma.usuario.findMany({
    where: { estado: "APROBADA", id: { not: usuario.id } },
    select: { id: true },
  });
  await crearNotificacionParaVarios(
    resto.map((u) => u.id),
    {
      tipo: "NUEVO_PARTIDO",
      mensaje: `Nuevo partido: ${formatearFechaCorta(fechaHora)} en ${ubicacion}.`,
      enlace: `/partidos/${partido.id}`,
    },
  );

  redirect(`/partidos/${partido.id}`);
}

async function exigirEncargadoOAdmin(partidoId: string) {
  const usuario = await exigirUsuarioAprobado();
  const partido = await prisma.partido.findUnique({ where: { id: partidoId } });
  if (!partido) {
    throw new Error("El partido no existe.");
  }
  if (usuario.rol !== "ADMIN" && partido.encargadoId !== usuario.id) {
    throw new Error("Solo un administrador o la persona encargada pueden hacer esto.");
  }
  return { usuario, partido };
}

export async function editarPartido(
  _estadoPrevio: ResultadoFormulario,
  formData: FormData,
): Promise<ResultadoFormulario> {
  const partidoId = String(formData.get("partidoId"));
  await exigirEncargadoOAdmin(partidoId);

  const fecha = String(formData.get("fecha") ?? "");
  const hora = String(formData.get("hora") ?? "");
  const horaFinTexto = String(formData.get("horaFin") ?? "");
  const ubicacion = String(formData.get("ubicacion") ?? "").trim();
  const horasCierre = Number(formData.get("horasCierre") ?? 2);

  if (!fecha || !hora) {
    return { error: "Indica fecha y hora del partido." };
  }
  if (!ubicacion) {
    return { error: "Indica la ubicación." };
  }
  if (!Number.isFinite(horasCierre) || horasCierre < 0) {
    return { error: "Las horas de antelación para cerrar asistencia no son válidas." };
  }

  const fechaHora = fechaHoraMadrid(fecha, hora);
  if (Number.isNaN(fechaHora.getTime())) {
    return { error: "La fecha u hora no son válidas." };
  }

  // Opcional (los partidos antiguos no la tenían): si se deja en blanco,
  // se borra la hora de fin en vez de exigirla para poder guardar.
  let horaFin: Date | null = null;
  if (horaFinTexto) {
    horaFin = fechaHoraMadrid(fecha, horaFinTexto);
    if (Number.isNaN(horaFin.getTime())) {
      return { error: "La hora de fin no es válida." };
    }
    if (horaFin <= fechaHora) {
      return { error: "La hora de fin debe ser posterior a la de inicio (el mismo día)." };
    }
  }

  await prisma.partido.update({
    where: { id: partidoId },
    data: { fechaHora, horaFin, ubicacion, horasCierre },
  });

  revalidatePath(`/partidos/${partidoId}`);
  revalidatePath("/panel");
  return { ok: true };
}

export async function eliminarPartido(formData: FormData) {
  const partidoId = String(formData.get("partidoId"));
  await exigirEncargadoOAdmin(partidoId);

  await prisma.partido.delete({ where: { id: partidoId } });

  revalidatePath("/panel");
  redirect("/panel");
}

export async function apuntarse(formData: FormData) {
  const usuario = await exigirUsuarioAprobado();
  const partidoId = String(formData.get("partidoId"));

  const partido = await prisma.partido.findUnique({ where: { id: partidoId } });
  if (!partido) {
    throw new Error("El partido no existe.");
  }
  if (!asistenciaAbierta(partido.fechaHora, partido.horasCierre)) {
    throw new Error("El plazo para apuntarse ya ha cerrado.");
  }

  await prisma.asistencia.upsert({
    where: { partidoId_usuarioId: { partidoId, usuarioId: usuario.id } },
    update: { cancelado: false, canceladoEn: null, apuntadoEn: new Date() },
    create: { partidoId, usuarioId: usuario.id },
  });

  revalidatePath(`/partidos/${partidoId}`);
}

export async function cancelarAsistencia(formData: FormData) {
  const usuario = await exigirUsuarioAprobado();
  const partidoId = String(formData.get("partidoId"));

  const partido = await prisma.partido.findUnique({ where: { id: partidoId } });
  if (!partido) {
    throw new Error("El partido no existe.");
  }
  if (!asistenciaAbierta(partido.fechaHora, partido.horasCierre)) {
    throw new Error("El plazo para cancelar ya ha cerrado.");
  }

  await prisma.asistencia.updateMany({
    where: { partidoId, usuarioId: usuario.id },
    data: { cancelado: true, canceladoEn: new Date() },
  });

  revalidatePath(`/partidos/${partidoId}`);
}

// Si juego de portero es cosa de cada partido, no del jugador en general:
// cada uno marca lo suyo, y el admin o el encargado pueden marcarlo por
// cualquier apuntado (por si alguien se olvida).
export async function cambiarMiPortero(formData: FormData) {
  const usuario = await exigirUsuarioAprobado();
  const partidoId = String(formData.get("partidoId"));

  const asistencia = await prisma.asistencia.findUnique({
    where: { partidoId_usuarioId: { partidoId, usuarioId: usuario.id } },
  });
  if (!asistencia || asistencia.cancelado) {
    throw new Error("Primero tienes que apuntarte al partido.");
  }

  await prisma.asistencia.update({
    where: { id: asistencia.id },
    data: { esPortero: !asistencia.esPortero },
  });

  revalidatePath(`/partidos/${partidoId}`);
}

export async function cambiarPorteroDeUsuario(formData: FormData) {
  const partidoId = String(formData.get("partidoId"));
  await exigirEncargadoOAdmin(partidoId);
  const usuarioId = String(formData.get("usuarioId"));

  const asistencia = await prisma.asistencia.findUnique({
    where: { partidoId_usuarioId: { partidoId, usuarioId } },
  });
  if (!asistencia || asistencia.cancelado) {
    throw new Error("Ese jugador no está apuntado.");
  }

  await prisma.asistencia.update({
    where: { id: asistencia.id },
    data: { esPortero: !asistencia.esPortero },
  });

  revalidatePath(`/partidos/${partidoId}`);
}
