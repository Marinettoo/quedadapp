"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obtenerUsuarioSesion } from "@/lib/auth";

async function exigirAdmin() {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario || usuario.rol !== "ADMIN") {
    throw new Error("Solo un administrador puede ajustar el bote.");
  }
  return usuario;
}

export async function crearAjusteBote(formData: FormData) {
  const usuario = await exigirAdmin();

  const importe = Number(formData.get("importe"));
  const tipo = String(formData.get("tipo"));
  const motivo = String(formData.get("motivo") ?? "").trim();

  if (!Number.isFinite(importe) || importe <= 0) {
    throw new Error("Indica un importe mayor que 0.");
  }
  if (tipo !== "sumar" && tipo !== "restar") {
    throw new Error("Elige si quieres sumar o restar.");
  }
  if (!motivo) {
    throw new Error("Indica el motivo del ajuste.");
  }

  await prisma.ajusteBote.create({
    data: {
      importe: tipo === "restar" ? -Math.abs(importe) : Math.abs(importe),
      motivo,
      creadoPorId: usuario.id,
    },
  });

  revalidatePath("/bote");
}

export async function eliminarAjusteBote(formData: FormData) {
  await exigirAdmin();
  const id = String(formData.get("id"));

  await prisma.ajusteBote.delete({ where: { id } });

  revalidatePath("/bote");
}
