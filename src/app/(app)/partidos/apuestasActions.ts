"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { asistenciaAbierta } from "@/lib/partidos";

async function exigirUsuarioAprobado() {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario || usuario.estado !== "APROBADA") {
    throw new Error("No autorizado.");
  }
  return usuario;
}

async function exigirEncargadoOAdmin(partidoId: string) {
  const usuario = await exigirUsuarioAprobado();
  const partido = await prisma.partido.findUnique({ where: { id: partidoId } });
  if (!partido) {
    throw new Error("El partido no existe.");
  }
  if (usuario.rol !== "ADMIN" && partido.encargadoId !== usuario.id) {
    throw new Error("Solo un administrador o la persona encargada pueden hacer esto.");
  }
  return { usuario, partido };
}

export async function crearApuesta(formData: FormData) {
  const partidoId = String(formData.get("partidoId"));
  const { usuario } = await exigirEncargadoOAdmin(partidoId);

  const pregunta = String(formData.get("pregunta") ?? "").trim();
  const importe = Number(formData.get("importe"));
  const cuota = Number(formData.get("cuota") ?? 0.2);

  if (!pregunta) {
    throw new Error("Escribe la pregunta de la apuesta.");
  }
  if (!Number.isFinite(importe) || importe <= 0) {
    throw new Error("El importe no es válido.");
  }
  if (!Number.isFinite(cuota) || cuota < 0) {
    throw new Error("La cuota de participar no es válida.");
  }

  await prisma.apuesta.create({
    data: { partidoId, pregunta, importe, cuota, creadaPorId: usuario.id },
  });

  revalidatePath(`/partidos/${partidoId}`);
}

export async function pronosticar(formData: FormData) {
  const usuario = await exigirUsuarioAprobado();
  const apuestaId = String(formData.get("apuestaId"));
  const partidoId = String(formData.get("partidoId"));
  const respuesta = String(formData.get("respuesta") ?? "").trim();

  if (!respuesta) {
    throw new Error("Escribe tu pronóstico.");
  }

  const partido = await prisma.partido.findUnique({ where: { id: partidoId } });
  if (!partido || !asistenciaAbierta(partido.fechaHora, partido.horasCierre)) {
    throw new Error("El plazo para pronosticar ya ha cerrado.");
  }

  await prisma.pronostico.upsert({
    where: { apuestaId_usuarioId: { apuestaId, usuarioId: usuario.id } },
    update: { respuesta },
    create: { apuestaId, usuarioId: usuario.id, respuesta },
  });

  revalidatePath(`/partidos/${partidoId}`);
}

export async function resolverApuesta(formData: FormData) {
  const apuestaId = String(formData.get("apuestaId"));
  const partidoId = String(formData.get("partidoId"));
  await exigirEncargadoOAdmin(partidoId);

  const resultado = String(formData.get("resultado") ?? "").trim();
  if (!resultado) {
    throw new Error("Escribe el resultado real.");
  }

  const apuesta = await prisma.apuesta.findUnique({
    where: { id: apuestaId },
    include: { pronosticos: true },
  });
  if (!apuesta) {
    throw new Error("La apuesta no existe.");
  }

  await prisma.$transaction([
    prisma.apuesta.update({
      where: { id: apuestaId },
      data: { resultado, resueltaEn: new Date() },
    }),
    ...apuesta.pronosticos.map((p) => {
      const acierto = p.respuesta.trim().toLowerCase() === resultado.toLowerCase();
      const importeDebido = acierto ? apuesta.cuota : apuesta.cuota + apuesta.importe;
      return prisma.pronostico.update({
        where: { id: p.id },
        data: { acierto, importeDebido },
      });
    }),
  ]);

  revalidatePath(`/partidos/${partidoId}`);
}

export async function indicarAporte(formData: FormData) {
  const usuario = await exigirUsuarioAprobado();
  const pronosticoId = String(formData.get("pronosticoId"));
  const partidoId = String(formData.get("partidoId"));

  const pronostico = await prisma.pronostico.findUnique({ where: { id: pronosticoId } });
  if (!pronostico || pronostico.usuarioId !== usuario.id || !pronostico.importeDebido) {
    throw new Error("No puedes indicar este aporte.");
  }

  await prisma.pronostico.update({
    where: { id: pronosticoId },
    data: { indicadoAporteEn: new Date() },
  });

  revalidatePath(`/partidos/${partidoId}`);
}

export async function confirmarAporte(formData: FormData) {
  const partidoId = String(formData.get("partidoId"));
  const { usuario } = await exigirEncargadoOAdmin(partidoId);
  const pronosticoId = String(formData.get("pronosticoId"));

  await prisma.pronostico.update({
    where: { id: pronosticoId },
    data: { confirmadoAporteEn: new Date(), confirmadoAportePorId: usuario.id, indicadoAporteEn: new Date() },
  });

  revalidatePath(`/partidos/${partidoId}`);
  revalidatePath("/bote");
}
