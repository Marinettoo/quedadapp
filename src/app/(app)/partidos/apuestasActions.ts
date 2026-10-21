"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { apuestasAbiertas } from "@/lib/partidos";
import { crearNotificacion } from "@/lib/notificaciones";

const CUOTA_FIJA = 0.2;
const RESPUESTAS_VALIDAS = ["EQUIPO1", "EMPATE", "EQUIPO2"] as const;
type Respuesta = (typeof RESPUESTAS_VALIDAS)[number];

function esRespuestaValida(valor: string): valor is Respuesta {
  return (RESPUESTAS_VALIDAS as readonly string[]).includes(valor);
}

async function exigirUsuarioAprobado() {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario || usuario.estado !== "APROBADA") {
    throw new Error("No autorizado.");
  }
  return usuario;
}

async function exigirEncargadoOAdmin(partidoId: string) {
  const usuario = await exigirUsuarioAprobado();
  const partido = await prisma.partido.findUnique({
    where: { id: partidoId },
    include: { generacion: true },
  });
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
  const { usuario, partido } = await exigirEncargadoOAdmin(partidoId);

  if (!partido.generacion || partido.generacion.formato !== "DOS_EQUIPOS") {
    throw new Error("Las apuestas de resultado solo están disponibles en partidos a 2 equipos.");
  }
  if (!apuestasAbiertas(partido.fechaHora)) {
    throw new Error("Ya no se puede crear una apuesta a menos de 30 minutos del partido.");
  }

  const yaExiste = await prisma.apuesta.findFirst({ where: { partidoId } });
  if (yaExiste) {
    throw new Error("Ya hay una apuesta de resultado para este partido.");
  }

  await prisma.apuesta.create({
    data: { partidoId, cuota: CUOTA_FIJA, creadaPorId: usuario.id },
  });

  revalidatePath(`/partidos/${partidoId}`);
}

export async function pronosticar(formData: FormData) {
  const usuario = await exigirUsuarioAprobado();
  const apuestaId = String(formData.get("apuestaId"));
  const partidoId = String(formData.get("partidoId"));
  const respuesta = String(formData.get("respuesta") ?? "");

  if (!esRespuestaValida(respuesta)) {
    throw new Error("Elige victoria, empate o derrota.");
  }

  const partido = await prisma.partido.findUnique({ where: { id: partidoId } });
  if (!partido || !apuestasAbiertas(partido.fechaHora)) {
    throw new Error("Ya no se puede pronosticar a menos de 30 minutos del partido.");
  }

  await prisma.pronostico.upsert({
    where: { apuestaId_usuarioId: { apuestaId, usuarioId: usuario.id } },
    update: { respuesta },
    create: { apuestaId, usuarioId: usuario.id, respuesta },
  });

  revalidatePath(`/partidos/${partidoId}`);
}

export async function retirarPronostico(formData: FormData) {
  const usuario = await exigirUsuarioAprobado();
  const apuestaId = String(formData.get("apuestaId"));
  const partidoId = String(formData.get("partidoId"));

  const partido = await prisma.partido.findUnique({ where: { id: partidoId } });
  if (!partido || !apuestasAbiertas(partido.fechaHora)) {
    throw new Error("Ya no se puede retirar la apuesta a menos de 30 minutos del partido.");
  }

  await prisma.pronostico.deleteMany({ where: { apuestaId, usuarioId: usuario.id } });

  revalidatePath(`/partidos/${partidoId}`);
}

export async function resolverApuesta(formData: FormData) {
  const apuestaId = String(formData.get("apuestaId"));
  const partidoId = String(formData.get("partidoId"));
  await exigirEncargadoOAdmin(partidoId);

  const resultado = String(formData.get("resultado") ?? "");
  if (!esRespuestaValida(resultado)) {
    throw new Error("Elige victoria, empate o derrota.");
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
      const acierto = p.respuesta === resultado;
      // La cuota de 0.20 € es obligatoria para todos, acierten o fallen.
      return prisma.pronostico.update({
        where: { id: p.id },
        data: { acierto, importeDebido: apuesta.cuota },
      });
    }),
  ]);

  await Promise.all(
    apuesta.pronosticos.map((p) =>
      crearNotificacion({
        usuarioId: p.usuarioId,
        tipo: "RESULTADO_APUESTA",
        mensaje:
          p.respuesta === resultado
            ? "Acertaste tu apuesta. Debes 0.20 € al bote, como todos."
            : "Fallaste tu apuesta. Debes 0.20 € al bote.",
        enlace: `/partidos/${partidoId}/apuestas`,
      }),
    ),
  );

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
