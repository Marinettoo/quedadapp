import { randomBytes, createHash } from "crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { prisma } from "@/lib/db";
import type { Usuario } from "@/generated/prisma/client";

const NOMBRE_COOKIE = "sesion";
const DURACION_SESION_MS = 30 * 24 * 60 * 60 * 1000; // 30 días

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function crearSesion(usuarioId: string) {
  const token = randomBytes(32).toString("hex");
  const expiraEn = new Date(Date.now() + DURACION_SESION_MS);

  await prisma.sesion.create({
    data: { id: hashToken(token), usuarioId, expiraEn },
  });

  const store = await cookies();
  store.set(NOMBRE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiraEn,
  });
}

export const obtenerUsuarioSesion = cache(async (): Promise<Usuario | null> => {
  // Next.js (Cache Components) necesita esta señal explícita de que la
  // petición es dinámica antes de usar un valor que cambia entre
  // renders (aquí, `new Date()` al comprobar si la sesión ha caducado).
  await connection();

  const store = await cookies();
  const token = store.get(NOMBRE_COOKIE)?.value;
  if (!token) return null;

  const sesion = await prisma.sesion.findUnique({
    where: { id: hashToken(token) },
    include: { usuario: true },
  });

  if (!sesion || sesion.expiraEn < new Date()) {
    return null;
  }

  return sesion.usuario;
});

export async function cerrarSesion() {
  const store = await cookies();
  const token = store.get(NOMBRE_COOKIE)?.value;
  if (token) {
    await prisma.sesion.deleteMany({ where: { id: hashToken(token) } });
  }
  store.delete(NOMBRE_COOKIE);
}
