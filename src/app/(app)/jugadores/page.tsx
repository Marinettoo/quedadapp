import { redirect } from "next/navigation";
import Link from "next/link";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AppHeader } from "@/components/AppHeader";
import { AccionBoton } from "@/components/AccionBoton";
import { AvatarJugador } from "@/components/AvatarJugador";
import { valorar } from "./actions";
import styles from "./page.module.css";

export const instant = false;

export default async function Jugadores() {
  const usuario = await obtenerUsuarioSesion();
  if (!usuario) {
    redirect("/");
  }

  const jugadores = await prisma.usuario.findMany({
    where: { estado: "APROBADA", id: { not: usuario.id } },
    orderBy: { nombreUsuario: "asc" },
    include: {
      valoracionesRecibidas: { select: { estrellas: true, autorId: true } },
    },
  });

  const miValoracion = await prisma.valoracion.findMany({
    where: { valoradoId: usuario.id },
    select: { estrellas: true },
  });
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
              <Link href={`/jugadores/${j.id}`} className={styles.cabecera}>
                <AvatarJugador
                  usuarioId={j.id}
                  nombre={j.nombreUsuario}
                  fotoActualizadaEn={j.fotoActualizadaEn}
                />
                <span className={styles.cabeceraTexto}>
                  <span className={styles.nombre}>{j.nombreUsuario}</span>
                  <span className={styles.media}>
                    {media === null
                      ? "Sin valoraciones todavía"
                      : `${media.toFixed(1)} ★ (${cuenta} ${cuenta === 1 ? "voto" : "votos"})`}
                  </span>
                </span>
              </Link>
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
            </li>
          );
        })}
      </ul>
    </main>
  );
}
