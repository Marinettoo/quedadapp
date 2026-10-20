import { redirect } from "next/navigation";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { AccionBoton } from "@/components/AccionBoton";
import { aprobarUsuario, rechazarUsuario } from "./actions";
import styles from "./page.module.css";

// Página protegida: necesita la sesión (cookie) en cada petición.
export const instant = false;

export default async function Solicitudes() {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario) {
    redirect("/");
  }
  if (usuario.rol !== "ADMIN") {
    redirect("/panel");
  }

  const pendientes = await prisma.usuario.findMany({
    where: { estado: "PENDIENTE" },
    orderBy: { creadoEn: "asc" },
  });

  return (
    <main className={styles.screen}>
      <AppHeader titulo="Solicitudes de acceso" />

      {pendientes.length === 0 ? (
        <p className={styles.vacio}>No hay solicitudes pendientes.</p>
      ) : (
        <ul className={styles.lista}>
          {pendientes.map((p) => (
            <li key={p.id} className={styles.item}>
              <div>
                <p className={styles.nombre}>{p.nombreUsuario}</p>
                <p className={styles.email}>{p.email}</p>
              </div>
              <div className={styles.acciones}>
                <AccionBoton
                  accion={aprobarUsuario}
                  campos={{ id: p.id }}
                  className={styles.aprobar}
                >
                  Aprobar
                </AccionBoton>
                <AccionBoton
                  accion={rechazarUsuario}
                  campos={{ id: p.id }}
                  className={styles.rechazar}
                >
                  Rechazar
                </AccionBoton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
