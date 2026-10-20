import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Navbar } from "@/components/Navbar";

// Las páginas de este grupo dependen de la sesión (cookies) en cada
// petición, así que no se pueden prerenderizar de forma estática.
export const instant = false;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const usuario = await obtenerUsuarioSesion();
  const esAdmin = usuario?.rol === "ADMIN";
  const solicitudesPendientes = esAdmin
    ? await prisma.usuario.count({ where: { estado: "PENDIENTE" } })
    : 0;

  return (
    <>
      {usuario && <Navbar esAdmin={esAdmin} solicitudesPendientes={solicitudesPendientes} />}
      {children}
    </>
  );
}
