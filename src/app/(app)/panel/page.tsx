import { redirect } from "next/navigation";
import Link from "next/link";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { BallMark } from "@/components/BallMark";
import { salir } from "@/app/actions";
import { CreadorModal } from "@/components/CreadorModal";
import styles from "./page.module.css";

// Página protegida: necesita la sesión (cookie) en cada petición.
export const instant = false;

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

  const [proximo, ...resto] = partidos;

  return (
    <main className={styles.screen}>
      <AppHeader
        titulo={`Hola, ${usuario.nombreUsuario}`}
        subtitulo={usuario.rol === "ADMIN" ? "Administrador" : "Jugador"}
      />

      {usuario.rol === "ADMIN" && (
        <div className={styles.enlaces}>
          <Link href="/partidos/nuevo" className={styles.crearPartido}>
            Crear partido
          </Link>
        </div>
      )}

      <section className={styles.seccion}>
        <h2 className={styles.subtitulo}>Próximos partidos</h2>

        {partidos.length === 0 ? (
          <div className={styles.vacio}>
            <BallMark className={styles.vacioIcono} />
            <p className={styles.vacioTexto}>
              {usuario.rol === "ADMIN"
                ? "No hay partidos programados. Anímate a organizar el próximo."
                : "No hay partidos programados. En cuanto un administrador cree uno, aparecerá aquí."}
            </p>
            {usuario.rol === "ADMIN" && (
              <Link href="/partidos/nuevo" className={styles.vacioBoton}>
                Crear partido
              </Link>
            )}
          </div>
        ) : (
          <>
            <Link href={`/partidos/${proximo.id}`} className={styles.destacado}>
              <span className={styles.destacadoEtiqueta}>El próximo</span>
              <span className={styles.destacadoFecha}>{formatearFecha(proximo.fechaHora)}</span>
              <span className={styles.destacadoMeta}>
                {proximo.ubicacion} · {proximo._count.asistencias} apuntados
              </span>
            </Link>

            {resto.length > 0 && (
              <ul className={styles.lista}>
                {resto.map((p) => (
                  <li key={p.id}>
                    <Link className={styles.partido} href={`/partidos/${p.id}`}>
                      <span className={styles.partidoFecha}>{formatearFecha(p.fechaHora)}</span>
                      <span className={styles.partidoMeta}>
                        {p.ubicacion} · {p._count.asistencias} apuntados
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      <form action={salir}>
        <button type="submit" className={styles.salir}>
          Cerrar sesión
        </button>
      </form>

      <div className={styles.creador}>
        <CreadorModal />
      </div>
    </main>
  );
}
