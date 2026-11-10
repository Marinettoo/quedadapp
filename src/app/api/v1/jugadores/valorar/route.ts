import { NextResponse } from "next/server";
import { obtenerUsuarioDesdeRequest } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Equivalente de valorar() en src/app/(app)/jugadores/actions.ts.
export async function POST(request: Request) {
  const usuario = await obtenerUsuarioDesdeRequest(request);
  if (!usuario) {
    return NextResponse.json({ error: "Sesión no válida o caducada." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const valoradoId = String(body?.valoradoId ?? "");
  const estrellas = Number(body?.estrellas);

  if (valoradoId === usuario.id) {
    return NextResponse.json({ error: "No puedes valorarte a ti mismo." }, { status: 400 });
  }
  if (!Number.isInteger(estrellas) || estrellas < 1 || estrellas > 5) {
    return NextResponse.json({ error: "La valoración debe ser de 1 a 5 estrellas." }, { status: 400 });
  }

  const valorado = await prisma.usuario.findUnique({ where: { id: valoradoId } });
  if (!valorado || valorado.estado !== "APROBADA") {
    return NextResponse.json({ error: "Ese jugador no existe o no está aprobado." }, { status: 404 });
  }

  await prisma.valoracion.upsert({
    where: { valoradoId_autorId: { valoradoId, autorId: usuario.id } },
    update: { estrellas },
    create: { valoradoId, autorId: usuario.id, estrellas },
  });

  return NextResponse.json({ ok: true });
}
