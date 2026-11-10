import { randomBytes, createHash } from "crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { prisma } from "@/lib/db";
import type { Usuario } from "@/generated/prisma/client";

const NOMBRE_COOKIE = "sesion";
const DURACION_SESION_MS = 30 * 24 * 60 * 60 * 1000; // 30 días
// No actualizar ultimoAcceso en cada petición (la sesión dura 30 días
// y se usa en casi cada página): con que quede al día a este nivel de
// detalle basta para saber quién ha usado la app estos días.
const UMBRAL_ACTUALIZAR_ACCESO_MS = 5 * 60 * 1000;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

// Crea la fila de sesión y devuelve el token en crudo (el único momento
// en que existe sin cifrar: en la base solo se guarda su hash). Lo usan
// tanto el login de la web (que lo mete en una cookie) como el de la
// API para apps nativas (que lo devuelve en el JSON de respuesta).
export async function crearTokenSesion(usuarioId: string) {
  const token = randomBytes(32).toString("hex");
  const expiraEn = new Date(Date.now() + DURACION_SESION_MS);

  await prisma.sesion.create({
    data: { id: hashToken(token), usuarioId, expiraEn },
  });

  return { token, expiraEn };
}

export async function crearSesion(usuarioId: string) {
  const { token, expiraEn } = await crearTokenSesion(usuarioId);

  const store = await cookies();
  store.set(NOMBRE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiraEn,
  });
}

// Busca al usuario de un token de sesión ya sea de cookie (web) o de
// cabecera Authorization (API/apps nativas): misma tabla, misma
// caducidad, mismo registro de "último acceso".
export async function obtenerUsuarioPorToken(token: string): Promise<Usuario | null> {
  const sesion = await prisma.sesion.findUnique({
    where: { id: hashToken(token) },
    include: { usuario: true },
  });

  if (!sesion || sesion.expiraEn < new Date()) {
    return null;
  }

  const ahora = new Date();
  const ultimo = sesion.usuario.ultimoAcceso;
  if (!ultimo || ahora.getTime() - ultimo.getTime() > UMBRAL_ACTUALIZAR_ACCESO_MS) {
    await prisma.usuario.update({
      where: { id: sesion.usuario.id },
      data: { ultimoAcceso: ahora },
    });
  }

  return sesion.usuario;
}

export const obtenerUsuarioSesion = cache(async (): Promise<Usuario | null> => {
  // Next.js (Cache Components) necesita esta señal explícita de que la
  // petición es dinámica antes de usar un valor que cambia entre
  // renders (aquí, `new Date()` al comprobar si la sesión ha caducado).
  await connection();

  const store = await cookies();
  const token = store.get(NOMBRE_COOKIE)?.value;
  if (!token) return null;

  return obtenerUsuarioPorToken(token);
});

// Para la API (apps nativas): el token va en la cabecera
// "Authorization: Bearer <token>" en vez de en una cookie.
export function extraerBearerToken(request: Request): string | null {
  const cabecera = request.headers.get("authorization");
  if (!cabecera?.startsWith("Bearer ")) return null;
  return cabecera.slice("Bearer ".length).trim() || null;
}

export async function invalidarToken(token: string) {
  await prisma.sesion.deleteMany({ where: { id: hashToken(token) } });
}

export async function cerrarSesion() {
  const store = await cookies();
  const token = store.get(NOMBRE_COOKIE)?.value;
  if (token) {
    await invalidarToken(token);
  }
  store.delete(NOMBRE_COOKIE);
}
