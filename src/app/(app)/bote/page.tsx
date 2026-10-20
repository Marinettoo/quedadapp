import { redirect } from "next/navigation";
import Link from "next/link";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import styles from "./page.module.css";

export const instant = false;

function formatearFecha(fecha: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    timeZone: "Europe/Madrid",
  }).format(fecha);
}

export default async function Bote() {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario) {
    redirect("/");
  }

  const confirmados = await prisma.pronostico.findMany({
    where: { confirmadoAporteEn: { not: null } },
    include: {
      usuario: { select: { nombreUsuario: true } },
      apuesta: { select: { pregunta: true, partidoId: true } },
    },
    orderBy: { confirmadoAporteEn: "desc" },
  });

  const pendientes = await prisma.pronostico.findMany({
    where: { importeDebido: { not: null }, confirmadoAporteEn: null },
    include: {
      usuario: { select: { nombreUsuario: true } },
      apuesta: { select: { pregunta: true, partidoId: true } },
    },
    orderBy: { creadoEn: "desc" },
  });

  const total = confirmados.reduce((s, p) => s + (p.importeDebido ?? 0), 0);

  return (
    <main className={styles.screen}>
      <AppHeader titulo="Bote de la peña" subtitulo="Lo que se acumula cuando alguien falla una apuesta." />

      <div className={styles.destacado}>
        <span className={styles.destacadoEtiqueta}>Total acumulado</span>
        <span className={styles.destacadoImporte}>{total.toFixed(2)} €</span>
      </div>

      {pendientes.length > 0 && (
        <section className={styles.seccion}>
          <h2 className={styles.subtitulo}>Pendientes de confirmar</h2>
          <ul className={styles.lista}>
            {pendientes.map((p) => (
              <li key={p.id} className={styles.item}>
                <span className={styles.nombre}>{p.usuario.nombreUsuario}</span>
                <span className={styles.meta}>
                  {" "}
                  · {p.apuesta.pregunta} · {(p.importeDebido ?? 0).toFixed(2)} €
                  {p.indicadoAporteEn ? " · indicado" : ""}
                </span>
                <Link href={`/partidos/${p.apuesta.partidoId}`} className={styles.ver}>
                  Ver partido
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className={styles.seccion}>
        <h2 className={styles.subtitulo}>Historial de aportes</h2>
        {confirmados.length === 0 ? (
          <p className={styles.meta}>Todavía no hay aportes confirmados.</p>
        ) : (
          <ul className={styles.lista}>
            {confirmados.map((p) => (
              <li key={p.id} className={styles.item}>
                <span className={styles.nombre}>{p.usuario.nombreUsuario}</span>
                <span className={styles.meta}>
                  {" "}
                  · {p.apuesta.pregunta} · {(p.importeDebido ?? 0).toFixed(2)} € ·{" "}
                  {formatearFecha(p.confirmadoAporteEn!)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
