import { notFound, redirect } from "next/navigation";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { asistenciaAbierta, cierreAsistencia } from "@/lib/partidos";
import { apuntarse, cancelarAsistencia } from "../actions";
import { generarEquiposPartido } from "../generarActions";
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
        orderBy: { apuntadoEn: "asc" },
        include: { usuario: { select: { id: true, nombreUsuario: true } } },
      },
      generacion: {
        include: {
          asignaciones: {
            include: { usuario: { select: { id: true, nombreUsuario: true } } },
          },
        },
      },
    },
  });

  if (!partido) {
    notFound();
  }

  const asistenciasActivas = partido.asistencias.filter((a) => !a.cancelado);
  const abierto = asistenciaAbierta(partido.fechaHora, partido.horasCierre);
  const cierre = cierreAsistencia(partido.fechaHora, partido.horasCierre);
  const yaApuntado = asistenciasActivas.some((a) => a.usuarioId === usuario.id);
  const puedeGenerar = usuario.rol === "ADMIN" || partido.encargadoId === usuario.id;

  const generacion = partido.generacion;
  const ultimoCambioAsistencia = partido.asistencias.reduce<Date | null>((max, a) => {
    const cambio = a.canceladoEn ?? a.apuntadoEn;
    return !max || cambio > max ? cambio : max;
  }, null);
  const hayCambiosTrasGenerar =
    generacion && ultimoCambioAsistencia && ultimoCambioAsistencia > generacion.generadoEn;

  const numEquipos = generacion?.formato === "TRIANGULAR" ? 3 : 2;
  const equipos = generacion
    ? Array.from({ length: numEquipos }, (_, i) =>
        generacion.asignaciones.filter((a) => a.equipo === i + 1),
      )
    : [];
  const listaEspera = generacion?.asignaciones.filter((a) => a.equipo === 0) ?? [];

  return (
    <main className={styles.screen}>
      <h1 className={styles.title}>{formatearFecha(partido.fechaHora)}</h1>
      <p className={styles.meta}>{partido.ubicacion}</p>
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
        <h2 className={styles.subtitulo}>Apuntados ({asistenciasActivas.length})</h2>
        {asistenciasActivas.length === 0 ? (
          <p className={styles.meta}>Todavía no se ha apuntado nadie.</p>
        ) : (
          <ul className={styles.lista}>
            {asistenciasActivas.map((a) => (
              <li key={a.id}>{a.usuario.nombreUsuario}</li>
            ))}
          </ul>
        )}
      </section>

      {puedeGenerar && (
        <section>
          <h2 className={styles.subtitulo}>Equipos</h2>
          {hayCambiosTrasGenerar && (
            <p className={styles.aviso}>
              Los apuntados han cambiado desde que se generaron los equipos. Puedes regenerarlos.
            </p>
          )}
          <form action={generarEquiposPartido}>
            <input type="hidden" name="partidoId" value={partido.id} />
            <button type="submit" className={styles.generar}>
              {generacion ? "Regenerar equipos" : "Generar equipos"}
            </button>
          </form>
        </section>
      )}

      {generacion && (
        <section>
          <p className={styles.meta}>
            Formato: {FORMATOS[generacion.formato]} · generado el {formatearFecha(generacion.generadoEn)}
          </p>
          <div className={styles.equipos}>
            {equipos.map((equipo, i) => (
              <div key={i} className={styles.equipo}>
                <h3 className={styles.equipoTitulo}>Equipo {i + 1}</h3>
                <ul className={styles.lista}>
                  {equipo.map((a) => (
                    <li key={a.id}>{a.usuario.nombreUsuario}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          {listaEspera.length > 0 && (
            <div className={styles.equipo}>
              <h3 className={styles.equipoTitulo}>Lista de espera</h3>
              <ul className={styles.lista}>
                {listaEspera.map((a) => (
                  <li key={a.id}>{a.usuario.nombreUsuario}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
