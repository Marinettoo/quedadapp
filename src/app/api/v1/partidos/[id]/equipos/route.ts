import { NextResponse } from "next/server";
import { obtenerUsuarioDesdeRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

const COLORES_POR_DEFECTO: Record<number, string> = { 1: "#000000", 2: "#ffffff", 3: "#757575" };

// Versión de solo lectura de la pestaña Equipos de la web (ver
// plantillas, colores y lista de espera). Generar equipos, grupos e
// invitados son cosa de admin/encargado y quedan fuera de este bloque.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await obtenerUsuarioDesdeRequest(request);
  if (!usuario) {
    return NextResponse.json({ error: "Sesión no válida o caducada." }, { status: 401 });
  }

  const { id } = await params;
  const partido = await prisma.partido.findUnique({
    where: { id },
    include: {
      coloresEquipo: true,
      generacion: {
        include: {
          asignaciones: {
            include: {
              usuario: { select: { id: true, nombreUsuario: true } },
              invitado: { select: { id: true, nombre: true } },
            },
          },
        },
      },
    },
  });

  if (!partido) {
    return NextResponse.json({ error: "El partido no existe." }, { status: 404 });
  }
  const generacion = partido.generacion;
  if (!generacion) {
    return NextResponse.json({ error: "Todavía no se han generado los equipos." }, { status: 404 });
  }

  const coloresPorEquipo = new Map(partido.coloresEquipo.map((c) => [c.equipo, c.color]));
  const numEquipos = generacion.formato === "TRIANGULAR" ? 3 : 2;

  const asignaciones = generacion.asignaciones;
  const nombreDe = (a: (typeof asignaciones)[number]) =>
    a.usuario ? a.usuario.nombreUsuario : `${a.invitado!.nombre} (invitado)`;

  const equipos = Array.from({ length: numEquipos }, (_, i) => {
    const numero = i + 1;
    return {
      numero,
      color: coloresPorEquipo.get(numero) ?? COLORES_POR_DEFECTO[numero],
      jugadores: asignaciones
        .filter((a) => a.equipo === numero)
        .map((a) => ({
          nombre: nombreDe(a),
          esYo: a.usuarioId === usuario.id,
          esPortero: a.esPortero,
        })),
    };
  });

  const listaEspera = asignaciones
    .filter((a) => a.equipo === 0)
    .map((a) => ({ nombre: nombreDe(a), esYo: a.usuarioId === usuario.id, esPortero: a.esPortero }));

  return NextResponse.json({
    equipos: {
      formato: generacion.formato,
      generadoEn: generacion.generadoEn,
      equipos,
      listaEspera,
    },
  });
}
