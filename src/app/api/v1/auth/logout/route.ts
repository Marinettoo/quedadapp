import { NextResponse } from "next/server";
import { extraerBearerToken, invalidarToken } from "@/lib/auth";

export async function POST(request: Request) {
  const token = extraerBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "Falta el token de sesión." }, { status: 401 });
  }

  await invalidarToken(token);
  return NextResponse.json({ ok: true });
}
