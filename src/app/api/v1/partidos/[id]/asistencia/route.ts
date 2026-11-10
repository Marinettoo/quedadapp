import { NextResponse } from "next/server";
import { obtenerUsuarioDesdeRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { asistenciaAbierta } from "@/lib/partidos";

// Mismas reglas que apuntarse/cancelarAsistencia en
// src/app/(app)/partidos/actions.ts (usadas por la web): cada quien
// apunta o cancela su propia asistencia, solo mientras el plazo sigue
// abierto. Apuntar a otra persona (cosa de admin/encargado) no entra en
// este primer bloque de la API.

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await obtenerUsuarioDesdeRequest(request);
  if (!usuario) {
    return NextResponse.json({ error: "Sesión no válida o caducada." }, { status: 401 });
  }

  const { id: partidoId } = await params;
  const partido = await prisma.partido.findUnique({ where: { id: partidoId } });
  if (!partido) {
    return NextResponse.json({ error: "El partido no existe." }, { status: 404 });
  }
  if (!asistenciaAbierta(partido.fechaHora, partido.horasCierre)) {
    return NextResponse.json({ error: "El plazo para apuntarse ya ha cerrado." }, { status: 409 });
  }

  await prisma.asistencia.upsert({
    where: { partidoId_usuarioId: { partidoId, usuarioId: usuario.id } },
    update: { cancelado: false, canceladoEn: null, apuntadoEn: new Date() },
    create: { partidoId, usuarioId: usuario.id },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await obtenerUsuarioDesdeRequest(request);
  if (!usuario) {
    return NextResponse.json({ error: "Sesión no válida o caducada." }, { status: 401 });
  }

  const { id: partidoId } = await params;
  const partido = await prisma.partido.findUnique({ where: { id: partidoId } });
  if (!partido) {
    return NextResponse.json({ error: "El partido no existe." }, { status: 404 });
  }
  if (!asistenciaAbierta(partido.fechaHora, partido.horasCierre)) {
    return NextResponse.json({ error: "El plazo para cancelar ya ha cerrado." }, { status: 409 });
  }

  await prisma.asistencia.updateMany({
    where: { partidoId, usuarioId: usuario.id },
    data: { cancelado: true, canceladoEn: new Date() },
  });

  return NextResponse.json({ ok: true });
}
