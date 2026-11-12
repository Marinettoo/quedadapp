import { NextResponse } from "next/server";
import { obtenerUsuarioDesdeRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Misma lógica de permisos y estados que la pestaña Pagos de la web
// (src/app/(app)/partidos/[id]/pagos/page.tsx), en solo lectura: las
// acciones (indicar, confirmar...) van en sus propias rutas.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await obtenerUsuarioDesdeRequest(request);
  if (!usuario) {
    return NextResponse.json({ error: "Sesión no válida o caducada." }, { status: 401 });
  }

  const { id } = await params;
  const partido = await prisma.partido.findUnique({
    where: { id },
    select: {
      id: true,
      encargadoId: true,
      importeTotal: true,
      asistencias: {
        where: { cancelado: false },
        orderBy: { apuntadoEn: "asc" },
        include: { usuario: { select: { id: true, nombreUsuario: true } } },
      },
      pagos: true,
      invitados: {
        orderBy: { creadoEn: "asc" },
        include: { invitado: { select: { id: true, nombre: true } } },
      },
    },
  });

  if (!partido) {
    return NextResponse.json({ error: "El partido no existe." }, { status: 404 });
  }

  const puedeGenerar = usuario.rol === "ADMIN" || partido.encargadoId === usuario.id;
  const puedeConfirmarPagos = partido.encargadoId === usuario.id;
  const puedeVerPagos =
    usuario.rol === "ADMIN" ||
    partido.encargadoId === usuario.id ||
    partido.asistencias.some((a) => a.usuarioId === usuario.id);
  const puedeVerListaCompleta = puedeGenerar;

  if (!puedeVerPagos) {
    return NextResponse.json({ error: "No puedes ver los pagos de este partido." }, { status: 403 });
  }

  type Jugador = {
    usuario: { id: string; nombreUsuario: string } | null;
    invitado: { id: string; nombre: string } | null;
  };
  const asistentes: Jugador[] = [
    ...partido.asistencias.map((a) => ({ usuario: a.usuario, invitado: null })),
    ...partido.invitados.map((i) => ({ usuario: null, invitado: i.invitado })),
  ];

  const pagosPorClave = new Map(
    partido.pagos.map((p) => [p.usuarioId ? `u:${p.usuarioId}` : `i:${p.invitadoId}`, p]),
  );
  const parteImporte =
    partido.importeTotal !== null && asistentes.length > 0 ? partido.importeTotal / asistentes.length : null;

  const filas = asistentes
    .map((a) => {
      const esUsuario = a.usuario !== null;
      const jugadorId = esUsuario ? a.usuario!.id : a.invitado!.id;
      const clave = esUsuario ? `u:${jugadorId}` : `i:${jugadorId}`;
      const pago = pagosPorClave.get(clave);
      return {
        jugadorId,
        tipo: esUsuario ? "USUARIO" : "INVITADO",
        nombre: esUsuario ? a.usuario!.nombreUsuario : `${a.invitado!.nombre} (invitado)`,
        esYo: esUsuario && jugadorId === usuario.id,
        estado: pago?.confirmadoEn ? "CONFIRMADO" : pago?.indicadoEn ? "INDICADO" : "PENDIENTE",
      };
    })
    .filter((f) => puedeVerListaCompleta || f.esYo);

  return NextResponse.json({
    pagos: {
      importeTotal: partido.importeTotal,
      parteImporte,
      totalJugadores: asistentes.length,
      puedeEstablecerImporte: puedeGenerar,
      puedeConfirmarPagos,
      filas,
    },
  });
}
