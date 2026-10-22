"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obtenerUsuarioSesion } from "@/lib/auth";

async function exigirEncargadoOAdmin(partidoId: string) {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario || usuario.estado !== "APROBADA") {
    throw new Error("No autorizado.");
  }
  const partido = await prisma.partido.findUnique({ where: { id: partidoId } });
  if (!partido) {
    throw new Error("El partido no existe.");
  }
  if (usuario.rol !== "ADMIN" && partido.encargadoId !== usuario.id) {
    throw new Error("Solo un administrador o la persona encargada pueden hacer esto.");
  }
  return usuario;
}

// Cada miembro llega como "usuario:<id>" o "invitado:<id>" desde los
// checkboxes del formulario.
function parsearMiembro(valor: string) {
  const [tipo, id] = valor.split(":");
  if (tipo === "usuario") return { usuarioId: id, invitadoId: null };
  if (tipo === "invitado") return { usuarioId: null, invitadoId: id };
  throw new Error("Miembro no válido.");
}

export async function crearGrupo(formData: FormData) {
  const partidoId = String(formData.get("partidoId"));
  await exigirEncargadoOAdmin(partidoId);

  const miembros = formData.getAll("miembros").map(String);
  if (miembros.length < 2) {
    throw new Error("Un grupo necesita al menos 2 jugadores.");
  }

  await prisma.grupo.create({
    data: {
      partidoId,
      miembros: {
        create: miembros.map(parsearMiembro),
      },
    },
  });

  revalidatePath(`/partidos/${partidoId}/equipos`);
}

export async function eliminarGrupo(formData: FormData) {
  const partidoId = String(formData.get("partidoId"));
  await exigirEncargadoOAdmin(partidoId);
  const grupoId = String(formData.get("grupoId"));

  await prisma.grupo.deleteMany({ where: { id: grupoId, partidoId } });

  revalidatePath(`/partidos/${partidoId}/equipos`);
}
