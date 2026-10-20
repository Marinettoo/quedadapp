import { redirect } from "next/navigation";
import Link from "next/link";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calcularTabla } from "@/lib/resultados";
import { Volver } from "@/components/Volver";
import styles from "./page.module.css";

export const instant = false;

function formatearFecha(fecha: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Madrid",
  }).format(fecha);
}

function resumenResultado(
  formato: "TRIANGULAR" | "DOS_EQUIPOS",
  enfrentamientos: { equipoLocal: number; equipoVisitante: number; golesLocal: number; golesVisitante: number }[],
) {
  if (enfrentamientos.length === 0) return "Sin resultado registrado";

  if (formato === "DOS_EQUIPOS") {
    const r = enfrentamientos[0];
    return `Equipo 1 ${r.golesLocal} - ${r.golesVisitante} Equipo 2`;
  }

  const tabla = calcularTabla(enfrentamientos, 3);
  const ganador = tabla[0];
  return `Ganador: Equipo ${ganador.equipo} (${ganador.puntos} pts)`;
}

export default async function Historial() {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario) {
    redirect("/");
  }

  const partidos = await prisma.partido.findMany({
    where: { fechaHora: { lt: new Date() } },
    orderBy: { fechaHora: "desc" },
    include: {
      generacion: true,
      enfrentamientos: true,
      _count: { select: { asistencias: { where: { cancelado: false } } } },
    },
  });

  return (
    <main className={styles.screen}>
      <Volver />
      <h1 className={styles.title}>Historial</h1>

      {partidos.length === 0 ? (
        <p className={styles.body}>Todavía no hay partidos jugados.</p>
      ) : (
        <ul className={styles.lista}>
          {partidos.map((p) => (
            <li key={p.id}>
              <Link className={styles.partido} href={`/partidos/${p.id}`}>
                <span className={styles.fecha}>{formatearFecha(p.fechaHora)}</span>
                <span className={styles.meta}>{p.ubicacion}</span>
                <span className={styles.meta}>
                  {p.generacion
                    ? resumenResultado(p.generacion.formato, p.enfrentamientos)
                    : "No se llegaron a generar equipos"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
