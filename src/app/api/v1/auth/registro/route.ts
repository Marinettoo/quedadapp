import { NextResponse } from "next/server";
import { validarRegistro, crearCuenta } from "@/lib/credenciales";

// Mismas reglas que el formulario web de registro (src/app/actions.ts):
// la cuenta queda PENDIENTE hasta que un administrador la aprueba.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Cuerpo de la petición no válido." }, { status: 400 });
  }

  const nombreUsuario = String(body.nombreUsuario ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const password = String(body.password ?? "");
  const password2 = String(body.password2 ?? "");

  const errorValidacion = validarRegistro({ nombreUsuario, email, password, password2 });
  if (errorValidacion) {
    return NextResponse.json({ error: errorValidacion }, { status: 400 });
  }

  const resultado = await crearCuenta({ nombreUsuario, email, password });
  if ("error" in resultado) {
    return NextResponse.json({ error: resultado.error }, { status: 409 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
