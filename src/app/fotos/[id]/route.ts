import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { obtenerUsuarioSesion, obtenerUsuarioDesdeRequest } from "@/lib/auth";
import { rutaFoto } from "@/lib/fotos";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // Cookie (web) o token Bearer (app nativa): lo primero que valga.
  const usuario = (await obtenerUsuarioSesion()) ?? (await obtenerUsuarioDesdeRequest(request));
  if (!usuario) {
    return new NextResponse("No autorizado", { status: 401 });
  }

  const { id } = await params;

  try {
    const datos = await readFile(rutaFoto(id));
    return new NextResponse(new Uint8Array(datos), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("No encontrada", { status: 404 });
  }
}
