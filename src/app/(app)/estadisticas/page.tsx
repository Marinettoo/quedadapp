import { redirect } from "next/navigation";
import Link from "next/link";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { AvatarJugador } from "@/components/AvatarJugador";
import styles from "./page.module.css";

export const instant = false;

type Fila = { nombre: string; valor: number };

function Ranking({ titulo, filas, unidad }: { titulo: string; filas: Fila[]; unidad: string }) {
  return (
    <section className={styles.bloque}>
      <h2 className={styles.subtitulo}>{titulo}</h2>
      {filas.length === 0 ? (
        <p className={styles.vacio}>Todavía no hay datos suficientes.</p>
      ) : (
        <ol className={styles.lista}>
          {filas.map((f, i) => (
            <li key={f.nombre} className={styles.fila}>
              <span className={styles.posicion}>{i + 1}</span>
              <span className={styles.nombre}>{f.nombre}</span>
              <span className={styles.valor}>
                {f.valor} {unidad}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

type FilaMvp = { id: string; nombre: string; fotoActualizadaEn: Date | null; veces: number };

// Los 3 primeros se ven como la foto sola (recortada, con marco de
// medalla), no la carta completa: a tamaño pequeño el nombre y los
// chips de la carta no se leerían bien, y así caben los 3 a la vez en
// pantalla (móvil o pc) sin tener que hacer scroll. Del 4º en
// adelante, fila de texto normal como el resto de estadísticas.
function RankingMvp({ filas }: { filas: FilaMvp[] }) {
  const top3 = filas.slice(0, 3);
  const resto = filas.slice(3);
  const coloresMedalla = [styles.medallaOro, styles.medallaPlata, styles.medallaBronce];

  return (
    <section className={styles.bloque}>
      <h2 className={styles.subtitulo}>Más veces MVP</h2>
      {filas.length === 0 ? (
        <p className={styles.vacio}>Todavía no hay datos suficientes.</p>
      ) : (
        <>
          <div className={styles.podioMvp}>
            {top3.map((f, i) => (
              <Link key={f.id} href={`/jugadores/${f.id}`} className={styles.podioMvpPuesto}>
                <span className={`${styles.podioMvpMarco} ${coloresMedalla[i]}`}>
                  <AvatarJugador
                    usuarioId={f.id}
                    nombre={f.nombre}
                    fotoActualizadaEn={f.fotoActualizadaEn}
                    tamano={96}
                  />
                  <span className={`${styles.podioMvpMedalla} ${coloresMedalla[i]}`}>{i + 1}</span>
                </span>
                <span className={styles.podioMvpNombre}>{f.nombre}</span>
                <span className={styles.podioMvpVeces}>
                  {f.veces} {f.veces === 1 ? "vez" : "veces"}
                </span>
              </Link>
            ))}
          </div>

          {resto.length > 0 && (
            <ol className={styles.lista} start={4}>
              {resto.map((f, i) => (
                <li key={f.id} className={styles.fila}>
                  <span className={styles.posicion}>{i + 4}</span>
                  <span className={styles.nombre}>{f.nombre}</span>
                  <span className={styles.valor}>
                    {f.veces} {f.veces === 1 ? "vez" : "veces"}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </section>
  );
}

export default async function Estadisticas() {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario) {
    redirect("/");
  }

  const [golesUsuarios, golesInvitados, asistenciasPorUsuario, vecesMvpPorUsuario, usuarios, invitados] =
    await Promise.all([
      prisma.golJugador.groupBy({
        by: ["usuarioId"],
        where: { usuarioId: { not: null } },
        _sum: { goles: true },
      }),
      prisma.golJugador.groupBy({
        by: ["invitadoId"],
        where: { invitadoId: { not: null } },
        _sum: { goles: true },
      }),
      prisma.asistencia.groupBy({
        by: ["usuarioId"],
        where: { cancelado: false },
        _count: { _all: true },
      }),
      prisma.votacionMvp.groupBy({
        by: ["ganadorId"],
        where: { ganadorId: { not: null } },
        _count: { _all: true },
      }),
      prisma.usuario.findMany({ select: { id: true, nombreUsuario: true, fotoActualizadaEn: true } }),
      prisma.invitado.findMany({ select: { id: true, nombre: true } }),
    ]);

  const nombreUsuario = new Map(usuarios.map((u) => [u.id, u.nombreUsuario]));
  const nombreInvitado = new Map(invitados.map((i) => [i.id, i.nombre]));
  const fotoUsuario = new Map(usuarios.map((u) => [u.id, u.fotoActualizadaEn]));

  const maxGoleadores = 10;
  const goleadores: Fila[] = [
    ...golesUsuarios.map((g) => ({
      nombre: nombreUsuario.get(g.usuarioId!) ?? "Jugador eliminado",
      valor: g._sum.goles ?? 0,
    })),
    ...golesInvitados.map((g) => ({
      nombre: `${nombreInvitado.get(g.invitadoId!) ?? "Invitado"} (invitado)`,
      valor: g._sum.goles ?? 0,
    })),
  ]
    .filter((f) => f.valor > 0)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, maxGoleadores);

  const maxAsistentes = 10;
  const asistentes: Fila[] = asistenciasPorUsuario
    .map((a) => ({
      nombre: nombreUsuario.get(a.usuarioId) ?? "Jugador eliminado",
      valor: a._count._all,
    }))
    .filter((f) => f.valor > 0)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, maxAsistentes);

  const maxMvp = 10;
  const mvpRanking: FilaMvp[] = vecesMvpPorUsuario
    .map((v) => ({
      id: v.ganadorId!,
      nombre: nombreUsuario.get(v.ganadorId!) ?? "Jugador eliminado",
      fotoActualizadaEn: fotoUsuario.get(v.ganadorId!) ?? null,
      veces: v._count._all,
    }))
    .sort((a, b) => b.veces - a.veces)
    .slice(0, maxMvp);

  return (
    <main className={styles.screen}>
      <AppHeader
        titulo="Estadísticas"
        subtitulo="Goles anotados al registrar resultados y partidos a los que te has apuntado."
      />

      <Ranking titulo="Más goles" filas={goleadores} unidad="goles" />
      <Ranking titulo="Más partidos asistidos" filas={asistentes} unidad="partidos" />
      <RankingMvp filas={mvpRanking} />
    </main>
  );
}
