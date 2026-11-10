import { redirect } from "next/navigation";
import Link from "next/link";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { AvatarJugador } from "@/components/AvatarJugador";
import styles from "./page.module.css";

export const instant = false;

// `enlace`: a /jugadores/[id] cuando es un jugador real (se puede
// entrar a su ficha); null para invitados y jugadores eliminados (no
// tienen ficha a la que ir). `fotoActualizadaEn` siempre null para
// esos dos casos: nunca tienen foto, así que el top 3 cae solo en las
// iniciales, sin intentar cargar nada.
type FilaRanking = {
  id: string;
  nombre: string;
  fotoActualizadaEn: Date | null;
  enlace: string | null;
  valor: number;
};

const MEDALLAS = [styles.medallaOro, styles.medallaPlata, styles.medallaBronce];

// Los 3 primeros de cada categoría se ven como la foto sola (recortada,
// con marco de medalla), no la carta completa: a tamaño pequeño el
// nombre y los chips de la carta no se leerían bien, y así caben los 3
// a la vez en pantalla (móvil o pc) sin hacer scroll. Del 4º en
// adelante, fila de texto normal, sin foto.
function Ranking({ titulo, filas, unidad }: { titulo: string; filas: FilaRanking[]; unidad: string }) {
  const top3 = filas.slice(0, 3);
  const resto = filas.slice(3);

  return (
    <section className={styles.bloque}>
      <h2 className={styles.subtitulo}>{titulo}</h2>
      {filas.length === 0 ? (
        <p className={styles.vacio}>Todavía no hay datos suficientes.</p>
      ) : (
        <>
          <div className={styles.podioTop3}>
            {top3.map((f, i) => {
              const contenido = (
                <>
                  <span className={`${styles.top3Marco} ${MEDALLAS[i]}`}>
                    <AvatarJugador
                      usuarioId={f.id}
                      nombre={f.nombre}
                      fotoActualizadaEn={f.fotoActualizadaEn}
                      tamano={96}
                    />
                    <span className={`${styles.top3Medalla} ${MEDALLAS[i]}`}>{i + 1}</span>
                  </span>
                  <span className={styles.top3Nombre}>{f.nombre}</span>
                  <span className={styles.top3Valor}>
                    {f.valor} {unidad}
                  </span>
                </>
              );
              return f.enlace ? (
                <Link key={f.id} href={f.enlace} className={styles.top3Puesto}>
                  {contenido}
                </Link>
              ) : (
                <div key={f.id} className={styles.top3Puesto}>
                  {contenido}
                </div>
              );
            })}
          </div>

          {resto.length > 0 && (
            <ol className={styles.lista} start={4}>
              {resto.map((f, i) => (
                <li key={f.id} className={styles.fila}>
                  <span className={styles.posicion}>{i + 4}</span>
                  <span className={styles.nombre}>{f.nombre}</span>
                  <span className={styles.valor}>
                    {f.valor} {unidad}
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
  const goleadores: FilaRanking[] = [
    ...golesUsuarios.map((g) => ({
      id: g.usuarioId!,
      nombre: nombreUsuario.get(g.usuarioId!) ?? "Jugador eliminado",
      fotoActualizadaEn: fotoUsuario.get(g.usuarioId!) ?? null,
      enlace: nombreUsuario.has(g.usuarioId!) ? `/jugadores/${g.usuarioId}` : null,
      valor: g._sum.goles ?? 0,
    })),
    ...golesInvitados.map((g) => ({
      id: `invitado:${g.invitadoId}`,
      nombre: `${nombreInvitado.get(g.invitadoId!) ?? "Invitado"} (invitado)`,
      fotoActualizadaEn: null,
      enlace: null,
      valor: g._sum.goles ?? 0,
    })),
  ]
    .filter((f) => f.valor > 0)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, maxGoleadores);

  const maxAsistentes = 10;
  const asistentes: FilaRanking[] = asistenciasPorUsuario
    .map((a) => ({
      id: a.usuarioId,
      nombre: nombreUsuario.get(a.usuarioId) ?? "Jugador eliminado",
      fotoActualizadaEn: fotoUsuario.get(a.usuarioId) ?? null,
      enlace: nombreUsuario.has(a.usuarioId) ? `/jugadores/${a.usuarioId}` : null,
      valor: a._count._all,
    }))
    .filter((f) => f.valor > 0)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, maxAsistentes);

  const maxMvp = 10;
  const mvpRanking: FilaRanking[] = vecesMvpPorUsuario
    .map((v) => ({
      id: v.ganadorId!,
      nombre: nombreUsuario.get(v.ganadorId!) ?? "Jugador eliminado",
      fotoActualizadaEn: fotoUsuario.get(v.ganadorId!) ?? null,
      enlace: nombreUsuario.has(v.ganadorId!) ? `/jugadores/${v.ganadorId}` : null,
      valor: v._count._all,
    }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, maxMvp);

  return (
    <main className={styles.screen}>
      <AppHeader
        titulo="Estadísticas"
        subtitulo="Goles anotados al registrar resultados y partidos a los que te has apuntado."
      />

      <Ranking titulo="Más goles" filas={goleadores} unidad="goles" />
      <Ranking titulo="Más partidos asistidos" filas={asistentes} unidad="partidos" />
      <Ranking titulo="Más veces MVP" filas={mvpRanking} unidad="veces" />
    </main>
  );
}
