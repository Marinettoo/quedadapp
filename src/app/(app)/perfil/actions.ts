"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obtenerUsuarioSesion } from "@/lib/auth";
import type { ResultadoFormulario } from "@/app/actions";

async function exigirUsuarioAprobado() {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario || usuario.estado !== "APROBADA") {
    throw new Error("No autorizado.");
  }
  return usuario;
}

export async function cambiarMiNombreUsuario(
  _estadoPrevio: ResultadoFormulario,
  formData: FormData,
): Promise<ResultadoFormulario> {
  const usuario = await exigirUsuarioAprobado();
  const nombreUsuario = String(formData.get("nombreUsuario") ?? "").trim();

  if (nombreUsuario.length < 3) {
    return { error: "El nombre de usuario debe tener al menos 3 caracteres." };
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(nombreUsuario)) {
    return { error: "Solo letras, números, puntos, guiones y guiones bajos." };
  }

  const existente = await prisma.usuario.findUnique({ where: { nombreUsuario } });
  if (existente && existente.id !== usuario.id) {
    return { error: "Ya hay una cuenta con ese nombre de usuario." };
  }

  await prisma.usuario.update({ where: { id: usuario.id }, data: { nombreUsuario } });

  revalidatePath("/perfil");
  revalidatePath("/jugadores");
  revalidatePath(`/jugadores/${usuario.id}`);
  return { ok: true };
}

export async function cambiarMiContrasena(
  _estadoPrevio: ResultadoFormulario,
  formData: FormData,
): Promise<ResultadoFormulario> {
  const usuario = await exigirUsuarioAprobado();
  const actual = String(formData.get("actual") ?? "");
  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password2") ?? "");

  const registro = await prisma.usuario.findUnique({ where: { id: usuario.id } });
  if (!registro || !(await bcrypt.compare(actual, registro.passwordHash))) {
    return { error: "La contraseña actual no es correcta." };
  }
  if (password.length < 8) {
    return { error: "La contraseña nueva debe tener al menos 8 caracteres." };
  }
  if (password !== password2) {
    return { error: "Las contraseñas nuevas no coinciden." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.usuario.update({ where: { id: usuario.id }, data: { passwordHash } });

  revalidatePath("/perfil");
  return { ok: true };
}

const PIERNAS_VALIDAS = ["DIESTRO", "ZURDO", "AMBIDIESTRO"] as const;

export async function actualizarMisDatosJugador(formData: FormData) {
  const usuario = await exigirUsuarioAprobado();
  const fechaNacimientoTexto = String(formData.get("fechaNacimiento") ?? "");
  const piernaBuenaTexto = String(formData.get("piernaBuena") ?? "");

  let fechaNacimiento: Date | null = null;
  if (fechaNacimientoTexto) {
    const fecha = new Date(`${fechaNacimientoTexto}T00:00:00`);
    if (Number.isNaN(fecha.getTime())) {
      throw new Error("La fecha de nacimiento no es válida.");
    }
    if (fecha > new Date()) {
      throw new Error("La fecha de nacimiento no puede ser futura.");
    }
    fechaNacimiento = fecha;
  }

  const piernaBuena = (PIERNAS_VALIDAS as readonly string[]).includes(piernaBuenaTexto)
    ? (piernaBuenaTexto as (typeof PIERNAS_VALIDAS)[number])
    : null;

  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { fechaNacimiento, piernaBuena },
  });

  revalidatePath("/perfil");
  revalidatePath("/jugadores");
  revalidatePath(`/jugadores/${usuario.id}`);
}
