import { NextResponse } from "next/server";
import { obtenerUsuarioDesdeRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calcularEdad } from "@/lib/usuarios";

// Mismos datos que /jugadores en la web: todos los aprobados, con
// media de estrellas, estadísticas y mi propia valoración a cada uno
// (para pintar las 5 estrellas ya rellenas que correspondan).
export async function GET(request: Request) {
  const usuario = await obtenerUsuarioDesdeRequest(request);
  if (!usuario) {
    return NextResponse.json({ error: "Sesión no válida o caducada." }, { status: 401 });
  }

  const [jugadores, partidosPorJugador, golesPorJugador] = await Promise.all([
    prisma.usuario.findMany({
      where: { estado: "APROBADA" },
      orderBy: { nombreUsuario: "asc" },
      include: { valoracionesRecibidas: { select: { estrellas: true, autorId: true } } },
    }),
    prisma.asistencia.groupBy({
      by: ["usuarioId"],
      where: { cancelado: false },
      _count: { _all: true },
    }),
    prisma.golJugador.groupBy({
      by: ["usuarioId"],
      where: { usuarioId: { not: null } },
      _sum: { goles: true },
    }),
  ]);

  const partidosMapa = new Map(partidosPorJugador.map((p) => [p.usuarioId, p._count._all]));
  const golesMapa = new Map(golesPorJugador.map((g) => [g.usuarioId, g._sum.goles ?? 0]));

  return NextResponse.json({
    jugadores: jugadores.map((j) => {
      const cuenta = j.valoracionesRecibidas.length;
      const media = cuenta === 0 ? null : j.valoracionesRecibidas.reduce((s, v) => s + v.estrellas, 0) / cuenta;
      const miValoracion = j.valoracionesRecibidas.find((v) => v.autorId === usuario.id)?.estrellas ?? 0;

      return {
        id: j.id,
        nombreUsuario: j.nombreUsuario,
        tieneFoto: j.fotoActualizadaEn !== null,
        fotoActualizadaEn: j.fotoActualizadaEn,
        media,
        cuenta,
        partidosJugados: partidosMapa.get(j.id) ?? 0,
        golesMarcados: golesMapa.get(j.id) ?? 0,
        edad: j.fechaNacimiento ? calcularEdad(j.fechaNacimiento) : null,
        piernaBuena: j.piernaBuena,
        fotoOffsetX: j.fotoOffsetX,
        fotoOffsetY: j.fotoOffsetY,
        fotoEscala: j.fotoEscala,
        esMvp: j.esMvpActual,
        esYo: j.id === usuario.id,
        miValoracion,
      };
    }),
  });
}
