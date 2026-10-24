import { redirect } from "next/navigation";
import Link from "next/link";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calcularEdad } from "@/lib/usuarios";
import { AppHeader } from "@/components/AppHeader";
import { AccionBoton } from "@/components/AccionBoton";
import { TarjetaJugador } from "@/components/TarjetaJugador";
import { valorar } from "./actions";
import styles from "./page.module.css";

export const instant = false;

export default async function Jugadores() {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario) {
    redirect("/");
  }

  const jugadores = await prisma.usuario.findMany({
    where: { estado: "APROBADA" },
    orderBy: { nombreUsuario: "asc" },
    include: {
      valoracionesRecibidas: { select: { estrellas: true, autorId: true } },
    },
  });

  const [miValoracion, partidosPorJugador, golesPorJugador] = await Promise.all([
    prisma.valoracion.findMany({ where: { valoradoId: usuario.id }, select: { estrellas: true } }),
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

  const miMedia =
    miValoracion.length === 0
      ? null
      : miValoracion.reduce((s, v) => s + v.estrellas, 0) / miValoracion.length;

  return (
    <main className={styles.screen}>
      <AppHeader
        titulo="Valorar jugadores"
        subtitulo="De 1 a 5 estrellas, anónimo: solo se ve la media de los votos."
      />

      <div className={styles.tuValoracion}>
        <span className={styles.nombre}>Tu valoración</span>
        <span className={styles.media}>
          {miMedia === null
            ? "Todavía no tienes valoraciones"
            : `${miMedia.toFixed(1)} ★ (${miValoracion.length} ${miValoracion.length === 1 ? "voto" : "votos"})`}
        </span>
        <span className={styles.aviso}>No puedes valorarte a ti mismo.</span>
      </div>

      <ul className={styles.lista}>
        {jugadores.map((j) => {
          const cuenta = j.valoracionesRecibidas.length;
          const media =
            cuenta === 0
              ? null
              : j.valoracionesRecibidas.reduce((s, v) => s + v.estrellas, 0) / cuenta;
          const tuValoracion =
            j.valoracionesRecibidas.find((v) => v.autorId === usuario.id)?.estrellas ?? 0;

          return (
            <li key={j.id} className={styles.item}>
              <Link href={`/jugadores/${j.id}`} className={styles.tarjetaEnlace}>
                <TarjetaJugador
                  jugadorId={j.id}
                  nombreUsuario={j.nombreUsuario}
                  fotoActualizadaEn={j.fotoActualizadaEn}
                  media={media}
                  cuenta={cuenta}
                  partidosJugados={partidosMapa.get(j.id) ?? 0}
                  golesMarcados={golesMapa.get(j.id) ?? 0}
                  edad={j.fechaNacimiento ? calcularEdad(j.fechaNacimiento) : null}
                  piernaBuena={j.piernaBuena}
                  fotoOffsetX={j.fotoOffsetX}
                  fotoOffsetY={j.fotoOffsetY}
                  fotoEscala={j.fotoEscala}
                />
              </Link>
              {j.id === usuario.id ? (
                <span className={styles.aviso}>Esta es tu ficha, no puedes valorarte a ti mismo.</span>
              ) : (
                <div className={styles.estrellas}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <AccionBoton
                      key={n}
                      accion={valorar}
                      campos={{ valoradoId: j.id, estrellas: String(n) }}
                      className={n <= tuValoracion ? styles.estrellaLlena : styles.estrellaVacia}
                      ariaLabel={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
                    >
                      ★
                    </AccionBoton>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
