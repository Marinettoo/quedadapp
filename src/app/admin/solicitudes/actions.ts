"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obtenerUsuarioSesion } from "@/lib/auth";

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
  await prisma.usuario.update({ where: { id }, data: { estado: "APROBADA" } });
  revalidatePath("/admin/solicitudes");
}

export async function rechazarUsuario(formData: FormData) {
  await exigirAdmin();
  const id = String(formData.get("id"));
  await prisma.usuario.update({ where: { id }, data: { estado: "RECHAZADA" } });
  revalidatePath("/admin/solicitudes");
}
