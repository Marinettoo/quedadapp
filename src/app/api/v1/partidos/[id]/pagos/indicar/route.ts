import { NextResponse } from "next/server";
import { obtenerUsuarioDesdeRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Equivalentes de indicarPago/deshacerIndicacion en
// src/app/(app)/partidos/pagosActions.ts, siempre sobre el propio pago
// de quien hace la petición (nunca el de otra persona).

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await obtenerUsuarioDesdeRequest(request);
  if (!usuario) {
    return NextResponse.json({ error: "Sesión no válida o caducada." }, { status: 401 });
  }

  const { id: partidoId } = await params;
  const asistencia = await prisma.asistencia.findFirst({
    where: { partidoId, usuarioId: usuario.id, cancelado: false },
  });
  if (!asistencia) {
    return NextResponse.json(
      { error: "Solo pueden indicar el pago quienes están apuntados al partido." },
      { status: 409 },
    );
  }

  await prisma.pago.upsert({
    where: { partidoId_usuarioId: { partidoId, usuarioId: usuario.id } },
    update: { indicadoEn: new Date() },
    create: { partidoId, usuarioId: usuario.id, indicadoEn: new Date() },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await obtenerUsuarioDesdeRequest(request);
  if (!usuario) {
    return NextResponse.json({ error: "Sesión no válida o caducada." }, { status: 401 });
  }

  const { id: partidoId } = await params;
  await prisma.pago.updateMany({
    where: { partidoId, usuarioId: usuario.id, confirmadoEn: null },
    data: { indicadoEn: null },
  });

  return NextResponse.json({ ok: true });
}
