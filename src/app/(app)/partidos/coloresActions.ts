"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obtenerUsuarioSesion } from "@/lib/auth";

export async function establecerColorEquipo(formData: FormData) {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario || usuario.estado !== "APROBADA") {
    throw new Error("No autorizado.");
  }

  const partidoId = String(formData.get("partidoId"));
  const equipo = Number(formData.get("equipo"));
  const color = String(formData.get("color"));

  const partido = await prisma.partido.findUnique({ where: { id: partidoId } });
  if (!partido) {
    throw new Error("El partido no existe.");
  }
  if (usuario.rol !== "ADMIN" && partido.encargadoId !== usuario.id) {
    throw new Error("Solo un administrador o la persona encargada pueden elegir los colores.");
  }
  if (!Number.isInteger(equipo) || equipo < 1 || equipo > 3) {
    throw new Error("Equipo no válido.");
  }
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    throw new Error("El color no es válido.");
  }

  await prisma.colorEquipo.upsert({
    where: { partidoId_equipo: { partidoId, equipo } },
    update: { color },
    create: { partidoId, equipo, color },
  });

  revalidatePath(`/partidos/${partidoId}`);
}
