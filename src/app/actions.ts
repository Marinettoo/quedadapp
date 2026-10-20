"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { crearSesion, cerrarSesion } from "@/lib/auth";

export type ResultadoFormulario = { error: string } | { ok: true } | null;

export async function registrar(
  _estadoPrevio: ResultadoFormulario,
  formData: FormData,
): Promise<ResultadoFormulario> {
  const nombreUsuario = String(formData.get("nombreUsuario") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password2") ?? "");

  if (nombreUsuario.length < 3) {
    return { error: "El nombre de usuario debe tener al menos 3 caracteres." };
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(nombreUsuario)) {
    return { error: "El nombre de usuario solo puede tener letras, números, puntos, guiones y guiones bajos." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "El correo no es válido." };
  }
  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }
  if (password !== password2) {
    return { error: "Las contraseñas no coinciden." };
  }

  const existente = await prisma.usuario.findFirst({
    where: { OR: [{ nombreUsuario }, { email }] },
  });
  if (existente) {
    return { error: "Ya existe una cuenta con ese nombre de usuario o correo." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.usuario.create({
    data: { nombreUsuario, email, passwordHash },
  });

  redirect("/registro/enviado");
}

export async function iniciarSesion(
  _estadoPrevio: ResultadoFormulario,
  formData: FormData,
): Promise<ResultadoFormulario> {
  const nombreUsuario = String(formData.get("nombreUsuario") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const usuario = await prisma.usuario.findUnique({ where: { nombreUsuario } });

  if (!usuario || !(await bcrypt.compare(password, usuario.passwordHash))) {
    return { error: "Nombre de usuario o contraseña incorrectos." };
  }

  if (usuario.estado === "PENDIENTE") {
    return { error: "Tu cuenta está pendiente de aprobación por un administrador." };
  }
  if (usuario.estado === "RECHAZADA") {
    return { error: "Tu solicitud de acceso fue rechazada. Contacta a un administrador." };
  }

  await crearSesion(usuario.id);
  redirect("/panel");
}

export async function salir() {
  await cerrarSesion();
  redirect("/");
}
