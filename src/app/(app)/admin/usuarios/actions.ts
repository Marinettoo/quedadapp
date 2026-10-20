"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obtenerUsuarioSesion } from "@/lib/auth";
import type { ResultadoFormulario } from "@/app/actions";

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

export async function restablecerContrasena(
  _estadoPrevio: ResultadoFormulario,
  formData: FormData,
): Promise<ResultadoFormulario> {
  const admin = await obtenerUsuarioSesion();
  if (!admin || admin.rol !== "ADMIN") {
    throw new Error("No autorizado.");
  }

  const usuarioId = String(formData.get("usuarioId"));
  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password2") ?? "");

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }
  if (password !== password2) {
    return { error: "Las contraseñas no coinciden." };
  }

  const objetivo = await prisma.usuario.findUnique({ where: { id: usuarioId } });
  if (!objetivo || objetivo.estado !== "APROBADA") {
    return { error: "Ese usuario no existe o no está aprobado." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.usuario.update({ where: { id: usuarioId }, data: { passwordHash } });

  revalidatePath("/admin/usuarios");
  return { ok: true };
}
