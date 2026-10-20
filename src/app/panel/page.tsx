import { redirect } from "next/navigation";
import Link from "next/link";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { salir } from "../actions";
import styles from "./page.module.css";

// Página protegida: necesita la sesión (cookie) en cada petición.
export const instant = false;

const FORMATOS: Record<string, string> = {
  TRIANGULAR: "Triangular",
  DOS_EQUIPOS: "2 equipos",
};

function formatearFecha(fecha: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  }).format(fecha);
}

export default async function Panel() {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario) {
    redirect("/");
  }

  const partidos = await prisma.partido.findMany({
    where: { fechaHora: { gte: new Date() } },
    orderBy: { fechaHora: "asc" },
    include: { _count: { select: { asistencias: { where: { cancelado: false } } } } },
  });

  return (
    <main className={styles.screen}>
      <h1 className={styles.title}>Hola, {usuario.nombreUsuario}</h1>
      <p className={styles.body}>
        Has entrado como {usuario.rol === "ADMIN" ? "administrador" : "usuario"}.
      </p>

      {usuario.rol === "ADMIN" && (
        <div className={styles.enlaces}>
          <Link className={styles.adminLink} href="/admin/solicitudes">
            Revisar solicitudes de acceso
          </Link>
          <Link className={styles.adminLink} href="/partidos/nuevo">
            Crear partido
          </Link>
        </div>
      )}

      <section>
        <h2 className={styles.subtitulo}>Próximos partidos</h2>
        {partidos.length === 0 ? (
          <p className={styles.body}>No hay partidos programados todavía.</p>
        ) : (
          <ul className={styles.lista}>
            {partidos.map((p) => (
              <li key={p.id}>
                <Link className={styles.partido} href={`/partidos/${p.id}`}>
                  <span className={styles.partidoFecha}>{formatearFecha(p.fechaHora)}</span>
                  <span className={styles.partidoMeta}>
                    {p.ubicacion} · {FORMATOS[p.formato]} · {p._count.asistencias} apuntados
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form action={salir}>
        <button type="submit" className={styles.salir}>
          Cerrar sesión
        </button>
      </form>
    </main>
  );
}
