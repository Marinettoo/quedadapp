import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type { Usuario } from "@/generated/prisma/client";

// Reglas de validación de registro, compartidas entre el formulario web
// y la API para apps nativas: un solo sitio donde cambiarlas.
export function validarRegistro({
  nombreUsuario,
  email,
  password,
  password2,
}: {
  nombreUsuario: string;
  email: string;
  password: string;
  password2: string;
}): string | null {
  if (nombreUsuario.length < 3) {
    return "El nombre de usuario debe tener al menos 3 caracteres.";
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(nombreUsuario)) {
    return "El nombre de usuario solo puede tener letras, números, puntos, guiones y guiones bajos.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "El correo no es válido.";
  }
  if (password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }
  if (password !== password2) {
    return "Las contraseñas no coinciden.";
  }
  return null;
}

export async function crearCuenta({
  nombreUsuario,
  email,
  password,
}: {
  nombreUsuario: string;
  email: string;
  password: string;
}): Promise<{ error: string } | { ok: true }> {
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

  return { ok: true };
}

// Forma del usuario que devuelve la API (apps nativas): nunca el hash
// de la contraseña ni otros campos internos.
export function serializarUsuario(usuario: Usuario) {
  return {
    id: usuario.id,
    nombreUsuario: usuario.nombreUsuario,
    email: usuario.email,
    rol: usuario.rol,
    estado: usuario.estado,
    fotoActualizadaEn: usuario.fotoActualizadaEn,
  };
}

// Comprueba usuario/contraseña y el estado de la cuenta (pendiente de
// aprobación, rechazada...), sin crear todavía la sesión: eso lo hace
// cada sitio a su manera (cookie en la web, token en la API).
export async function verificarLogin(
  nombreUsuario: string,
  password: string,
): Promise<{ error: string } | { ok: true; usuario: Usuario }> {
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

  return { ok: true, usuario };
}
