"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obtenerUsuarioSesion } from "@/lib/auth";

export async function cambiarRol(formData: FormData) {
  const admin = await obtenerUsuarioSesion();
  if (!admin || admin.rol !== "ADMIN") {
    throw new Error("No autorizado.");
  }

  const usuarioId = String(formData.get("usuarioId"));

  if (usuarioId === admin.id) {
    throw new Error("No puedes cambiar tu propio rol. Pide a otro administrador que lo haga.");
  }

  const objetivo = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!objetivo || objetivo.estado !== "APROBADA") {
    throw new Error("Ese usuario no existe o no está aprobado.");
  }

  if (objetivo.rol === "ADMIN") {
    const otrosAdmins = await prisma.usuario.count({
      where: { rol: "ADMIN", estado: "APROBADA", id: { not: usuarioId } },
    });
    if (otrosAdmins === 0) {
      throw new Error("No puedes quitar el último administrador.");
    }
  }

  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { rol: objetivo.rol === "ADMIN" ? "USUARIO" : "ADMIN" },
  });

  revalidatePath("/admin/usuarios");
}
