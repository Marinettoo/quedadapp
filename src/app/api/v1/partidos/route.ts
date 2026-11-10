import { NextResponse } from "next/server";
import { obtenerUsuarioDesdeRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { asistenciaAbierta, cierreAsistencia } from "@/lib/partidos";

// Mismo filtro que "Próximos partidos" en Inicio (src/app/(app)/panel/page.tsx):
// partidos que no han pasado, o que han pasado pero siguen en curso
// (tienen horaFin y todavía no ha llegado).
export async function GET(request: Request) {
  const usuario = await obtenerUsuarioDesdeRequest(request);
  if (!usuario) {
    return NextResponse.json({ error: "Sesión no válida o caducada." }, { status: 401 });
  }

  const ahora = new Date();
  const partidos = await prisma.partido.findMany({
    where: { OR: [{ fechaHora: { gte: ahora } }, { horaFin: { gt: ahora } }] },
    orderBy: { fechaHora: "asc" },
    include: {
      encargado: { select: { nombreUsuario: true } },
      asistencias: { where: { cancelado: false }, select: { usuarioId: true } },
    },
  });

  return NextResponse.json({
    partidos: partidos.map((p) => ({
      id: p.id,
      fechaHora: p.fechaHora,
      horaFin: p.horaFin,
      ubicacion: p.ubicacion,
      encargado: p.encargado.nombreUsuario,
      asistentes: p.asistencias.length,
      enCurso: !!p.horaFin && p.fechaHora <= ahora && p.horaFin > ahora,
      abierto: asistenciaAbierta(p.fechaHora, p.horasCierre),
      cierre: cierreAsistencia(p.fechaHora, p.horasCierre),
      yaApuntado: p.asistencias.some((a) => a.usuarioId === usuario.id),
    })),
  });
}
