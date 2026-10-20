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

async function jugadorEnEquipo(partidoId: string, tipo: "USUARIO" | "INVITADO", id: string) {
  const asignacion = await prisma.asignacionEquipo.findFirst({
    where: {
      equipo: { gt: 0 },
      generacion: { partidoId },
      ...(tipo === "USUARIO" ? { usuarioId: id } : { invitadoId: id }),
    },
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

  if (!(await jugadorEnEquipo(partidoId, "USUARIO", usuario.id))) {
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
  const objetivoId = String(formData.get("jugadorId"));
  const tipo = String(formData.get("tipo")) === "INVITADO" ? "INVITADO" : "USUARIO";
  await exigirEncargadoOAdmin(partidoId, usuario);

  if (!(await jugadorEnEquipo(partidoId, tipo, objetivoId))) {
    throw new Error("Ese jugador no está asignado a un equipo en este partido.");
  }

  const clave =
    tipo === "USUARIO"
      ? { partidoId_usuarioId: { partidoId, usuarioId: objetivoId } }
      : { partidoId_invitadoId: { partidoId, invitadoId: objetivoId } };
  const datosBase = tipo === "USUARIO" ? { usuarioId: objetivoId } : { invitadoId: objetivoId };

  await prisma.pago.upsert({
    where: clave,
    update: { confirmadoEn: new Date(), confirmadoPorId: usuario.id },
    create: {
      partidoId,
      ...datosBase,
      indicadoEn: new Date(),
      confirmadoEn: new Date(),
      confirmadoPorId: usuario.id,
    },
  });

  // Si ya existía pero sin indicar, lo marcamos también como indicado.
  await prisma.pago.updateMany({
    where: { partidoId, ...datosBase, indicadoEn: null },
    data: { indicadoEn: new Date() },
  });

  revalidatePath(`/partidos/${partidoId}`);
}

export async function corregirConfirmacion(formData: FormData) {
  const usuario = await exigirUsuarioAprobado();
  const partidoId = String(formData.get("partidoId"));
  const objetivoId = String(formData.get("jugadorId"));
  const tipo = String(formData.get("tipo")) === "INVITADO" ? "INVITADO" : "USUARIO";
  await exigirEncargadoOAdmin(partidoId, usuario);

  const datosBase = tipo === "USUARIO" ? { usuarioId: objetivoId } : { invitadoId: objetivoId };

  await prisma.pago.updateMany({
    where: { partidoId, ...datosBase },
    data: { confirmadoEn: null, confirmadoPorId: null },
  });

  revalidatePath(`/partidos/${partidoId}`);
}
