"use server";

import { redirect } from "next/navigation";
import { crearSesion, cerrarSesion } from "@/lib/auth";
import { validarRegistro, crearCuenta, verificarLogin } from "@/lib/credenciales";

export type ResultadoFormulario = { error: string } | { ok: true } | null;

export async function registrar(
  _estadoPrevio: ResultadoFormulario,
  formData: FormData,
): Promise<ResultadoFormulario> {
  const nombreUsuario = String(formData.get("nombreUsuario") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password2") ?? "");

  const errorValidacion = validarRegistro({ nombreUsuario, email, password, password2 });
  if (errorValidacion) {
    return { error: errorValidacion };
  }

  const resultado = await crearCuenta({ nombreUsuario, email, password });
  if ("error" in resultado) {
    return resultado;
  }

  redirect("/registro/enviado");
}

export async function iniciarSesion(
  _estadoPrevio: ResultadoFormulario,
  formData: FormData,
): Promise<ResultadoFormulario> {
  const nombreUsuario = String(formData.get("nombreUsuario") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const resultado = await verificarLogin(nombreUsuario, password);
  if ("error" in resultado) {
    return resultado;
  }

  await crearSesion(resultado.usuario.id);
  redirect("/panel");
}

export async function salir() {
  await cerrarSesion();
  redirect("/");
}
