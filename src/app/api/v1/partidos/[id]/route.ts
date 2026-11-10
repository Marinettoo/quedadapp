import { NextResponse } from "next/server";
import { obtenerUsuarioDesdeRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { asistenciaAbierta, cierreAsistencia } from "@/lib/partidos";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await obtenerUsuarioDesdeRequest(request);
  if (!usuario) {
    return NextResponse.json({ error: "Sesión no válida o caducada." }, { status: 401 });
  }

  const { id } = await params;
  const partido = await prisma.partido.findUnique({
    where: { id },
    include: {
      encargado: { select: { nombreUsuario: true } },
      asistencias: { where: { cancelado: false } },
    },
  });

  if (!partido) {
    return NextResponse.json({ error: "El partido no existe." }, { status: 404 });
  }

  const ahora = new Date();
  const miAsistencia = partido.asistencias.find((a) => a.usuarioId === usuario.id);

  return NextResponse.json({
    partido: {
      id: partido.id,
      fechaHora: partido.fechaHora,
      horaFin: partido.horaFin,
      ubicacion: partido.ubicacion,
      encargado: partido.encargado.nombreUsuario,
      asistentes: partido.asistencias.length,
      enCurso: !!partido.horaFin && partido.fechaHora <= ahora && partido.horaFin > ahora,
      abierto: asistenciaAbierta(partido.fechaHora, partido.horasCierre),
      cierre: cierreAsistencia(partido.fechaHora, partido.horasCierre),
      yaApuntado: miAsistencia !== undefined,
      esPortero: miAsistencia?.esPortero ?? false,
    },
  });
}
