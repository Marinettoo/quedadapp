import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { rutaFoto } from "@/lib/fotos";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const usuario = await obtenerUsuarioSesion();
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
