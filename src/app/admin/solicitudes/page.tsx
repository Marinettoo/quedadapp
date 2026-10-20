import { redirect } from "next/navigation";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Volver } from "@/components/Volver";
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
      <Volver />
      <h1 className={styles.title}>Solicitudes de acceso</h1>

      {pendientes.length === 0 ? (
        <p className={styles.body}>No hay solicitudes pendientes.</p>
      ) : (
        <ul className={styles.lista}>
          {pendientes.map((p) => (
            <li key={p.id} className={styles.item}>
              <div>
                <p className={styles.nombre}>{p.nombreUsuario}</p>
                <p className={styles.email}>{p.email}</p>
              </div>
              <div className={styles.acciones}>
                <form action={aprobarUsuario}>
                  <input type="hidden" name="id" value={p.id} />
                  <button type="submit" className={styles.aprobar}>
                    Aprobar
                  </button>
                </form>
                <form action={rechazarUsuario}>
                  <input type="hidden" name="id" value={p.id} />
                  <button type="submit" className={styles.rechazar}>
                    Rechazar
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
