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

async function exigirEncargadoOAdmin(partidoId: string, usuario: { id: string; rol: string }) {
  const partido = await prisma.partido.findUnique({ where: { id: partidoId } });
  if (!partido) {
    throw new Error("El partido no existe.");
  }
  if (usuario.rol !== "ADMIN" && partido.encargadoId !== usuario.id) {
    throw new Error("Solo un administrador o la persona encargada pueden hacer esto.");
  }
  return partido;
}

async function jugadorEnEquipo(partidoId: string, usuarioId: string) {
  const asignacion = await prisma.asignacionEquipo.findFirst({
    where: { usuarioId, equipo: { gt: 0 }, generacion: { partidoId } },
  });
  return asignacion !== null;
}

export async function establecerImporte(formData: FormData) {
  const usuario = await exigirUsuarioAprobado();
  const partidoId = String(formData.get("partidoId"));
  await exigirEncargadoOAdmin(partidoId, usuario);

  const importe = Number(formData.get("importeTotal"));
  if (!Number.isFinite(importe) || importe < 0) {
    throw new Error("El importe no es válido.");
  }

  await prisma.partido.update({ where: { id: partidoId }, data: { importeTotal: importe } });
  revalidatePath(`/partidos/${partidoId}`);
}

export async function indicarPago(formData: FormData) {
  const usuario = await exigirUsuarioAprobado();
  const partidoId = String(formData.get("partidoId"));

  if (!(await jugadorEnEquipo(partidoId, usuario.id))) {
    throw new Error("Solo pueden indicar el pago quienes están asignados a un equipo.");
  }

  await prisma.pago.upsert({
    where: { partidoId_usuarioId: { partidoId, usuarioId: usuario.id } },
    update: { indicadoEn: new Date() },
    create: { partidoId, usuarioId: usuario.id, indicadoEn: new Date() },
  });

  revalidatePath(`/partidos/${partidoId}`);
}

export async function deshacerIndicacion(formData: FormData) {
  const usuario = await exigirUsuarioAprobado();
  const partidoId = String(formData.get("partidoId"));

  await prisma.pago.updateMany({
    where: { partidoId, usuarioId: usuario.id, confirmadoEn: null },
    data: { indicadoEn: null },
  });

  revalidatePath(`/partidos/${partidoId}`);
}

export async function confirmarPago(formData: FormData) {
  const usuario = await exigirUsuarioAprobado();
  const partidoId = String(formData.get("partidoId"));
  const objetivoId = String(formData.get("usuarioId"));
  await exigirEncargadoOAdmin(partidoId, usuario);

  if (!(await jugadorEnEquipo(partidoId, objetivoId))) {
    throw new Error("Ese jugador no está asignado a un equipo en este partido.");
  }

  await prisma.pago.upsert({
    where: { partidoId_usuarioId: { partidoId, usuarioId: objetivoId } },
    update: { confirmadoEn: new Date(), confirmadoPorId: usuario.id },
    create: {
      partidoId,
      usuarioId: objetivoId,
      indicadoEn: new Date(),
      confirmadoEn: new Date(),
      confirmadoPorId: usuario.id,
    },
  });

  // Si ya existía pero sin indicar, lo marcamos también como indicado.
  await prisma.pago.updateMany({
    where: { partidoId, usuarioId: objetivoId, indicadoEn: null },
    data: { indicadoEn: new Date() },
  });

  revalidatePath(`/partidos/${partidoId}`);
}

export async function corregirConfirmacion(formData: FormData) {
  const usuario = await exigirUsuarioAprobado();
  const partidoId = String(formData.get("partidoId"));
  const objetivoId = String(formData.get("usuarioId"));
  await exigirEncargadoOAdmin(partidoId, usuario);

  await prisma.pago.updateMany({
    where: { partidoId, usuarioId: objetivoId },
    data: { confirmadoEn: null, confirmadoPorId: null },
  });

  revalidatePath(`/partidos/${partidoId}`);
}
