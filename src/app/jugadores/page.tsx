import { redirect } from "next/navigation";
import { obtenerUsuarioSesion } from "@/lib/auth";
import { prisma } from "@/lib/db";
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
      valoracionesRecibidas: { select: { estrellas: true } },
      valoracionesHechas: {
        where: { autorId: usuario.id },
        select: { valoradoId: true, estrellas: true },
      },
    },
  });

  return (
    <main className={styles.screen}>
      <h1 className={styles.title}>Valorar jugadores</h1>
      <p className={styles.body}>
        De 1 a 5 estrellas. Tu valoración es anónima: solo se muestra la
        media de todos los votos, no quién puso cada nota.
      </p>

      <ul className={styles.lista}>
        {jugadores.map((j) => {
          const cuenta = j.valoracionesRecibidas.length;
          const media =
            cuenta === 0
              ? null
              : j.valoracionesRecibidas.reduce((s, v) => s + v.estrellas, 0) / cuenta;
          const tuValoracion = j.valoracionesHechas[0]?.estrellas ?? 0;

          return (
            <li key={j.id} className={styles.item}>
              <div className={styles.cabecera}>
                <span className={styles.nombre}>{j.nombreUsuario}</span>
                <span className={styles.media}>
                  {media === null
                    ? "Sin valoraciones todavía"
                    : `${media.toFixed(1)} ★ (${cuenta} ${cuenta === 1 ? "voto" : "votos"})`}
                </span>
              </div>
              <div className={styles.estrellas}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <form action={valorar} key={n}>
                    <input type="hidden" name="valoradoId" value={j.id} />
                    <input type="hidden" name="estrellas" value={n} />
                    <button
                      type="submit"
                      className={n <= tuValoracion ? styles.estrellaLlena : styles.estrellaVacia}
                      aria-label={`${n} ${n === 1 ? "estrella" : "estrellas"}`}
                    >
                      ★
                    </button>
                  </form>
                ))}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
