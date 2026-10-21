import { redirect } from "next/navigation";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
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

export default async function Estadisticas() {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario) {
    redirect("/");
  }

  const [golesUsuarios, golesInvitados, asistenciasPorUsuario, usuarios, invitados] =
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
      prisma.usuario.findMany({ select: { id: true, nombreUsuario: true } }),
      prisma.invitado.findMany({ select: { id: true, nombre: true } }),
    ]);

  const nombreUsuario = new Map(usuarios.map((u) => [u.id, u.nombreUsuario]));
  const nombreInvitado = new Map(invitados.map((i) => [i.id, i.nombre]));

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

  return (
    <main className={styles.screen}>
      <AppHeader
        titulo="Estadísticas"
        subtitulo="Goles anotados al registrar resultados y partidos a los que te has apuntado."
      />

      <Ranking titulo="Más goles" filas={goleadores} unidad="goles" />
      <Ranking titulo="Más partidos asistidos" filas={asistentes} unidad="partidos" />
    </main>
  );
}
