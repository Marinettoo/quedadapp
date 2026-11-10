import { NextResponse } from "next/server";
import { verificarLogin, serializarUsuario } from "@/lib/credenciales";
import { crearTokenSesion } from "@/lib/auth";

// Equivalente a iniciarSesion (src/app/actions.ts) pero para un
// cliente que no es un navegador: en vez de dejar el token en una
// cookie, lo devuelve en el cuerpo de la respuesta para que la app lo
// guarde ella misma y lo mande en la cabecera Authorization.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Cuerpo de la petición no válido." }, { status: 400 });
  }

  const nombreUsuario = String(body.nombreUsuario ?? "").trim();
  const password = String(body.password ?? "");

  const resultado = await verificarLogin(nombreUsuario, password);
  if ("error" in resultado) {
    return NextResponse.json({ error: resultado.error }, { status: 401 });
  }

  const { token, expiraEn } = await crearTokenSesion(resultado.usuario.id);

  return NextResponse.json({
    token,
    expiraEn,
    usuario: serializarUsuario(resultado.usuario),
  });
}
