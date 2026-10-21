"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { identidadDeBaja } from "@/lib/usuarios";
import { crearNotificacionParaVarios } from "@/lib/notificaciones";

async function exigirAdmin() {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario || usuario.rol !== "ADMIN") {
    throw new Error("No autorizado.");
  }
  return usuario;
}

export async function aprobarUsuario(formData: FormData) {
  await exigirAdmin();
  const id = String(formData.get("id"));
  const nuevo = await prisma.usuario.update({ where: { id }, data: { estado: "APROBADA" } });
  revalidatePath("/admin/solicitudes");

  const resto = await prisma.usuario.findMany({
    where: { estado: "APROBADA", id: { not: id } },
    select: { id: true },
  });
  await crearNotificacionParaVarios(
    resto.map((u) => u.id),
    {
      tipo: "NUEVO_MIEMBRO",
      mensaje: `${nuevo.nombreUsuario} se ha unido a la peña. Valórale con estrellas.`,
      enlace: "/jugadores",
    },
  );
}

export async function rechazarUsuario(formData: FormData) {
  await exigirAdmin();
  const id = String(formData.get("id"));
  // Libera el nombre de usuario y el email para que se puedan volver a
  // usar; no se borra la cuenta en sí (ver src/lib/usuarios.ts).
  await prisma.usuario.update({
    where: { id },
    data: { estado: "RECHAZADA", ...identidadDeBaja(id) },
  });
  revalidatePath("/admin/solicitudes");
}
