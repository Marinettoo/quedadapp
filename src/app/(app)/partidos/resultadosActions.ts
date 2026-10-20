"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obtenerUsuarioSesion } from "@/lib/auth";

async function exigirEncargadoOAdmin(partidoId: string) {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario || usuario.estado !== "APROBADA") {
    throw new Error("No autorizado.");
  }
  const partido = await prisma.partido.findUnique({
    where: { id: partidoId },
    include: { generacion: true },
  });
  if (!partido) {
    throw new Error("El partido no existe.");
  }
  if (usuario.rol !== "ADMIN" && partido.encargadoId !== usuario.id) {
    throw new Error("Solo un administrador o la persona encargada pueden registrar resultados.");
  }
  if (!partido.generacion) {
    throw new Error("Primero hay que generar los equipos.");
  }
  return { usuario, partido };
}

function numEquiposDe(formato: "TRIANGULAR" | "DOS_EQUIPOS") {
  return formato === "TRIANGULAR" ? 3 : 2;
}

function leerGoles(formData: FormData, campo: string) {
  const valor = Number(formData.get(campo));
  if (!Number.isInteger(valor) || valor < 0) {
    throw new Error("Los goles deben ser un número entero igual o mayor que 0.");
  }
  return valor;
}

export async function agregarEnfrentamiento(formData: FormData) {
  const partidoId = String(formData.get("partidoId"));
  const { usuario, partido } = await exigirEncargadoOAdmin(partidoId);

  const equipoLocal = Number(formData.get("equipoLocal"));
  const equipoVisitante = Number(formData.get("equipoVisitante"));
  const golesLocal = leerGoles(formData, "golesLocal");
  const golesVisitante = leerGoles(formData, "golesVisitante");

  const numEquipos = numEquiposDe(partido.generacion!.formato);
  if (
    !Number.isInteger(equipoLocal) ||
    !Number.isInteger(equipoVisitante) ||
    equipoLocal < 1 ||
    equipoVisitante < 1 ||
    equipoLocal > numEquipos ||
    equipoVisitante > numEquipos ||
    equipoLocal === equipoVisitante
  ) {
    throw new Error("Elige dos equipos distintos del partido.");
  }

  if (partido.generacion!.formato === "DOS_EQUIPOS") {
    const yaExiste = await prisma.enfrentamiento.findFirst({ where: { partidoId } });
    if (yaExiste) {
      throw new Error("Ya hay un resultado para este partido; corrígelo en vez de añadir otro.");
    }
  }

  await prisma.enfrentamiento.create({
    data: {
      partidoId,
      equipoLocal,
      equipoVisitante,
      golesLocal,
      golesVisitante,
      registradoPorId: usuario.id,
    },
  });

  revalidatePath(`/partidos/${partidoId}`);
}

export async function editarEnfrentamiento(formData: FormData) {
  const partidoId = String(formData.get("partidoId"));
  await exigirEncargadoOAdmin(partidoId);

  const id = String(formData.get("id"));
  const golesLocal = leerGoles(formData, "golesLocal");
  const golesVisitante = leerGoles(formData, "golesVisitante");

  await prisma.enfrentamiento.update({
    where: { id },
    data: { golesLocal, golesVisitante },
  });

  revalidatePath(`/partidos/${partidoId}`);
}

export async function eliminarEnfrentamiento(formData: FormData) {
  const partidoId = String(formData.get("partidoId"));
  await exigirEncargadoOAdmin(partidoId);

  const id = String(formData.get("id"));
  await prisma.enfrentamiento.delete({ where: { id } });

  revalidatePath(`/partidos/${partidoId}`);
}
