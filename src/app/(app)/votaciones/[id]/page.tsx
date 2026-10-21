import { notFound, redirect } from "next/navigation";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { AccionBoton } from "@/components/AccionBoton";
import { votar, cerrarVotacion } from "../actions";
import styles from "../page.module.css";

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

export default async function DetalleVotacion({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const usuario = await obtenerUsuarioSesion();
  if (!usuario) {
    redirect("/");
  }

  const votacion = await prisma.votacionFecha.findUnique({
    where: { id },
    include: {
      creadaPor: { select: { nombreUsuario: true } },
      opciones: { orderBy: { fechaHora: "asc" } },
      votos: { include: { usuario: { select: { nombreUsuario: true } } } },
    },
  });

  if (!votacion) {
    notFound();
  }

  const totalVotos = votacion.votos.length;
  const tuVoto = votacion.votos.find((v) => v.usuarioId === usuario.id);

  const resultados = votacion.opciones.map((opcion) => {
    const votantes = votacion.votos.filter((v) => v.opcionId === opcion.id);
    return { opcion, votantes, cuenta: votantes.length };
  });
  const maxVotos = Math.max(0, ...resultados.map((r) => r.cuenta));
  const ganadoras = resultados.filter((r) => maxVotos > 0 && r.cuenta === maxVotos);
  const hayEmpate = votacion.cerrada && ganadoras.length > 1;

  return (
    <main className={styles.screen}>
      <AppHeader
        titulo={votacion.titulo}
        subtitulo={`Creada por ${votacion.creadaPor.nombreUsuario} · ${
          votacion.cerrada ? "Cerrada" : "Abierta"
        }`}
      />

      {hayEmpate && (
        <p className={styles.empate}>
          Empate entre {ganadoras.length} opciones. Decide cuál usar al crear el partido.
        </p>
      )}

      <div className={styles.opciones}>
        {resultados.map(({ opcion, votantes, cuenta }) => {
          const esTuVoto = tuVoto?.opcionId === opcion.id;
          const esGanadora = votacion.cerrada && ganadoras.some((g) => g.opcion.id === opcion.id);
          const porcentaje = totalVotos > 0 ? Math.round((cuenta / totalVotos) * 100) : 0;

          return (
            <div
              key={opcion.id}
              className={`${styles.opcionResultado} ${esGanadora ? styles.opcionGanadora : ""}`}
            >
              <div className={styles.opcionCabecera}>
                <span className={styles.opcionFecha}>{formatearFecha(opcion.fechaHora)}</span>
                <span className={styles.opcionVotos}>
                  {cuenta} {cuenta === 1 ? "voto" : "votos"}
                </span>
              </div>
              <div className={styles.barra}>
                <div className={styles.barraRelleno} style={{ width: `${porcentaje}%` }} />
              </div>
              {votantes.length > 0 && (
                <span className={styles.votantes}>
                  {votantes.map((v) => v.usuario.nombreUsuario).join(", ")}
                </span>
              )}
              {!votacion.cerrada && (
                <AccionBoton
                  accion={votar}
                  campos={{ votacionId: votacion.id, opcionId: opcion.id }}
                  className={esTuVoto ? styles.votadaBoton : styles.votarBoton}
                >
                  {esTuVoto ? "Tu voto" : "Votar esta opción"}
                </AccionBoton>
              )}
            </div>
          );
        })}
      </div>

      {!votacion.cerrada && usuario.rol === "ADMIN" && (
        <AccionBoton
          accion={cerrarVotacion}
          campos={{ votacionId: votacion.id }}
          className={styles.cerrarBoton}
        >
          Cerrar votación
        </AccionBoton>
      )}
    </main>
  );
}
