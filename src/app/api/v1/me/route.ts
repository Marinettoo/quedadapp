import { NextResponse } from "next/server";
import { extraerBearerToken, obtenerUsuarioPorToken } from "@/lib/auth";
import { serializarUsuario } from "@/lib/credenciales";

// Primera llamada que hace la app al abrir, para saber si el token
// guardado todavía vale y en qué estado está la cuenta (pendiente,
// aprobada, rechazada).
export async function GET(request: Request) {
  const token = extraerBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "Falta el token de sesión." }, { status: 401 });
  }

  const usuario = await obtenerUsuarioPorToken(token);
  if (!usuario) {
    return NextResponse.json({ error: "Sesión no válida o caducada." }, { status: 401 });
  }

  return NextResponse.json({ usuario: serializarUsuario(usuario) });
}
