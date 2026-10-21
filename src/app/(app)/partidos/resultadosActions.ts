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

// Goles por jugador: opcionales. Los campos del formulario llevan el
// prefijo golU_<usuarioId> o golI_<invitadoId>; si vienen a 0 o vacíos no
// se atribuyen a nadie, pero el resultado del equipo cuenta igual.
async function guardarGolesJugadores(enfrentamientoId: string, formData: FormData) {
  for (const [campo, valor] of formData.entries()) {
    let usuarioId: string | undefined;
    let invitadoId: string | undefined;
    if (campo.startsWith("golU_")) {
      usuarioId = campo.slice("golU_".length);
    } else if (campo.startsWith("golI_")) {
      invitadoId = campo.slice("golI_".length);
    } else {
      continue;
    }

    const goles = Number(valor);
    if (!Number.isInteger(goles) || goles < 0) {
      continue;
    }

    if (goles === 0) {
      await prisma.golJugador.deleteMany({
        where: usuarioId
          ? { enfrentamientoId, usuarioId }
          : { enfrentamientoId, invitadoId },
      });
      continue;
    }

    if (usuarioId) {
      await prisma.golJugador.upsert({
        where: { enfrentamientoId_usuarioId: { enfrentamientoId, usuarioId } },
        create: { enfrentamientoId, usuarioId, goles },
        update: { goles },
      });
    } else if (invitadoId) {
      await prisma.golJugador.upsert({
        where: { enfrentamientoId_invitadoId: { enfrentamientoId, invitadoId } },
        create: { enfrentamientoId, invitadoId, goles },
        update: { goles },
      });
    }
  }
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

  const enfrentamiento = await prisma.enfrentamiento.create({
    data: {
      partidoId,
      equipoLocal,
      equipoVisitante,
      golesLocal,
      golesVisitante,
      registradoPorId: usuario.id,
    },
  });

  await guardarGolesJugadores(enfrentamiento.id, formData);

  revalidatePath(`/partidos/${partidoId}`);
  revalidatePath("/estadisticas");
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

  await guardarGolesJugadores(id, formData);

  revalidatePath(`/partidos/${partidoId}`);
  revalidatePath("/estadisticas");
}

export async function eliminarEnfrentamiento(formData: FormData) {
  const partidoId = String(formData.get("partidoId"));
  await exigirEncargadoOAdmin(partidoId);

  const id = String(formData.get("id"));
  await prisma.enfrentamiento.delete({ where: { id } });

  revalidatePath(`/partidos/${partidoId}`);
  revalidatePath("/estadisticas");
}
