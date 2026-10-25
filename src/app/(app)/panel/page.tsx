import { redirect } from "next/navigation";
import Link from "next/link";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calcularEdad } from "@/lib/usuarios";
import { AppHeader } from "@/components/AppHeader";
import { BallMark } from "@/components/BallMark";
import { salir } from "@/app/actions";
import { CreadorModal } from "@/components/CreadorModal";
import { CarruselJugadores, type JugadorCarrusel } from "@/components/CarruselJugadores";
import { TarjetaJugador } from "@/components/TarjetaJugador";
import { AvatarJugador } from "@/components/AvatarJugador";
import { abrirVotacionesMvpPendientes } from "@/lib/mvp";
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

  // Antes de leer los partidos: si alguno ya ha terminado y todavía no
  // tiene votación de MVP, se abre sola aquí.
  await abrirVotacionesMvpPendientes();

  const ahora = new Date();
  const partidos = await prisma.partido.findMany({
    where: { OR: [{ fechaHora: { gte: ahora } }, { horaFin: { gt: ahora } }] },
    orderBy: { fechaHora: "asc" },
    include: { _count: { select: { asistencias: { where: { cancelado: false } } } } },
  });

  function enCurso(p: (typeof partidos)[number]) {
    return !!p.horaFin && p.fechaHora <= ahora && p.horaFin > ahora;
  }

  const [proximo, ...resto] = partidos;

  const jugadoresParaCarrusel = await prisma.usuario.findMany({
    where: { estado: "APROBADA" },
    orderBy: { nombreUsuario: "asc" },
    include: { valoracionesRecibidas: { select: { estrellas: true } } },
  });

  const [partidosPorJugador, golesPorJugador] = await Promise.all([
    prisma.asistencia.groupBy({
      by: ["usuarioId"],
      where: { cancelado: false },
      _count: { _all: true },
    }),
    prisma.golJugador.groupBy({
      by: ["usuarioId"],
      where: { usuarioId: { not: null } },
      _sum: { goles: true },
    }),
  ]);
  const partidosMapa = new Map(partidosPorJugador.map((p) => [p.usuarioId, p._count._all]));
  const golesMapa = new Map(golesPorJugador.map((g) => [g.usuarioId, g._sum.goles ?? 0]));

  const jugadoresCarrusel: JugadorCarrusel[] = jugadoresParaCarrusel.map((j) => {
    const cuenta = j.valoracionesRecibidas.length;
    const media =
      cuenta === 0 ? null : j.valoracionesRecibidas.reduce((s, v) => s + v.estrellas, 0) / cuenta;
    return {
      jugadorId: j.id,
      nombreUsuario: j.nombreUsuario,
      fotoActualizadaEn: j.fotoActualizadaEn,
      media,
      cuenta,
      partidosJugados: partidosMapa.get(j.id) ?? 0,
      golesMarcados: golesMapa.get(j.id) ?? 0,
      edad: j.fechaNacimiento ? calcularEdad(j.fechaNacimiento) : null,
      piernaBuena: j.piernaBuena,
      fotoOffsetX: j.fotoOffsetX,
      fotoOffsetY: j.fotoOffsetY,
      fotoEscala: j.fotoEscala,
      esMvp: j.esMvpActual,
    };
  });

  const mvp = jugadoresCarrusel.find((j) => j.esMvp) ?? null;

  // Podio: 2º y 3er más votados en la votación que coronó al MVP actual
  // (la última cerrada con ese ganador), para acompañarlo a los lados.
  type PuestoPodio = { id: string; nombreUsuario: string; fotoActualizadaEn: Date | null; votos: number };
  let segundo: PuestoPodio | null = null;
  let tercero: PuestoPodio | null = null;

  if (mvp) {
    const votacionGanadora = await prisma.votacionMvp.findFirst({
      where: { cerrada: true, ganadorId: mvp.jugadorId },
      orderBy: { cerradaEn: "desc" },
      include: { votos: true },
    });

    if (votacionGanadora) {
      const cuentas = new Map<string, number>();
      for (const v of votacionGanadora.votos) {
        cuentas.set(v.candidatoId, (cuentas.get(v.candidatoId) ?? 0) + 1);
      }
      cuentas.delete(mvp.jugadorId);

      const siguientes = [...cuentas.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2);
      if (siguientes.length > 0) {
        const usuarios = await prisma.usuario.findMany({
          where: { id: { in: siguientes.map(([id]) => id) } },
          select: { id: true, nombreUsuario: true, fotoActualizadaEn: true },
        });
        const porId = new Map(usuarios.map((u) => [u.id, u]));
        const [idSegundo, votosSegundo] = siguientes[0];
        const usuSegundo = porId.get(idSegundo);
        if (usuSegundo) segundo = { ...usuSegundo, votos: votosSegundo };

        if (siguientes[1]) {
          const [idTercero, votosTercero] = siguientes[1];
          const usuTercero = porId.get(idTercero);
          if (usuTercero) tercero = { ...usuTercero, votos: votosTercero };
        }
      }
    }
  }

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
              <span className={enCurso(proximo) ? styles.destacadoEtiquetaEnCurso : styles.destacadoEtiqueta}>
                {enCurso(proximo) ? "⚽ En curso" : "El próximo"}
              </span>
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
                      <span className={styles.partidoFecha}>
                        {enCurso(p) ? "⚽ En curso" : formatearFecha(p.fechaHora)}
                      </span>
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

      {mvp && (
        <section className={styles.seccion}>
          <h2 className={styles.subtitulo}>MVP de esta semana</h2>
          <div className={styles.podio}>
            {segundo && (
              <Link
                href={`/jugadores/${segundo.id}`}
                className={`${styles.podioPuesto} ${styles.podioSegundo}`}
              >
                <AvatarJugador
                  usuarioId={segundo.id}
                  nombre={segundo.nombreUsuario}
                  fotoActualizadaEn={segundo.fotoActualizadaEn}
                  tamano={84}
                />
                <span className={`${styles.podioMedalla} ${styles.podioMedallaPlata}`}>2</span>
                <span className={styles.podioNombre}>{segundo.nombreUsuario}</span>
                <span className={styles.podioVotos}>
                  {segundo.votos} {segundo.votos === 1 ? "voto" : "votos"}
                </span>
              </Link>
            )}

            <Link href={`/jugadores/${mvp.jugadorId}`} className={`${styles.podioPuesto} ${styles.podioPrimero}`}>
              <TarjetaJugador {...mvp} />
            </Link>

            {tercero && (
              <Link
                href={`/jugadores/${tercero.id}`}
                className={`${styles.podioPuesto} ${styles.podioTercero}`}
              >
                <AvatarJugador
                  usuarioId={tercero.id}
                  nombre={tercero.nombreUsuario}
                  fotoActualizadaEn={tercero.fotoActualizadaEn}
                  tamano={64}
                />
                <span className={`${styles.podioMedalla} ${styles.podioMedallaBronce}`}>3</span>
                <span className={styles.podioNombre}>{tercero.nombreUsuario}</span>
                <span className={styles.podioVotos}>
                  {tercero.votos} {tercero.votos === 1 ? "voto" : "votos"}
                </span>
              </Link>
            )}
          </div>
        </section>
      )}

      {jugadoresCarrusel.length > 0 && (
        <section className={styles.seccion}>
          <h2 className={styles.subtitulo}>Jugadores de la peña</h2>
          <CarruselJugadores jugadores={jugadoresCarrusel} />
        </section>
      )}

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
