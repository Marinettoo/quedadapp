import { NextResponse } from "next/server";
import { obtenerUsuarioDesdeRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { crearNotificacion } from "@/lib/notificaciones";

// Equivalentes de confirmarPago/corregirConfirmacion en
// src/app/(app)/partidos/pagosActions.ts: solo la persona encargada de
// la reserva puede confirmar o corregir el pago de otro jugador,
// aunque quien hace la petición sea administrador.

async function exigirEncargado(partidoId: string, usuarioId: string) {
  const partido = await prisma.partido.findUnique({ where: { id: partidoId } });
  if (!partido) return { error: "El partido no existe." as const, status: 404 as const };
  if (partido.encargadoId !== usuarioId) {
    return {
      error: "Solo la persona encargada de la reserva puede confirmar pagos." as const,
      status: 403 as const,
    };
  }
  return null;
}

async function jugadorApuntado(partidoId: string, tipo: "USUARIO" | "INVITADO", id: string) {
  if (tipo === "USUARIO") {
    return (await prisma.asistencia.findFirst({ where: { partidoId, usuarioId: id, cancelado: false } })) !== null;
  }
  return (await prisma.invitado.findFirst({ where: { partidoId, id } })) !== null;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await obtenerUsuarioDesdeRequest(request);
  if (!usuario) {
    return NextResponse.json({ error: "Sesión no válida o caducada." }, { status: 401 });
  }

  const { id: partidoId } = await params;
  const errorEncargado = await exigirEncargado(partidoId, usuario.id);
  if (errorEncargado) {
    return NextResponse.json({ error: errorEncargado.error }, { status: errorEncargado.status });
  }

  const body = await request.json().catch(() => null);
  const jugadorId = String(body?.jugadorId ?? "");
  const tipo = body?.tipo === "INVITADO" ? "INVITADO" : "USUARIO";
  if (!jugadorId) {
    return NextResponse.json({ error: "Falta jugadorId." }, { status: 400 });
  }
  if (!(await jugadorApuntado(partidoId, tipo, jugadorId))) {
    return NextResponse.json({ error: "Ese jugador no está apuntado a este partido." }, { status: 404 });
  }

  const clave =
    tipo === "USUARIO"
      ? { partidoId_usuarioId: { partidoId, usuarioId: jugadorId } }
      : { partidoId_invitadoId: { partidoId, invitadoId: jugadorId } };
  const datosBase = tipo === "USUARIO" ? { usuarioId: jugadorId } : { invitadoId: jugadorId };

  await prisma.pago.upsert({
    where: clave,
    update: { confirmadoEn: new Date(), confirmadoPorId: usuario.id },
    create: { partidoId, ...datosBase, indicadoEn: new Date(), confirmadoEn: new Date(), confirmadoPorId: usuario.id },
  });

  await prisma.pago.updateMany({
    where: { partidoId, ...datosBase, indicadoEn: null },
    data: { indicadoEn: new Date() },
  });

  if (tipo === "USUARIO") {
    await crearNotificacion({
      usuarioId: jugadorId,
      tipo: "PAGO_CONFIRMADO",
      mensaje: "Tu pago del partido ha sido confirmado.",
      enlace: `/partidos/${partidoId}`,
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await obtenerUsuarioDesdeRequest(request);
  if (!usuario) {
    return NextResponse.json({ error: "Sesión no válida o caducada." }, { status: 401 });
  }

  const { id: partidoId } = await params;
  const errorEncargado = await exigirEncargado(partidoId, usuario.id);
  if (errorEncargado) {
    return NextResponse.json({ error: errorEncargado.error }, { status: errorEncargado.status });
  }

  const url = new URL(request.url);
  const jugadorId = url.searchParams.get("jugadorId") ?? "";
  const tipo = url.searchParams.get("tipo") === "INVITADO" ? "INVITADO" : "USUARIO";
  if (!jugadorId) {
    return NextResponse.json({ error: "Falta jugadorId." }, { status: 400 });
  }

  const datosBase = tipo === "USUARIO" ? { usuarioId: jugadorId } : { invitadoId: jugadorId };
  await prisma.pago.updateMany({
    where: { partidoId, ...datosBase },
    data: { confirmadoEn: null, confirmadoPorId: null },
  });

  return NextResponse.json({ ok: true });
}
