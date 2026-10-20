"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { asistenciaAbierta } from "@/lib/partidos";
import type { ResultadoFormulario } from "@/app/actions";

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
  const ubicacion = String(formData.get("ubicacion") ?? "").trim();
  const encargadoId = String(formData.get("encargadoId") ?? "");
  const horasCierre = Number(formData.get("horasCierre") ?? 2);

  if (!fecha || !hora) {
    return { error: "Indica fecha y hora del partido." };
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

  const fechaHora = new Date(`${fecha}T${hora}`);
  if (Number.isNaN(fechaHora.getTime())) {
    return { error: "La fecha u hora no son válidas." };
  }

  const encargado = await prisma.usuario.findUnique({ where: { id: encargadoId } });
  if (!encargado || encargado.estado !== "APROBADA") {
    return { error: "La persona encargada debe ser una cuenta aprobada." };
  }

  const partido = await prisma.partido.create({
    data: {
      fechaHora,
      ubicacion,
      horasCierre,
      encargadoId,
      creadoPorId: usuario.id,
    },
  });

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

  const fechaHora = new Date(`${fecha}T${hora}`);
  if (Number.isNaN(fechaHora.getTime())) {
    return { error: "La fecha u hora no son válidas." };
  }

  await prisma.partido.update({
    where: { id: partidoId },
    data: { fechaHora, ubicacion, horasCierre },
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
