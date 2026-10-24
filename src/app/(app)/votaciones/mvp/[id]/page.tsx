import { notFound, redirect } from "next/navigation";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { AccionBoton } from "@/components/AccionBoton";
import { votarMvp, cerrarVotacionMvp } from "../actions";
import styles from "../../page.module.css";

export const instant = false;

function capitalizar(texto: string) {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function formatearFecha(fecha: Date) {
  return capitalizar(
    new Intl.DateTimeFormat("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Madrid",
    }).format(fecha),
  );
}

export default async function DetalleVotacionMvp({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const usuario = await obtenerUsuarioSesion();
  if (!usuario) {
    redirect("/");
  }

  const votacion = await prisma.votacionMvp.findUnique({
    where: { id },
    include: {
      partido: { select: { fechaHora: true, ubicacion: true } },
      creadaPor: { select: { nombreUsuario: true } },
      votos: {
        include: {
          candidato: { select: { nombreUsuario: true } },
          autor: { select: { nombreUsuario: true } },
        },
      },
    },
  });

  if (!votacion) {
    notFound();
  }

  const candidatos = await prisma.asistencia.findMany({
    where: { partidoId: votacion.partidoId, cancelado: false },
    include: { usuario: { select: { id: true, nombreUsuario: true } } },
    orderBy: { usuario: { nombreUsuario: "asc" } },
  });

  const totalVotos = votacion.votos.length;
  const tuVoto = votacion.votos.find((v) => v.autorId === usuario.id);

  const resultados = candidatos.map(({ usuario: candidato }) => {
    const votantes = votacion.votos.filter((v) => v.candidatoId === candidato.id);
    return { candidato, votantes, cuenta: votantes.length };
  });
  const maxVotos = Math.max(0, ...resultados.map((r) => r.cuenta));
  const empatados = resultados.filter((r) => maxVotos > 0 && r.cuenta === maxVotos);
  const hayEmpate = empatados.length > 1;

  const ganador = votacion.ganadorId
    ? candidatos.find((c) => c.usuarioId === votacion.ganadorId)?.usuario
    : null;

  return (
    <main className={styles.screen}>
      <AppHeader
        titulo="Votación de MVP"
        subtitulo={`${formatearFecha(votacion.partido.fechaHora)} · ${votacion.partido.ubicacion} · Creada por ${
          votacion.creadaPor.nombreUsuario
        } · ${votacion.cerrada ? "Cerrada" : "Abierta"}`}
      />

      {votacion.cerrada && (
        <p className={styles.empate}>
          {ganador ? `MVP: ${ganador.nombreUsuario}.` : "Se cerró sin ganador (sin votos)."}
        </p>
      )}

      {!votacion.cerrada && hayEmpate && (
        <p className={styles.empate}>
          Ahora mismo hay empate entre {empatados.length} jugadores. Un admin debe elegir a mano
          cuál gana al cerrar la votación.
        </p>
      )}

      {candidatos.length === 0 ? (
        <p className={styles.vacio}>Nadie se apuntó (y confirmó) a ese partido.</p>
      ) : (
        <div className={styles.opciones}>
          {resultados.map(({ candidato, votantes, cuenta }) => {
            const esTuVoto = tuVoto?.candidatoId === candidato.id;
            const esGanadora = votacion.cerrada && ganador?.nombreUsuario === candidato.nombreUsuario;
            const porcentaje = totalVotos > 0 ? Math.round((cuenta / totalVotos) * 100) : 0;
            const puedesVotarle = !votacion.cerrada && candidato.id !== usuario.id;

            return (
              <div
                key={candidato.id}
                className={`${styles.opcionResultado} ${esGanadora ? styles.opcionGanadora : ""}`}
              >
                <div className={styles.opcionCabecera}>
                  <span className={styles.opcionFecha}>{candidato.nombreUsuario}</span>
                  <span className={styles.opcionVotos}>
                    {cuenta} {cuenta === 1 ? "voto" : "votos"}
                  </span>
                </div>
                <div className={styles.barra}>
                  <div className={styles.barraRelleno} style={{ width: `${porcentaje}%` }} />
                </div>
                {votantes.length > 0 && (
                  <span className={styles.votantes}>
                    {votantes.map((v) => v.autor.nombreUsuario).join(", ")}
                  </span>
                )}
                {puedesVotarle && (
                  <AccionBoton
                    accion={votarMvp}
                    campos={{ votacionId: votacion.id, candidatoId: candidato.id }}
                    className={esTuVoto ? styles.votadaBoton : styles.votarBoton}
                  >
                    {esTuVoto ? "Tu voto" : "Votar como MVP"}
                  </AccionBoton>
                )}
                {!votacion.cerrada && candidato.id === usuario.id && (
                  <span className={styles.meta}>No puedes votarte a ti mismo.</span>
                )}

                {!votacion.cerrada && usuario.rol === "ADMIN" && hayEmpate && cuenta === maxVotos && (
                  <AccionBoton
                    accion={cerrarVotacionMvp}
                    campos={{ votacionId: votacion.id, ganadorId: candidato.id }}
                    className={styles.cerrarBoton}
                  >
                    Cerrar y nombrar MVP a {candidato.nombreUsuario}
                  </AccionBoton>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!votacion.cerrada && usuario.rol === "ADMIN" && !hayEmpate && candidatos.length > 0 && (
        <AccionBoton
          accion={cerrarVotacionMvp}
          campos={{ votacionId: votacion.id }}
          className={styles.cerrarBoton}
        >
          Cerrar votación
        </AccionBoton>
      )}
    </main>
  );
}
