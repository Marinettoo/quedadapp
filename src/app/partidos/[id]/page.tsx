import { notFound, redirect } from "next/navigation";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { asistenciaAbierta, cierreAsistencia } from "@/lib/partidos";
import { apuntarse, cancelarAsistencia } from "../actions";
import styles from "./page.module.css";

export const instant = false;

const FORMATOS: Record<string, string> = {
  TRIANGULAR: "Triangular (3 equipos)",
  DOS_EQUIPOS: "2 equipos",
};

function formatearFecha(fecha: Date) {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  }).format(fecha);
}

export default async function DetallePartido({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const usuario = await obtenerUsuarioSesion();
  if (!usuario) {
    redirect("/");
  }

  const partido = await prisma.partido.findUnique({
    where: { id },
    include: {
      encargado: { select: { nombreUsuario: true } },
      asistencias: {
        where: { cancelado: false },
        include: { usuario: { select: { id: true, nombreUsuario: true } } },
        orderBy: { apuntadoEn: "asc" },
      },
    },
  });

  if (!partido) {
    notFound();
  }

  const abierto = asistenciaAbierta(partido.fechaHora, partido.horasCierre);
  const cierre = cierreAsistencia(partido.fechaHora, partido.horasCierre);
  const yaApuntado = partido.asistencias.some((a) => a.usuarioId === usuario.id);

  return (
    <main className={styles.screen}>
      <h1 className={styles.title}>{formatearFecha(partido.fechaHora)}</h1>
      <p className={styles.meta}>{partido.ubicacion}</p>
      <p className={styles.meta}>{FORMATOS[partido.formato]}</p>
      <p className={styles.meta}>Encargado de la reserva: {partido.encargado.nombreUsuario}</p>
      <p className={styles.meta}>
        {abierto
          ? `Puedes apuntarte o cancelar hasta ${formatearFecha(cierre)}.`
          : "El plazo para apuntarse o cancelar ya ha cerrado."}
      </p>

      {abierto && (
        <form action={yaApuntado ? cancelarAsistencia : apuntarse}>
          <input type="hidden" name="partidoId" value={partido.id} />
          <button type="submit" className={yaApuntado ? styles.cancelar : styles.apuntarse}>
            {yaApuntado ? "Cancelar asistencia" : "Apuntarme"}
          </button>
        </form>
      )}

      <section>
        <h2 className={styles.subtitulo}>
          Apuntados ({partido.asistencias.length})
        </h2>
        {partido.asistencias.length === 0 ? (
          <p className={styles.meta}>Todavía no se ha apuntado nadie.</p>
        ) : (
          <ul className={styles.lista}>
            {partido.asistencias.map((a) => (
              <li key={a.id}>{a.usuario.nombreUsuario}</li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
